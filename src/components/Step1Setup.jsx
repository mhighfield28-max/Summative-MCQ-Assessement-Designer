import React, { useRef, useState } from 'react';
import { FieldError, Notice, levelColour } from './ui';
import {
  LEVELS,
  STUDY_LEVELS,
  QUESTION_COUNTS,
  EXPORT_FORMATS,
  WEIGHT_CEILING,
  defaultDistribution,
  distributionTotal,
  sameDistribution,
  lowerOrderShare,
  estimateSeconds,
  toMinutes,
  minuteRange,
  validateConfig,
  specFileText,
  parseSpecFile,
  slug,
} from '../utils/spec';
import { downloadText } from '../utils/exporters';

function RemoveButton({ onClick, disabled, label }) {
  return (
    <button type="button" className="icon-btn" onClick={onClick} disabled={disabled} aria-label={label} title={label}>
      ×
    </button>
  );
}

export default function Step1Setup({ config, houseRules, originalRules, contentSource, onChangeRules, onNext }) {
  const [c, setC] = useState(config);
  const [errors, setErrors] = useState({});
  const [editingRules, setEditingRules] = useState(false);
  const [importMsg, setImportMsg] = useState(null);
  const fileRef = useRef();

  const set = (patch) => {
    setC((prev) => ({ ...prev, ...patch }));
    setErrors((e) => {
      const next = { ...e };
      Object.keys(patch).forEach((k) => delete next[k]);
      return next;
    });
  };

  const setRow = (key, i, patch) => set({ [key]: c[key].map((r, j) => (j === i ? (typeof r === 'string' ? patch : { ...r, ...patch }) : r)) });
  const addRow = (key, blank) => set({ [key]: [...c[key], blank] });
  const removeRow = (key, i) => set({ [key]: c[key].filter((_, j) => j !== i) });

  const resetDistribution = (studyLevel, questionCount) =>
    set({ studyLevel, questionCount, distribution: defaultDistribution(studyLevel, questionCount), distributionReason: '' });

  const defaults = defaultDistribution(c.studyLevel, c.questionCount);
  const custom = !sameDistribution(c.distribution, defaults);
  const total = distributionTotal(c.distribution);
  const { low, high } = estimateSeconds(c.distribution);
  const fits = toMinutes(high) <= Number(c.minutes);
  const rulesEdited = houseRules !== null && originalRules !== null && houseRules !== originalRules;

  const startEditRules = () => {
    if (window.confirm('Only change a rule if you can say why.\n\nEdit the house rules for this set?')) setEditingRules(true);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const { config: imported, houseRules: rules } = parseSpecFile(String(reader.result));
        setC(imported);
        setErrors({});
        if (rules && rules !== houseRules) onChangeRules(rules);
        setImportMsg({ kind: 'ok', text: `Imported ${file.name}.` });
      } catch (err) {
        setImportMsg({ kind: 'error', text: err.message });
      }
    };
    reader.readAsText(file);
  };

  const handleDownload = () => {
    if (!houseRules) return;
    downloadText(specFileText(houseRules, c, contentSource), `${slug(c.moduleName)}_specification.md`, 'text/markdown');
  };

  const handleNext = () => {
    const e = validateConfig(c);
    setErrors(e);
    if (Object.keys(e).length) {
      const first = document.querySelector('[data-error="true"]');
      if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    onNext(c);
  };

  const err = (k) => (errors[k] ? { 'data-error': 'true', 'aria-invalid': true, 'aria-describedby': `${k}-err` } : {});

  return (
    <div>
      <div className="card">
        <h2 className="card-title">Set up</h2>
        <p className="card-sub">
          This form is Part B of your specification. Part A, the house rules, is loaded from its file and sent to the AI
          with your answers every time it writes questions.
        </p>

        <div className="toolbar">
          <button type="button" className="btn btn-secondary btn-small" onClick={() => fileRef.current.click()}>
            Import specification
          </button>
          <button type="button" className="btn btn-secondary btn-small" onClick={handleDownload} disabled={!houseRules}>
            Download specification
          </button>
          <input ref={fileRef} type="file" accept=".md,.txt,text/markdown" hidden onChange={handleImport} />
        </div>
        {importMsg && <Notice kind={importMsg.kind}>{importMsg.text}</Notice>}

        <details className="rules-panel">
          <summary>
            Part A — House rules
            {rulesEdited && <span className="badge-edited">! Edited for this set</span>}
          </summary>
          <div className="rules-body">
            {houseRules === null ? (
              <p className="hint">Loading…</p>
            ) : editingRules ? (
              <>
                <Notice kind="warn">Only change a rule if you can say why.</Notice>
                <label className="label" htmlFor="rules-edit">
                  House rules
                </label>
                <textarea
                  id="rules-edit"
                  className="textarea"
                  style={{ minHeight: 360, fontSize: '0.875rem' }}
                  value={houseRules}
                  onChange={(e) => onChangeRules(e.target.value)}
                />
                <div className="toolbar" style={{ marginTop: 10, marginBottom: 0 }}>
                  <button type="button" className="btn btn-secondary btn-small" onClick={() => setEditingRules(false)}>
                    Done
                  </button>
                  {rulesEdited && (
                    <button type="button" className="btn btn-ghost btn-small" onClick={() => onChangeRules(originalRules)}>
                      Restore the original rules
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="rules-text" tabIndex={0} aria-label="House rules, read only">
                  {houseRules}
                </div>
                <button type="button" className="btn btn-ghost btn-small" style={{ marginTop: 8 }} onClick={startEditRules}>
                  Edit house rules
                </button>
              </>
            )}
          </div>
        </details>
      </div>

      <div className="card">
        {/* B1 */}
        <h3 className="section-title">
          <span className="section-code">B1</span>Module and outcomes
        </h3>
        <div className="field" style={{ marginTop: 12 }}>
          <label className="label" htmlFor="moduleName">
            Module name and code
          </label>
          <input
            id="moduleName"
            className="input"
            placeholder="e.g. GEOG1102 Mountain Environments"
            value={c.moduleName}
            onChange={(e) => set({ moduleName: e.target.value })}
            {...err('moduleName')}
          />
          <FieldError id="moduleName-err">{errors.moduleName}</FieldError>
        </div>

        <div className="field">
          <label className="label" htmlFor="studyLevel">
            Level of study
          </label>
          <select
            id="studyLevel"
            className="select"
            value={c.studyLevel}
            onChange={(e) => resetDistribution(e.target.value, c.questionCount)}
          >
            {STUDY_LEVELS.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
          <p className="hint">Sets the default distribution in B4. Not recommended for doctoral-level summative assessment.</p>
        </div>

        <fieldset className="field" style={{ border: 0 }}>
          <legend className="label">Learning outcomes, each with the level it targets</legend>
          <div className="repeat-rows" {...err('outcomes')}>
            <div className="row-grid outcome row-head" aria-hidden="true">
              <span />
              <span>Outcome</span>
              <span>Target level</span>
              <span />
            </div>
            {c.outcomes.map((o, i) => (
              <div className="row-grid outcome" key={i}>
                <span className="row-code">LO{i + 1}</span>
                <input
                  className="input"
                  aria-label={`Outcome ${i + 1}`}
                  placeholder="e.g. Explain why water boils at a lower temperature at altitude"
                  value={o.text}
                  onChange={(e) => setRow('outcomes', i, { text: e.target.value })}
                />
                <select
                  className="select"
                  aria-label={`Target level for outcome ${i + 1}`}
                  value={o.level}
                  onChange={(e) => setRow('outcomes', i, { level: e.target.value })}
                >
                  {LEVELS.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
                <RemoveButton
                  label={`Remove outcome ${i + 1}`}
                  disabled={c.outcomes.length === 1}
                  onClick={() => removeRow('outcomes', i)}
                />
              </div>
            ))}
          </div>
          <FieldError id="outcomes-err">{errors.outcomes}</FieldError>
          <button type="button" className="btn btn-ghost btn-small" onClick={() => addRow('outcomes', { text: '', level: 'Apply' })}>
            + Add outcome
          </button>
        </fieldset>

        <hr className="divider" />

        {/* B2 */}
        <h3 className="section-title">
          <span className="section-code">B2</span>What was taught
        </h3>
        <p className="section-help">
          List every case, example and set of data used in teaching. Higher-order questions won't reuse these: anything not
          on the list counts as unseen. The teaching content itself goes in on the next screen.
        </p>
        <fieldset className="field" style={{ border: 0 }}>
          <legend className="sr-only">Cases and examples used in teaching</legend>
          <div className="repeat-rows" {...err('cases')}>
            {c.cases.map((x, i) => (
              <div className="row-grid case" key={i}>
                <input
                  className="input"
                  aria-label={`Case or example ${i + 1}`}
                  placeholder="e.g. A walker boiling water in a pan on a mountain summit (lecture 3)"
                  value={x}
                  onChange={(e) => setRow('cases', i, e.target.value)}
                />
                <RemoveButton label={`Remove case ${i + 1}`} disabled={c.cases.length === 1} onClick={() => removeRow('cases', i)} />
              </div>
            ))}
          </div>
          <p className="hint">Higher-order questions won't reuse these.</p>
          <FieldError id="cases-err">{errors.cases}</FieldError>
          <button type="button" className="btn btn-ghost btn-small" onClick={() => addRow('cases', '')}>
            + Add case or example
          </button>
        </fieldset>

        <hr className="divider" />

        {/* B3 */}
        <h3 className="section-title">
          <span className="section-code">B3</span>What students get wrong
        </h3>
        <p className="section-help">
          Distractors are built from these. Look at the errors you correct every year in marking, and the questions students
          ask before the penny drops.
        </p>
        <fieldset className="field" style={{ border: 0 }}>
          <legend className="sr-only">Misconceptions</legend>
          <div className="repeat-rows" {...err('misconceptions')}>
            <div className="row-grid mis row-head" aria-hidden="true">
              <span />
              <span>Misconception</span>
              <span>Where you see it</span>
              <span />
            </div>
            {c.misconceptions.map((m, i) => (
              <div className="row-grid mis" key={i}>
                <span className="row-code">M{i + 1}</span>
                <input
                  className="input"
                  aria-label={`Misconception ${i + 1}`}
                  placeholder="e.g. 100 °C is a fixed property of water"
                  value={m.text}
                  onChange={(e) => setRow('misconceptions', i, { text: e.target.value })}
                />
                <input
                  className="input where"
                  aria-label={`Where you see misconception ${i + 1}`}
                  placeholder="e.g. Exam answers, every year"
                  value={m.where}
                  onChange={(e) => setRow('misconceptions', i, { where: e.target.value })}
                />
                <RemoveButton
                  label={`Remove misconception ${i + 1}`}
                  disabled={c.misconceptions.length <= 2}
                  onClick={() => removeRow('misconceptions', i)}
                />
              </div>
            ))}
          </div>
          <FieldError id="misconceptions-err">{errors.misconceptions}</FieldError>
          <button type="button" className="btn btn-ghost btn-small" onClick={() => addRow('misconceptions', { text: '', where: '' })}>
            + Add misconception
          </button>
        </fieldset>

        <hr className="divider" />

        {/* B4 + B5 */}
        <h3 className="section-title">
          <span className="section-code">B4–B5</span>Distribution, length, timing and weight
        </h3>

        <div className="inline-fields" style={{ marginTop: 12 }}>
          <div className="field">
            <label className="label" htmlFor="questionCount">
              Number of questions
            </label>
            <select
              id="questionCount"
              className="select"
              style={{ width: 120 }}
              value={c.questionCount}
              onChange={(e) => resetDistribution(c.studyLevel, Number(e.target.value))}
            >
              {QUESTION_COUNTS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        <fieldset className="field" style={{ border: 0 }} {...err('distribution')}>
          <legend className="label">Distribution across levels</legend>
          <div className="dist-grid">
            {LEVELS.map((l) => (
              <div key={l}>
                <label className="label" htmlFor={`dist-${l}`}>
                  <span className="dot" style={{ width: 10, height: 10, borderRadius: '50%', background: levelColour(l) }} aria-hidden="true" />
                  {l}
                </label>
                <input
                  id={`dist-${l}`}
                  className="input"
                  type="number"
                  min="0"
                  max={c.questionCount}
                  value={c.distribution[l]}
                  onChange={(e) =>
                    set({ distribution: { ...c.distribution, [l]: Math.max(0, parseInt(e.target.value || '0', 10)) } })
                  }
                />
              </div>
            ))}
          </div>
          <p className="hint">
            Total {total} of {c.questionCount} · lower order {lowerOrderShare(c.distribution)}% ·{' '}
            {custom ? (
              <>
                changed from the default for {c.studyLevel} (
                {LEVELS.map((l) => defaults[l]).join('/')}).{' '}
                <button
                  type="button"
                  className="btn btn-ghost btn-small"
                  style={{ padding: 0 }}
                  onClick={() => resetDistribution(c.studyLevel, c.questionCount)}
                >
                  Restore default
                </button>
              </>
            ) : (
              <>default for {c.studyLevel}.</>
            )}
          </p>
          <FieldError id="distribution-err">{errors.distribution}</FieldError>
        </fieldset>

        {custom && (
          <div className="field">
            <label className="label" htmlFor="distributionReason">
              Why have you changed the default?
            </label>
            <textarea
              id="distributionReason"
              className="textarea"
              style={{ minHeight: 70 }}
              value={c.distributionReason}
              onChange={(e) => set({ distributionReason: e.target.value })}
              {...err('distributionReason')}
            />
            <FieldError id="distributionReason-err">{errors.distributionReason}</FieldError>
          </div>
        )}

        <div className="inline-fields">
          <div className="field">
            <label className="label" htmlFor="minutes">
              Time available
            </label>
            <div className="with-unit">
              <input
                id="minutes"
                className="input narrow"
                type="number"
                min="1"
                value={c.minutes}
                onChange={(e) => set({ minutes: Number(e.target.value) })}
                {...err('minutes')}
              />
              <span>minutes</span>
              <span className="estimate" aria-live="polite">
                Estimate {minuteRange(low, high)} min {fits ? '✓ fits' : '! does not fit'}
              </span>
            </div>
            <p className="hint">Add reading time once for any shared table, case or extract.</p>
            <FieldError id="minutes-err">{errors.minutes}</FieldError>
          </div>

          <div className="field">
            <label className="label" htmlFor="weight">
              Share of module grade
            </label>
            <div className="with-unit">
              <input
                id="weight"
                className="input narrow"
                type="number"
                min="1"
                max="100"
                value={c.weight}
                onChange={(e) => set({ weight: Number(e.target.value) })}
                {...err('weight')}
              />
              <span>%</span>
            </div>
            <FieldError id="weight-err">{errors.weight}</FieldError>
          </div>
        </div>

        {!fits && (
          <Notice kind="warn">
            The paper does not fit. At the upper allowance it runs to about {toMinutes(high)} minutes against {c.minutes}{' '}
            available. Give it more time or change the distribution.
          </Notice>
        )}
        {Number(c.weight) > WEIGHT_CEILING && (
          <Notice kind="warn">
            Multiple choice is set at {c.weight}% of the module grade. The house rules flag anything above {WEIGHT_CEILING}%:
            multiple choice should never be the only assessment in a module.
          </Notice>
        )}

        <hr className="divider" />

        {/* B6 */}
        <h3 className="section-title">
          <span className="section-code">B6</span>Output
        </h3>
        <fieldset className="field" style={{ border: 0, marginTop: 12 }} {...err('formats')}>
          <legend className="label">Export formats</legend>
          <div className="check-row">
            {EXPORT_FORMATS.map((f) => {
              const on = c.formats.includes(f.id);
              return (
                <label key={f.id} className={`check-opt${on ? ' on' : ''}`}>
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => set({ formats: on ? c.formats.filter((x) => x !== f.id) : [...c.formats, f.id] })}
                  />
                  {f.label}
                </label>
              );
            })}
          </div>
          <p className="hint">Every question is reviewed by you against A5 before it can be exported.</p>
          <FieldError id="formats-err">{errors.formats}</FieldError>
        </fieldset>
      </div>

      {Object.keys(errors).length > 0 && (
        <Notice kind="error">Some answers need fixing before you go on. They're marked above.</Notice>
      )}

      <div className="btn-row">
        <span className="hint">Step 1 of 5</span>
        <div className="right">
          <button type="button" className="btn btn-primary" onClick={handleNext} disabled={!houseRules}>
            Continue to content →
          </button>
        </div>
      </div>
    </div>
  );
}
