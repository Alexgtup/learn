import React from "react";

type Props = {
  data: { label: string; value: number; color: string }[];
  size?: number;
};

export function RadarChart({ data, size = 220 }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 40;
  const n = data.length;
  if (n < 3) return null;

  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2;

  const point = (i: number, radius: number) => {
    const angle = startAngle + i * angleStep;
    return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  };

  const gridLevels = [0.25, 0.5, 0.75, 1];
  const dataPoints = data.map((d, i) => point(i, r * (d.value / 100)));
  const polygon = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg width={size} height={size} className="radar-svg">
      {gridLevels.map((level) => (
        <polygon key={level}
          points={data.map((_, i) => { const p = point(i, r * level); return `${p.x},${p.y}`; }).join(" ")}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1}
        />
      ))}
      {data.map((_, i) => {
        const p = point(i, r);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />;
      })}
      <polygon points={polygon} fill="rgba(211,163,74,0.12)" stroke="rgba(211,163,74,0.5)" strokeWidth={2} />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4} fill={data[i].color} stroke="var(--bg-0)" strokeWidth={2} />
      ))}
      {data.map((d, i) => {
        const p = point(i, r + 22);
        return (
          <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
            className="radar-label">{d.label}</text>
        );
      })}
    </svg>
  );
}