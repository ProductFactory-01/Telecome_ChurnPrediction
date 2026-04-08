"use client";

interface Props {
  label: string;
  value: string | number;
  sub?: string;
  color?: "blue" | "green" | "amber" | "red" | "purple" | "cyan";
}

export default function KpiCard({ label, value, sub, color = "blue" }: Props) {
  const colorMap = {
    blue: "from-blue-500 to-indigo-600 shadow-blue-500/10 border-blue-200/20 text-blue-600",
    green: "from-emerald-500 to-teal-600 shadow-emerald-500/10 border-emerald-200/20 text-emerald-600",
    amber: "from-amber-500 to-orange-600 shadow-amber-500/10 border-amber-200/20 text-amber-600",
    red: "from-rose-500 to-red-600 shadow-rose-500/10 border-rose-200/20 text-rose-600",
    purple: "from-purple-500 to-violet-600 shadow-purple-500/10 border-purple-200/20 text-purple-600",
    cyan: "from-cyan-500 to-blue-600 shadow-cyan-500/10 border-cyan-200/20 text-cyan-600",
  };

  const accentColor = colorMap[color];

  return (
    <div
      className="relative group bg-white p-6 rounded-[28px] border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
      id={`kpi-${label.toLowerCase().replace(/\s+/g, "-")}`}
    >
      {/* Decorative accent background */}
      <div className={`absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br ${accentColor.split(' ').slice(0, 2).join(' ')} opacity-[0.03] rounded-full group-hover:scale-150 transition-transform duration-700`} />

      <div className="relative z-10 flex flex-col gap-1">
        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 group-hover:text-slate-500 transition-colors">
          {label}
        </span>

        <div className={`text-3xl font-black tracking-tight ${accentColor.split(' ').pop()} transition-all duration-300 group-hover:scale-[1.02] origin-left`}>
          {value}
        </div>

        {sub && (
          <div className="mt-2 text-[11px] font-bold text-slate-500/80 leading-relaxed max-w-[140px]">
            {sub}
          </div>
        )}
      </div>

      {/* Glow Effect - Constant light glow, intensifies on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${accentColor.split(' ').slice(0, 2).join(' ')} opacity-[0.03] transition-opacity duration-500 group-hover:opacity-[0.08]`} />

      <div className={`absolute bottom-0 left-6 right-6 h-[3px] bg-gradient-to-r ${accentColor.split(' ').slice(0, 2).join(' ')} opacity-30 group-hover:opacity-100 transition-all duration-500 rounded-t-full shadow-[0_0_10px_rgba(0,0,0,0.1)] group-hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]`} />
    </div>
  );
}
