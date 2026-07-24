import React, { useMemo, useState, useEffect } from "react";
import { ArrowLeft, GitBranch, Search, Layers, Target, Trophy } from "lucide-react";
import type { AppStateV2, ModuleItem, Lesson } from "../../shared/types";
import type { GlossaryMatcher } from "../glossaryHighlight";
import { TopicCard } from "./TopicCard";
import { ModuleContent } from "./ModuleContent";
import { countTasks } from "../markdown";

type Props = {
  v2State: AppStateV2 | null;
  activeModule: ModuleItem | Lesson | null;
  checks: Record<string, boolean>;
  onCheckChange: (i: number, c: boolean) => void;
  glossaryMatcher: GlossaryMatcher | null;
  onOpenGlossary: (s: string) => void;
  onCreateGlossaryTerm: (t: string) => void;
  onSelectLesson: (id: string) => void;
};

export function ProjectsPage(p: Props) {
  const [q, setQ] = useState("");

  const topics = useMemo(() => {
    if (!p.v2State) return [];
    return p.v2State.sections.filter((s) => s.type === "projects").flatMap((s) => s.topics || []);
  }, [p.v2State]);

  const filtered = useMemo(() => {
    if (!q.trim()) return topics;
    const s = q.toLowerCase();
    return topics.filter((t) =>
      t.title.toLowerCase().includes(s) || (t.lessons || []).some((l) => l.title.toLowerCase().includes(s))
    );
  }, [topics, q]);

  const stats = useMemo(() => {
    let lessons = 0, tasks = 0, done = 0;
    for (const t of topics)
      for (const l of t.lessons || []) {
        lessons++;
        const n = countTasks(l.content || "");
        tasks += n;
        done += Object.values(p.v2State?.checks?.[l.id] || {}).filter(Boolean).length;
      }
    return { lessons, tasks, done, pct: tasks ? Math.round((done / tasks) * 100) : 0 };
  }, [topics, p.v2State]);

  const isActiveHere = useMemo(() => {
    if (!p.activeModule || !p.v2State) return false;
    return p.v2State.sections.filter((s) => s.type === "projects")
      .some((s) => s.topics?.some((t) => t.lessons?.some((l) => l.id === p.activeModule!.id)));
  }, [p.activeModule, p.v2State]);

  useEffect(() => {
    if (!isActiveHere) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") p.onSelectLesson(""); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [isActiveHere, p.onSelectLesson]);

  if (isActiveHere && p.activeModule) {
    return (
      <div className="section-page">
        <button className="back-btn" onClick={() => p.onSelectLesson("")}>
          <ArrowLeft size={15} /> Все проекты
        </button>
        <ModuleContent module={p.activeModule} checks={p.checks} onCheckChange={p.onCheckChange}
          glossaryMatcher={p.glossaryMatcher} onOpenGlossary={p.onOpenGlossary}
          onCreateGlossaryTerm={p.onCreateGlossaryTerm} />
      </div>
    );
  }

  const v2c = p.v2State?.checks || {};

  return (
    <div className="section-page">
      <div className="section-hero">
        <div className="section-icon projects"><GitBranch size={26} /></div>
        <div className="section-hero-text">
          <h2>Проекты</h2>
          <p>Пошаговые задания с чек-листами для портфолио</p>
        </div>
        <div className="section-stats">
          <div className="stat-chip"><Layers size={14} /> {topics.length} проектов</div>
          <div className="stat-chip"><Target size={14} /> {stats.lessons} уроков</div>
          <div className="stat-chip"><Trophy size={14} /> {stats.done}/{stats.tasks}</div>
          <div className="stat-chip accent">{stats.pct}%</div>
        </div>
      </div>

      <div className="filterbar">
        <div className="filter-search">
          <Search size={14} />
          <input placeholder="Поиск проекта…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <div className="topic-grid">
        {filtered.length === 0 && <p className="empty-hint">Проектов пока нет.</p>}
        {filtered.map((t) => (
          <TopicCard key={t.id} topic={t} onSelectLesson={p.onSelectLesson} checks={v2c} />
        ))}
      </div>
    </div>
  );
}