import type { AppStateDto, CreateModuleInput, ModuleItem, AppStateV2 } from "../shared/types";
import type { GlossaryTerm, GlossaryTermSummary, UpsertGlossaryInput } from "../shared/types";
import type { Flashcard, LearningSession, QualityGrade } from "../shared/types";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers
    }
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message || `Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

async function tryGetV2State(): Promise<AppStateV2 | null> {
  try {
    return await request<AppStateV2>("/api/v2/state");
  } catch {
    return null;
  }
}

// Exported helper to get raw v2 store when consumers need the hierarchical model
export async function getV2State(): Promise<AppStateV2 | null> {
  return tryGetV2State();
}

function mapV2ToLegacy(v2: AppStateV2): AppStateDto {
  const modules: ModuleItem[] = [];
  const checks: Record<string, Record<string, boolean>> = {};

  for (const section of v2.sections || []) {
    for (const topic of section.topics || []) {
      for (const lesson of topic.lessons || []) {
        const module: ModuleItem = {
          id: lesson.id,
          title: lesson.title,
          week: section.title || "",
          weekOrder: section.order || 99,
          order: lesson.order || topic.order || 0,
          content: lesson.content || "",
          builtin: !!lesson.builtin
        };
        modules.push(module);
      }
    }
  }

  // pass through checks keyed by lesson id
  Object.assign(checks, v2.checks || {});

  return { modules, checks };
}

export const api = {
  getState: async () => {
    const v2 = await tryGetV2State();
    if (v2) {
      return mapV2ToLegacy(v2);
    }
    return request<AppStateDto>("/api/state");
  },

  createModule: (input: CreateModuleInput) =>
    request<ModuleItem>("/api/modules", {
      method: "POST",
      body: JSON.stringify(input)
    }),

  deleteModule: (id: string) =>
    request<void>(`/api/modules/${encodeURIComponent(id)}`, {
      method: "DELETE"
    }),

  updateCheck: (moduleId: string, taskIndex: number, checked: boolean) =>
    request<Record<string, boolean>>(`/api/checks/${encodeURIComponent(moduleId)}`, {
      method: "PATCH",
      body: JSON.stringify({ taskIndex, checked })
    }),
  listGlossary: () => request<GlossaryTermSummary[]>("/api/glossary"),
  getGlossaryTerm: (slug: string) => request<GlossaryTerm>(`/api/glossary/${encodeURIComponent(slug)}`),
  upsertGlossaryTerm: (input: UpsertGlossaryInput, adminToken: string) =>
    request<GlossaryTerm>("/api/glossary", {
      method: "POST",
      headers: { "x-admin-token": adminToken },
      body: JSON.stringify(input)
    }),
  deleteGlossaryTerm: (slug: string, adminToken: string) =>
    request<void>(`/api/glossary/${encodeURIComponent(slug)}`, {
      method: "DELETE",
      headers: { "x-admin-token": adminToken }
    }),

    // Добавить в объект api:
  getNote: (lessonId: string) =>
    request<{ content: string }>(`/api/notes/${encodeURIComponent(lessonId)}`),

  updateNote: (lessonId: string, content: string) =>
    request<{ ok: boolean }>(`/api/notes/${encodeURIComponent(lessonId)}`, {
      method: "PATCH", body: JSON.stringify({ content })
    }),

  getReview: (lessonId: string) =>
    request<{ nextDate: string; interval: number; ease: number } | null>(
      `/api/review/${encodeURIComponent(lessonId)}`
    ),

  updateReview: (lessonId: string, rating: "again" | "good" | "easy") =>
    request<{ nextDate: string; interval: number; ease: number }>(
      `/api/review/${encodeURIComponent(lessonId)}`, {
      method: "PATCH", body: JSON.stringify({ rating })
    }
    ),

  exportState: () => request<any>("/api/export"),

  importState: (data: any) =>
    request<{ ok: boolean }>("/api/import", {
      method: "POST", body: JSON.stringify(data)
    }),

  // Flashcards API
  getFlashcards: () => request<Flashcard[]>("/api/flashcards"),
  getDueFlashcards: () => request<Flashcard[]>("/api/flashcards/due"),
  updateFlashcardStats: (cardId: string, quality: QualityGrade) =>
    request<Flashcard>(`/api/flashcards/${encodeURIComponent(cardId)}/review`, {
      method: "PATCH",
      body: JSON.stringify({ quality })
    }),
  createFlashcard: (lessonId: string, question: string, answer: string) =>
    request<Flashcard>("/api/flashcards", {
      method: "POST",
      body: JSON.stringify({ lessonId, question, answer })
    }),
  deleteFlashcard: (cardId: string) =>
    request<void>(`/api/flashcards/${encodeURIComponent(cardId)}`, {
      method: "DELETE"
    }),

  // Learning sessions API
  getSessionStats: () => request<{ totalSessions: number; streak: number }>("/api/sessions/stats"),
  startSession: () => request<LearningSession>("/api/sessions", { method: "POST" }),
  completeSession: (sessionId: string, cardsReviewed: number, correctAnswers: number) =>
    request<LearningSession>(`/api/sessions/${encodeURIComponent(sessionId)}/complete`, {
      method: "PATCH",
      body: JSON.stringify({ cardsReviewed, correctAnswers })
    }),

};

