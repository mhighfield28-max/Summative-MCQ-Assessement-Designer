import { BLOOMS_DISTRIBUTION } from './bloomsDistribution';

export async function generateMCQs({ learningObjectives, syllabusContent, config }) {
  const apiKey = process.env.REACT_APP_ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error(
      'API key not configured. Set REACT_APP_ANTHROPIC_API_KEY in your .env file (local) or Amplify environment variables.'
    );
  }

  const distribution = BLOOMS_DISTRIBUTION[config.questionCount];
  const distributionText = Object.entries(distribution)
    .filter(([, count]) => count > 0)
    .map(([level, count]) => `- ${level}: ${count} question${count !== 1 ? 's' : ''}`)
    .join('\n');

  const optionCount = config.distractorCount + 1;
  const optionLetters = ['A', 'B', 'C', 'D', 'E'].slice(0, optionCount);

  const prompt = `You are an expert in higher education assessment design, specialising in Bloom's Taxonomy and multiple choice question (MCQ) design for ${config.academicLevel} level courses.

Generate exactly ${config.questionCount} MCQs for the following course. Each question must strictly follow best practices from the literature (Carneson et al., 1996; Anderson et al., 2001).

---
MODULE: ${config.moduleName}
ACADEMIC LEVEL: ${config.academicLevel}
ASSESSMENT WEIGHT: ${config.assessmentWeight}% of overall grade
OPTIONS PER QUESTION: ${optionCount} (${config.distractorCount} distractors + 1 correct answer)

LEARNING OBJECTIVES:
${learningObjectives}

COURSE CONTENT / SYLLABUS:
${syllabusContent}

REQUIRED BLOOM'S TAXONOMY DISTRIBUTION:
${distributionText}

---
MCQ DESIGN RULES (follow strictly):
1. Each question addresses exactly one learning objective
2. The question stem contains the full context — distractors should be brief
3. All ${config.distractorCount} distractors are plausible to less knowledgeable students
4. No negative constructs ("which is NOT...")
5. No "all/none of the above" options
6. Vary the position of the correct answer across questions
7. Options are grammatically parallel and similar in length
8. Questions progress from simpler (Remember/Understand) to more complex (Apply/Analyse/Evaluate)
9. Questions are independent — no answer provides context for another
10. Language complexity matches ${config.academicLevel} level

---
Return ONLY a valid JSON array — no preamble, no markdown fences, no explanation. Use this exact schema:

[
  {
    "id": 1,
    "bloomsLevel": "Remember",
    "learningObjectiveRef": "Brief reference to which LO this addresses",
    "stem": "Full question stem here?",
    "options": ${JSON.stringify(optionLetters.map((l) => `Option ${l} text here`))},
    "correctIndex": 0,
    "explanation": "Why the correct answer is right, and why each distractor is wrong."
  }
]

Generate all ${config.questionCount} questions. correctIndex is 0-based (0 = first option). Distribute questions across Bloom's levels exactly as specified.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
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
  const raw = data.content[0].text.trim();

  // Strip markdown fences if the model wraps output despite instructions
  const clean = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(clean);
  } catch (e) {
    throw new Error('Failed to parse generated questions. Please try again.');
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('Generated output was not a valid question array. Please try again.');
  }

  return parsed;
}

export async function regenerateSingleQuestion({ question, config, learningObjectives, syllabusContent }) {
  const apiKey = process.env.REACT_APP_ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('API key not configured.');

  const optionCount = config.distractorCount + 1;

  const prompt = `Generate a single replacement MCQ at the ${question.bloomsLevel} level of Bloom's Taxonomy for a ${config.academicLevel} course.

MODULE: ${config.moduleName}
LEARNING OBJECTIVES: ${learningObjectives}
COURSE CONTENT: ${syllabusContent}

The question that needs replacing addressed: "${question.learningObjectiveRef}"

Return ONLY a JSON object (no array, no markdown) matching this exact schema:
{
  "id": ${question.id},
  "bloomsLevel": "${question.bloomsLevel}",
  "learningObjectiveRef": "...",
  "stem": "...",
  "options": ${JSON.stringify(Array(optionCount).fill('option text'))},
  "correctIndex": 0,
  "explanation": "..."
}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const data = await response.json();
  const raw = data.content[0].text.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  return JSON.parse(raw);
}
