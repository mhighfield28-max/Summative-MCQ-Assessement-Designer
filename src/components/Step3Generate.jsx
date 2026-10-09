import React, { useState } from 'react';
import { Notice, LevelTag, levelColour } from './ui';
import { generateQuestionSet } from '../utils/anthropicClient';
import { LEVELS, SECONDS_PER_QUESTION, WEIGHT_CEILING, estimateSeconds, toMinutes, minuteRange } from '../utils/spec';

export default function Step3Generate({ config, specification, contentText, existingCount, onBack, onDone }) {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState([]);
  const [error, setError] = useState(null);

  const total = Number(config.questionCount);
  const { low, high } = estimateSeconds(config.distribution);
  const fits = toMinutes(high) <= Number(config.minutes);
  const heavy = Number(config.weight) > WEIGHT_CEILING;

  const run = async () => {
    setError(null);
    setProgress([]);
    setRunning(true);
    try {
      const qs = await generateQuestionSet({
        specification,
        content: contentText,
        config,
        onProgress: (done) => setProgress(done),
      });
      onDone(qs);
    } catch (e) {
      setError(e.message || 'Something went wrong.');
      setRunning(false);
    }
  };

  const pct = Math.round((progress.length / total) * 100);

  return (
    <div>
      <div className="card">
        <h2 className="card-title">Generate</h2>
        <p className="card-sub">
          This is what will be asked for. The full specification, Part A and Part B, goes to the AI as its instructions; your
          teaching content goes with it as source material.
        </p>

        <table className="summary-table">
          <thead>
            <tr>
              <th>Level</th>
              <th className="num">Questions</th>
              <th className="num">Seconds each</th>
              <th className="num">Time</th>
            </tr>
          </thead>
          <tbody>
            {LEVELS.map((l) => {
              const n = Number(config.distribution[l]);
              const [a, b] = SECONDS_PER_QUESTION[l];
              return (
                <tr key={l}>
                  <td>
                    <LevelTag level={l} />
                  </td>
                  <td className="num">{n}</td>
                  <td className="num">
                    {a}–{b}
                  </td>
                  <td className="num">
                    {toMinutes(n * a)}–{toMinutes(n * b)} min
                  </td>
                </tr>
              );
            })}
            <tr>
              <td>
                <strong>Total</strong>
              </td>
              <td className="num">
                <strong>{total}</strong>
              </td>
              <td />
              <td className="num">
                <strong>
                  {minuteRange(low, high)} min
                </strong>{' '}
                of {config.minutes}
              </td>
            </tr>
          </tbody>
        </table>

        {!fits && (
          <Notice kind="warn">
            The time doesn't fit: up to about {toMinutes(high)} minutes of questions against {config.minutes} available, before
            any reading time. You can still generate, but consider going back to Set up.
          </Notice>
        )}
        {heavy && (
          <Notice kind="warn">
            This paper carries {config.weight}% of the module grade, above the {WEIGHT_CEILING}% the house rules flag.
          </Notice>
        )}
        {existingCount > 0 && !running && (
          <Notice kind="info">You already have {existingCount} questions. Generating again replaces them all.</Notice>
        )}

        {running && (
          <div aria-live="polite">
            <div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={progress.length}>
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <p className="progress-label">
              {progress.length < total
                ? `Writing question ${progress.length + 1} of ${total}…`
                : 'Running the checks…'}
            </p>
            <ul className="progress-list">
              {progress.map((q) => (
                <li key={q.id}>
                  <span className="pid">{q.id.toUpperCase()}</span>
                  <span className="dot" style={{ width: 9, height: 9, borderRadius: '50%', background: levelColour(q.level), flexShrink: 0 }} aria-hidden="true" />
                  <span className="pstem">{q.stem}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <Notice kind="error">
            <strong>Generation stopped.</strong> {error}
            {/API key/i.test(error) && (
              <div style={{ marginTop: 6 }}>
                Set <code>REACT_APP_ANTHROPIC_API_KEY</code> in Amplify → Environment variables, then redeploy.
              </div>
            )}
            {progress.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <button type="button" className="btn btn-secondary btn-small" onClick={() => onDone(progress)}>
                  Review the {progress.length} written so far
                </button>
              </div>
            )}
          </Notice>
        )}
      </div>

      <div className="btn-row">
        <button type="button" className="btn btn-secondary" onClick={onBack} disabled={running}>
          ← Back
        </button>
        <div className="right">
          <button type="button" className="btn btn-primary" onClick={run} disabled={running}>
            {running ? 'Generating…' : error ? 'Try again' : `Generate ${total} questions`}
          </button>
        </div>
      </div>
    </div>
  );
}
