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
    <div className="card hover:scale-[1.01] transition-transform duration-300">
      <div className="card__header">
        <div className="card__title text-base">
          {icon && <span className="text-lg">{icon}</span>}
          <span>{title}</span>
        </div>
      </div>
      <div 
        style={{ height }} 
        className="overflow-hidden rounded-lg"
      >
        {children}
      </div>
    </div>
  );
}
