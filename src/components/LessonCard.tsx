import React from "react";
import type { Lesson } from "../../shared/types";
import { countTasks } from "../markdown";
import { Check, ChevronRight } from "lucide-react";

type Props = {
  lesson: Lesson;
  onSelect: () => void;
  checkedCount?: number;
  totalCount?: number;
};

export function LessonCard({ lesson, onSelect, checkedCount, totalCount }: Props) {
  const total = typeof totalCount === "number" ? totalCount : countTasks(lesson.content || "");
  const checked = typeof checkedCount === "number" ? checkedCount : 0;
  const solved = total > 0 && checked >= total;
  const pct = total ? Math.round((checked / total) * 100) : 0;

  return (
    <div role="button" tabIndex={0} onClick={onSelect}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(); } }}
      className={`lesson-card${solved ? " solved" : ""}`}>
      <div className="lc-left">
        <div className="lc-title">{lesson.title}</div>
        <div className="lc-meta">
          <span className="lc-tasks">{total > 0 ? `${checked}/${total} задач` : "Материал"}</span>
          <div className="lc-chips">
            {lesson.difficulty && (
              <span className={`chip diff-${lesson.difficulty}`}>
                {lesson.difficulty[0].toUpperCase() + lesson.difficulty.slice(1)}
              </span>
            )}
            {(lesson.tags || []).slice(0, 3).map((t) => <span key={t} className="chip">{t}</span>)}
          </div>
        </div>
        {total > 0 && (
          <div className="lc-bar"><div className="lc-bar-fill" style={{ width: `${pct}%` }} /></div>
        )}
      </div>
      <div className="lc-right">
        {solved && <span className="solved-badge"><Check size={12} /> Решено</span>}
        <span className="lc-order">{lesson.order != null ? String(lesson.order).padStart(2, "0") : "—"}</span>
        <ChevronRight size={15} className="lc-arrow" />
      </div>
    </div>
  );
}