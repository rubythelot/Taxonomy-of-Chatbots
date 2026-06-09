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

function UseCaseRanking({ ranking }) {
  return (
    <div className="use-case-ranking">
      {ranking.map((group) => (
        <div className="use-case-row" key={group.label}>
          <span>{group.label}</span>
          <TagList items={group.items} />
        </div>
      ))}
    </div>
  );
}

function NotesDrawer({ g, open, onClose }) {
  return (
    <div className={`notes-drawer-wrap ${open ? "is-open" : ""}`} aria-hidden={!open}>
      <button className="notes-scrim" aria-label="Close deeper notes" onClick={onClose} />
      <aside className="notes-drawer" aria-label="Deeper notes">
        <div className="notes-drawer-head">
          <div>
            <div className="notes-kicker">Deeper notes</div>
            <h2>{g.name}</h2>
          </div>
          <button className="notes-close" onClick={onClose}>Close x</button>
        </div>
        <div className="notes-drawer-body">
          <section className="notes-block">
            <h3>When to use this</h3>
            <ul className="notes-list">
              {g.whenToUse.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </section>
          <section className="notes-block">
            <h3>When not to use this</h3>
            <ul className="notes-list avoid">
              {g.whenNot.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </section>
          <section className="notes-block">
            <h3>Implementation notes</h3>
            <ul className="notes-list">
              {g.impl.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </section>
          <section className="notes-block">
            <h3>Guardrails</h3>
            <ul className="notes-list check">
              {g.guardrails.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </section>
        </div>
      </aside>
    </div>
  );
}

function RiskTone({ rank }) {
  if (rank === 3) return "high";
  if (rank === 2) return "medium";
  return "low";
}

const BUSINESS_USE_CASES = USE_CASES.map((useCase) => useCase.label);

function assessPatternFit(g) {
  const { bot, it, cx } = g.sel;

  if (bot.id === "deterministic" && ["create", "analyze", "coach"].includes(it.id)) {
    return {
      tone: "fit-warning",
      label: "Mixed fit",
      reason: `${it.label} usually needs generation or interpretation. Keep deterministic logic for routing and add a generative layer for the actual ${it.label.toLowerCase()} work.`,
    };
  }

  if (bot.id === "deterministic" && it.id === "do") {
    return {
      tone: "fit-bad",
      label: "Contradictory pairing",
      reason: "A deterministic flow can guide an action, but tool execution needs permissions, confirmation, and backend state handling.",
    };
  }

  if (bot.id === "intent" && ["create", "analyze", "coach"].includes(it.id)) {
    return {
      tone: "fit-warning",
      label: "Needs AI layer",
      reason: "Intent recognition can route the request, but the selected interaction needs generation, analysis, or feedback beyond slot filling.",
    };
  }

  if (bot.id === "generative" && ["do", "monitor"].includes(it.id)) {
    return {
      tone: "fit-warning",
      label: "Needs tools",
      reason: "Generation can explain the task, but this interaction needs tool calls, permissions, event state, and auditability.",
    };
  }

  if (bot.id === "rag" && ["do", "monitor"].includes(it.id)) {
    return {
      tone: "fit-warning",
      label: "Needs action layer",
      reason: "Retrieval can ground the answer, but acting or monitoring requires integrations beyond the knowledge base.",
    };
  }

  if (bot.id === "agentic" && ["ask", "create", "coach"].includes(it.id)) {
    return {
      tone: "fit-warning",
      label: "Possibly overbuilt",
      reason: "Agentic architecture may be more than this interaction needs unless the experience must call tools or change state.",
    };
  }

  if (bot.id === "multiagent" && cx.id !== "high") {
    return {
      tone: "fit-bad",
      label: "Under-scoped",
      reason: "Multi-agent systems need high-complexity orchestration, shared memory, role boundaries, and synthesis.",
    };
  }

  if (g.underPowered) {
    return {
      tone: "fit-warning",
      label: "Underpowered",
      reason: `This pattern usually needs ${g.complexityFloor.toLowerCase()} complexity to be reliable.`,
    };
  }

  if (g.overEngineered) {
    return {
      tone: "fit-warning",
      label: "Overbuilt",
      reason: `This pattern can usually work at ${g.complexityFloor.toLowerCase()} complexity. Start simpler unless the product needs the extra controls.`,
    };
  }

  return {
    tone: "fit-good",
    label: "Strong fit",
    reason: "The selected intelligence, interaction, and complexity line up cleanly for a production chatbot pattern.",
  };
}

const USE_CASE_RANKINGS = {
  ask: {
    best: ["Customer support", "Employee service", "Search & analytics"],
    possible: ["Sales", "Commerce", "Tutoring"],
    poor: ["Companion"],
  },
  guide: {
    best: ["Customer support", "Employee service", "Sales"],
    possible: ["Commerce", "Tutoring"],
    poor: ["Companion", "Search & analytics"],
  },
  do: {
    best: ["Customer support", "Employee service", "Commerce"],
    possible: ["Sales", "Search & analytics"],
    poor: ["Tutoring", "Companion"],
  },
  create: {
    best: ["Sales", "Search & analytics", "Tutoring"],
    possible: ["Customer support", "Employee service", "Companion"],
    poor: ["Commerce"],
  },
  analyze: {
    best: ["Search & analytics", "Sales", "Employee service"],
    possible: ["Commerce", "Customer support"],
    poor: ["Companion", "Tutoring"],
  },
  coach: {
    best: ["Tutoring", "Employee service"],
    possible: ["Sales", "Companion"],
    poor: ["Commerce", "Search & analytics"],
  },
  monitor: {
    best: ["Customer support", "Commerce", "Search & analytics"],
    possible: ["Employee service", "Sales"],
    poor: ["Tutoring", "Companion"],
  },
  escalate: {
    best: ["Customer support", "Employee service"],
    possible: ["Sales", "Commerce"],
    poor: ["Search & analytics", "Tutoring", "Companion"],
  },
};

function getBusinessUseCaseRanking(g) {
  const ranking = USE_CASE_RANKINGS[g.sel.it.id] || USE_CASE_RANKINGS.ask;
  const used = new Set([...ranking.best, ...ranking.possible, ...ranking.poor]);
  const remainder = BUSINESS_USE_CASES.filter((label) => !used.has(label));

  return [
    { label: "Best fit", items: ranking.best },
    { label: "Possible", items: [...ranking.possible, ...remainder] },
    { label: "Poor fit", items: ranking.poor },
  ].filter((group) => group.items.length > 0);
}

function ResearchPage() {
  const coreTypes = [
    ["Deterministic flow", "Explicit menus, rules, decision trees, and scripted responses for tightly controlled tasks."],
    ["Intent / NLU", "Classifies intent, extracts entities, and fills slots inside structured service paths."],
    ["Generative assistant", "Produces open-ended language for answers, drafting, summarization, and conversational help."],
    ["Grounded / RAG", "Retrieves from trusted sources before answering, improving factual consistency and citations."],
    ["Hybrid", "Combines deterministic control with AI flexibility, which is where many production systems land."],
    ["Agentic action", "Calls tools and APIs, plans steps, and changes state after explicit confirmation."],
    ["Multi-agent", "Coordinates specialized agents or roles for complex cross-domain work."],
  ];

  const interactionPatterns = [
    "Buttons and suggested replies",
    "Free-text Q&A",
    "Slot filling and structured intake",
    "Rich cards, carousels, and widgets",
    "In-chat actions and tool execution",
    "Human handoff",
    "Voice interaction",
    "Multimodal context sharing",
    "Proactive and event-driven interaction",
    "Multi-party or group interaction",
  ];

  const sources = [
    ["Google Conversational Agents", "https://cloud.google.com/products/conversational-agents/pricing"],
    ["Microsoft AI agent design patterns", "https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns"],
    ["IBM chatbot types", "https://www.ibm.com/think/topics/chatbot-types"],
    ["Microsoft Copilot Studio knowledge", "https://learn.microsoft.com/en-us/microsoft-copilot-studio/knowledge-copilot-studio"],
    ["Google conversation design", "https://developers.google.com/assistant/conversation-design/what-is-conversation-design"],
    ["OpenAI function calling", "https://developers.openai.com/api/docs/guides/function-calling"],
    ["Microsoft Copilot Studio handoff", "https://learn.microsoft.com/en-us/microsoft-copilot-studio/advanced-hand-off"],
    ["OpenAI voice agents", "https://developers.openai.com/api/docs/guides/voice-agents"],
  ];

  return (
    <main className="research-page">
      <section className="research-hero" aria-labelledby="research-title">
        <a className="research-back" href="/">Back to taxonomy</a>
        <div className="research-heading">
          <h1 id="research-title">AI Chatbot Taxonomy for Web App Product Strategy.</h1>
          <p>
            The working paper behind this prototype: a layered taxonomy of chatbot intelligence,
            interaction patterns, business roles, complexity, and design implications.
          </p>
        </div>
      </section>
      <section className="research-body" aria-label="Research summary">
        <article className="research-article">
          <section>
            <div className="research-kicker">01 / Framing</div>
            <h2>Why a single chatbot taxonomy is no longer enough.</h2>
            <p>
              The market no longer organizes neatly into one list of chatbot types. Major products combine
              deterministic flows, generative answers, retrieval, tool execution, voice, multimodal context,
              and human handoff inside the same system. A useful product taxonomy needs to describe the
              composition of those parts rather than treating every chatbot as one fixed category.
            </p>
          </section>

          <section>
            <div className="research-kicker">02 / Model</div>
            <h2>The durable model has three layers.</h2>
            <div className="research-grid">
              <div>
                <h3>Core intelligence</h3>
                <p>How the system reasons, retrieves, generates, and acts.</p>
              </div>
              <div>
                <h3>Interaction pattern</h3>
                <p>How the user provides input and how the bot responds.</p>
              </div>
              <div>
                <h3>Business role</h3>
                <p>The job the conversational surface performs inside a product or service.</p>
              </div>
            </div>
          </section>

          <section>
            <div className="research-kicker">03 / Core intelligence</div>
            <h2>The core kinds of AI chatbots.</h2>
            <div className="research-table">
              {coreTypes.map(([name, description]) => (
                <div className="research-row" key={name}>
                  <strong>{name}</strong>
                  <p>{description}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="research-kicker">04 / Interactions</div>
            <h2>The interface pattern matters as much as the model.</h2>
            <p>
              Teams often conflate chatbot type with interaction type. The research separates the system's
              intelligence from the user's actual experience: buttons, free text, forms, cards, actions, handoff,
              voice, multimodal uploads, proactive alerts, and group or multi-agent collaboration.
            </p>
            <div className="research-chip-list">
              {interactionPatterns.map((pattern) => (
                <span key={pattern}>{pattern}</span>
              ))}
            </div>
          </section>

          <section>
            <div className="research-kicker">05 / Product strategy</div>
            <h2>What this means for web apps.</h2>
            <p>
              The strongest question is not “Should this be a chatbot?” It is “What job should this
              conversational surface perform, and what level of intelligence and interaction does that job
              require?” Most strong deployments are hybrid: deterministic where control matters, grounded
              where facts matter, tool-enabled where action matters, and human-assisted where trust or
              sensitivity requires it.
            </p>
          </section>

          <section>
            <div className="research-kicker">06 / Sources</div>
            <h2>Selected sources.</h2>
            <ul className="research-sources">
              {sources.map(([label, href]) => (
                <li key={href}>
                  <a href={href}>{label}</a>
                </li>
              ))}
            </ul>
          </section>
        </article>
      </section>
    </main>
  );
}

export default function App() {
  const path = window.location.pathname;
  const [notesOpen, setNotesOpen] = useState(false);
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
  const patternFit = assessPatternFit(generated);
  const businessUseCaseRanking = getBusinessUseCaseRanking(generated);

  if (path === "/research") {
    return <ResearchPage />;
  }

  return (
    <main className="site-shell">
      <section className="hero-band" aria-labelledby="page-title">
        <div className="hero-grid">
          <div>
            <h1 id="page-title">Taxonomy of Chatbots.</h1>
          </div>
          <div className="hero-copy">
            <p>
              A decision model for matching chatbot intelligence and interaction design to the simplest reliable
              product pattern.
            </p>
            <a className="hero-link" href="/research">Read the research</a>
          </div>
        </div>
      </section>

      <section className="tool-band" aria-label="Taxonomy generator">
        <div className="control-panel">
          <SelectField label="Core intelligence" options={BOT_TYPES} value={selection.botType} onChange={update("botType")} />
          <SelectField label="Interaction pattern" options={INTERACTIONS} value={selection.interaction} onChange={update("interaction")} />
          <SelectField label="Complexity" options={COMPLEXITY} value={selection.complexity} onChange={update("complexity")} />
        </div>

        <div className="result-layout">
          <section className="strategy-panel" aria-labelledby="pattern-title">
            <div className="strategy-head">
              <div>
                <div className="result-kicker">Generated pattern</div>
                <h2 id="pattern-title">{generated.name}.</h2>
                <div className="recipe-line">
                  <span>{generated.botLabel}</span>
                  <span>/</span>
                  <span>{generated.interactionLabel}</span>
                </div>
              </div>
              <button className="notes-cta" onClick={() => setNotesOpen(true)}>Deeper notes</button>
            </div>

            <div className="status-row">
              <Pill tone={patternFit.tone}>{patternFit.label}</Pill>
              <Pill tone="inverse">{generated.complexity} complexity</Pill>
              <Pill tone={riskTone}>{generated.risk} risk</Pill>
              {generated.underPowered ? <Pill tone="warning">Needs {generated.complexityFloor}</Pill> : null}
              {generated.overEngineered ? <Pill tone="warning">Simplify to {generated.complexityFloor}</Pill> : null}
            </div>

            <div className={`fit-card ${patternFit.tone}`}>
              <strong>{patternFit.label}</strong>
              <p>{patternFit.reason}</p>
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
              <Field label="Potential business use cases" wide><UseCaseRanking ranking={businessUseCaseRanking} /></Field>
            </dl>
          </section>

          <aside className="preview-panel" aria-label="Live chatbot preview">
            <div className="panel-label">
              <span>Interface pattern</span>
              <span>{previewPattern.label}</span>
            </div>
            <p className="preview-rationale">{previewPattern.reason}</p>
            <ChatPreview g={generated} />
          </aside>
        </div>
      </section>

      <section className="ux-risk-band" aria-labelledby="ux-risks-title">
        <div className="ux-risk-card">
          <div className="ux-risk-head">
            <h2 id="ux-risks-title">UX risks</h2>
            <span>for {generated.botLabel} / {generated.interactionLabel}</span>
          </div>
          <ol className="ux-risk-list">
            {generated.uxRisks.map((risk, index) => (
              <li key={risk}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{risk}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <NotesDrawer g={generated} open={notesOpen} onClose={() => setNotesOpen(false)} />
    </main>
  );
}
