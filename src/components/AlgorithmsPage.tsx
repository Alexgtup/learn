import React, { useMemo, useState, useEffect } from "react";
import { ArrowLeft, BookOpen, Search, Trophy, Target, Layers } from "lucide-react";
import type { AppStateV2, Topic, ModuleItem, Lesson } from "../../shared/types";
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

export function AlgorithmsPage(p: Props) {
  const [diff, setDiff] = useState<"all" | "easy" | "medium" | "hard">("all");
  const [tag, setTag] = useState("");

  const topics = useMemo<Topic[]>(() => {
    if (!p.v2State) return [];
    return p.v2State.sections.filter((s) => s.type === "algorithms").flatMap((s) => s.topics || []);
  }, [p.v2State]);

  const filtered = useMemo(() =>
    topics.filter((t) => {
      if (!t.lessons?.length) return true;
      return t.lessons.some((l) => {
        if (diff !== "all" && l.difficulty !== diff) return false;
        if (tag && !(l.tags || []).some((tg) => tg.toLowerCase().includes(tag.toLowerCase()))) return false;
        return true;
      });
    }), [topics, diff, tag]);

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
    return p.v2State.sections.filter((s) => s.type === "algorithms")
      .some((s) => s.topics?.some((t) => t.lessons?.some((l) => l.id === p.activeModule!.id)));
  }, [p.activeModule, p.v2State]);

  /* Escape → назад */
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
          <ArrowLeft size={15} /> Все темы
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
        <div className="section-icon algorithms"><BookOpen size={26} /></div>
        <div className="section-hero-text">
          <h2>Алгоритмы</h2>
          <p>Паттерны, структуры данных и задачи для собеседований</p>
        </div>
        <div className="section-stats">
          <div className="stat-chip"><Layers size={14} /> {topics.length} тем</div>
          <div className="stat-chip"><Target size={14} /> {stats.lessons} уроков</div>
          <div className="stat-chip"><Trophy size={14} /> {stats.done}/{stats.tasks} задач</div>
          <div className="stat-chip accent">{stats.pct}%</div>
        </div>
      </div>

      <div className="filterbar">
        <div className="filter-group">
          {(["all", "easy", "medium", "hard"] as const).map((d) => (
            <button key={d} className={`filter-btn${diff === d ? " active" : ""}`} onClick={() => setDiff(d)}>
              {d === "all" ? "Все" : d[0].toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
        <div className="filter-search">
          <Search size={14} />
          <input placeholder="Тег…" value={tag} onChange={(e) => setTag(e.target.value)} />
          {(tag || diff !== "all") && (
            <button className="filter-btn" onClick={() => { setTag(""); setDiff("all"); }}>Сброс</button>
          )}
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