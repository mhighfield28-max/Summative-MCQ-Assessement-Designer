import React, { useState, useRef } from 'react';

const MIN_LO_WORDS  = 20;
const MIN_SYL_WORDS = 30;

function wordCount(str) {
  return str.trim().split(/\s+/).filter(Boolean).length;
}

export default function Step2Input({ content, onNext, onBack }) {
  const [learningObjectives, setLO] = useState(content.learningObjectives || '');
  const [syllabusContent,    setSyl] = useState(content.syllabusContent    || '');
  const [errors, setErrors] = useState({});
  const loFileRef  = useRef();
  const sylFileRef = useRef();

  const readFile = (file, setter) => {
    const reader = new FileReader();
    reader.onload = (e) => setter((prev) => prev ? prev + '\n\n' + e.target.result : e.target.result);
    reader.readAsText(file);
  };

  const handleFile = (e, setter) => {
    const file = e.target.files[0];
    if (!file) return;
    readFile(file, setter);
    e.target.value = '';
  };

  const validate = () => {
    const e = {};
    if (wordCount(learningObjectives) < MIN_LO_WORDS)
      e.lo = `Please provide more detail (at least ${MIN_LO_WORDS} words). Currently: ${wordCount(learningObjectives)} words.`;
    if (wordCount(syllabusContent) < MIN_SYL_WORDS)
      e.syl = `Please provide more content (at least ${MIN_SYL_WORDS} words). Currently: ${wordCount(syllabusContent)} words.`;
    return e;
  };

  const handleNext = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onNext({ learningObjectives, syllabusContent });
  };

  return (
    <div>
      <div className="card">
        <h2 className="card-title">Course Content</h2>
        <p className="card-subtitle">
          Provide your learning objectives and course syllabus. You can paste text directly or upload a .txt file.
          For PDFs and Word documents, copy and paste the relevant sections below.
        </p>

        <div className="notice info">
          <span className="notice-icon">💡</span>
          <span>
            The more detail you provide, the more accurate and specific the generated questions will be.
            Include all learning outcomes, key topics, theories, and concepts students are expected to know.
          </span>
        </div>

        {/* Learning Objectives */}
        <div className="form-group">
          <label className="form-label" htmlFor="lo">
            Learning Objectives / Intended Learning Outcomes (ILOs)
          </label>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span className="form-hint" style={{ marginBottom: 0 }}>
              List each objective on a new line. Include action verbs (e.g. "Students will be able to analyse…").
            </span>
            <button
              className="btn btn-secondary"
              style={{ padding: '4px 10px', fontSize: '0.78rem' }}
              onClick={() => loFileRef.current.click()}
            >
              📂 Upload .txt
            </button>
          </div>
          <input
            ref={loFileRef}
            type="file"
            accept=".txt"
            style={{ display: 'none' }}
            onChange={(e) => handleFile(e, setLO)}
          />
          <textarea
            id="lo"
            className="form-textarea"
            style={{ minHeight: 160 }}
            placeholder={
`Example:
1. Students will be able to identify the key principles of marketing strategy.
2. Students will be able to compare and contrast B2B and B2C market environments.
3. Students will be able to apply the marketing mix framework to real-world case studies.
4. Students will be able to evaluate marketing campaign effectiveness using data.`}
            value={learningObjectives}
            onChange={(e) => { setLO(e.target.value); setErrors((err) => ({ ...err, lo: undefined })); }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 4 }}>
            {errors.lo
              ? <p style={{ color: 'var(--red)', fontSize: '0.8rem' }}>{errors.lo}</p>
              : <span />
            }
            <span className="form-hint">
              {wordCount(learningObjectives)} words
            </span>
          </div>
        </div>

        <div className="section-divider" />

        {/* Syllabus Content */}
        <div className="form-group">
          <label className="form-label" htmlFor="syl">
            Syllabus / Course Content
          </label>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span className="form-hint" style={{ marginBottom: 0 }}>
              Paste your syllabus, lecture notes summary, or topic outline. The richer the content, the better the questions.
            </span>
            <button
              className="btn btn-secondary"
              style={{ padding: '4px 10px', fontSize: '0.78rem' }}
              onClick={() => sylFileRef.current.click()}
            >
              📂 Upload .txt
            </button>
          </div>
          <input
            ref={sylFileRef}
            type="file"
            accept=".txt"
            style={{ display: 'none' }}
            onChange={(e) => handleFile(e, setSyl)}
          />
          <textarea
            id="syl"
            className="form-textarea"
            style={{ minHeight: 200 }}
            placeholder={
`Example:
Week 1: Introduction to Marketing — definitions, evolution of marketing concept, market orientation
Week 2: The Marketing Environment — PESTLE analysis, Porter's Five Forces, competitive landscape
Week 3: Consumer Behaviour — decision-making process, psychological influences, cultural factors
Week 4: Segmentation, Targeting and Positioning (STP) — bases for segmentation, targeting strategies
Week 5: The Marketing Mix (4Ps) — product, price, place, promotion decisions and trade-offs
...`}
            value={syllabusContent}
            onChange={(e) => { setSyl(e.target.value); setErrors((err) => ({ ...err, syl: undefined })); }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 4 }}>
            {errors.syl
              ? <p style={{ color: 'var(--red)', fontSize: '0.8rem' }}>{errors.syl}</p>
              : <span />
            }
            <span className="form-hint">
              {wordCount(syllabusContent)} words
            </span>
          </div>
        </div>

        <div className="notice warning">
          <span className="notice-icon">⚠️</span>
          <span>
            <strong>Assessment coverage:</strong> Only assess content that has been taught and is included in the
            syllabus. Questions outside the stated learning objectives may be challenged by students and reviewers
            (UK Quality Code for Higher Education — QAA).
          </span>
        </div>
      </div>

      <div className="btn-row">
        <button className="btn btn-secondary" onClick={onBack}>← Back</button>
        <button className="btn btn-primary" onClick={handleNext}>
          Generate Questions →
        </button>
      </div>
    </div>
  );
}
