import React, { useState } from 'react';
import { generateRespondusFormat, downloadRespondusFile, downloadReviewSheet } from '../utils/respondusExport';
import { BLOOMS_COLORS } from '../utils/bloomsDistribution';

export default function Step5Export({ questions, config, onBack, onRestart }) {
  const [downloaded, setDownloaded] = useState(false);

  const preview  = generateRespondusFormat(questions, config);
  const lowerOrder  = questions.filter((q) => ['Remember', 'Understand'].includes(q.bloomsLevel)).length;
  const higherOrder = questions.length - lowerOrder;

  const handleDownload = () => {
    downloadRespondusFile(questions, config);
    setDownloaded(true);
  };

  const handleReview = () => {
    downloadReviewSheet(questions, config);
  };

  // Counts by level
  const counts = {};
  questions.forEach((q) => {
    counts[q.bloomsLevel] = (counts[q.bloomsLevel] || 0) + 1;
  });

  return (
    <div>
      <div className="card">
        <h2 className="card-title">Export Assessment</h2>
        <p className="card-subtitle">
          Your questions are ready. Download the Respondus plain text file and import it via the
          Newcastle Blackboard Quiz Creator.
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
            <div className="export-stat-val">{Math.round((higherOrder / questions.length) * 100)}%</div>
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

        {/* QAA reminder */}
        {config.assessmentWeight > 30 && (
          <div className="notice warning" style={{ marginBottom: 20 }}>
            <span className="notice-icon">⚠️</span>
            <span>
              <strong>Reminder:</strong> This assessment is weighted at {config.assessmentWeight}% of the
              overall module grade, which exceeds the recommended 30% ceiling for MCQ assessments
              (Franke, 2018). Ensure complementary assessment methods are documented in your assessment plan.
            </span>
          </div>
        )}

        {/* File preview */}
        <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
          Respondus Plain Text Preview
        </p>
        <div className="export-preview">{preview.slice(0, 1200)}{preview.length > 1200 ? '\n\n… (truncated for preview — full file on download)' : ''}</div>

        {/* Download buttons */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
          <button className="btn btn-gold" onClick={handleDownload}>
            ⬇️ Download Respondus .txt
          </button>
          <button className="btn btn-secondary" onClick={handleReview}>
            📋 Download Review Sheet
          </button>
        </div>

        {downloaded && (
          <div className="notice info" style={{ marginBottom: 20 }}>
            <span className="notice-icon">✅</span>
            <span>File downloaded. Follow the import steps below to add questions to your Blackboard course.</span>
          </div>
        )}

        <div className="section-divider" />

        {/* Import instructions */}
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--navy)', marginBottom: 12 }}>
          How to Import into Blackboard
        </h3>

        <ol style={{ paddingLeft: 20, fontSize: '0.875rem', lineHeight: 2, color: 'var(--text)' }}>
          <li>
            Go to the{' '}
            <a
              href="https://teaching.ncl.ac.uk/bms/bb/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--navy)', fontWeight: 600 }}
            >
              Newcastle Blackboard Quiz Creator
            </a>{' '}
            (teaching.ncl.ac.uk/bms/bb/)
          </li>
          <li>Upload your downloaded <code>.txt</code> file</li>
          <li>The tool will generate a Blackboard-ready <code>.zip</code> package</li>
          <li>In your Blackboard course, go to <strong>Course Tools → Tests, Surveys and Pools</strong></li>
          <li>Select <strong>Pools → Import Pool</strong> and upload the <code>.zip</code></li>
          <li>Create a new Test and pull questions from your imported pool</li>
          <li>Set time limit, attempts, and display settings in the Test Options</li>
        </ol>

        <div className="notice info" style={{ marginTop: 20 }}>
          <span className="notice-icon">📚</span>
          <span style={{ fontSize: '0.82rem' }}>
            <strong>References:</strong> Carneson et al. (1996); Anderson et al. (2001) — Bloom's Revised Taxonomy;
            Franke (2018) — Final Exam Weighting; QAA UK Quality Code for Higher Education (Assessment).
            Questions generated in line with UCD MCQ Design Guide (CC-BY).
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
