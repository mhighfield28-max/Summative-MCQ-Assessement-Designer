import React from 'react';

export const levelColour = (level) => `var(--lvl-${String(level || '').toLowerCase()})`;

/** The landing-target mark: three concentric rings, Spark centre dot. */
export function BrandMark({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden="true" focusable="false">
      <circle cx="18" cy="18" r="16" fill="none" stroke="var(--ink-on-dark)" strokeWidth="1.6" />
      <circle cx="18" cy="18" r="11" fill="none" stroke="var(--ink-on-dark)" strokeWidth="1.6" />
      <circle cx="18" cy="18" r="6" fill="none" stroke="var(--ink-on-dark)" strokeWidth="1.6" />
      <circle cx="18" cy="18" r="2.6" fill="var(--spark)" />
    </svg>
  );
}

export function LevelTag({ level }) {
  return (
    <span className="tag">
      <span className="dot" style={{ background: levelColour(level) }} aria-hidden="true" />
      {level || 'No level'}
    </span>
  );
}

const NOTICE_ICONS = { warn: '!', info: 'i', error: '✗', ok: '✓' };
const NOTICE_WORDS = { warn: 'Warning', info: 'Note', error: 'Problem', ok: 'Done' };

export function Notice({ kind = 'info', children, style }) {
  return (
    <div className={`notice ${kind}`} role={kind === 'error' || kind === 'warn' ? 'alert' : undefined} style={style}>
      <span className="ico" aria-hidden="true">{NOTICE_ICONS[kind]}</span>
      <div>
        <span className="sr-only">{NOTICE_WORDS[kind]}: </span>
        {children}
      </div>
    </div>
  );
}

export function FieldError({ id, children }) {
  if (!children) return null;
  return (
    <p className="field-error" id={id}>
      {children}
    </p>
  );
}

export function StatusPill({ status }) {
  const words = { draft: 'Draft', approved: '✓ Approved', rejected: '✗ Rejected' };
  return <span className={`status ${status}`}>{words[status] || status}</span>;
}
