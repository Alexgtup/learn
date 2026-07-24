import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { AppStateDto, CheckMap, CreateModuleInput, ModuleItem, AppStateV2 } from "../../shared/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, "../data");
const storePath = path.join(dataDir, "store.json");
const storeV2Path = path.join(dataDir, "store.v2.json");

type PersistedState = AppStateDto;

const initialState: PersistedState = {
  modules: [],
  checks: {}
};

async function ensureStore(): Promise<void> {
  await mkdir(dataDir, { recursive: true });
  try {
    await readFile(storePath, "utf8");
  } catch {
    await writeState(initialState);
  }
}

async function readState(): Promise<PersistedState> {
  await ensureStore();
  const raw = await readFile(storePath, "utf8");
  return JSON.parse(raw) as PersistedState;
}

async function writeState(state: PersistedState): Promise<void> {
  await mkdir(dataDir, { recursive: true });
  await writeFile(storePath, JSON.stringify(state, null, 2), "utf8");
}

async function readV2State(): Promise<AppStateV2 | null> {
  try {
    const raw = await readFile(storeV2Path, "utf8");
    return JSON.parse(raw) as AppStateV2;
  } catch {
    return null;
  }
}

async function writeV2State(state: AppStateV2): Promise<void> {
  await mkdir(dataDir, { recursive: true });
  await writeFile(storeV2Path, JSON.stringify(state, null, 2), "utf8");
}

function sortModules(modules: ModuleItem[]): ModuleItem[] {
  return modules.toSorted((a, b) => {
    return a.weekOrder - b.weekOrder || a.order - b.order || a.title.localeCompare(b.title, "ru");
  });
}

export async function getState(): Promise<AppStateDto> {
  const state = await readState();
  return {
    modules: sortModules(state.modules),
    checks: state.checks
  };
}

export async function createModule(input: CreateModuleInput): Promise<ModuleItem> {
  const state = await readState();
  const customCount = state.modules.filter((module) => !module.builtin).length;
  const module: ModuleItem = {
    id: `custom-${crypto.randomUUID()}`,
    title: input.title?.trim() || "Без названия",
    week: input.week?.trim() || "Мои модули",
    weekOrder: 99,
    order: customCount + 1,
    content: input.content.trim(),
    builtin: false
  };

  state.modules.push(module);
  await writeState(state);
  
  // Also add to v2 store if it exists
  const v2 = await readV2State();
  if (v2) {
    const sectionType = input.sectionType || "misc";
    
    // Find or create section with matching type
    let section = v2.sections.find((s) => s.type === sectionType);
    if (!section) {
      const sectionTitles: Record<string, string> = {
        algorithms: "Алгоритмы",
        projects: "Проекты",
        reference: "Справочник",
        misc: "Разное"
      };
      section = {
        id: sectionType,
        type: sectionType as any,
        title: sectionTitles[sectionType] || sectionType,
        order: sectionType === "algorithms" ? 1 : sectionType === "projects" ? 2 : sectionType === "reference" ? 3 : 99,
        topics: []
      };
      v2.sections.push(section);
    }

    // Add as a topic with a single lesson
    const newTopic: any = {
      id: `topic-${module.id}`,
      title: input.week?.trim() || "Общие",
      order: section.topics.length,
      lessons: [
        {
          id: module.id,
          title: module.title,
          content: module.content,
          order: 0
        }
      ]
    };
    section.topics.push(newTopic);
    await writeV2State(v2);
  }

  return module;
}

export async function deleteModule(id: string): Promise<boolean> {
  const state = await readState();
  const before = state.modules.length;
  state.modules = state.modules.filter((module) => module.id !== id);
  delete state.checks[id];
  await writeState(state);
  
  // Also remove from v2 if exists
  const v2 = await readV2State();
  if (v2) {
    for (const section of v2.sections) {
      for (let i = section.topics.length - 1; i >= 0; i--) {
        const topic = section.topics[i];
        topic.lessons = topic.lessons.filter((l) => l.id !== id);
        if (topic.lessons.length === 0) {
          section.topics.splice(i, 1);
        }
      }
    }
    // Remove empty sections
    v2.sections = v2.sections.filter((s) => s.topics.length > 0);
    await writeV2State(v2);
  }

  return state.modules.length !== before;
}


export async function updateCheck(moduleId: string, taskIndex: number, checked: boolean): Promise<CheckMap[string]> {
  const state = await readState();
  const exists = state.modules.some((module) => module.id === moduleId);
  if (!exists) {
    throw new Error("MODULE_NOT_FOUND");
  }

  state.checks[moduleId] = state.checks[moduleId] || {};
  state.checks[moduleId][String(taskIndex)] = checked;
  await writeState(state);
  
  // Also update v2 checks if v2 exists
  const v2 = await readV2State();
  if (v2) {
    v2.checks = v2.checks || {};
    v2.checks[moduleId] = v2.checks[moduleId] || {};
    v2.checks[moduleId][String(taskIndex)] = checked;
    await writeV2State(v2);
  }
  
  return state.checks[moduleId];
}

/* ═══ Notes ═══ */
export async function getNote(lessonId: string): Promise<string> {
  const v2 = await readV2State();
  if (!v2) return "";
  return (v2 as any).notes?.[lessonId] || "";
}

export async function updateNote(lessonId: string, content: string): Promise<void> {
  const v2 = await readV2State();
  if (!v2) return;
  (v2 as any).notes = (v2 as any).notes || {};
  (v2 as any).notes[lessonId] = content;
  await writeV2State(v2);
}

/* ═══ Spaced Repetition ═══ */
type ReviewEntry = { nextDate: string; interval: number; ease: number };

export async function getReview(lessonId: string): Promise<ReviewEntry | null> {
  const v2 = await readV2State();
  if (!v2) return null;
  return (v2 as any).review?.[lessonId] || null;
}

export async function updateReview(lessonId: string, rating: "again" | "good" | "easy"): Promise<ReviewEntry> {
  const v2 = await readV2State();
  if (!v2) throw new Error("NO_V2");
  (v2 as any).review = (v2 as any).review || {};
  const prev: ReviewEntry = (v2 as any).review[lessonId] || { nextDate: "", interval: 0, ease: 2.5 };

  let { interval, ease } = prev;
  if (rating === "again") { interval = 1; ease = Math.max(1.3, ease - 0.2); }
  else if (rating === "good") { interval = Math.max(1, Math.round(interval * ease)); }
  else { interval = Math.max(1, Math.round(interval * ease * 1.3)); ease += 0.1; }

  const next = new Date();
  next.setDate(next.getDate() + interval);
  const entry: ReviewEntry = { nextDate: next.toISOString().slice(0, 10), interval, ease };
  (v2 as any).review[lessonId] = entry;
  await writeV2State(v2);
  return entry;
}

/* ═══ Activity tracking ═══ */
export async function recordActivity(count = 1): Promise<void> {
  const v2 = await readV2State();
  if (!v2) return;
  (v2 as any).activity = (v2 as any).activity || {};
  const today = new Date().toISOString().slice(0, 10);
  (v2 as any).activity[today] = ((v2 as any).activity[today] || 0) + count;
  await writeV2State(v2);
}

/* ═══ Export / Import ═══ */
export async function exportState(): Promise<any> {
  const [legacy, v2] = await Promise.all([readState(), readV2State()]);
  return { legacy, v2, exportedAt: new Date().toISOString() };
}

export async function importState(data: any): Promise<void> {
  if (data.legacy) await writeState(data.legacy);
  if (data.v2) await writeV2State(data.v2);
}