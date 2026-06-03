const STEPS = [
  { n: "01", t: "Plan", d: "Decomposes your question into a multi-step investigation." },
  { n: "02", t: "Gather", d: "Searches and scrapes the open web, keeping every citation." },
  { n: "03", t: "Remember", d: "Builds a private, in-session memory of what it finds." },
  { n: "04", t: "Report", d: "Returns a sourced dossier — with privacy receipts." },
];

const FEATURES = [
  {
    k: "Signature",
    t: "Privacy receipts",
    d: "Every step records which model ran, its privacy tier, and whether E2EE actually applied — read from the response, never assumed.",
  },
  {
    k: "Two modes",
    t: "Recon & Vault",
    d: "Recon (tools on, private-tier models) for legwork; Vault (E2EE models, no tools) for the most sensitive synthesis.",
  },
  {
    k: "No refusals",
    t: "Uncensored when needed",
    d: "Handles legitimate-but-hard work — security research, sensitive journalism, legal and medical — that mainstream agents refuse.",
  },
  {
    k: "Economics",
    t: "Self-funding",
    d: "Can pay for its own inference per request via x402 — USDC on Base, no account, no card. The agent owns its brain.",
  },
  {
    k: "Trust",
    t: "Server-side keys",
    d: "The Venice key never touches the browser. Per-run spend caps keep an autonomous loop honest.",
  },
  {
    k: "Composable",
    t: "MCP + Skill",
    d: "Ships as an MCP server and a Venice Agent Skill — fork it into Cursor, Claude, or your own fleet of agents.",
  },
];

export default function Home() {
  return (
    <main>
      {/* ---------- hero ---------- */}
      <section className="hero">
        <div className="container">
          <div className="mark" data-reveal style={{ animationDelay: "0.05s" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/obscura-logo.png" alt="Obscura Agent" className="brand-mark spin" />
          </div>
          <h1 className="brand" data-reveal style={{ animationDelay: "0.5s" }}>
            Obscura&nbsp;Agent
          </h1>
          <p className="lede tagline" data-reveal style={{ animationDelay: "0.75s" }}>
            The autonomous research agent that investigates anything legitimate, refuses nothing
            legitimate, and <em>leaves no trace</em>.
          </p>
          <div className="meta" data-reveal style={{ animationDelay: "1s" }}>
            <span>Private</span>
            <span className="dot" />
            <span>Uncensored</span>
            <span className="dot" />
            <span>Cited</span>
            <span className="dot" />
            <span>
              Powered by <span className="venice">Venice</span>
            </span>
          </div>

          <div className="cta-row" data-reveal style={{ animationDelay: "1.15s" }}>
            <a className="cta cta-primary" href="/app">
              Launch the agent →
            </a>
            <a className="cta cta-ghost" href="/docs">
              Read the docs
            </a>
          </div>
        </div>
        <a className="scroll-cue" href="#how">
          how it works ↓
        </a>
      </section>

      {/* ---------- how it works ---------- */}
      <section className="section" id="how">
        <div className="container">
          <div className="section-head" data-reveal>
            <span className="eyebrow">How it works</span>
            <h2>A real agent, not a single prompt.</h2>
          </div>
          <div className="steps">
            {STEPS.map((s) => (
              <div className="step" key={s.n}>
                <span className="num">{s.n}</span>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- why ---------- */}
      <section className="section" id="why">
        <div className="container">
          <div className="section-head" data-reveal>
            <span className="eyebrow">Why it's different</span>
            <h2>Privacy you can verify. Reach others won't touch.</h2>
          </div>
          <div className="features">
            {FEATURES.map((f) => (
              <div className="feature" key={f.t}>
                <span className="k">{f.k}</span>
                <h3>{f.t}</h3>
                <p>{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- closing cta ---------- */}
      <section className="section closing">
        <div className="container">
          <h2>Investigate anything. Leave no trace.</h2>
          <div className="cta-row">
            <a className="cta cta-primary" href="/app">
              Launch the agent →
            </a>
            <a className="cta cta-ghost" href="/docs">
              Read the docs
            </a>
          </div>
        </div>
      </section>

      {/* ---------- footer ---------- */}
      <footer className="section">
        <div className="container footer">
          <span>
            Obscura Agent — leaves no trace · powered by <span className="venice">Venice</span>
          </span>
          <span>
            <a href="https://github.com/obscura-agents/obscura-agent" target="_blank" rel="noreferrer">
              GitHub
            </a>
            {"  ·  MCP  ·  Skill"}
          </span>
        </div>
      </footer>
    </main>
  );
}
