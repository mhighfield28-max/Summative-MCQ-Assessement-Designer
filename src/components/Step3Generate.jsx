import React, { useEffect, useState } from 'react';
import { generateMCQs } from '../utils/anthropicClient';
import { BLOOMS_DISTRIBUTION, BLOOMS_COLORS } from '../utils/bloomsDistribution';

const STAGES = [
  'Analysing learning objectives…',
  'Mapping content to Bloom\'s Taxonomy…',
  'Drafting higher-order questions…',
  'Refining distractors…',
  'Applying QAA best practices…',
  'Finalising question set…',
];

export default function Step3Generate({ config, content, onDone, onBack }) {
  const [stage,    setStage]   = useState(0);
  const [error,    setError]   = useState(null);
  const [retrying, setRetrying] = useState(false);

  const distribution = BLOOMS_DISTRIBUTION[config.questionCount];

  const run = async () => {
    setError(null);
    setRetrying(false);
    setStage(0);

    // Cycle through stage messages while waiting
    const interval = setInterval(() => {
      setStage((s) => (s < STAGES.length - 1 ? s + 1 : s));
    }, 3500);

    try {
      const questions = await generateMCQs({ learningObjectives: content.learningObjectives, syllabusContent: content.syllabusContent, config });
      clearInterval(interval);
      onDone(questions);
    } catch (err) {
      clearInterval(interval);
      setError(err.message || 'An unexpected error occurred.');
    }
  };

  useEffect(() => { run(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const handleRetry = () => { setRetrying(true); run(); };

  return (
    <div className="card">
      {!error ? (
        <div className="generate-screen">
          <div className="generate-spinner" />
          <h2 className="generate-title">Generating your assessment…</h2>
          <p className="generate-sub">{STAGES[stage]}</p>

          <div className="generate-progress">
            <div className="generate-progress-bar" />
          </div>

          <div style={{ marginTop: 40, textAlign: 'left' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Target distribution — {config.questionCount} questions
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.entries(distribution)
                .filter(([, count]) => count > 0)
                .map(([level, count]) => (
                  <div key={level} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 80,
                      fontSize: '0.78rem',
                      color: 'var(--text-muted)',
                      fontWeight: 500,
                    }}>{level}</div>
                    <div style={{
                      flex: 1,
                      height: 8,
                      background: 'var(--cream-dark)',
                      borderRadius: 4,
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${(count / config.questionCount) * 100}%`,
                        height: '100%',
                        background: BLOOMS_COLORS[level],
                        borderRadius: 4,
                      }} />
                    </div>
                    <div style={{ width: 20, fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                      {count}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: '20px 0' }}>
          <h2 className="card-title" style={{ marginBottom: 8 }}>Generation failed</h2>
          <p className="card-subtitle">Something went wrong. Check the error below and try again.</p>

          <div className="error-box">
            <strong>Error:</strong> {error}
            {error.includes('API key') && (
              <p style={{ marginTop: 8 }}>
                Set <code>REACT_APP_ANTHROPIC_API_KEY</code> in your <code>.env</code> file (local) or
                in <strong>Amplify → App Settings → Environment Variables</strong>.
              </p>
            )}
          </div>

          <div className="btn-row">
            <button className="btn btn-secondary" onClick={onBack}>← Back to Content</button>
            <button className="btn btn-primary" onClick={handleRetry} disabled={retrying}>
              {retrying ? 'Retrying…' : '↺ Try Again'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
