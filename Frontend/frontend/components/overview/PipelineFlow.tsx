"use client";

interface Step {
  label: string;
  sublabel: string;
  icon: string;
  color: string;
  status: string;
}

interface Props {
  steps: Step[];
}

export default function PipelineFlow({ steps }: Props) {
  return (
    <div className="card" id="pipeline-flow">
      <div className="pipeline">
        {steps.map((step, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center" }}>
            <div className="pipeline__step">
              <div className="pipeline__box" style={{ background: step.color }}>
                <div className="pipeline__box-icon">{step.icon}</div>
                <div className="pipeline__box-label">{step.label}</div>
                <div className="pipeline__box-sub">{step.sublabel}</div>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div className="pipeline__connector">→</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
