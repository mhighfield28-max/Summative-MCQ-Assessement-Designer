// Checks the Part A logic against the Worked Example Specification (GEOG1102).
import { defaultDistribution, distributionTotal, estimateSeconds, emptyConfig, specFileText, parseSpecFile, QUESTION_COUNTS, STUDY_LEVELS } from './spec';
import { runChecks, withChecks, setChecks, keyBalance } from './checks';
import { toGift, toBlackboard, giftEscape } from './exporters';
import { normalise, shapeProblems } from './anthropicClient';

const config = {
  ...emptyConfig(),
  moduleName: 'GEOG1102 Mountain Environments',
  cases: [
    'A walker boiling water in a pan on a mountain summit (lecture 3)',
    "Sea-level air pressure of about 1,013 hPa, and Everest's summit at about a third of that",
    'Boiling point falling by roughly 1 °C for every 300 m of ascent',
    'The environmental lapse rate of about 6.5 °C per 1,000 m',
    'Ben Nevis summit temperatures compared with Fort William at sea level',
    'Cooking rice in a high Andean town (seminar 4)',
  ],
  outcomes: [
    { text: 'Apply the link between air pressure and boiling point to unfamiliar situations', level: 'Apply' },
  ],
  misconceptions: [
    { text: '100 °C is a fixed property of water', where: 'Exam answers, every year' },
    { text: 'Water boils at a lower temperature because the air is colder', where: 'Seminar questions' },
  ],
  minutes: 40,
};

const sample1 = {
  id: 'q01', status: 'draft', level: 'Apply', knowledgeType: 'Conceptual', outcome: 'LO3',
  stem: 'A pressure cooker seals in steam and raises the pressure inside the pot. What happens to the temperature at which the water boils?',
  options: [
    { label: 'A', text: 'It rises above 100 °C', isKey: true },
    { label: 'B', text: 'It stays at 100 °C', isKey: false, misconception: 'M1' },
    { label: 'C', text: 'It falls below 100 °C', isKey: false, misconception: 'Common error — knows pressure matters, not which way' },
  ],
};
const sample2 = {
  id: 'q02', status: 'draft', level: 'Analyse', knowledgeType: 'Conceptual', outcome: 'LO4',
  stem: 'A walker records the boiling point of water at four camps: sea level, 100 °C; 1,500 m, 95 °C; 3,000 m, 90 °C; 4,500 m, 92 °C. Which reading is most likely a measurement error?',
  options: [
    { label: 'A', text: '1,500 m: 95 °C', isKey: false, misconception: 'M4' },
    { label: 'B', text: '3,000 m: 90 °C', isKey: false, misconception: 'Common error — picks the most extreme drop' },
    { label: 'C', text: '4,500 m: 92 °C', isKey: true },
  ],
};
const sample3 = {
  id: 'q03', status: 'draft', level: 'Evaluate', knowledgeType: 'Conceptual', outcome: 'LO5',
  stem: 'Two students explain why pasta takes longer to cook at the highest camp. The first says the water boils at a lower temperature, so the pasta cooks more slowly. The second says the air is colder, so the water takes longer to boil. Which judgement is best?',
  options: [
    { label: 'A', text: 'Only the first is correct', isKey: true },
    { label: 'B', text: 'Only the second is correct', isKey: false, misconception: 'M2 and M5' },
    { label: 'C', text: 'Both of them are correct', isKey: false, misconception: 'M5' },
    { label: 'D', text: 'Neither of them is correct', isKey: false, misconception: 'M3' },
  ],
};

const allPass = (r) => Object.entries(r).filter(([, v]) => !v.pass).map(([k, v]) => `${k}: ${v.reason}`);

test('worked example samples pass every A5 check', () => {
  [sample1, sample2, sample3].forEach((q) => expect(allPass(runChecks(q, config))).toEqual([]));
});

