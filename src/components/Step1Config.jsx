import React, { useState } from 'react';
import { ACADEMIC_LEVELS, QUESTION_SETS } from '../utils/bloomsDistribution';

export default function Step1Config({ config, onNext }) {
  const [form, setForm] = useState({
    moduleName:       config.moduleName      || '',
    academicLevel:    config.academicLevel   || ACADEMIC_LEVELS[0],
    questionCount:    config.questionCount   || 20,
    minutes:          config.minutes         || 30,
    assessmentWeight: config.assessmentWeight || 25,
    distractorCount:  config.distractorCount  || 4,
  });

  const [errors, setErrors] = useState({});

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.moduleName.trim()) e.moduleName = 'Module name is required.';
    if (form.assessmentWeight < 1 || form.assessmentWeight > 100)
      e.assessmentWeight = 'Enter a value between 1 and 100.';
    if (form.assessmentWeight > 30)
      e.assessmentWeightWarn = true;
    return e;
  };

  const handleNext = () => {
    const e = validate();
    const hasErrors = Object.keys(e).filter((k) => !k.endsWith('Warn')).length > 0;
    if (hasErrors) { setErrors(e); return; }
    setErrors(e); // keep warnings
    onNext(form);
  };

  return (
    <div>
      <div className="card">
        <h2 className="card-title">Assessment Configuration</h2>
        <p className="card-subtitle">
          Set the parameters for your summative MCQ assessment. These govern question generation and export.
        </p>

        {/* Module name */}
        <div className="form-group">
          <label className="form-label" htmlFor="moduleName">Module / Course Name</label>
          <input
            id="moduleName"
            className="form-input"
            type="text"
            placeholder="e.g. Introduction to Marketing (MKT1001)"
            value={form.moduleName}
            onChange={(e) => set('moduleName', e.target.value)}
          />
          {errors.moduleName && (
            <p style={{ color: 'var(--red)', fontSize: '0.8rem', marginTop: 4 }}>{errors.moduleName}</p>
          )}
        </div>

        {/* Academic level */}
        <div className="form-group">
          <label className="form-label" htmlFor="academicLevel">Academic Level</label>
          <select
            id="academicLevel"
            className="form-select"
            value={form.academicLevel}
            onChange={(e) => set('academicLevel', e.target.value)}
          >
            {ACADEMIC_LEVELS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          <p className="form-hint">Question difficulty and language complexity will be calibrated to this level.</p>
        </div>

        {/* Question set */}
        <div className="form-group">
          <label className="form-label">Number of Questions &amp; Time Allocation</label>
          <div className="radio-group">
            {QUESTION_SETS.map(({ questions, minutes, label }) => (
              <label
                key={questions}
                className={`radio-option${form.questionCount === questions ? ' selected' : ''}`}
              >
                <input
                  type="radio"
                  name="questionSet"
                  value={questions}
                  checked={form.questionCount === questions}
                  onChange={() => set('questionCount', questions) || set('minutes', minutes)}
                  onClick={() => { set('questionCount', questions); set('minutes', minutes); }}
                />
                <div>
                  <div className="radio-option-text">{label}</div>
                  <div className="radio-option-sub">
                    {questions === 20 && 'Default · suitable for formative or lower-stakes summative use'}
                    {questions === 30 && 'Medium · balances breadth and cognitive range'}
                    {questions === 40 && 'Full · 60-minute exam, maximum Bloom\'s coverage'}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Assessment weight */}
        <div className="form-group">
          <label className="form-label" htmlFor="assessmentWeight">
            Assessment Weight (% of overall module grade)
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              id="assessmentWeight"
              className="form-input"
              type="number"
              min="1"
              max="100"
              style={{ maxWidth: 100 }}
              value={form.assessmentWeight}
              onChange={(e) => set('assessmentWeight', Number(e.target.value))}
            />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>%</span>
          </div>
          {errors.assessmentWeight && (
            <p style={{ color: 'var(--red)', fontSize: '0.8rem', marginTop: 4 }}>{errors.assessmentWeight}</p>
          )}
          {errors.assessmentWeightWarn && !errors.assessmentWeight && (
            <div className="notice warning" style={{ marginTop: 8, marginBottom: 0 }}>
              <span className="notice-icon">⚠️</span>
              <span>
                <strong>QAA Guidance:</strong> It is not recommended that a single MCQ exam exceed{' '}
                <strong>30%</strong> of the assessment plan (Franke, 2018). Consider whether complementary
                assessment methods are in place.
              </span>
            </div>
          )}
        </div>

        {/* Distractor count */}
        <div className="form-group">
          <label className="form-label">Number of Distractors per Question</label>
          <div className="radio-group" style={{ flexDirection: 'row', gap: 12 }}>
            {[3, 4].map((n) => (
              <label
                key={n}
                className={`radio-option${form.distractorCount === n ? ' selected' : ''}`}
                style={{ flex: 1 }}
              >
                <input
                  type="radio"
                  name="distractors"
                  value={n}
                  checked={form.distractorCount === n}
                  onChange={() => set('distractorCount', n)}
                />
                <div>
                  <div className="radio-option-text">{n} distractors + 1 correct = {n + 1} options</div>
                  <div className="radio-option-sub">
                    {n === 3 ? 'Standard 4-option MCQ' : '5-option — reduces guessing probability to 20%'}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="btn-row">
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Step 1 of 5</span>
        <button className="btn btn-primary" onClick={handleNext}>
          Continue to Content →
        </button>
      </div>
    </div>
  );
}
