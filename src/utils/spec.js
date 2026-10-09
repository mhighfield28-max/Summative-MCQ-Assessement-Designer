// Part B of the specification: defaults, calculations and the text sent to the AI.

export const LEVELS = ['Remember', 'Understand', 'Apply', 'Analyse', 'Evaluate'];
export const LOWER_ORDER = ['Remember', 'Understand'];
export const KNOWLEDGE_TYPES = ['Factual', 'Conceptual', 'Procedural'];

export const STUDY_LEVELS = [
  'Undergraduate Y1',
  'Undergraduate Y2',
  'Undergraduate Y3',
  "Master's",
  'Professional',
];

// B4 defaults: counts per 20 questions, Remember → Evaluate.
export const DEFAULT_PER_20 = {
  'Undergraduate Y1': [3, 5, 7, 4, 1],
  'Undergraduate Y2': [2, 4, 7, 5, 2],
  'Undergraduate Y3': [1, 3, 6, 6, 4],
  "Master's": [1, 2, 5, 7, 5],
  Professional: [2, 4, 8, 4, 2],
};

export const QUESTION_COUNTS = [20, 30, 40];

// B5 allowances, seconds per question [low, high].
export const SECONDS_PER_QUESTION = {
  Remember: [45, 60],
  Understand: [60, 75],
  Apply: [90, 120],
  Analyse: [120, 150],
  Evaluate: [120, 180],
};

export const WEIGHT_CEILING = 30;

export const EXPORT_FORMATS = [
  { id: 'gift', label: 'Moodle GIFT' },
  { id: 'blackboard', label: 'Blackboard tab-delimited' },
];

export const isHigherOrder = (level) => !LOWER_ORDER.includes(level);

/** Default distribution for a level of study, scaled to the question count. Largest remainder keeps the total exact. */
export function defaultDistribution(studyLevel, count) {
  const base = DEFAULT_PER_20[studyLevel] || DEFAULT_PER_20['Undergraduate Y1'];
  const raw = base.map((n) => (n * count) / 20);
  const floored = raw.map(Math.floor);
  let short = count - floored.reduce((a, b) => a + b, 0);
  const order = raw
    .map((v, i) => ({ i, rem: v - Math.floor(v) }))
    .sort((a, b) => b.rem - a.rem || b.i - a.i); // ties go to the higher level
  for (let k = 0; short > 0; k++, short--) floored[order[k % order.length].i] += 1;
  return Object.fromEntries(LEVELS.map((l, i) => [l, floored[i]]));
}

export const distributionTotal = (d) => LEVELS.reduce((sum, l) => sum + (Number(d[l]) || 0), 0);

export const sameDistribution = (a, b) => LEVELS.every((l) => Number(a[l]) === Number(b[l]));

export function lowerOrderShare(d) {
  const total = distributionTotal(d);
  if (!total) return 0;
  return Math.round(((Number(d.Remember) + Number(d.Understand)) / total) * 100);
}

/** Time range in seconds for a set of level counts. */
export function estimateSeconds(counts) {
  return LEVELS.reduce(
    (acc, l) => {
      const n = Number(counts[l]) || 0;
      return { low: acc.low + n * SECONDS_PER_QUESTION[l][0], high: acc.high + n * SECONDS_PER_QUESTION[l][1] };
    },
    { low: 0, high: 0 }
  );
}

export const toMinutes = (sec) => Math.round(sec / 60);

export function emptyConfig() {
  const studyLevel = 'Undergraduate Y1';
  return {
    moduleName: '',
    studyLevel,
    outcomes: [{ text: '', level: 'Understand' }],
    cases: [''],
    misconceptions: [
      { text: '', where: '' },
      { text: '', where: '' },
    ],
    questionCount: 20,
    distribution: defaultDistribution(studyLevel, 20),
    distributionReason: '',
    minutes: 40,
    weight: 25,
    formats: ['gift', 'blackboard'],
  };
}

export function validateConfig(c) {
  const e = {};
  if (!c.moduleName.trim()) e.moduleName = 'Give the module name and code.';
  if (!c.outcomes.some((o) => o.text.trim())) e.outcomes = 'Add at least one learning outcome.';
  if (!c.cases.some((x) => x.trim())) e.cases = 'List at least one case or example used in teaching.';
  if (c.misconceptions.filter((m) => m.text.trim()).length < 2) e.misconceptions = 'List at least two misconceptions.';
  const total = distributionTotal(c.distribution);
  if (total !== c.questionCount) e.distribution = `The distribution adds up to ${total}. It needs to total ${c.questionCount}.`;
  const custom = !sameDistribution(c.distribution, defaultDistribution(c.studyLevel, c.questionCount));
  if (custom && !c.distributionReason.trim()) e.distributionReason = 'You changed the default, so give the reason.';
  if (!(Number(c.minutes) > 0)) e.minutes = 'Enter the time available in minutes.';
  if (!(Number(c.weight) >= 1 && Number(c.weight) <= 100)) e.weight = 'Enter a share between 1 and 100.';
  if (!c.formats.length) e.formats = 'Choose at least one export format.';
  return e;
}

