import React, { useState } from 'react';
import { Notice } from './ui';
import { setChecks, failedChecks } from '../utils/checks';
import { buildZip, downloadBlob, toGift, toBlackboard } from '../utils/exporters';
import { EXPORT_FORMATS, specFileText, minuteRange } from '../utils/spec';

export default function Step5Export({ questions, config, houseRules, contentSource, onBack, onRestart }) {
  const approved = questions.filter((q) => q.status === 'approved');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const [error, setError] = useState(null);

  const set = setChecks(approved, config);
  const withFails = approved.filter((q) => failedChecks(q).length > 0).length;
  const higher = approved.filter((q) => !['Remember', 'Understand'].includes(q.level)).length;
  const formats = EXPORT_FORMATS.filter((f) => config.formats.includes(f.id));

  const preview = config.formats.includes('gift')
    ? toGift(approved.slice(0, 2), config)
    : toBlackboard(approved.slice(0, 3));

  const download = async () => {
    setBusy(true);
    setError(null);
    try {
      const { blob, filename } = await buildZip({
        questions: approved,
        config,
        setResult: set,
        specificationFile: specFileText(houseRules, config, contentSource),
      });
      downloadBlob(blob, filename);
      setDone(filename);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (approved.length === 0) {
    return (
      <div>
        <div className="card">
          <h2 className="card-title">Export</h2>
          <Notice kind="warn">Nothing is approved yet. Only approved questions can be exported.</Notice>
        </div>
        <div className="btn-row">
          <button type="button" className="btn btn-secondary" onClick={onBack}>← Back to review</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <h2 className="card-title">Export</h2>
        <p className="card-sub">
          Approved questions only. Everything downloads together as one zip named after the module and today's date.
        </p>

        <div className="stats">
          <div className="stat">
            <div className="stat-val">{approved.length}</div>
            <div className="stat-label">Approved</div>
          </div>
          <div className="stat">
            <div className="stat-val">{minuteRange(set.time.low, set.time.high)}</div>
            <div className="stat-label">Minutes of {config.minutes}</div>
          </div>
          <div className="stat">
            <div className="stat-val">{config.weight}%</div>
            <div className="stat-label">Module grade</div>
          </div>
          <div className="stat">
            <div className="stat-val">{Math.round((higher / approved.length) * 100)}%</div>
            <div className="stat-label">Higher order</div>
          </div>
        </div>

        {!set.distribution.pass && (
          <Notice kind="warn">
            The approved set no longer matches your distribution: {set.distribution.reason}. You can still export, or go back
            and approve or regenerate questions.
          </Notice>
        )}
        {!set.time.pass && <Notice kind="warn">{set.time.reason}</Notice>}
        {withFails > 0 && (
          <Notice kind="warn">
            {withFails} approved question{withFails > 1 ? 's have' : ' has'} a failed check. That's your call, but it will show
            on the review sheet.
          </Notice>
        )}

        <h3 className="section-title">In the zip</h3>
        <ul style={{ paddingLeft: 20, marginBottom: 20, lineHeight: 1.9 }}>
          {formats.map((f) => (
            <li key={f.id}>
              <strong>{f.label}</strong> import file (.txt)
            </li>
          ))}
          <li>
            <strong>Review sheet</strong> (.html, print to PDF): key, level, knowledge type, the misconception behind each
            distractor and the source passage, for moderation and external examiners
          </li>
          <li>
            <strong>Specification used</strong> (.md), so the set can be reproduced. It re-imports on the Set up screen.
          </li>
        </ul>

        <p className="label">Preview</p>
        <pre className="file-preview" tabIndex={0} aria-label="Preview of the import file">{preview}</pre>

        <div className="export-payoff">
          <div>
            <strong>{approved.length} questions ready to import.</strong>
            <p>{formats.map((f) => f.label).join(' and ')}, plus review sheet and specification.</p>
          </div>
          <button type="button" className="btn btn-primary" onClick={download} disabled={busy}>
            {busy ? 'Building zip…' : 'Download zip'}
          </button>
        </div>

        {done && <Notice kind="ok">Downloaded {done}.</Notice>}
        {error && <Notice kind="error">Could not build the zip: {error}</Notice>}

        <h3 className="section-title">Importing</h3>
        <ol className="howto">
          {config.formats.includes('gift') && (
            <li>
              <strong>Moodle:</strong> in the course, open the question bank, choose <strong>Import</strong>, pick{' '}
              <strong>GIFT format</strong> and upload the GIFT file.
            </li>
          )}
          {config.formats.includes('blackboard') && (
            <li>
              <strong>Blackboard:</strong> in a test or question bank, choose <strong>Upload questions</strong> and select the
              Blackboard .txt file.
            </li>
          )}
          <li>Check a few questions in the LMS preview before you release the test.</li>
        </ol>
      </div>

      <div className="btn-row">
        <button type="button" className="btn btn-secondary" onClick={onBack}>← Back to review</button>
        <div className="right">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => window.confirm('Start a new set? This clears the current questions.') && onRestart()}
          >
            Start a new set
          </button>
        </div>
      </div>
    </div>
  );
}
