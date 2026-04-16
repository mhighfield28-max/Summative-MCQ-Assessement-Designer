import React from 'react';

const STEPS = [
  { num: 1, label: 'Configure' },
  { num: 2, label: 'Content' },
  { num: 3, label: 'Generate' },
  { num: 4, label: 'Review' },
  { num: 5, label: 'Export' },
];

export default function StepIndicator({ currentStep }) {
  return (
    <div className="step-indicator">
      {STEPS.map((step, i) => {
        const isDone   = currentStep > step.num;
        const isActive = currentStep === step.num;

        return (
          <React.Fragment key={step.num}>
            <div className={`step-item${isActive ? ' active' : ''}${isDone ? ' done' : ''}`}>
              <div className={`step-circle${isActive ? ' active' : ''}${isDone ? ' done' : ''}`}>
                {isDone ? '✓' : step.num}
              </div>
              <span className="step-label">{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`step-connector${isDone ? ' done' : ''}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
