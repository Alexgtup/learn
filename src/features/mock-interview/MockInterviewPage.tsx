import { useState, useMemo, useEffect, useRef } from "react";
import { X, Play, RotateCcw, Clock, CheckCircle, AlertCircle, SkipForward, ChevronRight } from "lucide-react";"lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "../../core/store/useAppStore";
import { Button } from "../../shared/ui/Button";
import { Card } from "../../shared/ui/Card";
import { Badge } from "../../shared/ui/Badge";
import { Modal } from "../../shared/ui/Modal";
import { countTasks } from "../../markdown";

const INTERVIEW_STEPS = [
  { id: "intro", title: "Введение", duration: 2, description: "Представься, расскажи о себе" },
  { id: "behavioral", title: "Behavioral", duration: 15, description: "Поведенческие вопросы (STAR метод)" },
  { id: "coding", title: "Coding", duration: 25, description: "Алгоритмическая задача" },
  { id: "system", title: "System Design", duration: 15, description: "Проектирование системы" },
  { id: "qa", title: "Q&A", duration: 5, description: "Вопросы к интервьюеру" },
];

const BEHAVIORAL_QUESTIONS = [
  "Расскажи о себе",
  "Опиши сложный проект, над которым работал",
  "Как ты решал конфликт в команде?",
  "Расскажи о провале и чему он тебя научил",
  "Почему хочешь работать у нас?",
  "Где ты видишь себя через 5 лет?",
];

