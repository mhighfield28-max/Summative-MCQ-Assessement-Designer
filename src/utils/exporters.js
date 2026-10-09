// Each export format is a separate converter from the one internal question shape.
import JSZip from 'jszip';
import { CHECKS } from './checks';
import { slug } from './spec';
import { APP_NAME, BRAND_NAME } from '../settings';

// ---------- Moodle GIFT ----------

/** GIFT reserves ~ = # { } : and the backslash. Newlines become \n. */
export function giftEscape(s) {
  return String(s ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/([~=#{}:])/g, '\\$1')
    .replace(/\r?\n/g, '\\n');
}

export function toGift(questions, config) {
  const head = [
    `// ${APP_NAME} — ${config.moduleName}`,
    `// ${questions.length} approved questions · ${config.studyLevel} · generated ${new Date().toISOString().slice(0, 10)}`,
    `// Import into Moodle: Question bank → Import → GIFT format`,
    '',
  ];
  const body = questions.map((q, i) => {
    const title = `Q${String(i + 1).padStart(2, '0')} ${q.level}`;
    const answers = q.options.map((o) => `  ${o.isKey ? '=' : '~'}${giftEscape(o.text)}`).join('\n');
    return [
      `// ${q.id} · ${q.level} · ${q.knowledgeType || '—'}${q.outcome ? ` · ${q.outcome}` : ''}`,
      `::${giftEscape(title)}::${giftEscape(q.stem)} {`,
      answers,
      '}',
      '',
    ].join('\n');
  });
  return head.concat(body).join('\n');
}

// ---------- Blackboard tab-delimited ----------

const bbClean = (s) => String(s ?? '').replace(/[\t\r\n]+/g, ' ').trim();

/** One question per line: MC, stem, then option / correct|incorrect pairs. */
export function toBlackboard(questions) {
  return questions
    .map((q) => ['MC', bbClean(q.stem), ...q.options.flatMap((o) => [bbClean(o.text), o.isKey ? 'correct' : 'incorrect'])].join('\t'))
    .join('\n');
}

// ---------- Review sheet (printable HTML; print to PDF for moderation) ----------

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function toReviewSheet(questions, config, setResult) {
  const items = questions
    .map((q, i) => {
      const opts = q.options
        .map(
          (o) => `<li class="${o.isKey ? 'key' : ''}"><b>${o.label}.</b> ${esc(o.text)}${
            o.isKey ? ' <span class="tag key">Key</span>' : `<div class="mis">Misconception: ${esc(o.misconception || '—')}</div>`
          }</li>`
        )
        .join('');
      const checks = CHECKS.map(
        (c) => `<span class="chk ${q.checks?.[c.key] ? 'ok' : 'no'}">${q.checks?.[c.key] ? '✓ Pass' : '✗ Fail'} · ${c.label}</span>`
      ).join(' ');
      return `<section class="q">
  <h2>Q${i + 1} <span class="tag">${esc(q.level)}</span> <span class="tag">${esc(q.knowledgeType)}</span>${
        q.outcome ? ` <span class="tag">${esc(q.outcome)}</span>` : ''
      }</h2>
  <p class="stem">${esc(q.stem)}</p>
  <ol class="opts">${opts}</ol>
  <p class="src"><b>Source passage:</b> ${esc(q.sourcePassage || '—')}</p>
  <p class="checks">${checks}</p>
</section>`;
    })
    .join('\n');

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Review sheet — ${esc(config.moduleName)}</title>
<style>
  body{font-family:Inter,Arial,sans-serif;color:#1A1C19;background:#fff;max-width:820px;margin:32px auto;padding:0 20px;font-size:15px;line-height:1.5}
  h1{font-family:Syne,Arial,sans-serif;font-weight:500;color:#243428;margin:0 0 4px}
  .meta{color:#6B6F68;margin:0 0 24px}
  .q{border-top:1px solid #E3DFD4;padding:16px 0;page-break-inside:avoid}
  h2{font-size:15px;margin:0 0 8px;color:#243428}
  .tag{display:inline-block;font-size:12px;font-weight:600;border:1px solid #2D6A5F;color:#2D6A5F;border-radius:999px;padding:0 8px;margin-left:4px}
  .tag.key{border-color:#243428;color:#243428}
  .stem{font-weight:500;margin:0 0 8px}
  .opts{list-style:none;padding:0;margin:0 0 8px}
  .opts li{margin:0 0 6px}
  .opts li.key{font-weight:600}
  .mis{font-size:13px;color:#6B6F68;margin-left:20px}
  .src{font-size:13px;color:#6B6F68;margin:0 0 6px}
  .chk{font-size:12px;margin-right:8px}
  .chk.ok{color:#2E6B3F}.chk.no{color:#A3261B}
  @media print{body{margin:0}}
</style></head><body>
<h1>Review sheet</h1>
<p class="meta">${esc(config.moduleName)} · ${esc(config.studyLevel)} · ${questions.length} approved questions · ${config.minutes} min · ${
    config.weight
  }% of module grade<br>Distribution: ${esc(setResult.distribution.reason)} · Time: ${esc(setResult.time.reason)}<br>Prepared with ${esc(
    APP_NAME
  )} (${esc(BRAND_NAME)}) on ${new Date().toISOString().slice(0, 10)}. Print to PDF for moderation and external examiners.</p>
${items}
</body></html>`;
}

// ---------- Zip ----------

export async function buildZip({ questions, config, specificationFile, setResult }) {
  const zip = new JSZip();
  const base = `${slug(config.moduleName)}_${new Date().toISOString().slice(0, 10)}`;
  if (config.formats.includes('gift')) zip.file(`${base}_moodle_gift.txt`, toGift(questions, config));
  if (config.formats.includes('blackboard')) zip.file(`${base}_blackboard.txt`, toBlackboard(questions));
  zip.file(`${base}_review_sheet.html`, toReviewSheet(questions, config, setResult));
  zip.file(`${base}_specification.md`, specificationFile);
  const blob = await zip.generateAsync({ type: 'blob' });
  return { blob, filename: `${base}.zip` };
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const downloadText = (text, filename, type = 'text/plain') =>
  downloadBlob(new Blob([text], { type: `${type};charset=utf-8` }), filename);
