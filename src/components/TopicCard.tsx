import React from "react";
import type { Topic } from "../../shared/types";
import { LessonCard } from "./LessonCard";
import { countTasks } from "../markdown";
import { ChevronRight } from "lucide-react";

type Props = {
  topic: Topic;
  onSelectLesson: (id: string) => void;
  checks?: Record<string, Record<string, boolean>>;
};

export function TopicCard({ topic, onSelectLesson, checks }: Props) {
  const lessons = topic.lessons || [];
  const total = lessons.reduce((s, l) => s + countTasks(l.content || ""), 0);
  const done = lessons.reduce((s, l) => {
    const c = checks?.[l.id];
    return s + (c ? Object.values(c).filter(Boolean).length : 0);
  }, 0);
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <section className="topic-card">
      <div className="tc-head">
        <div className="tc-info">
          <h4>{topic.title}</h4>
          {topic.description && <p>{topic.description}</p>}
        </div>
        <div className="tc-badge">{lessons.length} ур.</div>
      </div>

      {total > 0 && (
        <div className="tc-progress">
          <div className="tc-bar"><div className="tc-bar-fill" style={{ width: `${pct}%` }} /></div>
          <span className="tc-frac">{done}/{total}</span>
        </div>
      )}

      <div className="tc-lessons">
        {lessons.map((l) => (
          <LessonCard key={l.id} lesson={l} onSelect={() => onSelectLesson(l.id)}
            checkedCount={checks?.[l.id] ? Object.values(checks[l.id]).filter(Boolean).length : 0} />
        ))}
      </div>
    </section>
  );
}