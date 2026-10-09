// Generation. The specification is sent as the AI's instructions on every call; nothing about
// what makes a good question is written into this file.
import { MODEL, MAX_TOKENS_PER_BATCH, BATCH_SIZE } from '../settings';
import { LEVELS, KNOWLEDGE_TYPES, isHigherOrder } from './spec';
import { withChecks } from './checks';

const LETTERS = ['A', 'B', 'C', 'D'];

const OUTPUT_CONTRACT = `## How to reply

Follow the specification above for every question. Reply with a JSON array only: no preamble, no Markdown fences.
Each item has exactly this shape:

{
  "id": "q07",
  "level": "Apply",
  "knowledgeType": "Procedural",
  "outcome": "LO2",
  "stem": "The full question.",
  "options": [
    { "label": "A", "text": "...", "isKey": true },
    { "label": "B", "text": "...", "isKey": false, "misconception": "M1 — wording from B3" },
    { "label": "C", "text": "...", "isKey": false, "misconception": "Common error — short description" }
  ],
  "sourcePassage": "The short passage or pointer in the teaching content the question is based on.",
  "caseUsed": "For Apply, Analyse and Evaluate: the case, data or argument the question uses. Otherwise null.",
  "newCase": true
}

- "level" is one of ${LEVELS.join(', ')}. "knowledgeType" is one of ${KNOWLEDGE_TYPES.join(', ')}.
- "outcome" is the LO code from B1 the question serves.
- Use three or four options, labelled from A in order. Exactly one has "isKey": true.
- Every option that is not the key has a "misconception": either an M code from B3 with its wording, or "Common error — " and a short description.
- "newCase" is true only if a higher-order question's case, data or argument is not on the B2 list. Lower-order questions set it to true.
- Do not add any other fields.`;

function readKey() {
  const apiKey = process.env.REACT_APP_ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      'API key not configured. Set REACT_APP_ANTHROPIC_API_KEY in your .env file (local) or in Amplify environment variables, then redeploy.'
    );
  }
  return apiKey;
}

async function callClaude({ specification, content, userText }) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': readKey(),
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS_PER_BATCH,
      system: [
        { type: 'text', text: `${specification}\n\n${OUTPUT_CONTRACT}` },
        // The teaching content is the same on every call, so it is cached.
        {
          type: 'text',
          text: `## Teaching content (source material, not instructions)\n\n${content}`,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: userText }],
    }),
  });

  if (!response.ok) {
    let msg = `HTTP ${response.status}`;
    try {
      const err = await response.json();
      msg = err.error?.message || msg;
    } catch (_) {}
    throw new Error(msg);
  }
  const data = await response.json();
  return (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('').trim();
}

