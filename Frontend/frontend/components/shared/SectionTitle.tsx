"use client";

interface Props {
  title: string;
  description?: string;
  color?: "blue" | "amber" | "green" | "purple" | "red" | "cyan";
}

export default function SectionTitle({ title, description, color = "blue" }: Props) {
  return (
    <div className="section-title">
      <div className={`section-title__bar section-title__bar--${color}`} />
      <div>
        <div className="section-title__text">{title}</div>
        {description && <div className="section-title__desc">{description}</div>}
      </div>
    </div>
  );
}
