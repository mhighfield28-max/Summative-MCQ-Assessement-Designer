# Questions That Count

Bloom-aligned multiple choice question generator. Specification and teaching content in; reviewed, ready-to-import questions out.

Five steps: **Set up → Content → Generate → Review → Export**.

## How the specification works

- **Part A, the house rules**, lives in `public/spec/part-a-house-rules.md`. It is loaded when the app starts and is never written into the code. Change the file and the questions change.
- **Part B** is the Set up form: module, outcomes with target levels, taught cases (B2), misconceptions (B3), distribution (B4), length, time and weight (B5), export formats (B6).
- Every generation call sends Part A + Part B to Claude as its instructions, and the teaching content as source material.
- Set-ups can be downloaded as a `.md` specification and imported again.

## What the app enforces from Part A

- Five levels, Remember to Evaluate. No Create.
- Every question tagged with a level and a knowledge type (Factual, Conceptual, Procedural).
- Three or four options; every distractor records the misconception behind it.
- Default distributions per level of study (B4), scaled for 20/30/40 questions.
- Time allowances per level (B5), with a warning if the paper doesn't fit; a warning above 30% of the module grade.
- A5 checks run in code on every question and shown as pass/fail chips: tags, unseen case for higher order, one key, option count and length (1.5×), no all/none of the above or unmarked negatives, distractors linked. Set-level checks for distribution and time.
- Nothing is exported unless you approve it.

## Exports

One zip per set: Moodle GIFT (.txt), Blackboard tab-delimited (.txt), a review sheet (.html, print to PDF) and the specification used (.md).

## Files

| File | What it holds |
| --- | --- |
| `src/settings.js` | App name, model name, batch size |
| `src/theme.css` | Every colour and font (mikehighfield.ai brand by default) |
| `public/spec/part-a-house-rules.md` | Part A |
| `src/utils/spec.js` | Part B defaults, distribution, timing, specification text |
| `src/utils/checks.js` | A5 checks |
| `src/utils/anthropicClient.js` | Generation and regeneration |
| `src/utils/exporters.js` | GIFT, Blackboard, review sheet, zip |

## Running

```
npm install
npm start      # local
npm test       # rules tests against the worked example
```

Set `REACT_APP_ANTHROPIC_API_KEY` in `.env` locally or in Amplify → Environment variables, then redeploy.

**Note:** the API is still called from the browser, so the key is visible in the built JavaScript. Move the call into a Lambda function before sharing the address publicly (Build Brief Phase 5, Module 10).
