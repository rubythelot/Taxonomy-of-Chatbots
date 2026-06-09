import React from "react";

function Line({ w = "100%", h = 8 }) {
  return <span className="wire-line" style={{ width: w, height: h }} />;
}

function Lines({ widths }) {
  return (
    <span className="wire-lines">
      {widths.map((w, index) => (
        <Line key={index} w={w} />
      ))}
    </span>
  );
}

function Avatar({ label }) {
  return <span className="wire-avatar">{label}</span>;
}

function Bubble({ side = "bot", children }) {
  return (
    <div className={`wire-row ${side}`}>
      {side === "bot" ? <Avatar label="B" /> : null}
      <div className={`wire-bubble ${side}`}>{children}</div>
      {side === "user" ? <Avatar label="U" /> : null}
    </div>
  );
}

function Chip({ children }) {
  return <span className="wire-chip">{children}</span>;
}

function Button({ children, solid }) {
  return <span className={`wire-button ${solid ? "solid" : ""}`}>{children}</span>;
}

function PreviewShell({ title, status = "online", children, input }) {
  return (
    <div className="chat-preview" aria-label={`${title} preview`}>
      <div className="preview-topbar">
        <Avatar label="B" />
        <div className="preview-title">{title}</div>
        <div className="preview-status">
          <span />
          {status}
        </div>
      </div>
      <div className="preview-body">{children}</div>
      {input ? <div className="preview-input">{input}</div> : null}
    </div>
  );
}

function Input({ placeholder = "Type a message", action = "Send" }) {
  return (
    <>
      <span className="input-field">{placeholder}</span>
      <Button solid>{action}</Button>
    </>
  );
}

function truncate(value, length) {
  return value && value.length > length ? `${value.slice(0, length - 1)}...` : value;
}

export function getPreviewPattern(g) {
  const { bot, it, cx } = g.sel;

  if (bot.id === "multiagent") {
    return {
      id: "multiagent",
      label: "Multi-agent workspace",
      reason: "Multi-agent systems need a workspace view because the user has to see roles, delegation, and synthesized output.",
    };
  }
  if (it.id === "escalate") {
    return {
      id: "handoff",
      label: "Human handoff",
      reason: "Escalation patterns are about preserving context, showing queue state, and transferring the conversation to a person.",
    };
  }
  if (it.id === "monitor") {
    return {
      id: "monitor",
      label: "Proactive monitor",
      reason: "Monitor patterns start from events, so the interface centers alerts, severity, timelines, and next-best actions.",
    };
  }
  if (it.id === "do" || bot.id === "agentic") {
    return {
      id: "action",
      label: "Tool execution",
      reason: "Action patterns need confirmation cards, progress states, receipts, and undo because the bot can change system state.",
    };
  }
  if (it.id === "analyze") {
    return {
      id: "analytics",
      label: "Analytics copilot",
      reason: "Analyze patterns pair natural language with charts, tables, assumptions, and drill-down controls.",
    };
  }
  if (it.id === "create") {
    return {
      id: "creation",
      label: "Creation assistant",
      reason: "Creation patterns need a prompt surface and a reviewable draft before the output is accepted or exported.",
    };
  }
  if (it.id === "guide" && cx.id === "high") {
    return {
      id: "cards",
      label: "Rich cards / carousel",
      reason: "High-complexity guided flows often need cards or widgets so users can compare options without leaving the chat.",
    };
  }
  if (it.id === "coach" && cx.id === "high") {
    return {
      id: "voice",
      label: "Voice-first coach",
      reason: "High-complexity coaching benefits from spoken practice, interruption, and transcript support.",
    };
  }
  if (it.id === "coach") {
    return {
      id: "coach",
      label: "Tutor / coach",
      reason: "Coach patterns emphasize practice mode, hints, feedback, and progress rather than direct answers.",
    };
  }
  if (it.id === "guide" && bot.id === "deterministic") {
    return {
      id: "menu",
      label: "Button / menu flow",
      reason: "Deterministic guided flows work best as menus because the business needs controlled paths and predictable outcomes.",
    };
  }
  if (it.id === "guide") {
    return {
      id: "intake",
      label: "Structured intake",
      reason: "Guided workflows need progress, field collection, validation, and a final confirmation step.",
    };
  }
  if (bot.id === "deterministic") {
    return {
      id: "menu",
      label: "Button / menu flow",
      reason: "Deterministic systems should expose clear choices instead of pretending to understand every open-ended request.",
    };
  }
  if (cx.id === "high" && it.id === "ask") {
    return {
      id: "multimodal",
      label: "Multimodal support",
      reason: "High-complexity Q&A often needs files, screenshots, or documents as context, so the interface makes evidence visible.",
    };
  }
  return {
    id: "qna",
    label: "Grounded Q&A",
    reason: "Ask patterns work best when answers are grounded, cite sources, and offer follow-ups or handoff.",
  };
}

