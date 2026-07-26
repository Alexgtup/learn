import React, { useMemo } from "react";

type Props = { activity: Record<string, number> };

const WEEKDAYS = ["Пн", "", "Ср", "", "Пт", "", "Вс"];
const MONTHS = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];

export function Heatmap({ activity }: Props) {
  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 364);
    // align to Monday
    const day = start.getDay();
    start.setDate(start.getDate() - ((day + 6) % 7));

    const weeks: { date: Date; count: number }[][] = [];
    const cursor = new Date(start);
    let currentWeek: { date: Date; count: number }[] = [];

    while (cursor <= today) {
      const key = cursor.toISOString().slice(0, 10);
      currentWeek.push({ date: new Date(cursor), count: activity[key] || 0 });
      if (currentWeek.length === 7) { weeks.push(currentWeek); currentWeek = []; }
      cursor.setDate(cursor.getDate() + 1);
    }
    if (currentWeek.length) weeks.push(currentWeek);

    const monthLabels: { label: string; col: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((w, i) => {
      const m = w[0].date.getMonth();
      if (m !== lastMonth) { monthLabels.push({ label: MONTHS[m], col: i }); lastMonth = m; }
    });

    return { weeks, monthLabels };
  }, [activity]);

  const maxCount = useMemo(() => Math.max(1, ...Object.values(activity)), [activity]);

  const color = (count: number) => {
    if (count === 0) return "rgba(255,255,255,0.03)";
    const intensity = Math.min(count / maxCount, 1);
    if (intensity < 0.25) return "rgba(79,169,140,0.2)";
    if (intensity < 0.5) return "rgba(79,169,140,0.4)";
    if (intensity < 0.75) return "rgba(79,169,140,0.65)";
    return "rgba(79,169,140,0.9)";
  };

  const cellSize = 12;
  const gap = 3;
  const labelW = 28;
  const w = labelW + weeks.length * (cellSize + gap);
  const h = 7 * (cellSize + gap) + 20;

  return (
    <div className="heatmap-wrap">
      <svg width={w} height={h} className="heatmap-svg">
        {monthLabels.map((m, i) => (
          <text key={i} x={labelW + m.col * (cellSize + gap)} y={10}
            className="heatmap-month">{m.label}</text>
        ))}
        {WEEKDAYS.map((d, i) => d && (
          <text key={i} x={0} y={20 + i * (cellSize + gap) + cellSize - 2}
            className="heatmap-day">{d}</text>
        ))}
        {weeks.map((week, wi) =>
          week.map((cell, di) => (
            <rect key={`${wi}-${di}`}
              x={labelW + wi * (cellSize + gap)}
              y={20 + di * (cellSize + gap)}
              width={cellSize} height={cellSize} rx={2}
              fill={color(cell.count)}
            >
              <title>{cell.date.toLocaleDateString("ru-RU")}: {cell.count} задач</title>
            </rect>
          ))
        )}
      </svg>
      <div className="heatmap-legend">
        <span>Меньше</span>
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <span key={v} className="heatmap-legend-cell"
            style={{ background: v === 0 ? "rgba(255,255,255,0.03)" : `rgba(79,169,140,${v * 0.9})` }} />
        ))}
        <span>Больше</span>
      </div>
    </div>
  );
}