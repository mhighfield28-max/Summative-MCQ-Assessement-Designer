// A5 checks, run in code on every question and across the set.
import {
  LEVELS,
  KNOWLEDGE_TYPES,
  isHigherOrder,
  caseList,
  estimateSeconds,
  toMinutes,
} from './spec';

export const CHECKS = [
  { key: 'tags', label: 'Tags' },
  { key: 'newCase', label: 'Unseen case' },
  { key: 'oneKey', label: 'One key' },
  { key: 'optionLength', label: 'Options' },
  { key: 'noBannedForms', label: 'Wording' },
  { key: 'distractorsLinked', label: 'Distractors linked' },
];

const BANNED = /\b(all|none|both|neither)\s+of\s+the\s+(above|options|answers|following)\b/i;
const NEGATIVE = /\b(not|never|except|least|cannot|can't|isn't|aren't|doesn't|don't|won't|wasn't|weren't|didn't)\b/gi;

const STOP = new Set(
  'the a an and or of to in on at for with from by is are was were be been being it its this that these those as about into than then there their they them which what when where who whom how why'.split(
    ' '
  )
);

const contentWords = (s) =>
  (s.toLowerCase().match(/[a-z0-9][a-z0-9'°.,-]*/g) || [])
    .map((w) => w.replace(/[.,]+$/, ''))
    .filter((w) => w.length > 3 && !STOP.has(w));

/** Fraction of a taught case's distinctive words that turn up in the question. */
function caseOverlap(caseText, questionText) {
  const cw = [...new Set(contentWords(caseText))];
  if (cw.length < 3) return 0;
  const qw = new Set(contentWords(questionText));
  return cw.filter((w) => qw.has(w)).length / cw.length;
}

/** Returns { key: { pass, reason } } for one question. */
export function runChecks(q, config) {
  const r = {};
  const options = q.options || [];

  // Level tag and knowledge type
  const levelOk = LEVELS.includes(q.level);
  const ktOk = KNOWLEDGE_TYPES.includes(q.knowledgeType);
  r.tags = {
    pass: levelOk && ktOk,
    reason: !levelOk
      ? `Level "${q.level || 'missing'}" is not one of Remember to Evaluate.`
      : !ktOk
      ? `Knowledge type "${q.knowledgeType || 'missing'}" is not Factual, Conceptual or Procedural.`
      : 'Level and knowledge type present.',
  };

  // Higher-order uses a case not listed in B2
  if (!isHigherOrder(q.level)) {
    r.newCase = { pass: true, reason: 'Lower-order question: an unseen case is not required.' };
  } else {
    const text = `${q.stem} ${options.map((o) => o.text).join(' ')}`;
    const hit = caseList(config)
      .map((c) => ({ c, score: caseOverlap(c, text) }))
      .sort((a, b) => b.score - a.score)[0];
    if (q.newCase === false) {
      r.newCase = { pass: false, reason: 'The generator reported this question reuses a taught case.' };
    } else if (hit && hit.score >= 0.6) {
      r.newCase = { pass: false, reason: `Looks like it reuses a taught case: "${hit.c}".` };
    } else {
      r.newCase = { pass: true, reason: 'No taught case from B2 detected.' };
    }
  }

  // Exactly one key
  const keys = options.filter((o) => o.isKey).length;
  r.oneKey = { pass: keys === 1, reason: keys === 1 ? 'Exactly one key.' : `${keys} options are marked as the key.` };

  // 3–4 options, longest no more than 1.5× the shortest
  const lens = options.map((o) => (o.text || '').trim().length);
  const shortest = Math.min(...lens);
  const longest = Math.max(...lens);
  if (options.length < 3 || options.length > 4) {
    r.optionLength = { pass: false, reason: `${options.length} options. Use three or four.` };
  } else if (shortest === 0) {
    r.optionLength = { pass: false, reason: 'An option is empty.' };
  } else if (longest > shortest * 1.5) {
    r.optionLength = {
      pass: false,
      reason: `Longest option is ${(longest / shortest).toFixed(1)}× the shortest. Keep it within 1.5×.`,
    };
  } else {
    r.optionLength = { pass: true, reason: `${options.length} options, similar in length.` };
  }

  // No all/none of the above, no unmarked negatives
  const banned = [q.stem, ...options.map((o) => o.text)].some((t) => BANNED.test(t || ''));
  const unmarked = ((q.stem || '').match(NEGATIVE) || []).filter((w) => w !== w.toUpperCase());
  r.noBannedForms = {
    pass: !banned && unmarked.length === 0,
    reason: banned
      ? 'Uses "all/none of the above" or similar.'
      : unmarked.length
      ? `Unmarked negative in the stem: "${unmarked[0]}". Remove it or put it in BOLD CAPITALS.`
      : 'No banned forms or unmarked negatives.',
  };

  // Every distractor linked to a misconception
  const unlinked = options.filter((o) => !o.isKey && !(o.misconception || '').trim()).map((o) => o.label);
  r.distractorsLinked = {
    pass: unlinked.length === 0,
    reason: unlinked.length ? `No misconception recorded for option ${unlinked.join(', ')}.` : 'Every distractor is linked.',
  };

  return r;
}

/** Stores the pass/fail booleans in the data-model shape and keeps the reasons alongside. */
export function withChecks(q, config) {
  const results = runChecks(q, config);
  return {
    ...q,
    checks: Object.fromEntries(Object.entries(results).map(([k, v]) => [k, v.pass])),
    checkNotes: Object.fromEntries(Object.entries(results).map(([k, v]) => [k, v.reason])),
  };
}

export const failedChecks = (q) => Object.entries(q.checks || {}).filter(([, ok]) => !ok).map(([k]) => k);

export function countByLevel(questions) {
  const counts = Object.fromEntries(LEVELS.map((l) => [l, 0]));
  questions.forEach((q) => {
    if (counts[q.level] !== undefined) counts[q.level] += 1;
  });
  return counts;
}

/** Set-level A5 checks: distribution matches B4, time fits B5. */
export function setChecks(questions, config) {
  const counts = countByLevel(questions);
  const distOk = LEVELS.every((l) => counts[l] === Number(config.distribution[l]));
  const { low, high } = estimateSeconds(counts);
  const timeOk = toMinutes(high) <= Number(config.minutes);
  return {
    counts,
    distribution: {
      pass: distOk,
      reason: distOk
        ? 'Matches the B4 distribution.'
        : LEVELS.filter((l) => counts[l] !== Number(config.distribution[l]))
            .map((l) => `${l} ${counts[l]} of ${config.distribution[l]}`)
            .join(', '),
    },
    time: {
      pass: timeOk,
      low,
      high,
      reason: `${toMinutes(low)}–${toMinutes(high)} min estimated against ${config.minutes} min available${
        timeOk ? '' : '. It does not fit'
      }. Add reading time for any shared table, case or extract.`,
    },
  };
}

export function keyBalance(questions) {
  const bal = { A: 0, B: 0, C: 0, D: 0 };
  questions.forEach((q) => {
    const k = (q.options || []).find((o) => o.isKey);
    if (k && bal[k.label] !== undefined) bal[k.label] += 1;
  });
  return bal;
}
