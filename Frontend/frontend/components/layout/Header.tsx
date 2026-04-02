"use client";

export default function Header() {
  return (
    <header className="app-header">
      <div className="app-header__brand">
        <div className="app-header__logo">🛡️</div>
        <div>
          <div className="app-header__title">Customer Churn Prediction &amp; Retention</div>
          <div className="app-header__subtitle">AI-POWERED 4-AGENT SYSTEM · TELECOM USE CASE 3</div>
        </div>
      </div>
      <div className="app-header__badge">
        <span className="app-header__badge-dot" />
        SYSTEM LIVE
      </div>
    </header>
  );
}
