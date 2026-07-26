import React, { useMemo, useState } from "react";
import type { AppStateV2 } from "../../shared/types";
import { countTasks } from "../markdown";
import { api } from "../api";
import {
  User, BookOpen, Code, GitBranch, TrendingUp, Award,
  Download, Upload, Timer, Flame
} from "lucide-react";
import { Heatmap } from "./Heatmap";
import { RadarChart } from "./RadarChart";

type Props = {
  v2State: AppStateV2 | null;
};

export function ProfilePage({ v2State }: Props) {
  const [importing, setImporting] = useState(false);

  const stats = useMemo(() => {
    const result: Record<string, { total: number; completed: number; topics: number; lessons: number }> = {
      algorithms: { total: 0, completed: 0, topics: 0, lessons: 0 },
      projects: { total: 0, completed: 0, topics: 0, lessons: 0 },
      reference: { total: 0, completed: 0, topics: 0, lessons: 0 },
      misc: { total: 0, completed: 0, topics: 0, lessons: 0 },
    };
    let totalTasks = 0, completedTasks = 0;
    if (!v2State) return { totalTasks, completedTasks, sections: result };
    for (const section of v2State.sections || []) {
      const key = section.type || "misc";
      if (!result[key]) result[key] = { total: 0, completed: 0, topics: 0, lessons: 0 };
      const s = result[key];
      for (const topic of section.topics || []) {
        s.topics++;
        for (const lesson of topic.lessons || []) {
          s.lessons++;
          const tasks = countTasks(lesson.content || "");
          s.total += tasks; totalTasks += tasks;
          const done = Object.values(v2State.checks?.[lesson.id] || {}).filter(Boolean).length;
          s.completed += done; completedTasks += done;
        }
      }
    }
    return { totalTasks, completedTasks, sections: result };
  }, [v2State]);

  const pct = stats.totalTasks ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;
  const activity = (v2State as any)?.activity || {};

  const streak = useMemo(() => {
    let s = 0;
    const d = new Date();
    while (true) {
      const key = d.toISOString().slice(0, 10);
      if ((activity[key] || 0) > 0) { s++; d.setDate(d.getDate() - 1); }
      else break;
    }
    return s;
  }, [activity]);

  const radarData = [
    { label: "Алгоритмы", value: stats.sections.algorithms.total ? Math.round((stats.sections.algorithms.completed / stats.sections.algorithms.total) * 100) : 0, color: "rgba(83,158,233,0.9)" },
    { label: "Проекты", value: stats.sections.projects.total ? Math.round((stats.sections.projects.completed / stats.sections.projects.total) * 100) : 0, color: "rgba(211,163,74,0.9)" },
    { label: "Справочник", value: stats.sections.reference.total ? Math.round((stats.sections.reference.completed / stats.sections.reference.total) * 100) : 0, color: "rgba(79,169,140,0.9)" },
    { label: "Разное", value: stats.sections.misc.total ? Math.round((stats.sections.misc.completed / stats.sections.misc.total) * 100) : 0, color: "rgba(193,102,107,0.9)" },
  ];

  const handleExport = async () => {
    const data = await api.exportState();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `prep-journal-${new Date().toISOString().slice(0, 10)}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = ".json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setImporting(true);
      try {
        const data = JSON.parse(await file.text());
        await api.importState(data);
        window.location.reload();
      } catch { alert("Ошибка импорта"); setImporting(false); }
    };
    input.click();
  };

  const cards = [
    { key: "algorithms", label: "Алгоритмы", icon: BookOpen, color: "83,158,233" },
    { key: "projects", label: "Проекты", icon: GitBranch, color: "211,163,74" },
    { key: "reference", label: "Справочник", icon: Code, color: "79,169,140" },
  ] as const;

  return (
    <div className="section-page">
      <div className="section-hero">
        <div className="section-icon profile"><User size={26} /></div>
        <div className="section-hero-text">
          <h2>Мой прогресс</h2>
          <p>Обзор подготовки к собеседованиям</p>
        </div>
        <div className="section-stats">
          {streak > 0 && <div className="stat-chip accent"><Flame size={14} /> {streak} дн. подряд</div>}
          <button className="stat-chip" onClick={() => {}} style={{ cursor: "pointer" }}>
            <Timer size={14} /> Mock Interview
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="profile-cards">
        <div className="profile-stat-card">
          <div className="psc-icon" style={{ background: "rgba(79,169,140,0.12)" }}><TrendingUp size={20} color="var(--success)" /></div>
          <div className="psc-body"><span className="psc-label">Всего задач</span><span className="psc-value">{stats.totalTasks}</span></div>
        </div>
        <div className="profile-stat-card">
          <div className="psc-icon" style={{ background: "rgba(211,163,74,0.12)" }}><Award size={20} color="var(--accent)" /></div>
          <div className="psc-body"><span className="psc-label">Решено</span><span className="psc-value">{stats.completedTasks}</span></div>
        </div>
        <div className="profile-stat-card">
          <div className="psc-icon" style={{ background: "rgba(83,158,233,0.12)" }}><User size={20} color="rgba(83,158,233,0.9)" /></div>
          <div className="psc-body"><span className="psc-label">Прогресс</span><span className="psc-value">{pct}%</span></div>
        </div>
      </div>

      {/* Overall progress */}
      <div className="profile-progress-card">
        <div className="ppc-head"><span>Общий прогресс</span><span className="ppc-pct">{pct}%</span></div>
        <div className="ppc-bar"><div className="ppc-fill" style={{ width: `${pct}%` }} /></div>
      </div>

      {/* Radar + Heatmap */}
      <div className="profile-charts">
        <div className="profile-chart-card">
          <h3>Навыки</h3>
          <RadarChart data={radarData} size={240} />
        </div>
        <div className="profile-chart-card" style={{ flex: 1 }}>
          <h3>Активность</h3>
          <Heatmap activity={activity} />
        </div>
      </div>

      {/* Per section */}
      <h3 className="profile-section-title">По разделам</h3>
      <div className="profile-sections">
        {cards.map(({ key, label, icon: Icon, color }) => {
          const s = stats.sections[key];
          const sp = s.total ? Math.round((s.completed / s.total) * 100) : 0;
          return (
            <div className="profile-section-card" key={key}>
              <div className="psc-head">
                <div className="psc-icon" style={{ background: `rgba(${color},0.12)` }}><Icon size={18} color={`rgba(${color},0.9)`} /></div>
                <div><h4>{label}</h4><p>{s.topics} тем · {s.lessons} уроков</p></div>
              </div>
              <div className="psc-bar-row">
                <div className="psc-bar"><div className="psc-bar-fill" style={{ width: `${sp}%`, background: `rgba(${color},0.7)` }} /></div>
                <span className="psc-bar-pct">{sp}%</span>
              </div>
              <p className="psc-detail">{s.completed} из {s.total} задач</p>
            </div>
          );
        })}
      </div>

      {/* Export / Import */}
      <div className="profile-actions">
        <button className="btn btn-ghost" onClick={handleExport}><Download size={15} /> Экспорт JSON</button>
        <button className="btn btn-ghost" onClick={handleImport} disabled={importing}>
          <Upload size={15} /> {importing ? "Импорт…" : "Импорт JSON"}
        </button>
      </div>
    </div>
  );
}