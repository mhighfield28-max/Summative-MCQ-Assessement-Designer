import React, { useState } from 'react';
import { BLOOMS_COLORS } from '../utils/bloomsDistribution';

/**
 * Generates Blackboard tab-separated upload format.
 * Format per row:
 * MC [TAB] Question stem [TAB] Option A [TAB] correct/incorrect [TAB] Option B [TAB] incorrect ...
 */
function generateBlackboardFormat(questions) {
  const lines = questions.map((q) => {
    const parts = ['MC', q.stem];
    q.options.forEach((opt, i) => {
      parts.push(opt);
      parts.push(i === q.correctIndex ? 'correct' : 'incorrect');
    });
    return parts.join('\t');
  });
  return lines.join('\n');
}

function downloadBlackboardFile(questions, config) {
  const content = generateBlackboardFormat(questions);
  const safeName = config.moduleName
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/_+/g, '_')
    .toLowerCase();
  const filename = `${safeName}_blackboard_upload.txt`;
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadReviewSheet(questions, config) {
  const letters = ['a', 'b', 'c', 'd', 'e'];
  let output = '';
  output += `QUESTION REVIEW SHEET\n`;
  output += `${'='.repeat(60)}\n`;
  output += `Module: ${config.moduleName}\n`;
  output += `Academic Level: ${config.academicLevel}\n`;
  output += `Assessment Weight: ${config.assessmentWeight}%\n`;
  output += `Questions: ${questions.length} | Time: ${config.minutes} min\n`;
  output += `${'='.repeat(60)}\n\n`;
  questions.forEach((q, index) => {
    output += `Q${index + 1}. [${q.bloomsLevel.toUpperCase()}] ${q.stem}\n`;
    q.options.forEach((option, i) => {
      const marker = i === q.correctIndex ? '✓' : ' ';
      output += `   ${marker} ${letters[i]}. ${option}\n`;
    });
    output += `   LO: ${q.learningObjectiveRef}\n`;
    output += `   Explanation: ${q.explanation}\n\n`;
  });
  const safeName = config.moduleName
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/_+/g, '_')
    .toLowerCase();
  const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeName}_review_sheet.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function Step5Export({ questions, config, onBack, onRestart }) {
  const [downloaded, setDownloaded] = useState(false);

  const lowerOrder = questions.filter((q) =>
    ['Remember', 'Understand'].includes(q.bloomsLevel)
  ).length;
  const higherOrder = questions.length - lowerOrder;

  const counts = {};
  questions.forEach((q) => {
    counts[q.bloomsLevel] = (counts[q.bloomsLevel] || 0) + 1;
  });

  const previewLines = generateBlackboardFormat(questions)
    .split('\n')
    .slice(0, 5)
    .map((line) => {
      const parts = line.split('\t');
      return parts[0] + '\t' + parts[1] + '\t[options...]';
    })
    .join('\n');

  const handleDownload = () => {
    downloadBlackboardFile(questions, config);
    setDownloaded(true);
  };

  return (
    <div>
      <div className="card">
        <h2 className="card-title">Export to Blackboard</h2>
        <p className="card-subtitle">
          Download your questions as a Blackboard-ready upload file. Import it directly
          into a Blackboard Test or Question Pool in your course.
        </p>

        {/* Stats */}
        <div className="export-grid">
          <div className="export-stat">
            <div className="export-stat-val">{questions.length}</div>
            <div className="export-stat-label">Questions</div>
          </div>
          <div className="export-stat">
            <div className="export-stat-val">{config.minutes} min</div>
            <div className="export-stat-label">Duration</div>
          </div>
          <div className="export-stat">
            <div className="export-stat-val">{config.assessmentWeight}%</div>
            <div className="export-stat-label">Module Grade Weight</div>
          </div>
          <div className="export-stat">
            <div className="export-stat-val">
              {Math.round((higherOrder / questions.length) * 100)}%
            </div>
            <div className="export-stat-label">Higher-Order Questions</div>
          </div>
        </div>

        {/* Bloom's breakdown */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
            Bloom's Distribution
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Object.entries(counts).map(([level, count]) => (
              <span
                key={level}
                className="blooms-badge"
                style={{
                  background: BLOOMS_COLORS[level] + '18',
                  color: BLOOMS_COLORS[level],
                  border: `1px solid ${BLOOMS_COLORS[level]}44`,
                  fontSize: '0.8rem',
                  padding: '5px 12px',
                }}
              >
                {count}× {level}
              </span>
            ))}
          </div>
        </div>

        {/* QAA warning */}
        {config.assessmentWeight > 30 && (
          <div className="notice warning" style={{ marginBottom: 20 }}>
            <span className="notice-icon">⚠️</span>
            <span>
              <strong>Reminder:</strong> This assessment is weighted at {config.assessmentWeight}%
              of the overall module grade, which exceeds the recommended 30% ceiling for MCQ
              assessments (Franke, 2018). Ensure complementary assessment methods are in place.
            </span>
          </div>
        )}

        {/* Format explanation */}
        <div className="notice info" style={{ marginBottom: 20 }}>
          <span className="notice-icon">ℹ️</span>
          <span>
            The download is a <strong>tab-separated .txt file</strong> in Blackboard's native
            upload format. Each row contains the question type, stem, and answer options with
            correct/incorrect labels — ready to upload directly into Blackboard.
          </span>
        </div>

        {/* Preview */}
        <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
          File Preview (first 5 questions)
        </p>
        <div className="export-preview">{previewLines}</div>

        {/* Download buttons */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
          <button className="btn btn-gold" onClick={handleDownload}>
            ⬇️ Download Blackboard Upload File
          </button>
          <button className="btn btn-secondary" onClick={() => downloadReviewSheet(questions, config)}>
            📋 Download Review Sheet
          </button>
        </div>

        {downloaded && (
          <div className="notice info" style={{ marginBottom: 20 }}>
            <span className="notice-icon">✅</span>
            <span>File downloaded. Follow the steps below to upload into Blackboard.</span>
          </div>
        )}

        <div className="section-divider" />

        {/* Import instructions */}
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--navy)', marginBottom: 16 }}>
          How to Upload into Blackboard
        </h3>

        <ol style={{ paddingLeft: 20, fontSize: '0.875rem', lineHeight: 2.2, color: 'var(--text)' }}>
          <li>In your Blackboard course, go to <strong>Course Tools → Tests, Surveys and Pools</strong></li>
          <li>Select <strong>Pools</strong> → click <strong>Build Pool</strong> and give it a name</li>
          <li>Inside the pool, click <strong>Upload Questions</strong></li>
          <li>Select your downloaded <code>.txt</code> file and click <strong>Submit</strong></li>
          <li>Blackboard will import all questions — review them in the pool editor</li>
          <li>Go back to <strong>Tests</strong> → <strong>Build Test</strong></li>
          <li>Click <strong>Reuse Question → Find Questions</strong> and select from your pool</li>
          <li>Set time limit, display options and marks per question in <strong>Test Options</strong></li>
          <li>Deploy the test to your course content area and set availability dates</li>
        </ol>

        <div className="notice info" style={{ marginTop: 20 }}>
          <span className="notice-icon">📚</span>
          <span style={{ fontSize: '0.82rem' }}>
            <strong>References:</strong> Carneson et al. (1996); Anderson et al. (2001) — Bloom's
            Revised Taxonomy; Franke (2018) — Final Exam Weighting; QAA UK Quality Code for
            Higher Education (Assessment). Questions generated in line with UCD MCQ Design Guide (CC-BY).
          </span>
        </div>
      </div>

      <div className="btn-row">
        <button className="btn btn-secondary" onClick={onBack}>← Back to Review</button>
        <div className="btn-row-right">
          <button
            className="btn btn-secondary"
            onClick={onRestart}
            style={{ borderColor: 'var(--navy)', color: 'var(--navy)' }}
          >
            🔄 Start New Assessment
          </button>
        </div>
      </div>
    </div>
  );
}
