import { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Star, Zap, Lock, CheckCircle } from "lucide-react";
import { useAppStore } from "../../core/store/useAppStore";
import { Card } from "../../shared/ui/Card";
import { Badge } from "../../shared/ui/Badge";
import { Progress } from "../../shared/ui/Progress";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  condition: string;
  xpReward: number;
  unlocked: boolean;
  rarity: "common" | "rare" | "epic" | "legendary";
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-step",
    title: "Первый шаг",
    description: "Выполни первую задачу",
    icon: <Zap size={20} />,
    condition: "1 задача",
    xpReward: 50,
    unlocked: true,
    rarity: "common",
  },
  {
    id: "week-streak",
    title: "Неделя огня",
    description: "7 дней подряд",
    icon: <Star size={20} />,
    condition: "7 дней",
    xpReward: 200,
    unlocked: true,
    rarity: "rare",
  },
  {
    id: "algo-master",
    title: "Мастер Алгоритмов",
    description: "Реши 50 алгоритмических задач",
    icon: <Trophy size={20} />,
    condition: "50 задач",
    xpReward: 500,
    unlocked: false,
    rarity: "epic",
  },
  {
    id: "night-owl",
    title: "Ночная сова",
    description: "Учись после полуночи",
    icon: <Zap size={20} />,
    condition: "1 ночная сессия",
    xpReward: 100,
    unlocked: false,
    rarity: "common",
  },
  {
    id: "speed-demon",
    title: "Скоростной демон",
    description: "Реши задачу за 5 минут",
    icon: <Zap size={20} />,
    condition: "5 минут",
    xpReward: 150,
    unlocked: false,
    rarity: "rare",
  },
  {
    id: "interview-ready",
    title: "Готов к собесу",
    description: "Пройди 10 мок-интервью",
    icon: <CheckCircle size={20} />,
    condition: "10 интервью",
    xpReward: 300,
    unlocked: false,
    rarity: "epic",
  },
  {
    id: "legend",
    title: "Легенда",
    description: "Достигни 100 уровня",
    icon: <Trophy size={20} />,
    condition: "Уровень 100",
    xpReward: 10000,
    unlocked: false,
    rarity: "legendary",
  },
];

const RARITY_COLORS: Record<string, string> = {
  common: "from-gray-500/10 to-gray-500/5 border-gray-500/20",
  rare: "from-blue-500/10 to-blue-500/5 border-blue-500/20",
  epic: "from-purple-500/10 to-purple-500/5 border-purple-500/20",
  legendary: "from-amber-500/10 to-amber-500/5 border-amber-500/30",
};

const RARITY_LABELS: Record<string, string> = {
  common: "Обычная",
  rare: "Редкая",
  epic: "Эпическая",
  legendary: "Легендарная",
};

export function GamificationPage() {
  const { gamification } = useAppStore();
  const [filter, setFilter] = useState<"all" | "unlocked" | "locked">("all");

  const filtered = ACHIEVEMENTS.filter((a) => {
    if (filter === "unlocked") return a.unlocked;
    if (filter === "locked") return !a.unlocked;
    return true;
  });

  const xpToNext = gamification.level <= 10 ? 100 : gamification.level <= 25 ? 200 : 500;
  const xpInLevel = gamification.xp - getXpForLevel(gamification.level);

  return (
    <div className="section-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">🏆 Достижения</h2>
          <p className="text-white/50 text-sm mt-1">Собери все награды</p>
        </div>
        <div className="flex gap-2">
          {(["all", "unlocked", "locked"] as const).map((f) => (
            <button
              key={f}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filter === f
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white/70"
              }`}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "Все" : f === "unlocked" ? "Получены" : "Заблокированы"}
            </button>
          ))}
        </div>
      </div>

      {/* Level Card */}
      <Card variant="gradient" className="mb-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-2xl shadow-amber-500/20">
              <span className="text-4xl font-bold text-white">{gamification.level}</span>
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white/10 backdrop-blur flex items-center justify-center">
              <Star size={14} className="text-amber-400" />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold text-white">Уровень {gamification.level}</h3>
              <Badge variant="gold">
                {gamification.level <= 10
                  ? "Новичок"
                  : gamification.level <= 25
                  ? "Junior"
                  : gamification.level <= 50
                  ? "Middle"
                  : gamification.level <= 75
                  ? "Senior"
                  : "Lead"}
              </Badge>
            </div>
            <Progress value={xpInLevel} max={xpToNext} size="md" />
            <p className="text-sm text-white/50 mt-2">
              {xpInLevel} / {xpToNext} XP до следующего уровня
            </p>
          </div>
          <div className="text-right hidden md:block">
            <div className="text-3xl font-bold text-white">{gamification.xp}</div>
            <div className="text-sm text-white/50">всего XP</div>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Серия", value: `${gamification.streak} дней`, icon: "🔥" },
          { label: "Интервью", value: gamification.sessionsCompleted, icon: "🎯" },
          { label: "Время", value: `${gamification.totalStudyTime} мин`, icon: "⏱️" },
          { label: "Достижения", value: `${ACHIEVEMENTS.filter((a) => a.unlocked).length}/${ACHIEVEMENTS.length}`, icon: "🏆" },
        ].map((s) => (
          <Card key={s.label} className="text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-lg font-bold text-white">{s.value}</div>
            <div className="text-xs text-white/50">{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((achievement, i) => (
          <motion.div
            key={achievement.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card
              className={`relative overflow-hidden ${
                achievement.unlocked ? "" : "opacity-50"
              }`}
            >
              {achievement.unlocked && (
                <div className="absolute top-3 right-3">
                  <CheckCircle size={18} className="text-emerald-400" />
                </div>
              )}
              {!achievement.unlocked && (
                <div className="absolute top-3 right-3">
                  <Lock size={18} className="text-white/20" />
                </div>
              )}
              <div className="flex items-start gap-3">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${RARITY_COLORS[achievement.rarity]} flex items-center justify-center border`}
                >
                  <span className={achievement.unlocked ? "text-white" : "text-white/30"}>
                    {achievement.icon}
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white">{achievement.title}</h4>
                  <p className="text-sm text-white/50 mt-0.5">{achievement.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={achievement.rarity as any} size="sm">
                      {RARITY_LABELS[achievement.rarity]}
                    </Badge>
                    <span className="text-xs text-amber-400">+{achievement.xpReward} XP</span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
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
