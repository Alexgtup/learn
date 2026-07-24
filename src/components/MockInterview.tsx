import { useEffect, useMemo, useRef, useState } from "react";
import { X, Timer, Play, RotateCcw } from "lucide-react";
import type { AppStateV2, Lesson } from "../../shared/types";
import { countTasks } from "../markdown";

type Props = {
  open: boolean;
  onClose: () => void;
  v2State: AppStateV2 | null;
  onStartLesson: (lessonId: string, sectionType: string) => void;
};

export function MockInterview({ open, onClose, v2State, onStartLesson }: Props) {
  const [phase, setPhase] = useState<"pick" | "timer" | "done">("pick");
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [sectionType, setSectionType] = useState("algorithms");
  const [seconds, setSeconds] = useState(25 * 60);
  const [rating, setRating] = useState(0);
  const timerRef = useRef<number | null>(null);

  const candidates = useMemo(() => {
    if (!v2State) return [];
    const list: { lesson: Lesson; sectionType: string }[] = [];
    for (const s of v2State.sections || [])
      for (const t of s.topics || [])
        for (const l of t.lessons || []) {
          const total = countTasks(l.content || "");
          const done = Object.values(v2State.checks?.[l.id] || {}).filter(Boolean).length;
          if (total === 0 || done < total) list.push({ lesson: l, sectionType: s.type });
        }
    return list;
  }, [v2State]);

  useEffect(() => {
    if (!open) { setPhase("pick"); setLesson(null); setSeconds(25 * 60); setRating(0); }
  }, [open]);

  useEffect(() => {
    if (phase !== "timer") return;
    timerRef.current = window.setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) { setPhase("done"); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  if (!open) return null;

  const pickRandom = () => {
    if (!candidates.length) return;
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    setLesson(pick.lesson);
    setSectionType(pick.sectionType);
    setSeconds(25 * 60);
    setPhase("timer");
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal mock-modal">
        <button className="btn btn-ghost modal-close" onClick={onClose}><X size={16} /></button>

        {phase === "pick" && (
          <>
            <h2>🎯 Mock Interview</h2>
            <p className="sub">Случайная незавершённая задача + таймер 25 минут. Имитация реального собеседования.</p>
            <div className="mock-stats">
              <span>{candidates.length} задач доступно</span>
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={onClose}>Отмена</button>
              <button className="btn btn-primary" onClick={pickRandom} disabled={!candidates.length}>
                <Play size={15} /> Начать
              </button>
            </div>
          </>
        )}

        {phase === "timer" && lesson && (
          <>
            <h2>⏱️ {mm}:{ss}</h2>
            <p className="sub">{lesson.title}</p>
            <div className="mock-timer-bar">
              <div className="mock-timer-fill" style={{ width: `${(seconds / (25 * 60)) * 100}%` }} />
            </div>
            <div className="modal-actions" style={{ flexDirection: "column", gap: 8 }}>
              <button className="btn btn-primary" style={{ width: "100%" }}
                onClick={() => { onStartLesson(lesson.id, sectionType); onClose(); }}>
                Открыть задачу
              </button>
              <button className="btn" style={{ width: "100%" }} onClick={() => setPhase("done")}>
                Завершить досрочно
              </button>
            </div>
          </>
        )}

        {phase === "done" && (
          <>
            <h2>Как прошло?</h2>
            <p className="sub">Оцени свою уверенность по этой теме.</p>
            <div className="mock-rating">
              {[1, 2, 3, 4, 5].map((v) => (
                <button key={v} className={`mock-star${rating >= v ? " filled" : ""}`}
                  onClick={() => setRating(v)}>★</button>
              ))}
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={onClose}>Закрыть</button>
              <button className="btn btn-primary" onClick={() => { setPhase("pick"); setRating(0); }}>
                <RotateCcw size={15} /> Ещё раз
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}