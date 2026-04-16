export const BLOOMS_DISTRIBUTION = {
  20: { Remember: 2, Understand: 4, Apply: 7, Analyse: 5, Evaluate: 2, Create: 0 },
  30: { Remember: 3, Understand: 6, Apply: 10, Analyse: 8, Evaluate: 3, Create: 0 },
  40: { Remember: 4, Understand: 8, Apply: 14, Analyse: 10, Evaluate: 4, Create: 0 },
};

export const BLOOMS_LEVELS = ['Remember', 'Understand', 'Apply', 'Analyse', 'Evaluate', 'Create'];

export const BLOOMS_ORDER = {
  Remember: 'lower',
  Understand: 'lower',
  Apply: 'higher',
  Analyse: 'higher',
  Evaluate: 'higher',
  Create: 'higher',
};

export const BLOOMS_COLORS = {
  Remember:   '#e85d4a',
  Understand: '#f0965a',
  Apply:      '#e8c84a',
  Analyse:    '#4aab6d',
  Evaluate:   '#4a8fe8',
  Create:     '#9b5de5',
};

export const BLOOMS_VERBS = {
  Remember:   ['define', 'list', 'recall', 'identify', 'name', 'match', 'label', 'recognise'],
  Understand: ['explain', 'describe', 'interpret', 'classify', 'summarise', 'predict', 'compare'],
  Apply:      ['apply', 'demonstrate', 'calculate', 'use', 'solve', 'show', 'construct', 'relate'],
  Analyse:    ['analyse', 'differentiate', 'examine', 'compare', 'categorise', 'infer', 'distinguish'],
  Evaluate:   ['evaluate', 'judge', 'justify', 'appraise', 'assess', 'rank', 'recommend', 'critique'],
  Create:     ['design', 'formulate', 'construct', 'compose', 'plan', 'develop', 'produce', 'integrate'],
};

export const ACADEMIC_LEVELS = [
  'Undergraduate Year 1',
  'Undergraduate Year 2',
  'Undergraduate Year 3',
  "Master's Degree",
  'Doctoral Degree',
  'Adult Learning',
];

export const QUESTION_SETS = [
  { questions: 20, minutes: 30, label: '20 questions · 30 minutes' },
  { questions: 30, minutes: 45, label: '30 questions · 45 minutes' },
  { questions: 40, minutes: 60, label: '40 questions · 60 minutes' },
];