export function MockInterviewPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [phase, setPhase] = useState<"setup" | "interview" | "review">("setup");
  const [currentStep, setCurrentStep] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const timerRef = useRef<number | null>(null);

  const { v2State, addXp, updateStreak, incrementSessions } = useAppStore();

  const currentStepData = INTERVIEW_STEPS[currentStep];
  const totalDuration = INTERVIEW_STEPS.reduce((s, step) => s + step.duration, 0);
  const elapsedMinutes = Math.floor(seconds / 60);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const startInterview = () => {
    setPhase("interview");
    setCurrentStep(0);
    setSeconds(0);
    setIsRunning(true);
    setRatings({});
    setNotes("");
    updateStreak();
  };

  const nextStep = () => {
    if (currentStep < INTERVIEW_STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      finishInterview();
    }
  };

  const finishInterview = () => {
    setIsRunning(false);
    setPhase("review");
    addXp(50);
    incrementSessions();
  };

  const resetInterview = () => {
    setPhase("setup");
    setCurrentStep(0);
    setSeconds(0);
    setIsRunning(false);
    setRatings({});
  };

  const candidates = useMemo(() => {
    if (!v2State) return [];
    const list: { lesson: any; sectionType: string; sectionTitle: string }[] = [];
    for (const s of v2State.sections || [])
      for (const t of s.topics || [])
        for (const l of t.lessons || []) {
          const total = countTasks(l.content || "");
          const done = Object.values(v2State.checks?.[l.id] || {}).filter(Boolean).length;
          if (total === 0 || done < total) {
            list.push({ lesson: l, sectionType: s.type, sectionTitle: s.title });
          }
        }
    return list;
  }, [v2State]);

  const randomTask = useMemo(() => {
    if (candidates.length === 0) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
  }, [candidates, currentStep]);

  const randomQuestion = useMemo(() => {
    return BEHAVIORAL_QUESTIONS[Math.floor(Math.random() * BEHAVIORAL_QUESTIONS.length)];
  }, [currentStep]);

  return (
    <div className="section-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">🎯 Mock Interview</h2>
          <p className="text-white/50 text-sm mt-1">Полная имитация собеседования</p>
        </div>
        <Button icon={<Play size={16} />} onClick={() => setIsOpen(true)}>
          Начать интервью
        </Button>
      </div>

      {/* Interview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <div className="text-3xl font-bold text-white">{useAppStore.getState().gamification.sessionsCompleted}</div>
          <div className="text-sm text-white/50">Пройдено интервью</div>
        </Card>
        <Card>
          <div className="text-3xl font-bold text-white">
            {formatTime(useAppStore.getState().gamification.totalStudyTime * 60)}
          </div>
          <div className="text-sm text-white/50">Всего времени</div>
        </Card>
        <Card>
          <div className="text-3xl font-bold text-white">{candidates.length}</div>
          <div className="text-sm text-white/50">Доступных задач</div>
        </Card>
      </div>

      {/* Interview Structure */}
      <Card>
        <h3 className="text-lg font-semibold text-white mb-4">Структура интервью</h3>
        <div className="space-y-3">
          {INTERVIEW_STEPS.map((step, i) => (
            <div key={step.id} className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-sm font-bold text-white/50">
                {i + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">{step.title}</span>
                  <Badge variant="default" size="sm">{step.duration} мин</Badge>
                </div>
                <p className="text-sm text-white/40">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Interview Modal */}
      <Modal open={isOpen} onClose={() => setIsOpen(false)} size="xl">
        {phase === "setup" && (
          <div className="text-center py-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center mx-auto mb-6">
              <Play size={36} className="text-indigo-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Готов к интервью?</h2>
            <p className="text-white/50 mb-6 max-w-md mx-auto">
              Полная имитация собеседования длительностью ~{totalDuration} минут. 
              Включая behavioral, coding и system design вопросы.
            </p>
            {candidates.length > 0 && randomTask && (
              <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-sm text-white/50 mb-1">Пример задачи:</p>
                <p className="text-white font-medium">{randomTask.lesson.title}</p>
              </div>
            )}
            <div className="flex gap-3 justify-center">
              <Button variant="secondary" onClick={() => setIsOpen(false)}>
                Отмена
              </Button>
              <Button icon={<Play size={16} />} onClick={startInterview}>
                Начать
              </Button>
            </div>
          </div>
        )}

        {phase === "interview" && (
          <div>
            {/* Timer Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-white/50" />
                  <span className="text-2xl font-mono font-bold text-white">
                    {formatTime(seconds)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white/50">
                    Шаг {currentStep + 1} / {INTERVIEW_STEPS.length}
                  </span>
                </div>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentStep + 1) / INTERVIEW_STEPS.length) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Step Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="mb-4">
                  <Badge variant="purple">{currentStepData.title}</Badge>
                  <h3 className="text-xl font-bold text-white mt-2">
                    {currentStepData.description}
                  </h3>
                </div>

                {currentStepData.id === "behavioral" && (
                  <Card variant="gradient" className="mb-4">
                    <p className="text-lg text-white/90">{randomQuestion}</p>
                    <p className="text-sm text-white/40 mt-2">
                      Используй STAR метод: Situation, Task, Action, Result
                    </p>
                  </Card>
                )}

                {currentStepData.id === "coding" && randomTask && (
                  <Card variant="gradient" className="mb-4">
                    <p className="text-lg font-semibold text-white">{randomTask.lesson.title}</p>
                    <p className="text-sm text-white/50 mt-1">
                      Раздел: {randomTask.sectionTitle}
                    </p>
                  </Card>
                )}

                {currentStepData.id === "system" && (
                  <Card variant="gradient" className="mb-4">
                    <p className="text-lg text-white/90">
                      Спроектируй систему для: URL Shortener / Twitter Feed / Chat App
                    </p>
                  </Card>
                )}

                {/* Notes */}
                <textarea
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-white/30 resize-none focus:outline-none focus:border-indigo-500/50"
                  rows={4}
                  placeholder="Заметки по этому этапу..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </motion.div>
            </AnimatePresence>

            {/* Controls */}
            <div className="flex justify-between mt-6">
              <Button variant="ghost" size="sm" icon={<SkipForward size={14} />} onClick={finishInterview}>
                Завершить досрочно
              </Button>
              <Button icon={<ChevronRight size={14} />} onClick={nextStep}>
                {currentStep < INTERVIEW_STEPS.length - 1 ? "Следующий этап" : "Завершить"}
              </Button>
            </div>
          </div>
        )}

        {phase === "review" && (
          <div className="text-center py-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={36} className="text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Интервью завершено!</h2>
            <p className="text-white/50 mb-6">
              Длительность: {formatTime(seconds)} · Получено: +50 XP
            </p>

            <div className="text-left mb-6 space-y-3">
              {INTERVIEW_STEPS.map((step) => (
                <div key={step.id} className="flex items-center gap-3">
                  <span className="text-white/70">{step.title}</span>
                  <div className="flex-1" />
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((r) => (
                      <button
                        key={r}
                        className={`w-6 h-6 rounded text-xs transition-colors ${
                          (ratings[step.id] || 0) >= r
                            ? "bg-amber-500/30 text-amber-400"
                            : "bg-white/5 text-white/30 hover:bg-white/10"
                        }`}
                        onClick={() =>
                          setRatings((prev) => ({ ...prev, [step.id]: r }))
                        }
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 justify-center">
              <Button variant="secondary" onClick={() => setIsOpen(false)}>
                Закрыть
              </Button>
              <Button icon={<RotateCcw size={16} />} onClick={resetInterview}>
                Ещё раз
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
