import React, { useState } from 'react';
import { BLOOMS_COLORS, BLOOMS_DISTRIBUTION } from '../utils/bloomsDistribution';
import { regenerateSingleQuestion } from '../utils/anthropicClient';

const LETTERS = ['a', 'b', 'c', 'd', 'e'];

function BloomsBadge({ level }) {
  const bg    = BLOOMS_COLORS[level] || '#888';
  const light = bg + '22';
  return (
    <span className="blooms-badge" style={{ background: light, color: bg, border: `1px solid ${bg}44` }}>
      {level}
    </span>
  );
}

function QuestionCard({ question, index, onUpdate, onRegenerate, config }) {
  const [open,       setOpen]       = useState(false);
  const [editing,    setEditing]    = useState(false);
  const [regen,      setRegen]      = useState(false);
  const [localQ,     setLocalQ]     = useState(question);

  const toggle = () => { if (!editing) setOpen((o) => !o); };

  const updateStem = (v) => setLocalQ((q) => ({ ...q, stem: v }));

  const updateOption = (i, v) =>
    setLocalQ((q) => {
      const opts = [...q.options];
      opts[i] = v;
      return { ...q, options: opts };
    });

  const setCorrect = (i) => setLocalQ((q) => ({ ...q, correctIndex: i }));

  const saveEdits = () => {
    onUpdate(localQ);
    setEditing(false);
  };

  const cancelEdits = () => {
    setLocalQ(question);
    setEditing(false);
  };

  const handleRegen = async () => {
    setRegen(true);
    try {
      const newQ = await regenerateSingleQuestion({
        question,
        config,
        learningObjectives: '',
        syllabusContent: '',
      });
      newQ.id = question.id;
      onUpdate(newQ);
      setLocalQ(newQ);
    } catch (e) {
      alert('Could not regenerate question: ' + e.message);
    } finally {
      setRegen(false);
    }
  };

  const q = localQ;

  return (
    <div className="question-card">
      <div className="question-card-header" onClick={toggle}>
        <span className="question-card-num">Q{index + 1}</span>
        <BloomsBadge level={q.bloomsLevel} />
        <span className="question-card-stem-preview">{q.stem}</span>
        <div className="question-card-actions" onClick={(e) => e.stopPropagation()}>
          {open && !editing && (
            <>
              <button
                className="btn btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                onClick={() => setEditing(true)}
              >
                ✏️ Edit
              </button>
              <button
                className="btn btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                onClick={handleRegen}
                disabled={regen}
              >
                {regen ? '…' : '↺ Regen'}
              </button>
            </>
          )}
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{open ? '▲' : '▼'}</span>
        </div>
      </div>

      <div className={`question-card-body${open ? ' open' : ''}`}>
        {/* Stem */}
        {editing ? (
          <textarea
            className="inline-edit"
            style={{ fontSize: '0.9rem', fontWeight: 500, marginBottom: 14, minHeight: 80 }}
            value={q.stem}
            onChange={(e) => updateStem(e.target.value)}
          />
        ) : (
          <p className="question-edit-stem">{q.stem}</p>
        )}

        {/* Options */}
        <div className="options-list">
          {q.options.map((opt, i) => (
            <div
              key={i}
              className={`option-row${i === q.correctIndex ? ' correct' : ''}`}
              onClick={() => editing && setCorrect(i)}
              style={{ cursor: editing ? 'pointer' : 'default' }}
            >
              <div className="option-letter">{LETTERS[i]}</div>
              <div className="option-text">
                {editing ? (
                  <input
                    className="inline-edit"
                    style={{ padding: '2px 6px' }}
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : opt}
              </div>
              {i === q.correctIndex && (
                <span style={{ fontSize: '0.75rem', color: 'var(--green)', fontWeight: 600 }}>✓ Correct</span>
              )}
              {editing && i !== q.correctIndex && (
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>tap to mark correct</span>
              )}
            </div>
          ))}
        </div>

        {/* LO reference */}
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8 }}>
          <strong>Learning Objective:</strong> {q.learningObjectiveRef}
        </p>

        {/* Explanation */}
        <div className="explanation-box">
          <strong>Explanation:</strong> {q.explanation}
        </div>

        {/* Edit controls */}
        {editing && (
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button className="btn btn-primary" onClick={saveEdits}>Save Changes</button>
            <button className="btn btn-secondary" onClick={cancelEdits}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Step4Preview({ questions, config, content, onNext, onBack, onUpdateQuestions }) {
  const distribution = BLOOMS_DISTRIBUTION[config.questionCount];

  // Count by Bloom's level in current questions
  const counts = {};
  questions.forEach((q) => {
    counts[q.bloomsLevel] = (counts[q.bloomsLevel] || 0) + 1;
  });

  const handleUpdate = (updated) => {
    const newQs = questions.map((q) => (q.id === updated.id ? updated : q));
    onUpdateQuestions(newQs);
  };

  // Distribution bar
  const total = questions.length;
  const coloredSegments = Object.entries(distribution)
    .filter(([, target]) => target > 0)
    .map(([level, target]) => ({
      level,
      actual: counts[level] || 0,
      target,
      pct: ((counts[level] || 0) / total) * 100,
    }));

  const lowerOrder  = (counts['Remember'] || 0) + (counts['Understand'] || 0);
  const higherOrder = total - lowerOrder;

  return (
    <div>
      <div className="card">
        <h2 className="card-title">Review &amp; Edit Questions</h2>
        <p className="card-subtitle">
          {total} questions generated. Expand any question to view, edit, or regenerate it.
          Changes are saved in the tool — export when you're satisfied.
        </p>

        {/* Distribution summary cells */}
        <div className="distribution-summary">
          {Object.entries(distribution).map(([level, target]) => {
            const actual = counts[level] || 0;
            const ok     = actual === target;
            const bg     = BLOOMS_COLORS[level] + '18';
            const color  = BLOOMS_COLORS[level];
            return (
              <div key={level} className="dist-cell" style={{ background: bg }}>
                <div className="dist-cell-count" style={{ color }}>
                  {actual}
                  {target > 0 && actual !== target && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--red)' }}>/{target}</span>
                  )}
                </div>
                <div className="dist-cell-label" style={{ color }}>{level}</div>
              </div>
            );
          })}
        </div>

        {/* Bar */}
        <div className="blooms-bar">
          {coloredSegments.map(({ level, pct }) => (
            <div
              key={level}
              className="blooms-bar-segment"
              style={{ flex: pct, background: BLOOMS_COLORS[level] }}
              title={`${level}: ${counts[level] || 0} questions`}
            />
          ))}
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 24 }}>
          {lowerOrder} lower-order ({Math.round((lowerOrder / total) * 100)}%) ·{' '}
          {higherOrder} higher-order ({Math.round((higherOrder / total) * 100)}%) ·{' '}
          Target: 30% / 70%
        </p>

        {/* Quality checklist */}
        <div className="notice info" style={{ marginBottom: 24 }}>
          <span className="notice-icon">☑️</span>
          <div>
            <strong>Before exporting, verify:</strong>
            <ul style={{ marginTop: 6, paddingLeft: 18, fontSize: '0.82rem', lineHeight: 1.8 }}>
              <li>Each question stem contains a complete, standalone question</li>
              <li>All distractors are plausible to a less knowledgeable student</li>
              <li>No question stem inadvertently provides the answer to another</li>
              <li>Grammar and language is appropriate for {config.academicLevel} level</li>
              <li>All correct answers are indisputably correct</li>
            </ul>
          </div>
        </div>

        {/* Question list */}
        <div className="question-list">
          {questions.map((q, i) => (
            <QuestionCard
              key={q.id || i}
              question={q}
              index={i}
              config={config}
              onUpdate={handleUpdate}
              onRegenerate={handleUpdate}
            />
          ))}
        </div>
      </div>

      <div className="btn-row">
        <button className="btn btn-secondary" onClick={onBack}>← Back</button>
        <button className="btn btn-primary" onClick={onNext}>
          Proceed to Export →
        </button>
      </div>
    </div>
  );
}
