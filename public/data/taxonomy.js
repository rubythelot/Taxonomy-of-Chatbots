/* Chatbot Design Generator — taxonomy data + archetype generation engine.
   Grounded in the "AI Chatbot Taxonomy for Web App Product Strategy" research.
   Exposes window.TAXONOMY = { options, generate(sel) }.
*/
(function () {
  // ——————————————————————————————————————————————
  // Dropdown options
  // ——————————————————————————————————————————————
  const BOT_TYPES = [
    { id: "deterministic", label: "Deterministic flow", note: "menus / rules / scripts" },
    { id: "intent",        label: "Intent / NLU",        note: "classify intent, fill slots" },
    { id: "generative",    label: "Generative assistant",note: "open-ended language" },
    { id: "rag",           label: "Grounded / RAG",      note: "retrieve, then answer" },
    { id: "hybrid",        label: "Hybrid",              note: "control + flexibility" },
    { id: "agentic",       label: "Agentic action",      note: "calls tools, executes" },
    { id: "multiagent",    label: "Multi-agent",         note: "orchestrated roles" },
  ];

  const INTERACTIONS = [
    { id: "ask",      label: "Ask",      note: "free-text Q&A" },
    { id: "guide",    label: "Guide",    note: "step-by-step flow" },
    { id: "do",       label: "Do",       note: "take an action" },
    { id: "create",   label: "Create",   note: "generate content" },
    { id: "analyze",  label: "Analyze",  note: "data + charts" },
    { id: "coach",    label: "Coach",    note: "feedback + practice" },
    { id: "monitor",  label: "Monitor",  note: "proactive alerts" },
    { id: "escalate", label: "Escalate", note: "human handoff" },
  ];

  const USE_CASES = [
    {
      id: "support", label: "Customer support",
      domain: "your account, orders, and our policies", sources: "help center and account records",
      entity: "your order", task: "your request", artifact: "reply",
      dataset: "support tickets", skill: "self-service",
      question: "Why was I charged twice this month?",
      action: "Cancel order #4821 and refund it",
      products: ["Zendesk AI", "Intercom Fin", "Dialogflow CX"],
      data: ["help-center articles", "order & account records", "policy documents"],
    },
    {
      id: "employee", label: "Employee service",
      domain: "HR, IT, and internal policies", sources: "HR and IT knowledge bases",
      entity: "your IT ticket", task: "your request", artifact: "ticket",
      dataset: "internal tickets", skill: "internal service",
      question: "How many vacation days do I have left?",
      action: "Reset my VPN access and open an IT ticket",
      products: ["Microsoft Employee Self-Service", "IBM AskHR"],
      data: ["HR policies", "IT knowledge base", "employee directory & records"],
    },
    {
      id: "sales", label: "Sales",
      domain: "our product, pricing, and fit", sources: "product and pricing docs",
      entity: "your deal", task: "qualification", artifact: "follow-up email",
      dataset: "pipeline", skill: "qualification",
      question: "Which plan fits a 20-person team?",
      action: "Book a demo with an account exec next week",
      products: ["HubSpot Breeze lead capture", "Drift"],
      data: ["product & pricing catalog", "qualification criteria", "CRM records"],
    },
    {
      id: "commerce", label: "Commerce",
      domain: "products and recommendations", sources: "the product catalog",
      entity: "your cart", task: "checkout", artifact: "gift note",
      dataset: "orders", skill: "shopping",
      question: "What running shoe suits flat feet under $120?",
      action: "Add the size 10 in black to my cart",
      products: ["Google commerce agents", "Shopify Sidekick"],
      data: ["product catalog", "inventory & pricing", "cart / checkout state"],
    },
    {
      id: "analytics", label: "Search & analytics",
      domain: "your data and reports", sources: "governed data models",
      entity: "this report", task: "analysis", artifact: "summary",
      dataset: "your warehouse", skill: "data literacy",
      question: "How did Q2 revenue compare to Q1 by region?",
      action: "Save this view to my dashboard",
      products: ["Looker Conversational Analytics", "Tableau Agent", "Power BI Copilot"],
      data: ["governed semantic / data model", "metric definitions", "row-level permissions"],
    },
    {
      id: "tutoring", label: "Tutoring",
      domain: "the topic you're studying", sources: "the course materials",
      entity: "your lesson", task: "a practice set", artifact: "study plan",
      dataset: "your coursework", skill: "the concept",
      question: "Can you explain how photosynthesis works?",
      action: "Quiz me on this chapter",
      products: ["Khanmigo", "ChatGPT Study Mode", "Duolingo Video Call"],
      data: ["curriculum / skill model", "learner progress & memory", "uploaded materials"],
    },
    {
      id: "companion", label: "Companion",
      domain: "whatever's on your mind", sources: "the character's persona",
      entity: "our conversation", task: "a scene", artifact: "story",
      dataset: "chat history", skill: "the roleplay",
      question: "Want to hear about my day?",
      action: "Let's roleplay a job interview",
      products: ["Character.AI", "Replika"],
      data: ["persona definition", "conversation memory", "safety classifiers"],
    },
  ];

  const COMPLEXITY = [
    { id: "low", label: "Low", rank: 1 },
    { id: "medium", label: "Medium", rank: 2 },
    { id: "high", label: "High", rank: 3 },
  ];

  const CHANNELS = [
    { id: "web",      label: "Web chat widget", needs: [] },
    { id: "mobile",   label: "Mobile app",      needs: ["Push notification delivery", "Offline / reconnect handling"] },
    { id: "voice",    label: "Voice",           needs: ["Speech-to-text + TTS", "Low-latency streaming + barge-in"] },
    { id: "email",    label: "Email",           needs: ["Email ingestion + threading", "Async (non-realtime) state"] },
    { id: "embedded", label: "Embedded panel",  needs: ["Host-app SSO / context passing", "Iframe / SDK embed"] },
  ];

  // ——————————————————————————————————————————————
  // Interaction archetype templates
  // ——————————————————————————————————————————————
  const ARCHETYPES = {
    ask: {
      name: "Grounded Q&A assistant",
      preview: "ask",
      complexityFloor: "low",
      riskBase: 2,
      description: (u) => `Answers natural-language questions about ${u.domain} in prose, pulling from ${u.sources} and citing where each answer comes from. The conversational surface most people picture when they say "AI chatbot."`,
      userGoal: (u) => `Get a trustworthy answer about ${u.domain} without reading docs or waiting for a person.`,
      botBehavior: "Interprets the question, retrieves relevant passages, composes a grounded answer with citations, and offers a clarifying question or handoff when confidence is low.",
      firstMessage: (u) => `Hi — ask me anything about ${u.domain}. I'll pull from ${u.sources} and show you where it came from.`,
      ui: ["Free-text input", "Streamed prose answer", "Source citations", "Suggested follow-up chips", "Thumbs up / down feedback", "Escalate-to-human link"],
      data: ["Indexed knowledge base", "Embeddings + vector store", "Source metadata for citations"],
      integ: ["Retrieval / search API", "LLM endpoint", "Feedback + analytics logging"],
      risks: ["Hallucinated or out-of-date answers presented confidently", "Users over-trust unverified prose", "Citations that don't actually support the claim"],
      realWorld: (u) => `Long-tail support and policy help. Seen in ${u.products.join(", ")}.`,
      whenToUse: ["The main value is answering questions, not taking action", "There's a trustworthy corpus to ground answers in", "Questions are open-ended and hard to script"],
      whenNot: ["The task needs an exact, audited outcome (use a flow)", "There is no reliable source to ground on", "The user actually needs to *do* something, not learn something"],
      impl: ["Ground every answer with retrieval; never free-generate facts", "Stream responses for perceived speed", "Always expose the source and an escalation path"],
      guardrails: ["Show citations on every factual claim", "Refuse / defer when retrieval confidence is low", "Log answers for review and feedback"],
    },
    guide: {
      name: "Guided workflow bot",
      preview: "guide",
      complexityFloor: "low",
      riskBase: 1,
      description: (u) => `Walks the user through ${u.task} as a structured, multi-step flow — collecting required fields, validating them, and showing progress the whole way.`,
      userGoal: (u) => `Complete ${u.task} correctly without knowing the form or process in advance.`,
      botBehavior: "Asks for required fields (one at a time or batched via slot filling), validates each input, shows a checklist of remaining steps, and confirms on completion.",
      firstMessage: (u) => `Let's get ${u.task} done together. I'll walk you through it step by step — ready to start?`,
      ui: ["Step checklist / progress bar", "Slot-filling prompts", "Inline validation", "Quick-reply buttons", "Summary + confirm step"],
      data: ["Field schema + validation rules", "Session / state store", "Reference data for lookups"],
      integ: ["Backend submit API", "Validation services", "CRM / ticketing system"],
      risks: ["Rigid flow traps users who don't fit the script", "No clear way to skip, go back, or correct", "Validation errors that don't explain how to fix them"],
      realWorld: (u) => `Onboarding, issue intake, and qualification. Seen in ${u.products.join(", ")}.`,
      whenToUse: ["The process needs named, validated fields", "Compliance or accuracy requires a fixed path", "Onboarding, intake, or qualification flows"],
      whenNot: ["Questions are open-ended (use Ask)", "The path branches in unpredictable ways", "Speed matters more than completeness"],
      impl: ["Use slot filling so users can answer several fields at once", "Always allow back / edit / skip", "Confirm the full summary before submitting"],
      guardrails: ["Validate every field before advancing", "Persist progress so refreshes don't lose state", "Never auto-submit without an explicit confirm"],
    },
    do: {
      name: "Agentic action bot",
      preview: "do",
      complexityFloor: "high",
      riskBase: 3,
      description: (u) => `Turns conversation into action on ${u.entity} — calling tools and APIs to actually change something rather than just describing how.`,
      userGoal: (u) => `Get something done with ${u.entity}, not just be told how to do it.`,
      botBehavior: "Plans the steps, proposes each action as a card, requires explicit confirmation before any high-impact write, executes via tools, and reports the result.",
      firstMessage: (u) => `I can take care of ${u.entity} for you. Tell me what you need — I'll show you the action and ask before I run it.`,
      ui: ["Action cards", "Explicit confirm / cancel", "In-progress + result states", "Undo / receipt", "Audit trail"],
      data: ["Tool / function schemas", "User permissions & auth scope", "Transaction logs"],
      integ: ["Function calling / tool APIs", "Auth & authorization", "Backend systems of record"],
      risks: ["Irreversible actions taken without clear confirmation", "Permission / scope creep beyond the user's intent", "Silent failures the user can't see or undo"],
      realWorld: (u) => `Order, ticket, and workflow automation. Seen in ${u.products.join(", ")}.`,
      whenToUse: ["The user needs to change state, not just read it", "Actions are well-defined and tool-backed", "Time saved by acting outweighs the review cost"],
      whenNot: ["Actions are high-stakes and irreversible without review", "Tool reliability or auth isn't solid yet", "A simple link to the real screen would be safer"],
      impl: ["Gate every write behind an explicit confirm card", "Require human approval for high-impact actions", "Make every action auditable and reversible where possible"],
      guardrails: ["Confirm before any irreversible action", "Scope auth to exactly what the task needs", "Surface a receipt + undo for every executed action"],
    },
    create: {
      name: "Generative creation assistant",
      preview: "create",
      complexityFloor: "medium",
      riskBase: 2,
      description: (u) => `Produces a new ${u.artifact} from a prompt — shown in a preview pane for review, regeneration, and editing before it's used.`,
      userGoal: (u) => `Produce a usable ${u.artifact} fast, then refine it.`,
      botBehavior: "Takes a prompt (plus optional context or files), generates content, shows it in a preview pane, and supports regenerate / edit-in-place / accept.",
      firstMessage: (u) => `What should we make? Describe the ${u.artifact} you have in mind and I'll draft a first version.`,
      ui: ["Prompt input + context attach", "Generated content preview", "Regenerate / variations", "Edit-in-place", "Accept / export"],
      data: ["Prompt templates", "Brand / style guidelines", "Optional reference uploads"],
      integ: ["LLM / generation model", "Asset storage", "Export / publish targets"],
      risks: ["Output that's plausible but factually or legally wrong", "Off-brand or inconsistent tone", "Users shipping drafts without review"],
      realWorld: (u) => `Drafting, summarizing, and asset generation. Seen across generative copilots in this space.`,
      whenToUse: ["A first draft saves real time", "Output is reviewed before it's used", "The task is open-ended creation, not lookup"],
      whenNot: ["Output is used unedited in high-stakes contexts", "There's a single correct answer (use Ask)", "Brand / legal review can't keep up"],
      impl: ["Always show output for review before use", "Offer variations and edit-in-place, not just regenerate", "Seed prompts with brand + style context"],
      guardrails: ["Mark output as draft until a human accepts it", "Constrain with brand / style guidelines", "Keep a version history for every generation"],
    },
    analyze: {
      name: "Search & analytics copilot",
      preview: "analyze",
      complexityFloor: "medium",
      riskBase: 2,
      description: (u) => `Answers questions about ${u.domain} — turning natural language into queries over a governed model and returning charts, tables, and a written summary.`,
      userGoal: (u) => `Find an insight in ${u.domain} without writing a query or knowing the schema.`,
      botBehavior: "Parses the question into a query against a governed data model, runs it, and returns a visualization plus a narrative summary with drill-down follow-ups.",
      firstMessage: (u) => `Ask me about ${u.domain} and I'll chart it for you. Try: "${u.question}"`,
      ui: ["Free-text query", "Chart / table output", "Narrative summary", "Drill-down follow-ups", "Export / save view"],
      data: ["Governed semantic / data model", "Metric definitions", "Query permissions"],
      integ: ["BI / data warehouse", "NL→query engine", "Visualization library"],
      risks: ["Wrong query silently returns a confident-looking chart", "Ambiguous metrics interpreted inconsistently", "Permission leaks exposing restricted rows"],
      realWorld: (u) => `Website search, BI, and decision support. Seen in ${u.products.join(", ")}.`,
      whenToUse: ["The product's value is discovery and insight", "There's a governed model with defined metrics", "Users can't or won't write queries themselves"],
      whenNot: ["Metrics aren't governed or agreed on", "Precision is critical and queries can't be verified", "The answer is a single fact (use Ask)"],
      impl: ["Query only governed models with defined metrics", "Show the query / assumptions behind every chart", "Enforce row-level permissions on every result"],
      guardrails: ["Expose the generated query for verification", "Respect row-level security", "State assumptions when the question is ambiguous"],
    },
    coach: {
      name: "Tutor / coach",
      preview: "coach",
      complexityFloor: "medium",
      riskBase: 2,
      description: (u) => `Guides practice of ${u.skill} through Socratic dialogue and feedback rather than handing over answers — often with a dedicated practice mode.`,
      userGoal: (u) => `Build understanding of ${u.skill} through guided practice and feedback.`,
      botBehavior: "Asks questions instead of giving answers, gives targeted feedback, tracks progress across the session, and offers a practice / roleplay mode.",
      firstMessage: (u) => `Ready to work on ${u.skill}? I'll ask the questions — you think it through. Want hints available?`,
      ui: ["Conversational feedback", "Practice / roleplay mode toggle", "Progress & streaks", "Hints (reveal on demand)", "Session recap"],
      data: ["Curriculum / skill model", "Learner progress + memory", "Optional uploaded materials"],
      integ: ["LLM with memory", "Content / curriculum store", "Progress tracking"],
      risks: ["Gives away answers and short-circuits learning", "Incorrect feedback reinforces mistakes", "No memory means no sense of progress"],
      realWorld: (u) => `Learning, onboarding, and guided practice. Seen in ${u.products.join(", ")}.`,
      whenToUse: ["The goal is skill-building, not just answers", "Practice and feedback loops add value", "Progress over a session matters"],
      whenNot: ["The user just wants the answer fast (use Ask)", "Feedback quality can't be trusted", "There's no curriculum or skill model to anchor on"],
      impl: ["Default to questions, reveal answers only on request", "Track progress and recap each session", "Offer a low-pressure practice / roleplay mode"],
      guardrails: ["Withhold direct answers by default", "Flag low-confidence feedback", "Keep tone supportive and age-appropriate"],
    },
    monitor: {
      name: "Proactive monitor",
      preview: "monitor",
      complexityFloor: "medium",
      riskBase: 2,
      description: (u) => `Initiates contact based on events around ${u.entity} — surfacing alerts, status changes, and next-best actions instead of waiting to be asked.`,
      userGoal: (u) => `Be told what changed with ${u.entity} and what to do next, without polling for it.`,
      botBehavior: "Watches events and thresholds, pushes alert cards with severity and context, recommends a next action, and lets the user act, snooze, or acknowledge.",
      firstMessage: (u) => `I'm keeping an eye on ${u.entity}. I'll reach out the moment something needs your attention.`,
      ui: ["Alert cards (with severity)", "Status timeline", "Next-best-action buttons", "Snooze / acknowledge", "Subscription settings"],
      data: ["Event stream / thresholds", "Subscription preferences", "Per-alert context"],
      integ: ["Event / webhook source", "Notification delivery", "Action APIs"],
      risks: ["Alert fatigue from too many low-value pings", "Missed critical events (false negatives)", "Proactive messages that feel intrusive"],
      realWorld: (u) => `Customer care, alerts, and next-best-action. Seen across proactive CX platforms.`,
      whenToUse: ["Timeliness matters more than the user asking", "Events are well-defined and meaningful", "A clear next action follows each alert"],
      whenNot: ["Events are noisy or low-signal", "Users haven't opted into proactive contact", "There's no action to take on an alert"],
      impl: ["Tune thresholds hard to avoid alert fatigue", "Bundle related alerts; rank by severity", "Always pair an alert with a next action + snooze"],
      guardrails: ["Respect opt-in and quiet hours", "Rate-limit and de-duplicate alerts", "Make severity and source obvious on every alert"],
    },
    escalate: {
      name: "Handoff & escalation agent",
      preview: "escalate",
      complexityFloor: "low",
      riskBase: 1,
      description: (u) => `Recognizes when confidence, policy, or emotion requires a human and transfers the conversation about ${u.entity} — with full context — to staff.`,
      userGoal: (u) => `Reach a person quickly without repeating everything already said.`,
      botBehavior: "Detects escalation triggers, summarizes the transcript and collected data, routes to the right queue, and keeps the user informed of wait status.",
      firstMessage: (u) => `I want to make sure you get the right help with ${u.entity}. Let me pull together what we've covered and connect you with a person.`,
      ui: ["Transcript summary", "Handoff status / queue position", "Context hand-card for the agent", "Resume-with-bot option", "Post-handoff survey"],
      data: ["Conversation transcript + variables", "Routing rules / skills", "Agent availability"],
      integ: ["Live-agent platform (Zendesk / Intercom)", "Routing engine", "CRM context sync"],
      risks: ["Dead-end when no agent is available", "Context lost in the handoff — user repeats themselves", "Escalating too late after user frustration peaks"],
      realWorld: (u) => `Sensitive cases and failure recovery. Seen in ${u.products.join(", ")}.`,
      whenToUse: ["Confidence, policy, or emotion calls for a human", "There's a live-agent team to hand off to", "Context can be carried across the handoff"],
      whenNot: ["No human is available to receive the handoff", "The bot can safely resolve it itself", "Handoff is used to mask a broken bot flow"],
      impl: ["Detect triggers early — don't wait for frustration", "Carry full transcript + variables to the agent", "Show queue status and offer a callback"],
      guardrails: ["Never dead-end — always offer a fallback", "Transfer full context so users don't repeat", "Honor explicit 'talk to a human' requests immediately"],
    },
  };

  const RANKS = ["", "Low", "Medium", "High"];

  function botTypeRiskBump(botTypeId) {
    if (botTypeId === "agentic" || botTypeId === "multiagent") return 1;
    if (botTypeId === "generative") return 1; // ungrounded generation adds risk
    return 0;
  }

  function botTypeData(botTypeId) {
    switch (botTypeId) {
      case "rag":        return ["Vector store + freshness pipeline"];
      case "agentic":    return ["Tool / action permission model"];
      case "multiagent": return ["Shared memory across agents"];
      case "intent":     return ["Labelled intent + entity training data"];
      default:           return [];
    }
  }
  function botTypeInteg(botTypeId) {
    switch (botTypeId) {
      case "rag":        return ["Document ingestion + re-indexing"];
      case "agentic":    return ["Tool auth + rate limiting"];
      case "multiagent": return ["Agent orchestration layer"];
      case "deterministic": return ["Flow / decision-tree authoring tool"];
      default:           return [];
    }
  }

  function uniq(arr) { return Array.from(new Set(arr)); }

  // ——————————————————————————————————————————————
  // Generate the archetype from a selection
  // ——————————————————————————————————————————————
  function generate(sel) {
    const bot = BOT_TYPES.find((b) => b.id === sel.botType) || BOT_TYPES[0];
    const it = INTERACTIONS.find((i) => i.id === sel.interaction) || INTERACTIONS[0];
    const uc = USE_CASES.find((u) => u.id === sel.useCase) || USE_CASES[0];
    const cx = COMPLEXITY.find((c) => c.id === sel.complexity) || COMPLEXITY[0];
    const ch = CHANNELS.find((c) => c.id === sel.channel) || CHANNELS[0];

    const A = ARCHETYPES[it.id];

    // Risk: base + bot-type bump, clamped 1..3
    let riskRank = Math.min(3, Math.max(1, A.riskBase + botTypeRiskBump(bot.id)));
    // sensitive domains nudge risk up by one (clamped)
    if ((uc.id === "support" || uc.id === "employee" || uc.id === "commerce") && riskRank < 3 && (bot.id === "agentic" || bot.id === "multiagent")) {
      riskRank = Math.min(3, riskRank + 1);
    }

    const floorRank = COMPLEXITY.find((c) => c.id === A.complexityFloor).rank;
    const overEngineered = cx.rank > floorRank + 1;
    const underPowered = cx.rank < floorRank;

    // Example prompts: question vs action depending on interaction nature
    const actionish = ["do", "guide", "monitor", "escalate"].includes(it.id);
    const userPrompt = it.id === "create" ? `Draft a ${uc.artifact} for ${uc.entity}.`
      : it.id === "coach" ? `Help me understand ${uc.skill}.`
      : actionish ? uc.action
      : uc.question;

    const archetypeName = `${bot.label} · ${A.name}`;

    return {
      // headline
      name: A.name,
      fullName: archetypeName,
      botLabel: bot.label,
      interactionLabel: it.label,
      useCaseLabel: uc.label,
      channelLabel: ch.label,
      preview: A.preview,

      // details
      description: A.description(uc),
      userGoal: A.userGoal(uc),
      botBehavior: A.botBehavior,
      firstMessage: A.firstMessage(uc),
      userPrompt,
      ui: A.ui,
      data: uniq([...A.data, ...botTypeData(bot.id), ...uc.data.slice(0, 1)]),
      integ: uniq([...A.integ, ...botTypeInteg(bot.id), ...ch.needs]),
      complexity: cx.label,
      complexityFloor: RANKS[floorRank],
      overEngineered,
      underPowered,
      risk: RANKS[riskRank],
      riskRank,

      // bottom card
      uxRisks: A.risks,

      // drawer
      realWorld: A.realWorld(uc),
      realWorldProducts: uc.products,
      whenToUse: A.whenToUse,
      whenNot: A.whenNot,
      impl: [...A.impl, ...(ch.id === "voice" ? ["Design for speech: short turns, confirmations, barge-in"] : [])],
      guardrails: A.guardrails,

      // echo selection + content for previews
      sel: { bot, it, uc, cx, ch },
    };
  }

  window.TAXONOMY = {
    options: { BOT_TYPES, INTERACTIONS, USE_CASES, COMPLEXITY, CHANNELS },
    generate,
  };
})();
