import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Activity } from "lucide-react";
import { NavLink, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import type {
  AppStateDto, AppStateV2, Lesson, ModuleItem,
  CreateModuleInput, GlossaryTermSummary, UpsertGlossaryInput
} from "../shared/types";
import { api, getV2State } from "./api";
import { ImportModal } from "./components/ImportModal";
import { ModuleSidebar } from "./components/ModuleSidebar";
import { Toast } from "./components/Toast";
import { GlossaryAdminModal } from "./components/GlossaryAdminModal";
import { GlossaryPage } from "./components/GlossaryPage";
import { GlossaryDrawer } from "./components/GlossaryDrawer";
import { AlgorithmsPage } from "./components/AlgorithmsPage";
import { ProjectsPage } from "./components/ProjectsPage";
import { ReferencePage } from "./components/ReferencePage";
import { ProfilePage } from "./components/ProfilePage";
import { buildGlossaryMatcher } from "./glossaryHighlight";
import { countTasks } from "./markdown";

const emptyState: AppStateDto = { modules: [], checks: {} };
const emptyChecks: Record<string, boolean> = {};

function parseGlossaryHash(hash: string): string | null {
  const m = hash.match(/^#\/glossary\/(.+)$/);
  return m ? decodeURIComponent(m[1]) : null;
}

/* ── TopNav вынесен ── */
function TopNav() {
  const cls = ({ isActive }: { isActive: boolean }) =>
    `nav-link${isActive ? " nav-active" : ""}`;
  return (
    <nav className="top-nav" aria-label="Разделы">
      <NavLink to="/algorithms" className={cls}>Алгоритмы</NavLink>
      <NavLink to="/projects" className={cls}>Проекты</NavLink>
      <NavLink to="/reference" className={cls}>Справочник</NavLink>
      <NavLink to="/profile" className={cls}>Профиль</NavLink>
    </nav>
  );
}

export function App() {
  const navigate = useNavigate();
  const [state, setState] = useState<AppStateDto>(emptyState);
  const [v2State, setV2State] = useState<AppStateV2 | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<number | null>(null);
  const [glossaryTerms, setGlossaryTerms] = useState<GlossaryTermSummary[]>([]);
  const [glossaryDraftTerm, setGlossaryDraftTerm] = useState<string | null>(null);
  const [glossarySlug, setGlossarySlug] = useState<string | null>(() =>
    parseGlossaryHash(window.location.hash)
  );
  const [glossaryDrawerSlug, setGlossaryDrawerSlug] = useState<string | null>(null);

  const glossaryMatcher = useMemo(() => buildGlossaryMatcher(glossaryTerms), [glossaryTerms]);

  /* ── activeModule: БЕЗ fallback на firstLesson ── */
  const activeModule = useMemo(() => {
    if (v2State) {
      if (!activeId) return null;
      for (const s of v2State.sections || [])
        for (const t of s.topics || []) {
          const f = (t.lessons || []).find((l) => l.id === activeId);
          if (f) return f as Lesson;
        }
      return null;
    }
    return state.modules.find((m) => m.id === activeId) || null;
  }, [activeId, state.modules, v2State]);

  const progress = useMemo(() => {
    if (v2State) {
      let total = 0, checked = 0;
      for (const s of v2State.sections || [])
        for (const t of s.topics || [])
          for (const l of t.lessons || []) {
            total += countTasks(l.content || "");
            checked += Object.values(v2State.checks?.[l.id] || {}).filter(Boolean).length;
          }
      return total ? Math.round((checked / total) * 100) : 0;
    }
    let total = 0, checked = 0;
    state.modules.forEach((m) => {
      total += countTasks(m.content);
      checked += Object.values(state.checks[m.id] || {}).filter(Boolean).length;
    });
    return total ? Math.round((checked / total) * 100) : 0;
  }, [state, v2State]);

  const perSection = useMemo(() => {
    const r: Record<string, { total: number; checked: number; pct: number }> = {
      algorithms: { total: 0, checked: 0, pct: 0 },
      projects: { total: 0, checked: 0, pct: 0 },
      reference: { total: 0, checked: 0, pct: 0 },
      misc: { total: 0, checked: 0, pct: 0 },
    };
    if (!v2State) return r;
    for (const s of v2State.sections || []) {
      const k = s.type || "misc";
      if (!r[k]) r[k] = { total: 0, checked: 0, pct: 0 };
      for (const t of s.topics || [])
        for (const l of t.lessons || []) {
          r[k].total += countTasks(l.content || "");
          r[k].checked += Object.values(v2State.checks?.[l.id] || {}).filter(Boolean).length;
        }
    }
    for (const k of Object.keys(r)) r[k].pct = r[k].total ? Math.round((r[k].checked / r[k].total) * 100) : 0;
    return r;
  }, [v2State]);

  const activeChecks = useMemo(
    () => (activeModule ? state.checks[activeModule.id] || emptyChecks : emptyChecks),
    [state.checks, activeModule]
  );

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 2600);
  }, []);

  const loadState = useCallback(async () => {
    try {
      setError(null);
      const [next, rawV2] = await Promise.all([api.getState(), getV2State()]);
      setState(next);
      setV2State(rawV2);
      if (rawV2?.sections?.length) {
        const first = rawV2.sections[0]?.topics?.[0]?.lessons?.[0];
        setActiveId((c) => c || first?.id || next.modules[0]?.id || null);
      } else {
        setActiveId((c) => (c && next.modules.some((m) => m.id === c) ? c : next.modules[0]?.id || null));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить данные");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadState(); }, [loadState]);
  useEffect(() => { api.listGlossary().then(setGlossaryTerms).catch(() => {}); }, []);
  useEffect(() => {
    const h = () => setGlossarySlug(parseGlossaryHash(window.location.hash));
    window.addEventListener("hashchange", h);
    return () => window.removeEventListener("hashchange", h);
  }, []);

  /* ── sidebar → navigate в нужный раздел ── */
  const handleSidebarSelect = useCallback((id: string) => {
    setActiveId(id);
    if (v2State) {
      for (const s of v2State.sections)
        for (const t of s.topics || [])
          if (t.lessons?.some((l) => l.id === id)) { navigate(`/${s.type}`); return; }
    }
    navigate("/algorithms");
  }, [v2State, navigate]);

  async function handleCreateModule(input: CreateModuleInput) {
    const mod = await api.createModule(input);
    setState((c) => ({ ...c, modules: [...c.modules, mod] }));
    setActiveId(mod.id);
    const v2 = await getV2State();
    if (v2) setV2State(v2);
    const sec = (input as any).sectionType || "misc";
    navigate(sec === "misc" ? "/algorithms" : `/${sec}`);
    showToast("Модуль добавлен");
  }

  async function handleDeleteModule(id: string) {
    const mod = state.modules.find((m) => m.id === id);
    if (!mod || !confirm(`Удалить «${mod.title}»?`)) return;
    await api.deleteModule(id);
    setState((c) => {
      const checks = { ...c.checks }; delete checks[id];
      return { modules: c.modules.filter((m) => m.id !== id), checks };
    });
    setActiveId((c) => (c === id ? null : c));
    showToast("Модуль удалён");
  }

  const handleCheckChange = useCallback(async (idx: number, checked: boolean) => {
    if (!activeModule) return;
    const id = activeModule.id;
    setState((c) => ({
      ...c,
      checks: { ...c.checks, [id]: { ...(c.checks[id] || {}), [String(idx)]: checked } },
    }));
    try { await api.updateCheck(id, idx, checked); }
    catch (e) { showToast(e instanceof Error ? e.message : "Ошибка"); await loadState(); }
  }, [activeModule, loadState, showToast]);

  const openGlossary = useCallback((slug: string) => setGlossaryDrawerSlug(slug), []);
  const closeGlossary = () => { window.location.hash = ""; };
  const handleCreateGlossaryTerm = (t: string) => setGlossaryDraftTerm(t);
  async function handleSubmitGlossaryTerm(input: UpsertGlossaryInput, token: string) {
    await api.upsertGlossaryTerm(input, token);
    setGlossaryTerms(await api.listGlossary());
    showToast("Мануал сохранён");
  }

  const sectionProps = {
    v2State, activeModule, checks: activeChecks,
    onCheckChange: handleCheckChange, glossaryMatcher,
    onOpenGlossary: openGlossary, onCreateGlossaryTerm: handleCreateGlossaryTerm,
    onSelectLesson: (id: string) => setActiveId(id || null),
  };

  return (
    <div id="app">
      <header id="topbar">
        <div className="brand">
          <span className="eyebrow">Fullstack Developer</span>
          <h1>Журнал подготовки</h1>
        </div>
        <TopNav />
        <div className="spacer" />
        <div className="gauge-wrap" aria-label={`Прогресс ${progress}%`}>
          <Activity size={16} />
          <span className="gauge-label">Прогресс</span>
          <div className="gauge"><div className="gauge-fill" style={{ width: `${progress}%` }} /></div>
          <span className="gauge-pct">{progress}%</span>
        </div>
      </header>

      <div id="body">
        <ModuleSidebar
          modules={state.modules} checks={state.checks}
          activeId={activeModule?.id || null}
          onSelect={handleSidebarSelect}
          onDelete={handleDeleteModule}
          onOpenImport={() => setImportOpen(true)}
        />
        <main id="content">
          <div id="content-inner">
            {glossarySlug ? (
              <GlossaryPage slug={glossarySlug} onClose={closeGlossary} />
            ) : (
              <Routes>
                <Route path="/" element={<Navigate to="/algorithms" replace />} />
                <Route path="/algorithms" element={<AlgorithmsPage {...sectionProps} />} />
                <Route path="/projects" element={<ProjectsPage {...sectionProps} />} />
                <Route path="/reference" element={<ReferencePage {...sectionProps} />} />
                <Route path="/profile" element={<ProfilePage v2State={v2State} />} />
                <Route path="*" element={<Navigate to="/algorithms" replace />} />
              </Routes>
            )}
          </div>
        </main>
      </div>

      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} onSubmit={handleCreateModule} />
      <GlossaryAdminModal
        open={glossaryDraftTerm !== null}
        initialTerm={glossaryDraftTerm || ""}
        onClose={() => setGlossaryDraftTerm(null)}
        onSubmit={handleSubmitGlossaryTerm}
      />
      {glossaryDrawerSlug && (
        <GlossaryDrawer slug={glossaryDrawerSlug} onClose={() => setGlossaryDrawerSlug(null)} />
      )}
      <Toast message={toast} />
    </div>
  );
}