"use client";

interface LogEntry {
  time: string;
  tag: "ok" | "info" | "warn";
  message: string;
}

interface Props {
  entries: LogEntry[];
}

const DEFAULT_ENTRIES: LogEntry[] = [
  { time: "09:02:14", tag: "ok", message: "CRM Profiles ingested — 7,043 records" },
  { time: "09:02:18", tag: "ok", message: "Billing & Usage data merged" },
  { time: "09:02:21", tag: "ok", message: "Complaints enrichment complete — 2,224 records" },
  { time: "09:02:25", tag: "info", message: "Schema validation passed — all fields mapped" },
  { time: "09:02:28", tag: "ok", message: "Customer360 unified view created" },
  { time: "09:03:01", tag: "ok", message: "Churn model inference complete — 7,043 scored" },
  { time: "09:03:04", tag: "warn", message: "1,869 subscribers flagged high-risk (>0.7)" },
  { time: "09:03:08", tag: "info", message: "Feature importance: Tenure (0.24), Monthly Charges (0.18)" },
];

export default function AgentLog({ entries = DEFAULT_ENTRIES }: Props) {
  return (
    <div className="agent-log ring-1 ring-white/5 hover:ring-white/10 transition-all duration-300" id="agent-log-console">
      {entries.map((e, i) => (
        <div key={i} className="agent-log__entry hover:bg-slate-700/20 px-2 py-1.5 rounded transition-colors">
          <span className="agent-log__time font-mono">{e.time}</span>
          <span className={`agent-log__tag agent-log__tag--${e.tag} inline-block px-2 py-0.5 rounded text-xs font-semibold`}>{e.tag.toUpperCase()}</span>
          <span className="agent-log__msg font-mono text-xs ml-2">{e.message}</span>
        </div>
      ))}
    </div>
  );
}