function MenuPreview({ g }) {
  return (
    <PreviewShell title="Button flow" input={<Input placeholder="Choose an option or type" />}>
      <Bubble>{truncate(g.firstMessage, 96)}</Bubble>
      <div className="menu-grid">
        <Button solid>{g.sel.uc.label}</Button>
        <Button>Status lookup</Button>
        <Button>Eligibility</Button>
        <Button>Talk to a human</Button>
      </div>
      <div className="flow-map">
        <span className="active">Start</span>
        <span>Route</span>
        <span>Resolve</span>
      </div>
      <Bubble>
        <Lines widths={["86%", "64%"]} />
      </Bubble>
    </PreviewShell>
  );
}

function AskPreview({ g }) {
  return (
    <PreviewShell title="Grounded Q&A" input={<Input />}>
      <Bubble>{truncate(g.firstMessage, 116)}</Bubble>
      <Bubble side="user">{g.userPrompt}</Bubble>
      <Bubble>
        <Lines widths={["100%", "94%", "76%"]} />
        <div className="citation-row">
          <span>1</span>
          <Line w="72px" h={7} />
          <span>2</span>
          <Line w="58px" h={7} />
        </div>
      </Bubble>
      <div className="chip-row">
        <Chip>Follow up</Chip>
        <Chip>Source</Chip>
        <Chip>Handoff</Chip>
      </div>
    </PreviewShell>
  );
}

function CardsPreview({ g }) {
  const cardTitles = g.sel.uc.id === "commerce"
    ? ["Best match", "Budget pick", "Premium option"]
    : ["Option A", "Option B", "Option C"];

  return (
    <PreviewShell title="Rich card concierge" input={<Input placeholder="Compare options" />}>
      <Bubble>{truncate(g.firstMessage, 92)}</Bubble>
      <div className="carousel-row">
        {cardTitles.map((title, index) => (
          <article className="product-card" key={title}>
            <div className="product-media" />
            <strong>{title}</strong>
            <Lines widths={index === 0 ? ["90%", "62%"] : ["76%", "58%"]} />
            <div className="action-buttons">
              <Button solid={index === 0}>Select</Button>
              <Button>Compare</Button>
            </div>
          </article>
        ))}
      </div>
      <div className="chip-row">
        <Chip>Filter</Chip>
        <Chip>Compare all</Chip>
        <Chip>Checkout</Chip>
      </div>
    </PreviewShell>
  );
}

function MultimodalPreview({ g }) {
  return (
    <PreviewShell title="Multimodal support" input={<Input placeholder="Add a file or ask a question" />}>
      <div className="attachment-card">
        <div className="file-tile">PDF</div>
        <div>
          <div className="mini-label">Context attached</div>
          <strong>{g.sel.uc.label} reference</strong>
          <small>Extracting text, images, and source anchors</small>
        </div>
      </div>
      <Bubble side="user">{g.userPrompt}</Bubble>
      <Bubble>
        <Lines widths={["100%", "88%", "70%"]} />
        <div className="citation-row">
          <span>1</span>
          <Line w="74px" h={7} />
          <span>IMG</span>
          <Line w="54px" h={7} />
        </div>
      </Bubble>
      <div className="chip-row">
        <Chip>Show evidence</Chip>
        <Chip>Zoom source</Chip>
        <Chip>Ask follow-up</Chip>
      </div>
    </PreviewShell>
  );
}

