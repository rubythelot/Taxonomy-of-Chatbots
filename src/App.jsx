import React, { useMemo, useState } from "react";
import ChatPreview from "./ChatPreview.jsx";

const { BOT_TYPES, INTERACTIONS, USE_CASES, COMPLEXITY } = window.TAXONOMY.options;

const BOT_EXPLAINERS = {
  deterministic: "Explicit menus, rules, decision trees, and scripted responses for high-control work.",
  intent: "Classifies intent, extracts entities, and fills slots inside a structured service flow.",
  generative: "Produces open-ended language, drafts, summaries, and conversational help.",
  rag: "Retrieves from trusted sources before answering, improving factual consistency and citation quality.",
  hybrid: "Blends deterministic control with AI flexibility, which is where most production web bots land.",
  agentic: "Plans steps, calls tools or APIs, and changes system state after confirmation.",
  multiagent: "Coordinates specialized agents or roles for cross-domain work and complex processes.",
};

const INTERACTION_EXPLAINERS = {
  ask: "Natural-language questions with prose answers, citations, follow-ups, and escalation.",
  guide: "Structured intake, slot filling, validation, progress, and confirmation.",
  do: "In-chat tool execution with action cards, permission checks, audit trails, and receipts.",
  create: "Prompted generation with a reviewable draft, regeneration, editing, and export.",
  analyze: "Natural language into governed queries, visualizations, tables, and written summaries.",
  coach: "Socratic dialogue, practice mode, feedback loops, and progress memory.",
  monitor: "Event-driven alerts, severity, next-best actions, snooze, and subscription settings.",
  escalate: "Human handoff with transcript, variables, routing, queue state, and recovery.",
};

const ROLE_EXPLAINERS = {
  support: "Customer self-service, account help, policies, order questions, and issue recovery.",
  employee: "HR, IT, onboarding, internal knowledge, ticketing, and employee operations.",
  sales: "Lead capture, qualification, routing, demo booking, and pipeline creation.",
  commerce: "Product discovery, recommendations, cart actions, checkout support, and upsell.",
  analytics: "Website search, intranet search, reporting, governed metrics, and decision support.",
  tutoring: "Learning, onboarding, training, language practice, and guided skill development.",
  companion: "Entertainment, storytelling, roleplay, social connection, and lightweight coaching.",
};

const ACCENTS = ["mint", "pink", "peach", "blue", "purple"];

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
  const botExplainer = BOT_EXPLAINERS[selection.botType];
  const interactionExplainer = INTERACTION_EXPLAINERS[selection.interaction];
  const roleExplainer = ROLE_EXPLAINERS[selection.useCase];

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
              <span>{generated.interactionLabel}</span>
            </div>
            <ChatPreview g={generated} />
          </aside>
        </div>
      </section>

      <section className="taxonomy-band" aria-labelledby="taxonomy-title">
        <div className="section-heading">
          <div className="slug">Model / Three dimensions</div>
          <h2 id="taxonomy-title">The selection stack.</h2>
        </div>
        <div className="lens-grid">
          {[
            ["01", "Core intelligence", generated.botLabel, botExplainer],
            ["02", "Interaction pattern", generated.interactionLabel, interactionExplainer],
            ["03", "Business role", generated.useCaseLabel, roleExplainer],
          ].map(([number, label, value, text], index) => (
            <article className={`lens-card ${ACCENTS[index]}`} key={label}>
              <span className="lens-number">{number}</span>
              <h3>{label}</h3>
              <strong>{value}</strong>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="brief-band" aria-labelledby="brief-title">
        <div className="section-heading">
          <div className="slug">Implementation / Risk / Evidence</div>
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
          <article className="brief-block evidence">
            <h3>Representative products</h3>
            <p>{generated.realWorld}</p>
            <TagList items={generated.realWorldProducts} />
          </article>
        </div>
      </section>
    </main>
  );
}
