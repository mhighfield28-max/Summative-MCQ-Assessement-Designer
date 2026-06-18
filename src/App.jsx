import React, { useState } from 'react';
import './App.css';
import StepIndicator from './components/StepIndicator';
import Step1Config   from './components/Step1Config';
import Step2Input    from './components/Step2Input';
import Step3Generate from './components/Step3Generate';
import Step4Preview  from './components/Step4Preview';
import Step5Export   from './components/Step5Export';
 
const DEFAULT_CONFIG = {
  moduleName:       '',
  academicLevel:    'Undergraduate Year 1',
  questionCount:    20,
  minutes:          30,
  assessmentWeight: 25,
  distractorCount:  4,
};
 
const DEFAULT_CONTENT = {
  learningObjectives: '',
  syllabusContent:    '',
};
 
/* Brand mark — a landing target: three rings, one point of impact. */
function TargetMark() {
  return (
    <svg viewBox="0 0 44 44" role="img" aria-label="mikehighfield.ai">
      <circle cx="22" cy="22" r="20" fill="none" stroke="rgba(245,242,236,0.28)" strokeWidth="1.5" />
      <circle cx="22" cy="22" r="13.5" fill="none" stroke="rgba(245,242,236,0.55)" strokeWidth="1.5" />
      <circle cx="22" cy="22" r="7.5" fill="none" stroke="#f5f2ec" strokeWidth="2" />
      <circle cx="22" cy="22" r="3.4" fill="#e09830" />
    </svg>
  );
}
 
export default function App() {
  const [step,      setStep]      = useState(1);
  const [config,    setConfig]    = useState(DEFAULT_CONFIG);
  const [content,   setContent]   = useState(DEFAULT_CONTENT);
  const [questions, setQuestions] = useState([]);
 
  const handleConfig  = (cfg) => { setConfig(cfg);     setStep(2); };
  const handleContent = (cnt) => { setContent(cnt);    setStep(3); };
  const handleGenDone = (qs)  => { setQuestions(qs);   setStep(4); };
  const handleRestart = ()    => {
    setStep(1);
    setConfig(DEFAULT_CONFIG);
    setContent(DEFAULT_CONTENT);
    setQuestions([]);
  };
 
  return (
    <div className="app-shell">
      {/* Header */}
      <header className="app-header">
        <div className="header-logo"><TargetMark /></div>
        <div>
          <h1>Summative Assessment Design Assistant</h1>
          <p className="subtitle">Bloom's Taxonomy · MCQ Generator · Blackboard Export</p>
        </div>
        <span className="header-wordmark">
          mikehighfield<span className="spark-dot">.</span><span className="tld">ai</span>
        </span>
      </header>
 
      {/* Main content */}
      <main className="app-main">
        <StepIndicator currentStep={step} />
 
        {step === 1 && (
          <Step1Config
            config={config}
            onNext={handleConfig}
          />
        )}
 
        {step === 2 && (
          <Step2Input
            content={content}
            onNext={handleContent}
            onBack={() => setStep(1)}
          />
        )}
 
        {step === 3 && (
          <Step3Generate
            config={config}
            content={content}
            onDone={handleGenDone}
            onBack={() => setStep(2)}
          />
        )}
 
        {step === 4 && (
          <Step4Preview
            questions={questions}
            config={config}
            content={content}
            onNext={() => setStep(5)}
            onBack={() => setStep(2)}
            onUpdateQuestions={setQuestions}
          />
        )}
 
        {step === 5 && (
          <Step5Export
            questions={questions}
            config={config}
            onBack={() => setStep(4)}
            onRestart={handleRestart}
          />
        )}
      </main>
 
      {/* Footer */}
      <footer className="app-footer">
        Designed for faculty use in alignment with the{' '}
        <a href="https://www.qaa.ac.uk/docs/qaa/quality-code/advice-and-guidance-assessment.pdf" target="_blank" rel="noopener noreferrer">
          UK Quality Code for Higher Education (QAA)
        </a>{' '}
        · Bloom's Revised Taxonomy (Anderson et al., 2001) · Franke (2018)
        <span className="footer-brand">
          mikehighfield<span className="spark-dot">.</span>ai — Learning that <span className="lands">lands</span><span className="spark-dot">.</span>
        </span>
      </footer>
    </div>
  );
}
 
