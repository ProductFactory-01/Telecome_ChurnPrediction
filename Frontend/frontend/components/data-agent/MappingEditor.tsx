"use client";
import { useState, useEffect } from "react";

interface Props {
  csvColumns: string[];
  initialMapping: Record<string, string>;
  targetColumns: string[];
  onChange: (mapping: Record<string, string>) => void;
}

export default function MappingEditor({ csvColumns, initialMapping, targetColumns, onChange }: Props) {
  const [mapping, setMapping] = useState<Record<string, string>>(initialMapping);

  useEffect(() => {
    onChange(mapping);
  }, [mapping, onChange]);

  const handleSelect = (csvCol: string, targetCol: string) => {
    setMapping(prev => ({ ...prev, [csvCol]: targetCol }));
  };

  return (
    <div className="mapping-editor mt-4">
      <div className="text-sm font-bold text-gray-700 mb-2">Review AI Column Mapping</div>
      <div className="mapping-table-container max-h-80 overflow-y-auto border border-gray-200 rounded-lg">
        <table className="mapping-table w-full text-left text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="p-3 border-b">CSV Column</th>
              <th className="p-3 border-b">→</th>
              <th className="p-3 border-b">Application Field</th>
            </tr>
          </thead>
          <tbody>
            {csvColumns.map((col) => {
              const mapped = mapping[col];
              const isMapped = !!mapped;

              return (
                <tr key={col} className={`hover:bg-gray-50 ${!isMapped ? "bg-red-50/30" : ""}`}>
                  <td className="p-3 font-medium text-gray-600">{col}</td>
                  <td className="p-3 text-gray-400">→</td>
                  <td className="p-3">
                    <select
                      className={`mapping-select w-full p-2 border rounded-md text-sm ${
                        isMapped ? "border-blue-200 bg-white" : "border-red-300 bg-red-50"
                      }`}
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
                    {!isMapped && col.toLowerCase().includes("id") && (
                      <div className="text-[10px] text-red-500 font-semibold mt-1">
                        ⚠ Recommended to map ID columns
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-gray-500 bg-blue-50 p-3 rounded-md">
        <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>Mapped</span>
        </div>
        <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-400"></span>
            <span>Unmapped/Ignored</span>
        </div>
        <div className="ml-auto italic">AI mapped {Object.values(mapping).filter(v => !!v).length} of {csvColumns.length} columns</div>
      </div>
    </div>
  );
}
