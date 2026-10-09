import React from 'react';

export const STEPS = ['Set up', 'Content', 'Generate', 'Review', 'Export'];

/** Numbered steps across the top. Earlier steps can be revisited; going forward uses the button on each screen. */
export default function StepIndicator({ currentStep, onSelect }) {
  return (
    <nav className="step-bar-wrap" aria-label="Steps">
      <ol className="step-bar">
        {STEPS.map((label, i) => {
          const num = i + 1;
          const done = num < currentStep;
          const active = num === currentStep;
          return (
            <li key={label}>
              <button
                type="button"
                className={`step-btn${active ? ' active' : ''}${done ? ' done can-go' : ''}`}
                onClick={() => done && onSelect(num)}
                aria-current={active ? 'step' : undefined}
                aria-disabled={!done && !active}
                tabIndex={done ? 0 : -1}
                title={done ? `Back to ${label}` : undefined}
              >
                <span className="step-num">{done ? '✓' : num}</span>
                <span className="step-label">
                  {label}
                  {done && <span className="sr-only"> (completed, go back)</span>}
                </span>
              </button>
              {num < STEPS.length && <span className={`step-line${done ? ' done' : ''}`} aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
