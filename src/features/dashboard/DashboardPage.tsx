import { useMemo } from "react";
import {
  Flame,
  TrendingUp,
  Award,
  Zap,
  BookOpen,
  GitBranch,
  Code,
  Target,
  Clock,
  Trophy,
  Star,
  ChevronRight,
} from "lucide-react";
import { useAppStore } from "../../core/store/useAppStore";
import { Card } from "../../shared/ui/Card";
import { Badge } from "../../shared/ui/Badge";
import { Progress } from "../../shared/ui/Progress";
import { motion } from "framer-motion";
import { Heatmap } from "../../components/Heatmap";
import { RadarChart } from "../../components/RadarChart";

export function DashboardPage() {
  const { v2State, gamification, getProgress, getSectionProgress, ui } = useAppStore();
  const progress = getProgress();

  const stats = useMemo(() => {
    if (!v2State) return null;
    let totalTasks = 0;
    let completedTasks = 0;
    let totalLessons = 0;
    const sectionStats: Record<string, { total: number; done: number }> = {};

    for (const section of v2State.sections || []) {
      sectionStats[section.type] = { total: 0, done: 0 };
      for (const topic of section.topics || []) {
        for (const lesson of topic.lessons || []) {
          totalLessons++;
          const tasks = (lesson.content || "").match(/^[ \t]*[-*] \[[ xX]\]/gm)?.length || 0;
          totalTasks += tasks;
          const done = Object.values(v2State.checks?.[lesson.id] || {}).filter(Boolean).length;
          completedTasks += done;
          sectionStats[section.type].total += tasks;
          sectionStats[section.type].done += done;
        }
      }
    }
    return { totalTasks, completedTasks, totalLessons, sectionStats };
  }, [v2State]);

  const radarData = [
    {
      label: "Алгоритмы",
      value: getSectionProgress("algorithms"),
      color: "rgba(83,158,233,0.9)",
    },
    {
      label: "Проекты",
      value: getSectionProgress("projects"),
      color: "rgba(245,158,11,0.9)",
    },
    {
      label: "Справочник",
      value: getSectionProgress("reference"),
      color: "rgba(16,185,129,0.9)",
    },
    {
      label: "Разное",
      value: getSectionProgress("misc"),
      color: "rgba(236,72,153,0.9)",
    },
  ];

  const xpToNext = gamification.level <= 10 ? 100 : gamification.level <= 25 ? 200 : 500;
  const xpInLevel = gamification.xp - getXpForLevel(gamification.level);

  const activity = (v2State as any)?.activity || {};

  return (
    <div className="section-page">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-white/90 to-white/60 bg-clip-text text-transparent">
              {getGreeting()}, разработчик!
            </h1>
            <p className="text-white/50 mt-1">
              {gamification.streak > 0
                ? `🔥 ${gamification.streak} дней подряд — продолжай в том же духе!`
                : "Начни свой путь к офферу сегодня"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-500/20">
              <Trophy size={18} className="text-amber-400" />
              <span className="text-sm font-semibold text-amber-300">
                LVL {gamification.level}
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
              <Star size={18} className="text-violet-400" />
              <span className="text-sm font-semibold text-violet-300">
                {gamification.xp} XP
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-min">
        {/* Continue Learning */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-2"
        >
          <Card variant="gradient" className="h-full">
            <div className="flex items-start justify-between">
              <div>
                <Badge variant="purple">Продолжить обучение</Badge>
                <h3 className="text-xl font-bold mt-3">
                  {getContinueLesson(v2State)?.title || "Начни с основ"}
                </h3>
                <p className="text-white/50 text-sm mt-1">
                  {getContinueLesson(v2State)?.section || "Выбери свой первый урок"}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                <Zap size={24} className="text-indigo-400" />
              </div>
            </div>
            <div className="mt-4">
              <Progress
                value={progress}
                showLabel={false}
                size="sm"
              />
            </div>
          </Card>
        </motion.div>

        {/* Streak Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-orange-500/15 flex items-center justify-center mb-3">
              <Flame size={28} className="text-orange-400" />
            </div>
            <div className="text-3xl font-bold text-white">{gamification.streak}</div>
            <div className="text-sm text-white/50">дней подряд</div>
          </Card>
        </motion.div>

        {/* XP Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-violet-500/15 flex items-center justify-center mb-3">
              <Star size={28} className="text-violet-400" />
            </div>
            <div className="text-3xl font-bold text-white">{gamification.xp}</div>
            <div className="text-sm text-white/50">опыта</div>
            <div className="mt-2 w-full">
              <Progress
                value={xpInLevel}
                max={xpToNext}
                size="sm"
                showLabel={false}
              />
            </div>
          </Card>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="md:col-span-2"
        >
          <Card>
            <div className="grid grid-cols-3 gap-4">
              <StatBox
                icon={<BookOpen size={20} className="text-blue-400" />}
                value={stats?.totalLessons || 0}
                label="Уроков"
              />
              <StatBox
                icon={<Target size={20} className="text-emerald-400" />}
                value={stats?.completedTasks || 0}
                label="Выполнено"
              />
              <StatBox
                icon={<Clock size={20} className="text-amber-400" />}
                value={gamification.totalStudyTime}
                label="Минут"
              />
            </div>
          </Card>
        </motion.div>

        {/* Radar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="md:col-span-2"
        >
          <Card>
            <h3 className="text-sm font-semibold text-white/70 mb-4 flex items-center gap-2">
              <TrendingUp size={16} /> Навыки
            </h3>
            <div className="flex justify-center">
              <RadarChart data={radarData} size={220} />
            </div>
          </Card>
        </motion.div>

        {/* Heatmap */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="md:col-span-4"
        >
          <Card>
            <h3 className="text-sm font-semibold text-white/70 mb-4 flex items-center gap-2">
              <Clock size={16} /> Активность за год
            </h3>
            <Heatmap activity={activity} />
          </Card>
        </motion.div>

        {/* Section Progress */}
        {["algorithms", "projects", "reference"].map((type, i) => (
          <motion.div
            key={type}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.05 }}
          >
            <Card>
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    type === "algorithms"
                      ? "bg-blue-500/15"
                      : type === "projects"
                      ? "bg-amber-500/15"
                      : "bg-emerald-500/15"
                  }`}
                >
                  {type === "algorithms" ? (
                    <BookOpen size={20} className="text-blue-400" />
                  ) : type === "projects" ? (
                    <GitBranch size={20} className="text-amber-400" />
                  ) : (
                    <Code size={20} className="text-emerald-400" />
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-white">
                    {type === "algorithms"
                      ? "Алгоритмы"
                      : type === "projects"
                      ? "Проекты"
                      : "Справочник"}
                  </h4>
                </div>
              </div>
              <Progress
                value={getSectionProgress(type)}
                size="sm"
                showLabel={false}
                variant={
                  type === "algorithms"
                    ? "default"
                    : type === "projects"
                    ? "gold"
                    : "success"
                }
              />
              <div className="flex justify-between mt-2 text-xs text-white/40">
                <span>{getSectionProgress(type)}%</span>
                <span>
                  {stats?.sectionStats?.[type]?.done || 0} /{" "}
                  {stats?.sectionStats?.[type]?.total || 0}
                </span>
              </div>
            </Card>
          </motion.div>
        ))}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <Card
            variant="gradient"
            className="h-full flex flex-col items-center justify-center text-center cursor-pointer"
            onClick={() => {}}
          >
            <Zap size={28} className="text-indigo-400 mb-2" />
            <span className="font-semibold text-white">Mock Interview</span>
            <ChevronRight size={16} className="text-white/40 mt-1" />
          </Card>
        </motion.div>

        {/* Achievements Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="md:col-span-4"
        >
          <Card>
            <h3 className="text-sm font-semibold text-white/70 mb-4 flex items-center gap-2">
              <Award size={16} /> Достижения
            </h3>
            <div className="flex gap-3 flex-wrap">
              {gamification.achievements.length === 0 ? (
                <p className="text-white/40 text-sm">
                  Выполняй задания, чтобы разблокировать достижения!
                </p>
              ) : (
                gamification.achievements.map((ach) => (
                  <div
                    key={ach}
                    className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm font-medium"
                  >
                    🏆 {ach}
                  </div>
                ))
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

function StatBox({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="text-center">
      <div className="flex justify-center mb-2">{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-white/50">{label}</div>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "Доброй ночи";
  if (hour < 12) return "Доброе утро";
  if (hour < 18) return "Добрый день";
  return "Добрый вечер";
}

function getContinueLesson(v2State: any) {
  if (!v2State?.sections) return null;
  for (const section of v2State.sections) {
    for (const topic of section.topics || []) {
      for (const lesson of topic.lessons || []) {
        const checks = v2State.checks?.[lesson.id] || {};
        const total = (lesson.content || "").match(/^[ \t]*[-*] \[[ xX]\]/gm)?.length || 0;
        const done = Object.values(checks).filter(Boolean).length;
        if (done < total || total === 0) {
          return { title: lesson.title, section: section.title };
        }
      }
    }
  }
  return null;
}

function getXpForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    if (i <= 10) total += 100;
    else if (i <= 25) total += 200;
    else if (i <= 50) total += 500;
    else if (i <= 75) total += 1000;
    else total += 2000;
  }
  return total;
}
