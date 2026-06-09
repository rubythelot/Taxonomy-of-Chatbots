import React, { useMemo, useState } from "react";
import ChatPreview, { getPreviewPattern } from "./ChatPreview.jsx";

const { BOT_TYPES, INTERACTIONS, USE_CASES, COMPLEXITY } = window.TAXONOMY.options;

function SelectField({ label, value, options, onChange }) {
  const id = `select-${label.toLowerCase().replaceAll(" ", "-")}`;

  return (
    <label className="select-field" htmlFor={id}>
      <span>{label}</span>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
            {option.note ? ` - ${option.note}` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}

function Pill({ children, tone = "" }) {
  return <span className={`pill ${tone}`}>{children}</span>;
}

function Field({ label, children, wide = false }) {
  return (
    <div className={`field ${wide ? "wide" : ""}`}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function TagList({ items }) {
  return (
    <div className="tag-list">
      {items.map((item) => (
        <Pill key={item}>{item}</Pill>
      ))}
    </div>
  );
}

function BulletList({ items, variant = "" }) {
  return (
    <ul className={`plain-list ${variant}`}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function RiskTone({ rank }) {
  if (rank === 3) return "high";
  if (rank === 2) return "medium";
  return "low";
}

export default function App() {
  const [selection, setSelection] = useState({
    botType: "hybrid",
    interaction: "ask",
    useCase: "support",
    complexity: "low",
    channel: "web",
  });

  const generated = useMemo(() => window.TAXONOMY.generate(selection), [selection]);
  const update = (key) => (value) => setSelection((current) => ({ ...current, [key]: value }));
  const riskTone = RiskTone({ rank: generated.riskRank });
  const previewPattern = getPreviewPattern(generated);

  return (
    <main className="site-shell">
      <section className="hero-band" aria-labelledby="page-title">
        <div className="hero-grid">
          <div>
            <h1 id="page-title">Taxonomy of Chatbots.</h1>
          </div>
          <p>
            A decision model for matching chatbot intelligence, interaction design, and business role to the
            simplest reliable product pattern.
          </p>
        </div>
      </section>

      <section className="tool-band" aria-label="Taxonomy generator">
        <div className="control-panel">
          <SelectField label="Core intelligence" options={BOT_TYPES} value={selection.botType} onChange={update("botType")} />
          <SelectField label="Interaction pattern" options={INTERACTIONS} value={selection.interaction} onChange={update("interaction")} />
          <SelectField label="Business role" options={USE_CASES} value={selection.useCase} onChange={update("useCase")} />
          <SelectField label="Complexity" options={COMPLEXITY} value={selection.complexity} onChange={update("complexity")} />
        </div>

        <div className="result-layout">
          <section className="strategy-panel" aria-labelledby="pattern-title">
            <div className="result-kicker">Generated pattern</div>
            <h2 id="pattern-title">{generated.name}.</h2>
            <div className="recipe-line">
              <span>{generated.botLabel}</span>
              <span>/</span>
              <span>{generated.interactionLabel}</span>
              <span>/</span>
              <span>{generated.useCaseLabel}</span>
            </div>

            <div className="status-row">
              <Pill tone="inverse">{generated.complexity} complexity</Pill>
              <Pill tone={riskTone}>{generated.risk} risk</Pill>
              {generated.underPowered ? <Pill tone="warning">Needs {generated.complexityFloor}</Pill> : null}
              {generated.overEngineered ? <Pill tone="warning">Simplify to {generated.complexityFloor}</Pill> : null}
            </div>

            <dl className="detail-grid">
              <Field label="Description" wide>{generated.description}</Field>
              <Field label="User goal">{generated.userGoal}</Field>
              <Field label="Bot behavior">{generated.botBehavior}</Field>
              <Field label="Opening message">"{generated.firstMessage}"</Field>
              <Field label="Example user prompt">"{generated.userPrompt}"</Field>
              <Field label="Recommended UI" wide><TagList items={generated.ui} /></Field>
              <Field label="Data requirements"><TagList items={generated.data} /></Field>
              <Field label="Integrations"><TagList items={generated.integ} /></Field>
            </dl>
          </section>

          <aside className="preview-panel" aria-label="Live chatbot preview">
            <div className="panel-label">
              <span>Live preview</span>
              <span>{previewPattern.label}</span>
            </div>
            <ChatPreview g={generated} />
          </aside>
        </div>
      </section>

      <section className="brief-band" aria-labelledby="brief-title">
        <div className="section-heading">
          <h2 id="brief-title">Product brief.</h2>
        </div>
        <div className="brief-grid">
          <article className="brief-block">
            <h3>UX risks</h3>
            <BulletList items={generated.uxRisks} />
          </article>
          <article className="brief-block">
            <h3>When to use this</h3>
            <BulletList items={generated.whenToUse} />
          </article>
          <article className="brief-block">
            <h3>When not to use this</h3>
            <BulletList items={generated.whenNot} variant="avoid" />
          </article>
          <article className="brief-block">
            <h3>Implementation notes</h3>
            <BulletList items={generated.impl} />
          </article>
          <article className="brief-block">
            <h3>Guardrails</h3>
            <BulletList items={generated.guardrails} />
          </article>
        </div>
      </section>
    </main>
  );
}
