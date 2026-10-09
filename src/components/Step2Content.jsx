import React, { useRef, useState } from 'react';
import { FieldError, Notice } from './ui';
import { MAX_UPLOAD_FILES } from '../settings';

const MIN_WORDS = 50;
const TEXT_TYPES = /\.(txt|md|markdown|csv|html?)$/i;

const words = (s) => (s.trim() ? s.trim().split(/\s+/).length : 0);
const sizeLabel = (b) => (b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1048576).toFixed(1)} MB`);

const readAsText = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsText(file);
  });

export default function Step2Content({ content, onChange, onBack, onNext }) {
  const [over, setOver] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef();

  const addFiles = async (list) => {
    setError(null);
    const incoming = Array.from(list);
    const room = MAX_UPLOAD_FILES - content.files.length;
    if (incoming.length > room) setError(`Up to ${MAX_UPLOAD_FILES} files. ${incoming.length - room} not added.`);
    const read = await Promise.all(
      incoming.slice(0, Math.max(room, 0)).map(async (f) => {
        if (!TEXT_TYPES.test(f.name)) {
          return {
            name: f.name,
            size: f.size,
            ok: false,
            text: '',
            note: 'Not read. Copy the text from PDF, Word or PowerPoint into the box below.',
          };
        }
        try {
          const text = await readAsText(f);
          return { name: f.name, size: f.size, ok: text.trim().length > 0, text, note: text.trim() ? '' : 'File is empty.' };
        } catch (e) {
          return { name: f.name, size: f.size, ok: false, text: '', note: 'Could not read this file.' };
        }
      })
    );
    onChange({ ...content, files: [...content.files, ...read] });
  };

  const removeFile = (i) => onChange({ ...content, files: content.files.filter((_, j) => j !== i) });

  const total = content.files.filter((f) => f.ok).reduce((n, f) => n + words(f.text), 0) + words(content.pasted);

  const handleNext = () => {
    if (total < MIN_WORDS) {
      setError(`Add more teaching content. The generator needs at least ${MIN_WORDS} words; there are ${total}.`);
      return;
    }
    onNext();
  };

  return (
    <div>
      <div className="card">
        <h2 className="card-title">Content</h2>
        <p className="card-sub">
          Give the generator what you taught: slides, notes or the course export. Questions are built from this and nothing
          else.
        </p>

        <Notice kind="warn">Teaching materials only. Do not upload student work, marks or any student data.</Notice>

        <div
          className={`dropzone${over ? ' over' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            addFiles(e.dataTransfer.files);
          }}
        >
          <p style={{ marginBottom: 12 }}>Drop text files here (.txt or .md), up to {MAX_UPLOAD_FILES}.</p>
          <button type="button" className="btn btn-secondary" onClick={() => inputRef.current.click()}>
            Choose files
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple
            hidden
            accept=".txt,.md,.markdown,.csv,.html,.htm,text/plain,text/markdown"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </div>

        {content.files.length > 0 && (
          <ul className="file-list" aria-label="Uploaded files">
            {content.files.map((f, i) => (
              <li className="file-item" key={`${f.name}-${i}`}>
                <span className="file-name" title={f.name}>
                  {f.name}
                  {f.note && (
                    <span className="hint" style={{ display: 'block', whiteSpace: 'normal' }}>
                      {f.note}
                    </span>
                  )}
                </span>
                <span className="file-size">{sizeLabel(f.size)}</span>
                {f.ok ? <span className="read-ok">✓ read OK</span> : <span className="read-fail">✗ not read</span>}
                <button type="button" className="icon-btn" aria-label={`Remove ${f.name}`} title="Remove" onClick={() => removeFile(i)}>
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="field">
          <label className="label" htmlFor="pasted">
            Or paste teaching content
          </label>
          <textarea
            id="pasted"
            className="textarea"
            style={{ minHeight: 220 }}
            placeholder="Paste lecture notes, slide text or a reading here. For PDF, Word and PowerPoint, copy the text in for now."
            value={content.pasted}
            onChange={(e) => {
              setError(null);
              onChange({ ...content, pasted: e.target.value });
            }}
          />
          <p className="hint">{total} words of teaching content in total.</p>
        </div>

        <FieldError>{error}</FieldError>
      </div>

      <div className="btn-row">
        <button type="button" className="btn btn-secondary" onClick={onBack}>
          ← Back
        </button>
        <div className="right">
          <button type="button" className="btn btn-primary" onClick={handleNext}>
            Continue to generate →
          </button>
        </div>
      </div>
    </div>
  );
}
