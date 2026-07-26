import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppStateV2, Flashcard, LearningSession, Lesson, Section } from "../../../shared/types";

export type GamificationState = {
  xp: number;
  level: number;
  streak: number;
  lastActiveDate: string | null;
  achievements: string[];
  totalStudyTime: number; // minutes
  sessionsCompleted: number;
};

export type UiState = {
  sidebarOpen: boolean;
  activeSection: string;
  activeLessonId: string | null;
  theme: "dark" | "light";
  toast: { message: string; type: "success" | "error" | "info" } | null;
};

export type AppStore = {
  // Data
  v2State: AppStateV2 | null;
  loading: boolean;
  error: string | null;

  // UI
  ui: UiState;

  // Gamification
  gamification: GamificationState;

  // Actions
  setV2State: (state: AppStateV2 | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // UI Actions
  toggleSidebar: () => void;
  setActiveSection: (section: string) => void;
  setActiveLessonId: (id: string | null) => void;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
  clearToast: () => void;

  // Gamification Actions
  addXp: (amount: number) => void;
  updateStreak: () => void;
  addAchievement: (id: string) => void;
  addStudyTime: (minutes: number) => void;
  incrementSessions: () => void;

  // Computed
  getProgress: () => number;
  getSectionProgress: (type: string) => number;
  getXpForNextLevel: () => number;
};

function calculateLevel(xp: number): number {
  let level = 1;
  let required = 100;
  let totalRequired = 100;
  while (xp >= totalRequired) {
    level++;
    if (level <= 10) required = 100;
    else if (level <= 25) required = 200;
    else if (level <= 50) required = 500;
    else if (level <= 75) required = 1000;
    else if (level <= 99) required = 2000;
    else required = 5000;
    totalRequired += required;
  }
  return level;
}

function getXpForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    if (i <= 10) total += 100;
    else if (i <= 25) total += 200;
    else if (i <= 50) total += 500;
    else if (i <= 75) total += 1000;
    else if (i <= 99) total += 2000;
    else total += 5000;
  }
  return total;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial state
      v2State: null,
      loading: true,
      error: null,

      ui: {
        sidebarOpen: true,
        activeSection: "dashboard",
        activeLessonId: null,
        theme: "dark",
        toast: null,
      },

      gamification: {
        xp: 0,
        level: 1,
        streak: 0,
        lastActiveDate: null,
        achievements: [],
        totalStudyTime: 0,
        sessionsCompleted: 0,
      },

      // Actions
      setV2State: (state) => set({ v2State: state }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      toggleSidebar: () =>
        set((s) => ({ ui: { ...s.ui, sidebarOpen: !s.ui.sidebarOpen } })),
      setActiveSection: (section) =>
        set((s) => ({ ui: { ...s.ui, activeSection: section } })),
      setActiveLessonId: (id) =>
        set((s) => ({ ui: { ...s.ui, activeLessonId: id } })),
      showToast: (message, type = "info") =>
        set((s) => ({ ui: { ...s.ui, toast: { message, type } } })),
      clearToast: () =>
        set((s) => ({ ui: { ...s.ui, toast: null } })),

      addXp: (amount) =>
        set((s) => {
          const newXp = s.gamification.xp + amount;
          const newLevel = calculateLevel(newXp);
          const leveledUp = newLevel > s.gamification.level;
          return {
            gamification: {
              ...s.gamification,
              xp: newXp,
              level: newLevel,
            },
            ui: leveledUp
              ? {
                  ...s.ui,
                  toast: {
                    message: `🎉 Level Up! Теперь уровень ${newLevel}`,
                    type: "success",
                  },
                }
              : s.ui,
          };
        }),

      updateStreak: () =>
        set((s) => {
          const today = new Date().toISOString().slice(0, 10);
          const last = s.gamification.lastActiveDate;
          let streak = s.gamification.streak;

          if (!last) {
            streak = 1;
          } else {
            const lastDate = new Date(last);
            const todayDate = new Date(today);
            const diffDays = Math.floor(
              (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            if (diffDays === 1) streak += 1;
            else if (diffDays > 1) streak = 1;
          }

          return {
            gamification: {
              ...s.gamification,
              streak,
              lastActiveDate: today,
            },
          };
        }),

      addAchievement: (id) =>
        set((s) => {
          if (s.gamification.achievements.includes(id)) return s;
          return {
            gamification: {
              ...s.gamification,
              achievements: [...s.gamification.achievements, id],
            },
            ui: {
              ...s.ui,
              toast: {
                message: `🏆 Достижение разблокировано: ${id}`,
                type: "success",
              },
            },
          };
        }),

      addStudyTime: (minutes) =>
        set((s) => ({
          gamification: {
            ...s.gamification,
            totalStudyTime: s.gamification.totalStudyTime + minutes,
          },
        })),

      incrementSessions: () =>
        set((s) => ({
          gamification: {
            ...s.gamification,
            sessionsCompleted: s.gamification.sessionsCompleted + 1,
          },
        })),

      getProgress: () => {
        const state = get().v2State;
        if (!state) return 0;
        let total = 0;
        let checked = 0;
        for (const section of state.sections || []) {
          for (const topic of section.topics || []) {
            for (const lesson of topic.lessons || []) {
              const tasks = (lesson.content || "").match(/^[ \t]*[-*] \[[ xX]\]/gm)?.length || 0;
              total += tasks;
              checked += Object.values(state.checks?.[lesson.id] || {}).filter(Boolean).length;
            }
          }
        }
        return total ? Math.round((checked / total) * 100) : 0;
      },

      getSectionProgress: (type) => {
        const state = get().v2State;
        if (!state) return 0;
        let total = 0;
        let checked = 0;
        for (const section of state.sections || []) {
          if (section.type !== type) continue;
          for (const topic of section.topics || []) {
            for (const lesson of topic.lessons || []) {
              const tasks = (lesson.content || "").match(/^[ \t]*[-*] \[[ xX]\]/gm)?.length || 0;
              total += tasks;
              checked += Object.values(state.checks?.[lesson.id] || {}).filter(Boolean).length;
            }
          }
        }
        return total ? Math.round((checked / total) * 100) : 0;
      },

      getXpForNextLevel: () => {
        const { gamification } = get();
        const currentLevelBase = getXpForLevel(gamification.level);
        const nextLevelBase = getXpForLevel(gamification.level + 1);
        return nextLevelBase - currentLevelBase;
      },
    }),
    {
      name: "fullstack-prep-v3",
      partialize: (state) => ({
        ui: { ...state.ui, toast: null },
        gamification: state.gamification,
      }),
    }
  )
);