function GuidePreview({ g }) {
  return (
    <PreviewShell title="Guided workflow" input={<Input placeholder="Enter your answer" action="Next" />}>
      <div className="progress-row">
        <span className="progress-track">
          <span />
        </span>
        <span>Step 2 of 5</span>
      </div>
      <div className="checklist">
        {["done", "active", "", ""].map((state, index) => (
          <div className={`check ${state}`} key={index}>
            <span>{state === "done" ? "✓" : ""}</span>
            <Line w={index === 1 ? "150px" : "110px"} h={7} />
          </div>
        ))}
      </div>
      <Bubble>{truncate(g.firstMessage, 94)}</Bubble>
      <div className="chip-row">
        <Chip>Option A</Chip>
        <Chip>Option B</Chip>
        <Chip>Skip</Chip>
      </div>
    </PreviewShell>
  );
}

function VoicePreview({ g }) {
  return (
    <PreviewShell title="Voice-first coach" status="listening">
      <div className="voice-stage">
        <div className="voice-meter">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <strong>Listening</strong>
        <p>{truncate(g.firstMessage, 96)}</p>
      </div>
      <div className="transcript-panel">
        <div>
          <span>User</span>
          <Line w="74%" h={8} />
        </div>
        <div>
          <span>Coach</span>
          <Line w="92%" h={8} />
        </div>
      </div>
      <div className="action-buttons">
        <Button>Interrupt</Button>
        <Button>Switch to text</Button>
        <Button solid>Practice next</Button>
      </div>
    </PreviewShell>
  );
}

function DoPreview({ g }) {
  return (
    <PreviewShell title="Action bot" input={<Input placeholder="Ask me to do something" />}>
      <Bubble side="user">{g.userPrompt}</Bubble>
      <div className="action-card">
        <div className="action-card-head">
          <span>ACTION</span>
          <Line w="128px" h={7} />
        </div>
        <div className="kv-row">
          <Line w="52px" h={6} />
          <Line w="118px" h={6} />
        </div>
        <div className="action-buttons">
          <Button solid>Confirm</Button>
          <Button>Cancel</Button>
        </div>
      </div>
      <div className="action-card muted">
        <div className="action-card-head">
          <span>DONE</span>
          <Line w="96px" h={7} />
        </div>
        <div className="action-buttons">
          <Button>Receipt</Button>
          <Button>Undo</Button>
        </div>
      </div>
    </PreviewShell>
  );
}

function MultiAgentPreview({ g }) {
  return (
    <PreviewShell title="Multi-agent workspace" status="orchestrating">
      <div className="agent-board">
        {["Planner", "Research", "Action"].map((agent, index) => (
          <article className="agent-card" key={agent}>
            <span>{agent}</span>
            <Lines widths={index === 0 ? ["84%", "62%"] : ["74%", "90%"]} />
          </article>
        ))}
      </div>
      <div className="handoff-strip">
        <span>Plan</span>
        <Line w="70px" h={7} />
        <span>Delegate</span>
        <Line w="70px" h={7} />
        <span>Synthesize</span>
      </div>
      <div className="action-card muted">
        <div className="action-card-head">
          <span>SHARED OUTPUT</span>
          <Line w="120px" h={7} />
        </div>
        <Lines widths={["96%", "80%"]} />
      </div>
    </PreviewShell>
  );
}

function CreatePreview({ g }) {
  return (
    <PreviewShell title="Creation assistant">
      <div className="split-preview">
        <div>
          <div className="mini-label">Prompt</div>
          <div className="prompt-box">{truncate(g.userPrompt, 68)}</div>
          <Button solid>Generate</Button>
        </div>
        <div>
          <div className="mini-label">Draft</div>
          <div className="output-box">
            <Lines widths={["94%", "100%", "82%", "66%"]} />
          </div>
          <div className="action-buttons">
            <Button>Regenerate</Button>
            <Button solid>Accept</Button>
          </div>
        </div>
      </div>
    </PreviewShell>
  );
}

