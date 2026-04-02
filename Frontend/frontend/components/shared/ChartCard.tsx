"use client";
import { ReactNode } from "react";

interface Props {
  title: string;
  icon?: string;
  children: ReactNode;
  height?: number;
}

export default function ChartCard({ title, icon, children, height = 280 }: Props) {
  return (
    <div className="card">
      <div className="card__header">
        <div className="card__title">
          {icon && <span>{icon}</span>}
          {title}
        </div>
      </div>
      <div style={{ height }}>{children}</div>
    </div>
  );
}