test('B4 defaults: per-20 table and scaled sets total exactly', () => {
  expect(defaultDistribution('Undergraduate Y1', 20)).toEqual({ Remember: 3, Understand: 5, Apply: 7, Analyse: 4, Evaluate: 1 });
  expect(defaultDistribution("Master's", 40)).toEqual({ Remember: 2, Understand: 4, Apply: 10, Analyse: 14, Evaluate: 10 });
  STUDY_LEVELS.forEach((l) => QUESTION_COUNTS.forEach((n) => expect(distributionTotal(defaultDistribution(l, n))).toBe(n)));
});

test('B5 timing matches the worked example', () => {
  expect(estimateSeconds(defaultDistribution('Undergraduate Y1', 20))).toEqual({ low: 1665, high: 2175 });
});

test('catches what Part A forbids', () => {
  const bad = {
    ...sample1,
    level: 'Apply',
    stem: 'Which of these is not true of a walker boiling water in a pan on a mountain summit?',
    options: [
      { label: 'A', text: 'All of the above', isKey: true },
      { label: 'B', text: 'It boils at exactly one hundred degrees every single time without fail', isKey: true },
      { label: 'C', text: 'Lower', isKey: false },
    ],
  };
  const r = runChecks(bad, config);
  expect(r.newCase.pass).toBe(false);
  expect(r.oneKey.pass).toBe(false);
  expect(r.optionLength.pass).toBe(false);
  expect(r.noBannedForms.pass).toBe(false);
  expect(r.distractorsLinked.pass).toBe(false);
  expect(runChecks({ ...sample1, stem: 'Which is NOT a cause?' }, config).noBannedForms.pass).toBe(true);
  expect(runChecks({ ...sample1, level: 'Create' }, config).tags.pass).toBe(false);
  expect(runChecks({ ...sample1, knowledgeType: '' }, config).tags.pass).toBe(false);
});

test('set checks and key balance', () => {
  const qs = [sample1, sample2, sample3].map((q) => withChecks(q, config));
  const s = setChecks(qs, config);
  expect(s.distribution.pass).toBe(false);
  expect(s.time.pass).toBe(true);
  expect(keyBalance(qs)).toEqual({ A: 2, B: 0, C: 1, D: 0 });
});

test('GIFT escapes special characters; Blackboard is one tab-delimited line per question', () => {
  expect(giftEscape('a: {b} = ~c #d \\ e')).toBe('a\\: \\{b\\} \\= \\~c \\#d \\\\ e');
  const q = { ...sample2, stem: 'Ratio 1:2 {approx} at 100 °C = "boiling"?' };
  const gift = toGift([q], config);
  expect(gift).toContain('::Q01 Analyse::Ratio 1\\:2 \\{approx\\} at 100 °C \\= "boiling"? {');
  expect(gift).toContain('  =4,500 m\\: 92 °C');
  expect(gift).toContain('  ~1,500 m\\: 95 °C');
  const bb = toBlackboard([sample1, { ...sample3, stem: 'Line one\nline\ttwo' }]).split('\n');
  expect(bb).toHaveLength(2);
  expect(bb[0].split('\t')).toEqual(['MC', sample1.stem, 'It rises above 100 °C', 'correct', 'It stays at 100 °C', 'incorrect', 'It falls below 100 °C', 'incorrect']);
  expect(bb[1].split('\t')[1]).toBe('Line one line two');
});

test('specification file round-trips', () => {
  const text = specFileText('## Part A — House rules\n\nRule -- with dashes', config, 'week3.txt');
  expect(text).toContain('| M1 |');
  const back = parseSpecFile(text);
  expect(back.config).toEqual(config);
  expect(back.houseRules).toBe('## Part A — House rules\n\nRule -- with dashes');
});

test('AI replies are shape-checked and normalised to the data model', () => {
  expect(shapeProblems({ stem: '', options: [] })).toEqual(expect.arrayContaining(['missing stem', 'missing options']));
  const q = normalise({ ...sample2, options: sample2.options.map(({ label, ...o }) => o) }, 'q09', config);
  expect(q.id).toBe('q09');
  expect(q.options.map((o) => o.label)).toEqual(['A', 'B', 'C']);
  expect(q.options[2].misconception).toBeUndefined();
  expect(q.checks).toEqual({ tags: true, newCase: true, oneKey: true, optionLength: true, noBannedForms: true, distractorsLinked: true });
});
