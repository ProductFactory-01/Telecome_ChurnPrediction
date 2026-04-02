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
      <div className="card__header">
        <div className="card__title">🔄 AI Pipeline Flow</div>
      </div>
      <div className="pipeline">
        {steps.map((step, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", flex: 1 }}>
            <div className="pipeline__step">
              <div
                className={`pipeline__icon pipeline__icon--${step.status}`}
                style={{ borderColor: step.color }}
              >
                {step.icon}
              </div>
              <div className="pipeline__label">{step.label}</div>
              <div className="pipeline__sublabel">{step.sublabel}</div>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`pipeline__connector pipeline__connector--${step.status}`}
                style={{ background: step.status === "done" ? step.color : undefined }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
