import React, { useEffect, useMemo, useRef, useState } from "react";
import ChatPreview, { getPreviewPattern } from "./ChatPreview.jsx";

const { BOT_TYPES, INTERACTIONS, USE_CASES, COMPLEXITY } = window.TAXONOMY.options;

const USE_CASE_LABEL_TO_ID = Object.fromEntries(USE_CASES.map((u) => [u.label, u.id]));

function pickValid(value, options, fallback) {
  return options.some((option) => option.id === value) ? value : fallback;
}

function initialSelection() {
  const params = new URLSearchParams(window.location.search);
  return {
    botType: pickValid(params.get("bot"), BOT_TYPES, "hybrid"),
    interaction: pickValid(params.get("it"), INTERACTIONS, "ask"),
    useCase: pickValid(params.get("uc"), USE_CASES, "support"),
    complexity: pickValid(params.get("cx"), COMPLEXITY, "low"),
  };
}

function initialView() {
  const view = new URLSearchParams(window.location.search).get("view");
  return view === "matrix" ? "matrix" : "detail";
}

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

function UseCaseRanking({ ranking, activeLabel, onPick }) {
  return (
    <div className="use-case-ranking">
      <p className="use-case-hint">Click a use case to re-render the pattern in that context.</p>
      {ranking.map((group) => (
        <div className="use-case-row" key={group.label}>
          <span>{group.label}</span>
          <div className="tag-list">
            {group.items.map((item) => (
              <button
                key={item}
                type="button"
                className={`pill pill-button ${item === activeLabel ? "inverse" : ""}`}
                aria-pressed={item === activeLabel}
                onClick={() => onPick(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function NotesDrawer({ g, open, onClose }) {
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = document.activeElement;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [open, onClose]);

  return (
    <div className={`notes-drawer-wrap ${open ? "is-open" : ""}`} aria-hidden={!open}>
      <button className="notes-scrim" aria-label="Close deeper notes" onClick={onClose} tabIndex={open ? 0 : -1} />
      <aside className="notes-drawer" role="dialog" aria-modal="true" aria-label="Deeper notes">
        <div className="notes-drawer-head">
          <div>
            <div className="notes-kicker">Deeper notes</div>
            <h2>{g.name}</h2>
          </div>
          <button className="notes-close" ref={closeRef} onClick={onClose}>Close x</button>
        </div>
        <div className="notes-drawer-body">
          <section className="notes-block">
            <h3>Seen in the wild</h3>
            <p className="notes-realworld">{g.realWorld}</p>
            <TagList items={g.realWorldProducts} />
          </section>
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

  if (bot.id === "multiagent" && ["ask", "create", "coach"].includes(it.id)) {
    return {
      tone: "fit-warning",
      label: "Possibly overbuilt",
      reason: "Multiple coordinated agents rarely pay off for a single conversational task — one well-scoped agent usually covers this interaction.",
    };
  }

  if ((bot.id === "agentic" || bot.id === "multiagent") && it.id === "escalate") {
    return {
      tone: "fit-warning",
      label: "Mixed fit",
      reason: "Escalation is mostly routing and context transfer. Agent orchestration adds little unless triage itself is genuinely complex.",
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

const FIT_MARKS = { "fit-good": "+", "fit-warning": "~", "fit-bad": "x" };

function MatrixPanel({ selection, onPick, generated, patternFit }) {
  const cells = useMemo(() => {
    return BOT_TYPES.map((bot) =>
      INTERACTIONS.map((it) => {
        const g = window.TAXONOMY.generate({
          botType: bot.id,
          interaction: it.id,
          useCase: selection.useCase,
          complexity: selection.complexity,
        });
        return assessPatternFit(g);
      })
    );
  }, [selection.useCase, selection.complexity]);

  const cxLabel = COMPLEXITY.find((c) => c.id === selection.complexity)?.label || "";

  return (
    <section className="strategy-panel matrix-panel" aria-labelledby="matrix-title">
      <div className="strategy-head">
        <div>
          <div className="result-kicker">Fit matrix</div>
          <h2 id="matrix-title" className="matrix-title">Every pairing, one view.</h2>
          <div className="recipe-line">
            <span>assessed at {cxLabel.toLowerCase()} complexity</span>
          </div>
        </div>
        <div className="matrix-legend" aria-hidden="true">
          <span><i className="fit-good" /> Strong fit</span>
          <span><i className="fit-warning" /> Mixed / caution</span>
          <span><i className="fit-bad" /> Contradictory</span>
        </div>
      </div>
      <p className="matrix-hint">
        Every core intelligence crossed with every interaction pattern. Click a cell to load it —
        the interface pattern on the right updates with it.
      </p>
      <div className="matrix-scroll">
        <table className="matrix-table">
          <thead>
            <tr>
              <th aria-label="Core intelligence" />
              {INTERACTIONS.map((it) => (
                <th key={it.id} scope="col">{it.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BOT_TYPES.map((bot, botIndex) => (
              <tr key={bot.id}>
                <th scope="row">{bot.label}</th>
                {INTERACTIONS.map((it, itIndex) => {
                  const fit = cells[botIndex][itIndex];
                  const active = selection.botType === bot.id && selection.interaction === it.id;
                  return (
                    <td key={it.id}>
                      <button
                        type="button"
                        className={`matrix-cell ${fit.tone} ${active ? "active" : ""}`}
                        title={`${bot.label} x ${it.label}: ${fit.label}`}
                        aria-label={`${bot.label} with ${it.label}: ${fit.label}. Load this combination.`}
                        aria-pressed={active}
                        onClick={() => onPick(bot.id, it.id)}
                      >
                        {FIT_MARKS[fit.tone]}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={`fit-card ${patternFit.tone}`}>
        <strong>
          {generated.botLabel} / {generated.interactionLabel} — {patternFit.label}
        </strong>
        <p>{patternFit.reason}</p>
      </div>
    </section>
  );
}

const GLOSSARY = [
  {
    group: "Core intelligence",
    kicker: "How a bot reasons, retrieves, and acts",
    terms: [
      ["Deterministic flow", "A bot that follows explicit rules, menus, and decision trees. Every path is authored in advance, so behaviour is fully predictable — but it can't handle anything off-script."],
      ["Intent / NLU", "Natural-language understanding that classifies what the user wants (the intent) and pulls out key details (entities), then routes into a structured path. Flexible input, controlled handling."],
      ["Generative assistant", "Uses a large language model to produce open-ended language — answers, summaries, drafts — instead of choosing from scripted responses."],
      ["Grounded / RAG", "Retrieval-Augmented Generation: the bot retrieves relevant passages from a trusted source before answering, so responses stay tied to real content and can cite it."],
      ["Hybrid", "Combines deterministic control with generative flexibility — scripted where accuracy and compliance matter, generative where open-ended language helps. Where most production systems land."],
      ["Agentic action", "A bot that can act, not just talk: it calls tools and APIs, plans multi-step tasks, and changes real system state — usually behind an explicit confirmation."],
      ["Multi-agent", "Several specialised agents coordinated together — e.g. a planner, a researcher, and an executor — each handling part of a complex task and passing work between them."],
    ],
  },
  {
    group: "Interaction patterns",
    kicker: "What the user actually does",
    terms: [
      ["Ask", "Free-text question and answer. The user types a question in natural language and gets a direct response."],
      ["Guide", "A structured, step-by-step flow that walks the user through a task, collecting and validating each field along the way."],
      ["Do", "The user asks the bot to perform an action and it executes via tools — after showing what it will do and getting confirmation."],
      ["Create", "The bot generates a new artefact (copy, an image, a document) from a prompt, shown for review, regeneration, and editing before use."],
      ["Analyze", "The user asks questions about data; the bot turns them into queries and returns charts, tables, and a written summary."],
      ["Coach", "The bot guides practice and gives feedback rather than handing over answers — Socratic questioning, hints, and progress tracking."],
      ["Monitor", "The bot initiates contact based on events — alerts, status changes, next-best actions — instead of waiting to be asked."],
      ["Escalate", "Recognising when a human is needed and transferring the conversation, with full context, to a person."],
    ],
  },
  {
    group: "Key concepts",
    kicker: "The vocabulary behind the choices",
    terms: [
      ["Large language model (LLM)", "The AI model behind generative bots. Trained on large text corpora to predict and produce language — the engine for answering, drafting, and reasoning."],
      ["RAG", "Retrieval-Augmented Generation. The system first retrieves relevant documents, then feeds them to the LLM so answers are grounded in real, current content rather than the model's memory."],
      ["Embedding", "A numeric representation of text that captures meaning, so similar concepts sit close together. Lets a bot search a knowledge base by meaning rather than exact keywords."],
      ["Vector store", "A database of embeddings that finds the passages most relevant to a question — the retrieval half of RAG."],
      ["Grounding", "Tying a bot's answers to verifiable source content so it doesn't invent facts. The main defence against hallucination."],
      ["Hallucination", "When a model produces confident, plausible-sounding text that is factually wrong or unsupported. The core risk of ungrounded generation."],
      ["Intent", "What the user is trying to accomplish with a message (e.g. “reset password”). Classifying intent is how NLU bots route requests."],
      ["Entity", "A specific detail extracted from a message — a date, an order number, a product name — used to fill the parameters of a task."],
      ["Slot filling", "Collecting the required pieces of information (slots) for a task, one or several at a time, until the bot has everything it needs to proceed."],
      ["Tool / function calling", "Giving an LLM a set of functions it can invoke — look up an order, book a meeting — so it can take real actions instead of only producing text."],
      ["Agent", "An LLM-driven system that plans and takes actions toward a goal, deciding which tools to call and in what order, rather than following a fixed script."],
      ["Orchestration", "Coordinating multiple steps, tools, or agents into a coherent workflow — deciding what runs when and how results combine."],
      ["System prompt", "The hidden instructions that define a bot's role, tone, rules, and boundaries before any user message arrives."],
      ["Context window", "The amount of text (measured in tokens) a model can consider at once — the conversation, retrieved documents, and instructions all have to fit."],
      ["Token", "The unit models read and generate — roughly a word-piece. Usage, limits, and cost are all measured in tokens."],
      ["Guardrails", "Rules and checks that constrain what a bot can say or do — content filters, confirmation gates, refusal conditions — to keep it safe and on-task."],
      ["Human handoff", "Transferring a conversation from bot to a human agent, ideally carrying the full transcript and context so the user doesn't repeat themselves."],
      ["Multimodal", "Able to work with more than text — images, files, audio, screenshots — as input or output."],
      ["Citation", "A reference to the source a grounded answer came from, so a user can verify the claim."],
      ["Fallback", "What a bot does when it isn't confident or can't handle a request — ask a clarifying question, offer options, or escalate — instead of guessing."],
      ["Streaming", "Sending a response token-by-token as it's generated, so the user sees it appear immediately rather than waiting for the whole answer."],
      ["Fine-tuning", "Further training a base model on domain-specific examples to specialise its behaviour. Heavier than prompting; used when prompting alone isn't enough."],
      ["Conversation memory", "What a bot retains across turns and sessions — earlier messages, preferences, progress — so it doesn't start from scratch each time."],
      ["MCP (Model Context Protocol)", "An open standard for connecting AI assistants to external tools and data sources through a consistent interface."],
    ],
  },
];

function GlossaryPage() {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const groups = GLOSSARY.map((group) => ({
    ...group,
    terms: group.terms.filter(
      ([term, def]) => !q || term.toLowerCase().includes(q) || def.toLowerCase().includes(q)
    ),
  })).filter((group) => group.terms.length > 0);

  const totalMatches = groups.reduce((sum, group) => sum + group.terms.length, 0);

  return (
    <main className="glossary-page">
      <section className="glossary-hero" aria-labelledby="glossary-title">
        <a className="hero-link glossary-back" href="/">Back to taxonomy</a>
        <div className="glossary-heading">
          <h1 id="glossary-title">Glossary.</h1>
          <p>
            Plain-language definitions for the chatbot types, interaction patterns, and technical
            terms used throughout this tool.
          </p>
        </div>
      </section>

      <section className="glossary-body" aria-label="Glossary terms">
        <div className="glossary-search">
          <label htmlFor="glossary-filter">Filter terms</label>
          <input
            id="glossary-filter"
            type="search"
            placeholder="Search e.g. RAG, intent, handoff…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoComplete="off"
          />
          {q ? <span className="glossary-count">{totalMatches} match{totalMatches === 1 ? "" : "es"}</span> : null}
        </div>

        {groups.length === 0 ? (
          <p className="glossary-empty">No terms match “{query}”.</p>
        ) : (
          groups.map((group) => (
            <section className="glossary-group" key={group.group}>
              <div className="glossary-group-head">
                <h2>{group.group}</h2>
                <span>{group.kicker}</span>
              </div>
              <dl className="glossary-list">
                {group.terms.map(([term, def]) => (
                  <div className="glossary-term" key={term}>
                    <dt>{term}</dt>
                    <dd>{def}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))
        )}
      </section>
    </main>
  );
}

export default function App() {
  const isGlossary = window.location.pathname === "/glossary";
  const [notesOpen, setNotesOpen] = useState(false);
  const [selection, setSelection] = useState(initialSelection);
  const [view, setView] = useState(initialView);

  useEffect(() => {
    if (isGlossary) return;
    const params = new URLSearchParams();
    params.set("bot", selection.botType);
    params.set("it", selection.interaction);
    params.set("cx", selection.complexity);
    params.set("uc", selection.useCase);
    if (view === "matrix") params.set("view", "matrix");
    window.history.replaceState(null, "", `${window.location.pathname}?${params}`);
  }, [isGlossary, selection, view]);

  const generated = useMemo(() => window.TAXONOMY.generate(selection), [selection]);
  const update = (key) => (value) => setSelection((current) => ({ ...current, [key]: value }));
  const riskTone = RiskTone({ rank: generated.riskRank });
  const previewPattern = getPreviewPattern(generated);
  const patternFit = assessPatternFit(generated);
  const businessUseCaseRanking = getBusinessUseCaseRanking(generated);
  const pickMatrixCell = (botType, interaction) =>
    setSelection((current) => ({ ...current, botType, interaction }));
  const pickUseCase = (label) => {
    const id = USE_CASE_LABEL_TO_ID[label];
    if (id) update("useCase")(id);
  };

  if (isGlossary) {
    return <GlossaryPage />;
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
            <a className="hero-link" href="/glossary">Glossary</a>
          </div>
        </div>
      </section>

      <section className="tool-band" aria-label="Taxonomy generator">
        <div className="control-panel">
          <SelectField label="Core intelligence" options={BOT_TYPES} value={selection.botType} onChange={update("botType")} />
          <SelectField label="Interaction pattern" options={INTERACTIONS} value={selection.interaction} onChange={update("interaction")} />
          <SelectField label="Complexity" options={COMPLEXITY} value={selection.complexity} onChange={update("complexity")} />
        </div>

        <div className="view-tabs" role="tablist" aria-label="Result view">
          <button
            type="button"
            role="tab"
            aria-selected={view === "detail"}
            className={view === "detail" ? "active" : ""}
            onClick={() => setView("detail")}
          >
            Pattern detail
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "matrix"}
            className={view === "matrix" ? "active" : ""}
            onClick={() => setView("matrix")}
          >
            Fit matrix
          </button>
        </div>

        <div className="result-layout">
          {view === "matrix" ? (
            <MatrixPanel
              selection={selection}
              onPick={pickMatrixCell}
              generated={generated}
              patternFit={patternFit}
            />
          ) : (
          <section className="strategy-panel" aria-labelledby="pattern-title">
            <div className="strategy-head">
              <div>
                <div className="result-kicker">Generated pattern</div>
                <h2 id="pattern-title">{generated.name}.</h2>
                <div className="recipe-line">
                  <span>{generated.botLabel}</span>
                  <span>/</span>
                  <span>{generated.interactionLabel}</span>
                  <span>/</span>
                  <span>{generated.useCaseLabel}</span>
                </div>
              </div>
              <button className="notes-cta" onClick={() => setNotesOpen(true)}>Deeper notes</button>
            </div>

            <div className="status-row">
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
              <Field label="Seen in the wild" wide>
                <div className="real-world">
                  <p>{generated.realWorld}</p>
                  <TagList items={generated.realWorldProducts} />
                </div>
              </Field>
              <Field label="Potential business use cases" wide>
                <UseCaseRanking
                  ranking={businessUseCaseRanking}
                  activeLabel={generated.useCaseLabel}
                  onPick={pickUseCase}
                />
              </Field>
            </dl>
          </section>
          )}

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