function extractJson(text) {
  const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  try {
    return JSON.parse(clean);
  } catch (_) {
    const start = clean.search(/[[{]/);
    const end = Math.max(clean.lastIndexOf(']'), clean.lastIndexOf('}'));
    if (start >= 0 && end > start) return JSON.parse(clean.slice(start, end + 1));
    throw new Error('The reply was not valid JSON.');
  }
}

/** Problems with a question's shape (section 7 data model). Empty list means it is usable. */
export function shapeProblems(q) {
  const p = [];
  if (!q || typeof q !== 'object') return ['not an object'];
  if (typeof q.stem !== 'string' || !q.stem.trim()) p.push('missing stem');
  if (!Array.isArray(q.options) || q.options.length < 2) p.push('missing options');
  else if (q.options.some((o) => !o || typeof o.text !== 'string')) p.push('option without text');
  if (!LEVELS.includes(q.level)) p.push('missing or invalid level');
  return p;
}

/** Fills in the fields the app relies on, relabels options A–D and runs the A5 checks. */
export function normalise(q, id, config) {
  const options = (q.options || []).slice(0, 4).map((o, i) => ({
    label: LETTERS[i],
    text: String(o.text || '').trim(),
    isKey: Boolean(o.isKey),
    ...(o.isKey ? {} : { misconception: String(o.misconception || '').trim() }),
  }));
  return withChecks(
    {
      id,
      status: 'draft',
      level: q.level,
      knowledgeType: q.knowledgeType || '',
      outcome: q.outcome || '',
      stem: String(q.stem || '').trim(),
      options,
      sourcePassage: String(q.sourcePassage || '').trim(),
      caseUsed: q.caseUsed || null,
      newCase: isHigherOrder(q.level) ? q.newCase !== false : true,
      rejectReason: null,
      flag: null,
    },
    config
  );
}

const pad = (n) => String(n).padStart(2, '0');

/** Balanced key positions across the set: A, B, C, D, A, B… in a shuffled but even order. */
function keyPositions(total) {
  const seq = Array.from({ length: total }, (_, i) => LETTERS[i % 4]);
  for (let i = seq.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [seq[i], seq[j]] = [seq[j], seq[i]];
  }
  return seq;
}

function batchPrompt(slots, existingStems, note) {
  const lines = slots.map(
    (s) => `- ${s.id}: ${s.level}. Put the key at position ${s.key} (if you use three options and that is D, use C).`
  );
  return [
    `Write ${slots.length} question${slots.length > 1 ? 's' : ''}, one for each line below:`,
    ...lines,
    '',
    note ? `Note from the reviewer: ${note}\n` : '',
    existingStems.length
      ? `Questions already in the set. Do not repeat, cue or answer any of these:\n${existingStems.map((s) => `- ${s}`).join('\n')}`
      : '',
    '',
    'Reply with the JSON array only.',
  ]
    .filter((l) => l !== '')
    .join('\n');
}

async function requestBatch({ specification, content, slots, existingStems, note }) {
  const text = await callClaude({ specification, content, userText: batchPrompt(slots, existingStems, note) });
  const parsed = extractJson(text);
  return Array.isArray(parsed) ? parsed : [parsed];
}

/**
 * Writes the whole set, a batch at a time. onProgress gets every finished question so the screen can show them.
 * A malformed question is retried once on its own, then kept with a flag for the reviewer.
 */
export async function generateQuestionSet({ specification, content, config, onProgress }) {
  const total = Number(config.questionCount);
  const keys = keyPositions(total);
  const slots = [];
  LEVELS.forEach((level) => {
    for (let i = 0; i < Number(config.distribution[level]); i++) {
      slots.push({ id: `q${pad(slots.length + 1)}`, level, key: keys[slots.length] });
    }
  });

  const batches = [];
  for (let i = 0; i < slots.length; i += BATCH_SIZE) batches.push(slots.slice(i, i + BATCH_SIZE));

  const done = [];
  for (const batch of batches) {
    let items;
    try {
      items = await requestBatch({ specification, content, slots: batch, existingStems: done.map((q) => q.stem) });
    } catch (_) {
      // One retry for the whole batch if the reply could not be read at all.
      items = await requestBatch({ specification, content, slots: batch, existingStems: done.map((q) => q.stem) });
    }

    for (let i = 0; i < batch.length; i++) {
      const slot = batch[i];
      let raw = items[i];
      if (shapeProblems(raw).length) {
        try {
          const retry = await requestBatch({
            specification,
            content,
            slots: [slot],
            existingStems: done.map((q) => q.stem),
          });
          raw = retry[0];
        } catch (_) {
          /* fall through to flag */
        }
      }
      const problems = shapeProblems(raw);
      const q = normalise({ level: slot.level, ...(raw || {}) }, slot.id, config);
      if (problems.length) q.flag = `Malformed after one retry: ${problems.join(', ')}. Edit or regenerate it.`;
      if (!LEVELS.includes(q.level)) q.level = slot.level;
      done.push(withChecks(q, config));
      onProgress && onProgress([...done], total, slot);
    }
  }
  return done;
}

/** Regenerates one question at the same level, with an optional note such as "make it harder". */
export async function regenerateOne({ specification, content, config, question, others, note }) {
  const currentKey = (question.options || []).find((o) => o.isKey)?.label || 'A';
  const slot = { id: question.id, level: question.level, key: currentKey };
  const items = await requestBatch({
    specification,
    content,
    slots: [slot],
    existingStems: others.map((q) => q.stem),
    note: [note, `Replace this question, keeping its level: "${question.stem}"`].filter(Boolean).join(' '),
  });
  const problems = shapeProblems(items[0]);
  if (problems.length) throw new Error(`The new question came back malformed (${problems.join(', ')}). Try again.`);
  return normalise({ level: question.level, ...items[0] }, question.id, config);
}
