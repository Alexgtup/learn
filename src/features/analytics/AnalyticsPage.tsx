import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { useAppStore } from "../../core/store/useAppStore";
import { Card } from "../../shared/ui/Card";
import { Badge } from "../../shared/ui/Badge";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Clock,
  Target,
  Zap,
  BookOpen,
  Award,
} from "lucide-react";

const COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ec4899", "#06b6d4"];

export function AnalyticsPage() {
  const { v2State, gamification } = useAppStore();

  const stats = useMemo(() => {
    if (!v2State) return null;
    let totalTasks = 0;
    let completedTasks = 0;
    let totalLessons = 0;
    const sectionBreakdown: Record<string, number> = {};
    const difficultyBreakdown: Record<string, number> = { easy: 0, medium: 0, hard: 0 };

    for (const section of v2State.sections || []) {
      sectionBreakdown[section.type] = 0;
      for (const topic of section.topics || []) {
        for (const lesson of topic.lessons || []) {
          totalLessons++;
          const tasks = (lesson.content || "").match(/^[ \t]*[-*] \[[ xX]\]/gm)?.length || 0;
          totalTasks += tasks;
          const done = Object.values(v2State.checks?.[lesson.id] || {}).filter(Boolean).length;
          completedTasks += done;
          sectionBreakdown[section.type] += tasks;

          if (lesson.difficulty) {
            difficultyBreakdown[lesson.difficulty] = (difficultyBreakdown[lesson.difficulty] || 0) + tasks;
          }
        }
      }
    }
    return { totalTasks, completedTasks, totalLessons, sectionBreakdown, difficultyBreakdown };
  }, [v2State]);

  const mockProgressData = [
    { date: "Пн", tasks: 12, xp: 120 },
    { date: "Вт", tasks: 18, xp: 180 },
    { date: "Ср", tasks: 8, xp: 80 },
    { date: "Чт", tasks: 24, xp: 240 },
    { date: "Пт", tasks: 15, xp: 150 },
    { date: "Сб", tasks: 30, xp: 300 },
    { date: "Вс", tasks: 22, xp: 220 },
  ];

  const sectionData = stats
    ? Object.entries(stats.sectionBreakdown).map(([name, value]) => ({
        name:
          name === "algorithms"
            ? "Алгоритмы"
            : name === "projects"
            ? "Проекты"
            : name === "reference"
            ? "Справочник"
            : "Разное",
        value,
      }))
    : [];

  const difficultyData = stats
    ? Object.entries(stats.difficultyBreakdown).map(([name, value]) => ({
        name: name === "easy" ? "Easy" : name === "medium" ? "Medium" : "Hard",
        value,
      }))
    : [];

  return (
    <div className="section-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">📊 Аналитика</h2>
          <p className="text-white/50 text-sm mt-1">Глубокий анализ прогресса</p>
        </div>
        <Badge variant="purple">За последние 7 дней</Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: <BookOpen size={20} className="text-blue-400" />, value: stats?.totalLessons || 0, label: "Уроков", bg: "bg-blue-500/10" },
          { icon: <Target size={20} className="text-emerald-400" />, value: stats?.completedTasks || 0, label: "Решено", bg: "bg-emerald-500/10" },
          { icon: <Zap size={20} className="text-amber-400" />, value: gamification.xp, label: "XP", bg: "bg-amber-500/10" },
          { icon: <Clock size={20} className="text-violet-400" />, value: gamification.totalStudyTime, label: "Минут", bg: "bg-violet-500/10" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                {stat.icon}
              </div>
              <div>
                <div className="text-xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-white/50">{stat.label}</div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <h3 className="text-sm font-semibold text-white/70 mb-4 flex items-center gap-2">
              <TrendingUp size={16} /> Прогресс по дням
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={mockProgressData}>
                <defs>
                  <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={12} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "#0f0f16",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                  }}
                  labelStyle={{ color: "rgba(255,255,255,0.7)" }}
                />
                <Area
                  type="monotone"
                  dataKey="tasks"
                  stroke="#6366f1"
                  fillOpacity={1}
                  fill="url(#colorTasks)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card>
            <h3 className="text-sm font-semibold text-white/70 mb-4">XP Growth</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={mockProgressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={12} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "#0f0f16",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="xp"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ fill: "#f59e0b", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <h3 className="text-sm font-semibold text-white/70 mb-4">По разделам</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={sectionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "#0f0f16",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                  }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {sectionData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card>
            <h3 className="text-sm font-semibold text-white/70 mb-4">По сложности</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={difficultyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {difficultyData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#0f0f16",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
              {difficultyData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ background: COLORS[i % COLORS.length] }}
                  />
                  <span className="text-xs text-white/50">{d.name}</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Weak Areas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-4"
      >
        <Card>
          <h3 className="text-sm font-semibold text-white/70 mb-4 flex items-center gap-2">
            <Award size={16} /> Слабые места
          </h3>
          <div className="space-y-3">
            {[
              { name: "Dynamic Programming", progress: 15 },
              { name: "System Design", progress: 10 },
              { name: "Graph Algorithms", progress: 25 },
            ].map((area) => (
              <div key={area.name} className="flex items-center gap-4">
                <span className="text-sm text-white/70 w-40">{area.name}</span>
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-500"
                    style={{ width: `${area.progress}%` }}
                  />
                </div>
                <span className="text-sm text-white/50 w-12 text-right">
                  {area.progress}%
                </span>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
