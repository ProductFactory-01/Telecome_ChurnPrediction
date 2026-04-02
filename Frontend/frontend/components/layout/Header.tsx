"use client";

export default function Header() {
  return (
    <header className="app-header">
      <div className="app-header__brand">
        <div className="app-header__logo">🛡️</div>
        <div>
          <div className="app-header__title">Customer Churn Prediction &amp; Retention — 4 AI Agents</div>
          <div className="app-header__subtitle">Use Case 3 — Agentic AI PoC | Unified Subscriber Intelligence Platform</div>
        </div>
      </div>
      <div className="app-header__badge">
        <span className="app-header__badge-dot" />
        AGENTS LIVE
      </div>
    </header>
  );
}