export const outcomeList = (c) => c.outcomes.filter((o) => o.text.trim());
export const caseList = (c) => c.cases.map((x) => x.trim()).filter(Boolean);
export const misconceptionList = (c) => c.misconceptions.filter((m) => m.text.trim());

/** Part B as Markdown, mirroring the Specification Template. */
export function buildPartB(c, contentSource = '') {
  const lines = [];
  const outs = outcomeList(c);
  const mis = misconceptionList(c);
  const custom = !sameDistribution(c.distribution, defaultDistribution(c.studyLevel, c.questionCount));

  lines.push('## Part B — Your module', '');
  lines.push('### B1. Module and outcomes', '');
  lines.push(`- Module: ${c.moduleName.trim()}`);
  lines.push(`- Level of study: ${c.studyLevel}`);
  lines.push('- Learning outcomes, each with the level it targets:', '');
  lines.push('| Code | Outcome | Target level |', '| --- | --- | --- |');
  outs.forEach((o, i) => lines.push(`| LO${i + 1} | ${o.text.trim()} | ${o.level} |`));
  lines.push('');

  lines.push('### B2. What was taught', '');
  lines.push(`- Content source: ${contentSource || 'teaching content supplied with this specification'}`);
  lines.push('- Cases, examples and data used in teaching. Higher-order questions must not reuse these:', '');
  caseList(c).forEach((x) => lines.push(`  - ${x}`));
  lines.push('', 'Anything not on this list counts as unseen.', '');

  lines.push('### B3. What students get wrong', '');
  lines.push('| Code | Misconception | Where you see it |', '| --- | --- | --- |');
  mis.forEach((m, i) => lines.push(`| M${i + 1} | ${m.text.trim()} | ${m.where.trim() || '—'} |`));
  lines.push('');

  lines.push('### B4. Distribution', '');
  const counts = LEVELS.map((l) => `${l} ${c.distribution[l]}`).join(', ');
  lines.push(
    custom
      ? `- My distribution: ${counts}. Lower order ${lowerOrderShare(c.distribution)}%. Changed from the default because: ${c.distributionReason.trim()}`
      : `- My distribution: default for ${c.studyLevel}. ${counts}. Lower order ${lowerOrderShare(c.distribution)}%. No change.`
  );
  lines.push('');

  lines.push('### B5. Length, timing and weight', '');
  lines.push(`- Number of questions: ${c.questionCount}`);
  lines.push(`- Time available: ${c.minutes} minutes`);
  lines.push(`- Share of the module grade: ${c.weight}%`, '');

  lines.push('### B6. Output', '');
  const fmts = EXPORT_FORMATS.filter((f) => c.formats.includes(f.id)).map((f) => f.label);
  lines.push(`- Export formats: ${fmts.join(' and ')}`);
  lines.push('- Review: every question is reviewed by me against A5 before import');

  return lines.join('\n');
}

/** The full specification: Part A as loaded (or edited) plus Part B from the form. */
export function buildSpecification(houseRules, c, contentSource) {
  return [`# ${c.moduleName.trim() || 'Untitled module'} — Specification`, '', houseRules.trim(), '', buildPartB(c, contentSource)].join('\n');
}

const CONFIG_MARKER = 'qtc-config';

/** The downloadable specification: readable Markdown, with the form data tucked in a comment so it re-imports exactly. */
export function specFileText(houseRules, c, contentSource) {
  const data = JSON.stringify({ version: 1, config: c, houseRules });
  return `${buildSpecification(houseRules, c, contentSource)}\n\n<!-- ${CONFIG_MARKER}\n${data.replace(/--/g, '\\u002d\\u002d')}\n-->\n`;
}

export function parseSpecFile(text) {
  const m = text.match(new RegExp(`<!-- ${CONFIG_MARKER}\\n([\\s\\S]*?)\\n-->`));
  if (!m) {
    throw new Error(
      'This file has no set-up data in it. Import a specification that was downloaded from this app.'
    );
  }
  const parsed = JSON.parse(m[1]);
  const base = emptyConfig();
  const config = { ...base, ...parsed.config };
  config.distribution = { ...base.distribution, ...(parsed.config?.distribution || {}) };
  return { config, houseRules: parsed.houseRules || null };
}

export function slug(s) {
  return (s || 'module')
    .replace(/[^a-z0-9]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60) || 'module';
}

/** "28–36" or just "2" when both ends round the same. */
export function minuteRange(low, high) {
  const a = toMinutes(low);
  const b = toMinutes(high);
  return a === b ? `${a}` : `${a}–${b}`;
}
