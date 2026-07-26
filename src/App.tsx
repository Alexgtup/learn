import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import {
  Activity, LayoutDashboard, BookOpen, GitBranch, Code, Layers,
  Zap, Trophy, Map, PlayCircle, BarChart3, Menu, X, Flame,
  Star, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { AppStateDto, AppStateV2, Lesson, ModuleItem } from "../shared/types";
import { api, getV2State } from "./api";
import { useAppStore } from "./core/store/useAppStore";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { PlaygroundPage } from "./features/playground/PlaygroundPage";
import { RoadmapPage } from "./features/roadmap/RoadmapPage";
import { MockInterviewPage } from "./features/mock-interview/MockInterviewPage";
import { GamificationPage } from "./features/gamification/GamificationPage";
import { AnalyticsPage } from "./features/analytics/AnalyticsPage";
import { AlgorithmVisualizerPage } from "./features/algorithms/AlgorithmVisualizerPage";
import { AlgorithmsPage } from "./components/AlgorithmsPage";
import { ProjectsPage } from "./components/ProjectsPage";
import { ReferencePage } from "./components/ReferencePage";
import { FlashcardsPage } from "./components/FlashcardsPage";
import { ModuleSidebar } from "./components/ModuleSidebar";
import { ModuleContent } from "./components/ModuleContent";
import { GlossaryDrawer } from "./components/GlossaryDrawer";
import { GlossaryPage } from "./components/GlossaryPage";
import { ImportModal } from "./components/ImportModal";
import { CommandPalette } from "./components/CommandPalette";
import { Toast as OldToast } from "./components/Toast";
import { Toast as NewToast } from "./shared/ui/Toast";
import { buildGlossaryMatcher } from "./glossaryHighlight";
import { countTasks } from "./markdown";

const emptyState: AppStateDto = { modules: [], checks: {} };
const emptyChecks: Record<string, boolean> = {};

function parseGlossaryHash(hash: string): string | null {
  const m = hash.match(/^#\/glossary\/(.+)$/);
  return m ? decodeURIComponent(m[1]) : null;
}

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/algorithms", icon: BookOpen, label: "Алгоритмы" },
  { to: "/projects", icon: GitBranch, label: "Проекты" },
  { to: "/reference", icon: Code, label: "Справочник" },
  { to: "/flashcards", icon: Layers, label: "Флешкарты" },
  { to: "/playground", icon: PlayCircle, label: "Playground" },
  { to: "/roadmap", icon: Map, label: "Roadmap" },
  { to: "/mock-interview", icon: Zap, label: "Mock Interview" },
  { to: "/analytics", icon: BarChart3, label: "Аналитика" },
  { to: "/achievements", icon: Trophy, label: "Достижения" },
];

export function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [state, setState] = useState<AppStateDto>(emptyState);
  const [v2State, setV2State] = useState<AppStateV2 | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<number | null>(null);
  const [glossaryTerms, setGlossaryTerms] = useState<any[]>([]);
  const [glossaryDrawerSlug, setGlossaryDrawerSlug] = useState<string | null>(null);
  const [glossarySlug, setGlossarySlug] = useState<string | null>(() =>
    parseGlossaryHash(window.location.hash)
  );
  const [commandOpen, setCommandOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const store = useAppStore();

  const glossaryMatcher = useMemo(() => buildGlossaryMatcher(glossaryTerms), [glossaryTerms]);

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
      store.setV2State(rawV2);
      if (rawV2?.sections?.length) {
        const first = rawV2.sections[0]?.topics?.[0]?.lessons?.[0];
        setActiveId((c) => c || first?.id || next.modules[0]?.id || null);
      } else {
        setActiveId((c) => (c && next.modules.some((m) => m.id === c) ? c : next.modules[0]?.id || null));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить данные");
    } finally { setLoading(false); }
  }, [store]);

  useEffect(() => { loadState(); }, [loadState]);
  useEffect(() => { api.listGlossary().then(setGlossaryTerms).catch(() => {}); }, []);
  useEffect(() => {
    const h = () => setGlossarySlug(parseGlossaryHash(window.location.hash));
    window.addEventListener("hashchange", h);
    return () => window.removeEventListener("hashchange", h);
  }, []);
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen(o => !o);
      }
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, []);

  const handleSidebarSelect = useCallback((id: string) => {
    setActiveId(id);
    if (v2State) {
      for (const s of v2State.sections)
        for (const t of s.topics || [])
          if (t.lessons?.some((l) => l.id === id)) { navigate(`/${s.type}`); return; }
    }
    navigate("/algorithms");
  }, [v2State, navigate]);

  async function handleCreateModule(input: any, adminToken: string) {
    const mod = await api.createModule(input, adminToken);
    setState((c) => ({ ...c, modules: [...c.modules, mod] }));
    setActiveId(mod.id);
    const v2 = await getV2State();
    if (v2) { setV2State(v2); store.setV2State(v2); }
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
    if (checked) {
      store.addXp(10);
      store.updateStreak();
    }
    try { await api.updateCheck(id, idx, checked); }
    catch (e) { showToast(e instanceof Error ? e.message : "Ошибка"); await loadState(); }
  }, [activeModule, loadState, showToast, store]);

  const openGlossary = useCallback((slug: string) => setGlossaryDrawerSlug(slug), []);

  const sectionProps = {
    v2State, activeModule, checks: activeChecks,
    onCheckChange: handleCheckChange, glossaryMatcher,
    onOpenGlossary: openGlossary, onCreateGlossaryTerm: () => {},
    onSelectLesson: (id: string) => setActiveId(id || null),
  };

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div id="app">
      {/* Top Navigation */}
      <header id="topbar" className="flex items-center gap-4 px-4 lg:px-6 py-3">
        <button
          className="lg:hidden text-white/50 hover:text-white p-1"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className="brand">
          <span className="eyebrow">Fullstack Developer</span>
          <h1>Журнал подготовки <span className="text-xs font-normal text-white/30 ml-1">v3.0</span></h1>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex top-nav" aria-label="Разделы">
          {navItems.slice(0, 6).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `nav-link${isActive ? " nav-active" : ""}`
              }
            >
              <item.icon size={14} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="spacer" />

        {/* Level + XP */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
            <Flame size={14} className="text-amber-400" />
            <span className="text-xs font-semibold text-amber-300">{store.gamification.streak}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20">
            <Star size={14} className="text-violet-400" />
            <span className="text-xs font-semibold text-violet-300">{store.gamification.level}</span>
          </div>
        </div>

        <div className="gauge-wrap">
          <Activity size={16} />
          <span className="gauge-label hidden sm:inline">Прогресс</span>
          <div className="gauge w-20 sm:w-32 lg:w-40">
            <div className="gauge-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="gauge-pct">{progress}%</span>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-white/5 z-[90]"
          >
            <div className="p-4 grid grid-cols-2 gap-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-3 rounded-xl text-sm transition-colors ${
                      isActive
                        ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/20"
                        : "text-white/60 hover:bg-white/5"
                    }`
                  }
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon size={16} />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div id="body">
        <ModuleSidebar
          modules={state.modules}
          checks={state.checks}
          activeId={activeModule?.id || null}
          onSelect={handleSidebarSelect}
          onDelete={handleDeleteModule}
          onOpenImport={() => setImportOpen(true)}
        />

        <main id="content">
          <div id="content-inner">
            {glossarySlug ? (
              <GlossaryPage slug={glossarySlug} onClose={() => { window.location.hash = ""; }} />
            ) : (
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/algorithms" element={<AlgorithmsPage {...sectionProps} />} />
                <Route path="/projects" element={<ProjectsPage {...sectionProps} />} />
                <Route path="/reference" element={<ReferencePage {...sectionProps} />} />
                <Route path="/flashcards" element={<FlashcardsPage />} />
                <Route path="/playground" element={<PlaygroundPage />} />
                <Route path="/roadmap" element={<RoadmapPage />} />
                <Route path="/mock-interview" element={<MockInterviewPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/achievements" element={<GamificationPage />} />
                <Route path="/visualizer" element={<AlgorithmVisualizerPage />} />
                <Route path="/profile" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            )}
          </div>
        </main>
      </div>

      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSubmit={handleCreateModule}
      />

      {glossaryDrawerSlug && (
        <GlossaryDrawer slug={glossaryDrawerSlug} onClose={() => setGlossaryDrawerSlug(null)} />
      )}

      <CommandPalette
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        v2State={v2State}
        glossaryTerms={glossaryTerms}
        onOpenImport={() => setImportOpen(true)}
        onExport={async () => {
          const data = await api.exportState();
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `prep-journal-${new Date().toISOString().slice(0, 10)}.json`;
          a.click();
          URL.revokeObjectURL(url);
          setCommandOpen(false);
        }}
        onMockInterview={() => { navigate("/mock-interview"); setCommandOpen(false); }}
      />

      <OldToast message={toast} />
      <NewToast />
    </div>
  );
}
