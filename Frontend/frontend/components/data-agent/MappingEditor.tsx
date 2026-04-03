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
    <div className="mapping-editor">
      <div className="mapping-editor-title">🎯 Review AI Column Mapping</div>
      
      <div className="mapping-table-container">
        <table className="mapping-table">
          <thead>
            <tr>
              <th>CSV Column</th>
              <th style={{ width: "40px", textAlign: "center" }}>→</th>
              <th>Application Field</th>
              <th style={{ width: "100px", textAlign: "center" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {csvColumns.map((col) => {
              const mapped = mapping[col];
              const isMapped = !!mapped;

              return (
                <tr key={col} className={isMapped ? "" : "unmapped-row"}>
                  <td style={{ fontWeight: 600 }}>{col}</td>
                  <td style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>→</td>
                  <td>
                    <select
                      className={`mapping-select ${isMapped ? "" : "mapping-select.unmapped"}`}
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
                  <td style={{ textAlign: "center" }}>
                    {isMapped ? (
                      <span style={{ display: "inline-block", padding: "4px 10px", background: "rgba(5, 150, 105, 0.1)", color: "var(--accent-green)", borderRadius: "4px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.3px" }}>
                        ✓ Mapped
                      </span>
                    ) : (
                      <span style={{ display: "inline-block", padding: "4px 10px", background: "rgba(220, 38, 38, 0.1)", color: "var(--accent-red)", borderRadius: "4px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.3px" }}>
                        ⚠ Unmapped
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div style={{
        marginTop: "16px",
        display: "flex",
        alignItems: "center",
        gap: "20px",
        padding: "12px 14px",
        background: "var(--accent-blue-light)",
        borderRadius: "var(--radius-md)",
        fontSize: "12px",
        fontWeight: 500,
        color: "var(--text-secondary)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent-green)" }}></span>
          <span>Mapped</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent-red)" }}></span>
          <span>Unmapped/Ignored</span>
        </div>
        <div style={{ marginLeft: "auto", fontStyle: "italic" }}>
          AI mapped <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{Object.values(mapping).filter(v => !!v).length}</span> of <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{csvColumns.length}</span> columns
        </div>
      </div>
    </div>
  );
}
