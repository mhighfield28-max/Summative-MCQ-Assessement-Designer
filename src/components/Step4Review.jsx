import React, { useMemo, useState } from 'react';
import { LevelTag, Notice, StatusPill, levelColour } from './ui';
import { CHECKS, withChecks, failedChecks, setChecks, keyBalance } from '../utils/checks';
import { regenerateOne } from '../utils/anthropicClient';
import { LEVELS, KNOWLEDGE_TYPES, outcomeList, misconceptionList, minuteRange } from '../utils/spec';

const LETTERS = ['A', 'B', 'C', 'D'];

function CheckChips({ q }) {
  return (
    <div className="chips" aria-label="A5 checks">
      {CHECKS.map(({ key, label }) => {
        const ok = q.checks?.[key];
        const note = q.checkNotes?.[key] || '';
        return (
          <span key={key} className={`chip ${ok ? 'ok' : 'no'}`} title={note} tabIndex={0} aria-label={`${label}: ${ok ? 'pass' : 'fail'}. ${note}`}>
            <span aria-hidden="true">{ok ? '✓' : '✗'}</span>
            {label} · {ok ? 'Pass' : 'Fail'}
          </span>
        );
      })}
    </div>
  );
}

function Editor({ q, config, onSave, onCancel }) {
  const [d, setD] = useState(() => JSON.parse(JSON.stringify(q)));
  const outcomes = outcomeList(config);
  const mis = misconceptionList(config);

  const setOpt = (i, patch) => setD((x) => ({ ...x, options: x.options.map((o, j) => (j === i ? { ...o, ...patch } : o)) }));
  const setKey = (i) => setD((x) => ({ ...x, options: x.options.map((o, j) => ({ ...o, isKey: j === i })) }));
  const addOpt = () => setD((x) => ({ ...x, options: [...x.options, { label: '', text: '', isKey: false, misconception: '' }] }));
  const removeOpt = (i) => setD((x) => ({ ...x, options: x.options.filter((_, j) => j !== i) }));

  const save = () => {
    const options = d.options.map((o, i) => {
      const base = { label: LETTERS[i], text: o.text.trim(), isKey: o.isKey };
      return o.isKey ? base : { ...base, misconception: (o.misconception || '').trim() };
    });
    onSave({ ...d, stem: d.stem.trim(), options, status: 'draft', flag: null, newCase: undefined });
  };

  const misListId = `mis-${q.id}`;

  return (
    <div>
      <div className="edit-grid">
        <div>
          <label className="label" htmlFor={`lvl-${q.id}`}>Level</label>
          <select id={`lvl-${q.id}`} className="select" value={d.level} onChange={(e) => setD({ ...d, level: e.target.value })}>
            {LEVELS.map((l) => <option key={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor={`kt-${q.id}`}>Knowledge type</label>
          <select id={`kt-${q.id}`} className="select" value={d.knowledgeType} onChange={(e) => setD({ ...d, knowledgeType: e.target.value })}>
            <option value="">Choose…</option>
            {KNOWLEDGE_TYPES.map((k) => <option key={k}>{k}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor={`lo-${q.id}`}>Outcome</label>
          <select id={`lo-${q.id}`} className="select" value={d.outcome} onChange={(e) => setD({ ...d, outcome: e.target.value })}>
            <option value="">None</option>
            {outcomes.map((o, i) => (
              <option key={i} value={`LO${i + 1}`}>LO{i + 1} — {o.text.slice(0, 50)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label className="label" htmlFor={`stem-${q.id}`}>Stem</label>
        <textarea id={`stem-${q.id}`} className="textarea" style={{ minHeight: 90 }} value={d.stem} onChange={(e) => setD({ ...d, stem: e.target.value })} />
      </div>

      <datalist id={misListId}>
        {mis.map((m, i) => <option key={i} value={`M${i + 1} — ${m.text.trim()}`} />)}
      </datalist>

      <fieldset style={{ border: 0 }}>
        <legend className="label">Options</legend>
        {d.options.map((o, i) => (
          <div className="edit-opt" key={i}>
            <div className="edit-opt-head">
              <strong>{LETTERS[i]}</strong>
              <label className="keypick">
                <input type="radio" name={`key-${q.id}`} checked={o.isKey} onChange={() => setKey(i)} />
                Key
              </label>
              <button type="button" className="btn btn-ghost btn-small" style={{ marginLeft: 'auto' }} onClick={() => removeOpt(i)} disabled={d.options.length <= 3}>
                Remove option
              </button>
            </div>
            <input className="input" aria-label={`Option ${LETTERS[i]} text`} value={o.text} onChange={(e) => setOpt(i, { text: e.target.value })} />
            {!o.isKey && (
              <input
                className="input"
                list={misListId}
                aria-label={`Misconception behind option ${LETTERS[i]}`}
                placeholder="Misconception: pick from B3 or type a common error"
                value={o.misconception || ''}
                onChange={(e) => setOpt(i, { misconception: e.target.value })}
              />
            )}
          </div>
        ))}
        {d.options.length < 4 && (
          <button type="button" className="btn btn-ghost btn-small" onClick={addOpt}>+ Add option</button>
        )}
      </fieldset>

      <div className="field" style={{ marginTop: 10 }}>
        <label className="label" htmlFor={`src-${q.id}`}>Source passage</label>
        <textarea id={`src-${q.id}`} className="textarea" style={{ minHeight: 60 }} value={d.sourcePassage} onChange={(e) => setD({ ...d, sourcePassage: e.target.value })} />
      </div>

      <div className="qactions">
        <button type="button" className="btn btn-dark btn-small" onClick={save}>Save and re-run checks</button>
        <button type="button" className="btn btn-ghost btn-small" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function QuestionCard({ q, number, config, onUpdate, onRegenerate }) {
  const [mode, setMode] = useState(null); // 'edit' | 'regen' | 'reject'
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const doRegen = async () => {
    setBusy(true);
    setErr(null);
    try {
      await onRegenerate(q, note.trim());
      setMode(null);
      setNote('');
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className={`qcard ${q.status}`} aria-labelledby={`qt-${q.id}`}>
      <div className="qhead">
        <h3 className="qnum" id={`qt-${q.id}`}>Q{number}</h3>
        <LevelTag level={q.level} />
        <span className="tag kt">{q.knowledgeType || 'No knowledge type'}</span>
        {q.outcome && <span className="tag lo">{q.outcome}</span>}
        <StatusPill status={q.status} />
      </div>

      {q.flag && <Notice kind="error" style={{ marginBottom: 14 }}>{q.flag}</Notice>}

      {mode === 'edit' ? (
        <Editor
          q={q}
          config={config}
          onCancel={() => setMode(null)}
          onSave={(updated) => {
            onUpdate(updated);
            setMode(null);
          }}
        />
      ) : (
        <>
          <p className="qstem">{q.stem}</p>
          <ul className="qopts">
            {q.options.map((o) => (
              <li key={o.label} className={`qopt${o.isKey ? ' key' : ''}`}>
                <div className="qopt-main">
                  <span className="qopt-letter">{o.label}</span>
                  <span>{o.text}</span>
                  {o.isKey && <span className="qopt-key">✓ Key</span>}
                </div>
                {!o.isKey && (
                  <p className="qopt-mis">
                    <b>Misconception:</b> {o.misconception || 'none recorded'}
                  </p>
                )}
              </li>
            ))}
          </ul>

          <details className="qsource">
            <summary>Source passage</summary>
            <p>{q.sourcePassage || 'None given.'}</p>
          </details>

          <CheckChips q={q} />

          {q.status === 'rejected' && q.rejectReason && <p className="reject-reason">Rejected: {q.rejectReason}</p>}

          <div className="qactions">
            <button type="button" className="btn btn-secondary btn-small" onClick={() => setMode('edit')}>Edit</button>
            <button type="button" className="btn btn-secondary btn-small" onClick={() => setMode(mode === 'regen' ? null : 'regen')} disabled={busy}>
              Regenerate
            </button>
            <span className="spacer" />
            {q.status !== 'approved' && (
              <button type="button" className="btn btn-approve btn-small" onClick={() => onUpdate({ ...q, status: 'approved', rejectReason: null })}>
                ✓ Approve
              </button>
            )}
            {q.status !== 'rejected' && (
              <button type="button" className="btn btn-reject btn-small" onClick={() => setMode(mode === 'reject' ? null : 'reject')}>
                ✗ Reject
              </button>
            )}
            {q.status !== 'draft' && (
              <button type="button" className="btn btn-ghost btn-small" onClick={() => onUpdate({ ...q, status: 'draft', rejectReason: null })}>
                Back to draft
              </button>
            )}

            {mode === 'regen' && (
              <div className="inline-form">
                <input
                  className="input"
                  aria-label="Note for the new version (optional)"
                  placeholder='Optional note, e.g. "make it harder" or "use a different case"'
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !busy && doRegen()}
                />
                <button type="button" className="btn btn-dark btn-small" onClick={doRegen} disabled={busy}>
                  {busy ? 'Writing…' : 'Write a new version'}
                </button>
              </div>
            )}
            {mode === 'reject' && (
              <div className="inline-form">
                <input
                  className="input"
                  aria-label="Reason for rejecting (optional)"
                  placeholder="Optional reason, kept for the record"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-reject btn-small"
                  onClick={() => {
                    onUpdate({ ...q, status: 'rejected', rejectReason: note.trim() || null });
                    setNote('');
                    setMode(null);
                  }}
                >
                  Confirm reject
                </button>
              </div>
            )}
          </div>
          {err && <Notice kind="error" style={{ marginTop: 12, marginBottom: 0 }}>{err}</Notice>}
        </>
      )}
    </article>
  );
}

export default function Step4Review({ questions, config, specification, contentText, onChange, onBack, onNext }) {
  const [levelFilter, setLevelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [failedOnly, setFailedOnly] = useState(false);

  const live = questions.filter((q) => q.status !== 'rejected');
  const approved = questions.filter((q) => q.status === 'approved');
  const set = useMemo(() => setChecks(live, config), [live, config]);
  const bal = keyBalance(live);

  const update = (q) => onChange(questions.map((x) => (x.id === q.id ? withChecks(q, config) : x)));

  const regenerate = async (q, note) => {
    const fresh = await regenerateOne({
      specification,
      content: contentText,
      config,
      question: q,
      others: questions.filter((x) => x.id !== q.id),
      note,
    });
    onChange(questions.map((x) => (x.id === q.id ? fresh : x)));
  };

  const shown = questions
    .map((q, i) => ({ q, n: i + 1 }))
    .filter(({ q }) => levelFilter === 'all' || q.level === levelFilter)
    .filter(({ q }) => statusFilter === 'all' || q.status === statusFilter)
    .filter(({ q }) => !failedOnly || failedChecks(q).length > 0);

  const failingCount = questions.filter((q) => failedChecks(q).length > 0).length;

  return (
    <div>
      <div className="card" style={{ paddingBottom: 12 }}>
        <h2 className="card-title">Review</h2>
        <p className="card-sub">
          This is where your judgement comes in. Read every question, fix what needs fixing and approve each one on its own.
          Only approved questions are exported.
        </p>
      </div>

      <section className="summary-bar" aria-label="Set summary">
        <div>
          <div className="big">
            {approved.length} / {questions.length}
          </div>
          <div className="small">approved</div>
        </div>
        <div>
          <div className="summary-levels">
            {LEVELS.map((l) => {
              const have = set.counts[l];
              const want = Number(config.distribution[l]);
              return (
                <span className="lv" key={l}>
                  <span className="dot" style={{ background: levelColour(l) }} aria-hidden="true" />
                  {l}{' '}
                  <span className={have !== want ? 'off' : ''}>
                    {have}/{want}
                    {have !== want && <span className="sr-only"> (does not match)</span>}
                  </span>
                </span>
              );
            })}
          </div>
          <div className="small" style={{ marginTop: 6 }}>
            Key positions: {Object.entries(bal).map(([k, v]) => `${k} ${v}`).join(' · ')} · counts exclude rejected
          </div>
        </div>
        <div className="summary-right">
          <div className={set.time.pass ? '' : 'bad'}>
            {set.time.pass ? '✓' : '!'} {minuteRange(set.time.low, set.time.high)} min
          </div>
          <div className="small">of {config.minutes} available</div>
          <div className={set.distribution.pass ? 'small' : 'small bad'} style={{ marginTop: 4 }}>
            {set.distribution.pass ? '✓ Distribution matches' : '! Distribution off'}
          </div>
        </div>
      </section>

      <div className="filters" role="group" aria-label="Filters">
        <div className="field">
          <label className="label" htmlFor="f-level">Level</label>
          <select id="f-level" className="select" value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
            <option value="all">All levels</option>
            {LEVELS.map((l) => <option key={l}>{l}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="label" htmlFor="f-status">Status</label>
          <select id="f-status" className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="draft">Draft</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <label className="checkbox">
          <input type="checkbox" checked={failedOnly} onChange={(e) => setFailedOnly(e.target.checked)} />
          Failed checks only ({failingCount})
        </label>
        <span className="hint" style={{ marginLeft: 'auto', paddingBottom: 10 }} aria-live="polite">
          Showing {shown.length} of {questions.length}
        </span>
      </div>

      {shown.length === 0 && <div className="card empty">No questions match these filters.</div>}

      {shown.map(({ q, n }) => (
        <QuestionCard key={q.id} q={q} number={n} config={config} onUpdate={update} onRegenerate={regenerate} />
      ))}

      <div className="btn-row">
        <button type="button" className="btn btn-secondary" onClick={onBack}>← Back</button>
        <div className="right">
          <span className="hint">{approved.length === 0 ? 'Approve at least one question to export.' : ''}</span>
          <button type="button" className="btn btn-primary" onClick={onNext} disabled={approved.length === 0}>
            Continue to export →
          </button>
        </div>
      </div>
    </div>
  );
}
