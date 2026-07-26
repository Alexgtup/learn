import { useState, useMemo } from "react";
import { Check, Lock, Play, Star, ChevronRight } from "lucide-react";
import { useAppStore } from "../../core/store/useAppStore";
import { Card } from "../../shared/ui/Card";
import { Badge } from "../../shared/ui/Badge";
import { Progress } from "../../shared/ui/Progress";
import { motion } from "framer-motion";

interface RoadmapNode {
  id: string;
  title: string;
  type: "topic" | "milestone";
  status: "locked" | "available" | "in-progress" | "completed";
  progress?: number;
  description?: string;
  xpReward?: number;
}

interface RoadmapPhase {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  nodes: RoadmapNode[];
}

const ROADMAP_DATA: RoadmapPhase[] = [
  {
    id: "js-foundation",
    title: "JavaScript Foundations",
    subtitle: "База для всего",
    color: "#f59e0b",
    nodes: [
      { id: "js-basics", title: "Основы JS", type: "topic", status: "completed", progress: 100 },
      { id: "js-functions", title: "Функции", type: "topic", status: "completed", progress: 100 },
      { id: "js-closures", title: "Замыкания", type: "topic", status: "completed", progress: 100 },
      { id: "js-async", title: "Async/Await", type: "topic", status: "in-progress", progress: 60 },
      { id: "js-prototypes", title: "Прототипы", type: "topic", status: "available" },
      { id: "milestone-1", title: "JS Junior", type: "milestone", status: "available", xpReward: 500 },
    ],
  },
  {
    id: "react-ts",
    title: "React & TypeScript",
    subtitle: "Фронтенд стек",
    color: "#06b6d4",
    nodes: [
      { id: "ts-basics", title: "TypeScript Basics", type: "topic", status: "in-progress", progress: 40 },
      { id: "react-hooks", title: "React Hooks", type: "topic", status: "locked" },
      { id: "react-patterns", title: "Паттерны", type: "topic", status: "locked" },
      { id: "state-management", title: "State Management", type: "topic", status: "locked" },
      { id: "milestone-2", title: "Frontend Middle", type: "milestone", status: "locked", xpReward: 1000 },
    ],
  },
  {
    id: "algorithms",
    title: "Алгоритмы",
    subtitle: "Подготовка к собесам",
    color: "#6366f1",
    nodes: [
      { id: "arrays", title: "Arrays & Strings", type: "topic", status: "in-progress", progress: 30 },
      { id: "two-pointers", title: "Two Pointers", type: "topic", status: "available" },
      { id: "sliding-window", title: "Sliding Window", type: "topic", status: "locked" },
      { id: "trees", title: "Trees & Graphs", type: "topic", status: "locked" },
      { id: "dp", title: "Dynamic Programming", type: "topic", status: "locked" },
      { id: "milestone-3", title: "Algo Master", type: "milestone", status: "locked", xpReward: 1500 },
    ],
  },
  {
    id: "system-design",
    title: "System Design",
    subtitle: "Проектирование систем",
    color: "#ec4899",
    nodes: [
      { id: "sd-basics", title: "Основы SD", type: "topic", status: "locked" },
      { id: "scalability", title: "Scalability", type: "topic", status: "locked" },
      { id: "databases", title: "Database Design", type: "topic", status: "locked" },
      { id: "microservices", title: "Microservices", type: "topic", status: "locked" },
      { id: "milestone-4", title: "System Architect", type: "milestone", status: "locked", xpReward: 2000 },
    ],
  },
];

export function RoadmapPage() {
  const { gamification } = useAppStore();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const totalProgress = useMemo(() => {
    let total = 0;
    let completed = 0;
    ROADMAP_DATA.forEach((phase) => {
      phase.nodes.forEach((node) => {
        if (node.type === "topic") {
          total++;
          if (node.status === "completed") completed++;
        }
      });
    });
    return total ? Math.round((completed / total) * 100) : 0;
  }, []);

  return (
    <div className="section-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">🗺️ Дорожная карта</h2>
          <p className="text-white/50 text-sm mt-1">Путь от нуля до Senior Fullstack</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="purple">{totalProgress}% пройдено</Badge>
          <div className="text-sm text-white/50">
            Уровень {gamification.level}
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {ROADMAP_DATA.map((phase, phaseIndex) => (
          <motion.div
            key={phase.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: phaseIndex * 0.1 }}
          >
            <Card>
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ background: phase.color }}
                />
                <div>
                  <h3 className="text-lg font-bold text-white">{phase.title}</h3>
                  <p className="text-sm text-white/50">{phase.subtitle}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {phase.nodes.map((node, nodeIndex) => (
                  <motion.div
                    key={node.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: phaseIndex * 0.1 + nodeIndex * 0.05 }}
                  >
                    <div
                      className={`relative p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                        node.status === "locked"
                          ? "bg-white/[0.02] border-white/[0.04] opacity-50"
                          : node.status === "completed"
                          ? "bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10"
                          : node.status === "in-progress"
                          ? "bg-indigo-500/5 border-indigo-500/20 hover:bg-indigo-500/10"
                          : "bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06]"
                      }`}
                      onClick={() =>
                        node.status !== "locked" && setSelectedNode(node.id)
                      }
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {node.type === "milestone" ? (
                            <Star
                              size={16}
                              className={
                                node.status === "completed"
                                  ? "text-amber-400"
                                  : node.status === "locked"
                                  ? "text-white/20"
                                  : "text-amber-400/60"
                              }
                            />
                          ) : node.status === "completed" ? (
                            <Check size={16} className="text-emerald-400" />
                          ) : node.status === "locked" ? (
                            <Lock size={16} className="text-white/20" />
                          ) : (
                            <Play size={16} className="text-indigo-400" />
                          )}
                          <span
                            className={`text-sm font-medium ${
                              node.status === "locked"
                                ? "text-white/30"
                                : "text-white/90"
                            }`}
                          >
                            {node.title}
                          </span>
                        </div>
                        {node.xpReward && (
                          <Badge variant="gold" size="sm">
                            +{node.xpReward} XP
                          </Badge>
                        )}
                      </div>

                      {node.progress !== undefined && node.progress > 0 && (
                        <div className="mt-3">
                          <Progress
                            value={node.progress}
                            size="sm"
                            showLabel={false}
                            variant={
                              node.status === "completed" ? "success" : "gradient"
                            }
                          />
                        </div>
                      )}

                      {node.status === "in-progress" && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full animate-pulse" />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
