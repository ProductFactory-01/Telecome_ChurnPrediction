"use client";
import { useEffect, useState } from "react";
import api from "../../lib/api";
import Loading from "../shared/Loading";
import SectionTitle from "../shared/SectionTitle";

export default function MilestonesTab() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get("/milestones").then((r) => setData(r.data)).catch(console.error);
  }, []);

  if (!data) return <Loading message="Loading System Milestones..." />;

  return (
    <div className="dashboard-content">
      <SectionTitle title="Project Milestones" description="Use-case delivery timeline and KPI progress" color="purple" />

      <div className="panel-grid panel-grid--2 mb-6">
        <div className="card">
          <div className="card__title" style={{ marginBottom: 16 }}>📅 Delivery Timeline</div>
          <div className="timeline">
            {data.phases.map((phase: any, i: number) => {
              const isDone = phase.milestone.startsWith("✅");
              const isActive = phase.milestone.startsWith("🔄");
              return (
                <div key={i} className="timeline__item">
                  <div className={`timeline__dot ${isDone ? "timeline__dot--done" : isActive ? "timeline__dot--active" : "timeline__dot--pending"}`} />
                  <div className={`timeline__phase timeline__phase--${phase.phase_class}`}>{phase.phase}</div>
                  <div className="timeline__title">{phase.title}</div>
                  <div className="timeline__desc">{phase.deliverables}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4, color: "var(--text-secondary)" }}>
                    Agent: {phase.agent} | {phase.milestone}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <SectionTitle title="KPI Gauges" color="green" />
          <div className="panel-grid" style={{ gap: 16 }}>
            {data.gauges.map((g: any, i: number) => {
              const pct = Math.min((g.value / 100) * 100, 100);
              const circumference = 2 * Math.PI * 42;
              const offset = circumference - (pct / 100) * circumference;
              const color = g.value >= g.stretch_target ? "var(--accent-green)" : g.value >= g.min_target ? "var(--accent-amber)" : "var(--accent-red)";

              return (
                <div key={i} className="gauge-card">
                  <div className="gauge-card__title">{g.title}</div>
                  <svg viewBox="0 0 100 100" className="gauge-card__ring">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="var(--bg-input)" strokeWidth="6" />
                    <circle cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="6"
                      strokeDasharray={circumference} strokeDashoffset={offset}
                      strokeLinecap="round" transform="rotate(-90 50 50)"
                      style={{ transition: "stroke-dashoffset 0.8s ease" }} />
                    <text x="50" y="50" textAnchor="middle" dominantBaseline="middle"
                      fill="var(--text-primary)" fontSize="18" fontWeight="800">
                      {g.value}%
                    </text>
                  </svg>
                  <div className="gauge-card__metrics">
                    {g.metrics.map((m: any, j: number) => (
                      <div key={j}>
                        <div style={{ color: "var(--text-muted)", fontSize: 10 }}>{m.label}</div>
                        <div style={{ fontWeight: 700 }}>{m.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
