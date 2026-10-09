import React, { useEffect, useMemo, useState } from 'react';
import StepIndicator from './components/StepIndicator';
import Step1Setup from './components/Step1Setup';
import Step2Content from './components/Step2Content';
import Step3Generate from './components/Step3Generate';
import Step4Review from './components/Step4Review';
import Step5Export from './components/Step5Export';
import { BrandMark, Notice } from './components/ui';
import { APP_NAME, APP_TAGLINE, BRAND_NAME, BRAND_URL, HOUSE_RULES_URL } from './settings';
import { emptyConfig, buildSpecification } from './utils/spec';

const EMPTY_CONTENT = { files: [], pasted: '' };

export function contentSourceOf(content) {
  const names = content.files.filter((f) => f.ok).map((f) => f.name);
  if (content.pasted.trim()) names.push('pasted notes');
  return names.join('; ');
}

export function contentTextOf(content) {
  const parts = content.files.filter((f) => f.ok).map((f) => `### File: ${f.name}\n\n${f.text}`);
  if (content.pasted.trim()) parts.push(`### Pasted notes\n\n${content.pasted.trim()}`);
  return parts.join('\n\n');
}

export default function App() {
  const [step, setStep] = useState(1);
  const [houseRules, setHouseRules] = useState(null);
  const [originalRules, setOriginalRules] = useState(null);
  const [rulesError, setRulesError] = useState(null);
  const [config, setConfig] = useState(emptyConfig);
  const [content, setContent] = useState(EMPTY_CONTENT);
  const [questions, setQuestions] = useState([]);
  const [generatedSpec, setGeneratedSpec] = useState(null);

  // Part A is loaded from its file, never written into the code.
  useEffect(() => {
    fetch(HOUSE_RULES_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then((t) => {
        setHouseRules(t);
        setOriginalRules(t);
      })
      .catch((e) => setRulesError(`Could not load the house rules from ${HOUSE_RULES_URL} (${e.message}).`));
  }, []);

  const specification = useMemo(
    () => (houseRules ? buildSpecification(houseRules, config, contentSourceOf(content)) : ''),
    [houseRules, config, content]
  );

  const go = (n) => {
    setStep(n);
    window.scrollTo({ top: 0 });
  };

  const restart = () => {
    setConfig(emptyConfig());
    setContent(EMPTY_CONTENT);
    setQuestions([]);
    setGeneratedSpec(null);
    setHouseRules(originalRules);
    go(1);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <BrandMark />
          <div>
            <h1>{APP_NAME}</h1>
            <p className="tagline">{APP_TAGLINE}</p>
          </div>
          <a className="brand-link" href={BRAND_URL} target="_blank" rel="noopener noreferrer">
            {BRAND_NAME}
          </a>
        </div>
      </header>

      <StepIndicator currentStep={step} onSelect={go} />

      <main className="app-main" id="main">
        {rulesError && <Notice kind="error">{rulesError}</Notice>}

        {step === 1 && (
          <Step1Setup
            config={config}
            houseRules={houseRules}
            originalRules={originalRules}
            contentSource={contentSourceOf(content)}
            onChangeRules={setHouseRules}
            onNext={(c) => {
              setConfig(c);
              go(2);
            }}
          />
        )}

        {step === 2 && (
          <Step2Content content={content} onChange={setContent} onBack={() => go(1)} onNext={() => go(3)} />
        )}

        {step === 3 && (
          <Step3Generate
            config={config}
            specification={specification}
            contentText={contentTextOf(content)}
            existingCount={questions.length}
            onBack={() => go(2)}
            onDone={(qs) => {
              setQuestions(qs);
              setGeneratedSpec({ text: specification, houseRules, config, at: new Date().toISOString() });
              go(4);
            }}
          />
        )}

        {step === 4 && (
          <Step4Review
            questions={questions}
            config={generatedSpec?.config || config}
            specification={generatedSpec?.text || specification}
            contentText={contentTextOf(content)}
            onChange={setQuestions}
            onBack={() => go(3)}
            onNext={() => go(5)}
          />
        )}

        {step === 5 && (
          <Step5Export
            questions={questions}
            config={generatedSpec?.config || config}
            houseRules={generatedSpec?.houseRules || houseRules}
            contentSource={contentSourceOf(content)}
            onBack={() => go(4)}
            onRestart={restart}
          />
        )}
      </main>

      <footer className="app-footer">
        <div className="app-footer-inner">
          <span>
            {APP_NAME} · <a href={BRAND_URL} target="_blank" rel="noopener noreferrer">{BRAND_NAME}</a>
          </span>
          <span>
            Anderson &amp; Krathwohl (2001) · Haladyna, Downing &amp; Rodriguez (2002) · Rodriguez (2005) · Gierl et al.
            (2017) · Franke (2018) · QAA UK Quality Code (2024)
          </span>
        </div>
      </footer>
    </div>
  );
}