function AnalyzePreview({ g }) {
  const bars = [40, 72, 56, 92, 64];
  return (
    <PreviewShell title="Analytics copilot" input={<Input placeholder="Ask about your data" action="Run" />}>
      <Bubble side="user">{g.userPrompt}</Bubble>
      <div className="chart-card">
        <div className="bars">
          {bars.map((height, index) => (
            <span key={index} style={{ height: `${height}%` }} />
          ))}
        </div>
        <div className="table-lines">
          <div>
            <Line w="90px" h={6} />
            <Line w="42px" h={6} />
          </div>
          <div>
            <Line w="116px" h={6} />
            <Line w="38px" h={6} />
          </div>
        </div>
      </div>
      <div className="chip-row">
        <Chip>Drill down</Chip>
        <Chip>Save view</Chip>
      </div>
    </PreviewShell>
  );
}

function CoachPreview({ g }) {
  return (
    <PreviewShell title="Tutor / coach" input={<Input placeholder="Your answer" />}>
      <div className="coach-toolbar">
        <span className="toggle"><span />Practice mode</span>
        <span className="dots"><i /><i /><i /><i /><i /></span>
      </div>
      <Bubble>{truncate(g.firstMessage, 104)}</Bubble>
      <Bubble side="user">
        <Lines widths={["100%", "64%"]} />
      </Bubble>
      <Bubble>
        <span className="mini-label">Feedback</span>
        <Lines widths={["92%", "70%"]} />
      </Bubble>
      <div className="chip-row">
        <Chip>Hint</Chip>
        <Chip>Try again</Chip>
        <Chip>Recap</Chip>
      </div>
    </PreviewShell>
  );
}

function MonitorPreview() {
  return (
    <PreviewShell title="Proactive monitor" status="watching">
      <div className="alert-card high">
        <div className="action-card-head">
          <span>HIGH</span>
          <Line w="118px" h={7} />
        </div>
        <Lines widths={["100%", "72%"]} />
        <div className="action-buttons">
          <Button solid>Resolve</Button>
          <Button>Snooze</Button>
        </div>
      </div>
      <div className="alert-card">
        <div className="action-card-head">
          <span>LOW</span>
          <Line w="96px" h={7} />
        </div>
        <Button>Acknowledge</Button>
      </div>
      <div className="timeline">
        <span /><span /><span />
      </div>
    </PreviewShell>
  );
}

function EscalatePreview({ g }) {
  return (
    <PreviewShell title="Escalation agent" status="handoff">
      <Bubble>{truncate(g.firstMessage, 112)}</Bubble>
      <div className="action-card">
        <div className="action-card-head">
          <span>TRANSCRIPT</span>
        </div>
        <Lines widths={["100%", "86%", "58%"]} />
      </div>
      <div className="handoff-box">
        <span className="spinner" />
        <div>
          <strong>Connecting to a person</strong>
          <small>Queue position 2 / about 3 min</small>
        </div>
      </div>
      <div className="chip-row">
        <Chip>Callback</Chip>
        <Chip>Keep using bot</Chip>
      </div>
    </PreviewShell>
  );
}

const PREVIEWS = {
  action: DoPreview,
  analytics: AnalyzePreview,
  cards: CardsPreview,
  coach: CoachPreview,
  creation: CreatePreview,
  handoff: EscalatePreview,
  intake: GuidePreview,
  menu: MenuPreview,
  monitor: MonitorPreview,
  multimodal: MultimodalPreview,
  multiagent: MultiAgentPreview,
  qna: AskPreview,
  voice: VoicePreview,
};

export default function ChatPreview({ g }) {
  const pattern = getPreviewPattern(g);
  const Component = PREVIEWS[pattern.id] || AskPreview;
  return <Component g={g} />;
}
