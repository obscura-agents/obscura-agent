import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Docs — Obscura Agent",
  description: "How to use, self-host, and build on Obscura Agent.",
};

const NAV = [
  {
    group: "Getting started",
    links: [
      { href: "#overview", label: "Overview" },
      { href: "#quickstart", label: "Quickstart" },
      { href: "#selfhost", label: "Self-host" },
    ],
  },
  {
    group: "Using it",
    links: [
      { href: "#modes", label: "Investigation modes" },
      { href: "#receipts", label: "Privacy Receipts" },
      { href: "#features", label: "Features" },
      { href: "#funding", label: "Funding & access" },
    ],
  },
  {
    group: "Build",
    links: [
      { href: "#api", label: "HTTP API" },
      { href: "#mcp", label: "MCP server" },
      { href: "#skill", label: "Venice Skill" },
    ],
  },
  {
    group: "Help",
    links: [{ href: "#faq", label: "FAQ" }],
  },
];

export default function Docs() {
  return (
    <main className="docs-layout">
      <aside className="docs-side">
        <nav>
          {NAV.map((g) => (
            <div className="docs-group" key={g.group}>
              <span className="docs-group-title">{g.group}</span>
              {g.links.map((l) => (
                <a key={l.href} href={l.href}>
                  {l.label}
                </a>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <article className="doc">
        <span className="eyebrow">Documentation</span>
        <h1>Obscura Agent</h1>
        <p className="lede">
          The autonomous research agent that leaves no trace. Everything you need to use it,
          self-host it, or build on it.
        </p>

        <h2 id="overview">Overview</h2>
        <p>
          Give Obscura Agent a question. It runs a real planner→executor loop on{" "}
          <a href="https://venice.ai">Venice</a>: it plans, searches and scrapes the web (with
          citations), builds a private in-session memory, optionally dispatches parallel specialist
          agents, adversarially verifies each finding, and returns a sourced dossier — emitting an
          honest <strong>Privacy Receipt</strong> for every step.
        </p>

        <h2 id="quickstart">Quickstart</h2>
        <h3>Try it — no key needed</h3>
        <p>
          On the home page, click <strong>“Watch a live demo”</strong>. It replays a real
          investigation so you can see the agent think, verify, and seal a brief — without any
          account or API key.
        </p>
        <h3>Run a real investigation (BYOK)</h3>
        <p>
          In the console, switch the key toggle to <strong>“Your Venice key”</strong> and paste your
          Venice API key. It is stored only in your browser and sent only with your request — never
          logged or stored server-side. Get a key at{" "}
          <a href="https://venice.ai/settings/api">venice.ai/settings/api</a>.
        </p>

        <h2 id="selfhost">Self-host</h2>
        <pre>
          <code>{`git clone https://github.com/obscura-agents/obscura-agent.git
cd obscura-agent
npm install
cp .env.local.example .env.local   # set VENICE_API_KEY (optional — BYOK works too)
npm run dev                         # http://localhost:3000`}</code>
        </pre>

        <h2 id="modes">Investigation modes</h2>
        <p>
          <strong>Recon</strong> (default) — private-tier Venice models with web search, scraping,
          and function calling. This is where the legwork happens.
        </p>
        <p>
          <strong>Vault</strong> — a final, tool-free synthesis routed through an
          end-to-end-encrypted (<code>e2ee-</code>) model with <code>enable_e2ee</code>. The receipt
          reports the value Venice echoes back, so privacy is never over-claimed.
        </p>

        <h2 id="receipts">Privacy Receipts</h2>
        <p>Every step records, honestly, how privacy was handled:</p>
        <ul>
          <li>
            <code>mode</code> — recon or vault
          </li>
          <li>
            <code>model</code> + <code>privacy_tier</code> — the model used and whether it is private
            or anonymized
          </li>
          <li>
            <code>e2ee_applied</code> — read from the echoed{" "}
            <code>venice_parameters.enable_e2ee</code>, not assumed
          </li>
          <li>
            <code>attestation</code> — <code>pending</code> until the live TEE attestation endpoint
            is verified; never claimed as proven before then
          </li>
        </ul>

        <h2 id="features">Features</h2>
        <ul>
          <li>
            <strong>Deep mode (multi-agent)</strong> — a supervisor decomposes your question and runs
            parallel specialist agents.
          </li>
          <li>
            <strong>Adversarial verification</strong> — a skeptic judges each finding (supported /
            refuted / uncertain) against its sources.
          </li>
          <li>
            <strong>Personas</strong> — Investigator, Skeptic, or Analyst styles.
          </li>
          <li>
            <strong>Multimodal briefing</strong> — a cover image + spoken audio summary via Venice.
          </li>
          <li>
            <strong>Evidence graph</strong> — see findings linked to their sources.
          </li>
          <li>
            <strong>Share &amp; history</strong> — shareable dossier links (no backend) + local
            history.
          </li>
          <li>
            <strong>Multimodal inputs</strong> — research over an uploaded document (PDF/DOCX, via
            Venice file input), an image (vision model), or a spoken question (Venice speech-to-text).
          </li>
        </ul>

        <h2 id="funding">Funding &amp; access — no login</h2>
        <p>
          Obscura Agent is <strong>permissionless</strong>. There is no account and no login. Set how
          inference is paid for via <code>OBSCURA_PAYMENT_MODE</code>:
        </p>
        <ul>
          <li>
            <code>apikey</code> — a server <code>VENICE_API_KEY</code> (platform-funded).
          </li>
          <li>
            <strong>BYOK</strong> — users bring their own key in the UI (free to host).
          </li>
          <li>
            <code>x402</code> — the agent pays per request in USDC on Base from a wallet
            (<code>WALLET_PRIVATE_KEY</code>) — no account, built for agents.
          </li>
        </ul>

        <h2 id="api">HTTP API</h2>
        <p>
          <code>POST /api/research</code> with <code>{`{ "question": "…" }`}</code> returns a
          Server-Sent Events stream of <code>status</code>, <code>activity</code>,{" "}
          <code>receipt</code>, <code>plan</code>, <code>dossier</code>, <code>vault</code>,{" "}
          <code>cover</code>, and <code>audio</code> events (terminated by <code>data: [DONE]</code>
          ). Optional body fields: <code>veniceApiKey</code>, <code>deep</code>, <code>model</code>,{" "}
          <code>persona</code>.
        </p>

        <h2 id="mcp">MCP server</h2>
        <p>
          Run <code>npm run mcp</code> to expose a <code>research</code> tool over stdio — drop it
          into Cursor, Claude, or any MCP client.
        </p>

        <h2 id="skill">Venice Skill</h2>
        <p>
          <code>skills/obscura-agent/SKILL.md</code> packages the agent as a Venice Agent Skill so
          other runtimes can discover and use it.
        </p>

        <h2 id="faq">FAQ</h2>
        <p>
          <strong>Do I need an account?</strong> No — no account, no login, ever.
        </p>
        <p>
          <strong>Is it free?</strong> The app is free to host; inference is funded by you (BYOK) or
          by a wallet (x402). The demo needs nothing.
        </p>
        <p>
          <strong>Does it store my data?</strong> No. Venice retains nothing; your key stays in your
          browser; conversation history is local to your device.
        </p>

        <p style={{ marginTop: "3rem" }}>
          <a href="/" className="powered">
            ← Back to the app
          </a>
        </p>
      </article>
    </main>
  );
}
