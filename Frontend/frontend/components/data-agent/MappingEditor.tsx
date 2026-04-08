"use client";
import { useState, useEffect } from "react";

interface Props {
  csvColumns: string[];
  initialMapping: Record<string, string>;
  targetColumns: string[];
  onChange: (mapping: Record<string, string>) => void;
  nullCounts?: Record<string, number>;
}

export default function MappingEditor({ csvColumns, initialMapping, targetColumns, onChange, nullCounts }: Props) {
  const [mapping, setMapping] = useState<Record<string, string>>(initialMapping);

  useEffect(() => {
    onChange(mapping);
  }, [mapping, onChange]);

  const handleSelect = (csvCol: string, targetCol: string) => {
    setMapping(prev => ({ ...prev, [csvCol]: targetCol }));
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
         <span className="text-[12px] font-black text-slate-800 uppercase tracking-tight">🎯 Review Mapping</span>
         <div className="text-[10px] font-bold text-slate-400 font-mono italic">
            AI matched {Object.values(mapping).filter(v => !!v).length}/{csvColumns.length} fields
         </div>
      </div>
      
      <div className="overflow-y-auto max-h-[400px] flex-1">
        <table className="w-full text-left text-[11px] font-bold">
          <thead className="sticky top-0 bg-white shadow-sm z-10">
            <tr className="text-slate-400 uppercase tracking-widest text-[9px]">
              <th className="px-6 py-4">Source Property</th>
              <th className="px-4 text-center">→</th>
              <th className="px-6">Intelligence Field</th>
              <th className="px-4 text-center">Data Quality</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {csvColumns.map((col) => {
              const mapped = mapping[col];
              const isMapped = !!mapped;
              const nullCount = nullCounts?.[col] || 0;

              return (
                <tr key={col} className={`group transition-all duration-300 ${isMapped ? "bg-white" : "bg-slate-50/50"}`}>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-slate-700 text-[13px] tracking-tight">{col}</span>
                      {isMapped === false && <span className="text-[9px] text-amber-500 uppercase tracking-tighter">Skipping Field</span>}
                    </div>
                  </td>
                  <td className="px-4 text-center">
                    <div className={`transition-transform duration-500 ${isMapped ? "text-indigo-600 scale-125" : "text-slate-200"}`}>→</div>
                  </td>
                  <td className="px-6">
                    <select
                      className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none appearance-none cursor-pointer
                        ${isMapped ? "border-indigo-100 bg-indigo-50/20 text-indigo-700" : "opacity-60 grayscale hover:grayscale-0 hover:opacity-100"}`}
                      value={mapped || ""}
                      onChange={(e) => handleSelect(col, e.target.value)}
                    >
                      <option value="">-- Ignore Column --</option>
                      {targetColumns.sort().map((target) => (
                        <option key={target} value={target}>
                          {target}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 text-center">
                    <div className="flex flex-col items-center">
                        {nullCount > 0 ? (
                          <span className="text-rose-500/80 bg-rose-50 px-2 py-0.5 rounded-full text-[10px]">
                            {nullCount} nulls
                          </span>
                        ) : (
                          <span className="text-emerald-500 opacity-60">✓ Clean</span>
                        )}
                        {isMapped && (
                           <div className="" />
                        )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-6 text-[10px] font-black uppercase tracking-widest">
        <div className="flex items-center gap-2 text-emerald-600">
           <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
           Active Pipeline
        </div>
        <div className="flex items-center gap-2 text-slate-400">
           <span className="w-2 h-2 rounded-full bg-slate-200"></span>
           Inactive Flow
        </div>
      </div>
    </div>
  );
}
