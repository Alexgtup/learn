import React, { useMemo, useState, useEffect } from "react";
import { ArrowLeft, Code, Search, Layers, Target, Trophy } from "lucide-react";
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

export function ReferencePage(p: Props) {
  const [q, setQ] = useState("");

  const topics = useMemo(() => {
    if (!p.v2State) return [];
    return p.v2State.sections.filter((s) => s.type === "reference").flatMap((s) => s.topics || []);
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
    return p.v2State.sections.filter((s) => s.type === "reference")
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
          <ArrowLeft size={15} /> Весь справочник
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
        <div className="section-icon reference"><Code size={26} /></div>
        <div className="section-hero-text">
          <h2>Справочник</h2>
          <p>Термины, концепции и шпаргалки по стеку</p>
        </div>
        <div className="section-stats">
          <div className="stat-chip"><Layers size={14} /> {topics.length} категорий</div>
          <div className="stat-chip"><Target size={14} /> {stats.lessons} терминов</div>
          <div className="stat-chip"><Trophy size={14} /> {stats.done}/{stats.tasks}</div>
          <div className="stat-chip accent">{stats.pct}%</div>
        </div>
      </div>

      <div className="filterbar">
        <div className="filter-search">
          <Search size={14} />
          <input placeholder="Поиск термина…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <div className="topic-grid">
        {filtered.length === 0 && <p className="empty-hint">Ничего не найдено.</p>}
        {filtered.map((t) => (
          <TopicCard key={t.id} topic={t} onSelectLesson={p.onSelectLesson} checks={v2c} />
        ))}
      </div>
    </div>
  );
}