import React from "react";

export function Skeleton() {
  return (
    <div className="skeleton-page">
      <div className="sk-line sk-title" />
      <div className="sk-line sk-sub" />
      <div className="sk-grid">
        {[1, 2, 3].map((i) => (
          <div key={i} className="sk-card">
            <div className="sk-line sk-card-title" />
            <div className="sk-line sk-card-text" />
            <div className="sk-line sk-card-text short" />
            <div className="sk-bar" />
          </div>
        ))}
      </div>
    </div>
  );
}