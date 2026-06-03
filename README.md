# Obscura Agent

**The autonomous research agent that leaves no trace.** Powered by [Venice](https://venice.ai).

Obscura Agent is a privacy-first, agentic research tool built on the Venice.ai API. Give it a
question; it autonomously plans, searches and scrapes the web, builds a private memory, and returns
a **sourced, cited dossier** — while proving, step by step, that nothing leaked.

## Why it's different

- **Genuinely agentic** — a real planner→executor loop using Venice's native function/tool calling
  (not a single prompt or regex routing).
- **Privacy as a visible feature** — every step emits a **Privacy Receipt** (model used, privacy
  tier, whether E2EE actually applied per the echoed response). Two modes: *recon* (tools on,
  private-tier models) and *vault* (Venice `e2ee-`/TEE models, no tools).
- **Uncensored when needed** — handles legitimate-but-hard topics (security research, sensitive
  journalism, legal/medical) that mainstream agents refuse.
- **Server-side keys only** — the Venice API key never reaches the browser; per-run spend caps.
- **Self-funding (planned)** — pay per request via x402 / USDC on Base, so the agent can own its
  own inference budget.

## Tech

TypeScript · Next.js 16 (App Router) · React 19 · Vitest · Venice OpenAI-compatible API.

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then set VENICE_API_KEY
npm run dev                         # http://localhost:3000
```

Get a key at <https://venice.ai/settings/api> (the API needs an active balance — Pro includes free
API credit).

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm test` — run the unit test suite (Vitest, fully mocked — no API key required)
- `npm run typecheck` — `tsc --noEmit`
- `npm run mcp` — run the MCP server over stdio

## Payment modes

Set `OBSCURA_PAYMENT_MODE` (server), or let users bring their own:

- **`apikey`** (default) — authenticate with `VENICE_API_KEY`.
- **`x402`** — *self-funding*: the agent pays per request in USDC on Base from a wallet
  (`WALLET_PRIVATE_KEY`), no API key. Powered by `venice-x402-client` (requests are signed by the
  wallet via an injected fetch, so the full tool-using pipeline works unchanged).
- **BYOK** — users can paste their own Venice key in the console; it's kept only in their browser
  and sent per request (never stored or logged), overriding platform config. This lets the app be
  **free to host** — each user funds their own Venice access.

## MCP server & Venice Skill

- **MCP:** `npm run mcp` starts a stdio MCP server exposing a `research` tool — drop it into
  Cursor / Claude / any MCP client to run private research from your editor.
- **Skill:** `skills/obscura-agent/SKILL.md` packages the agent as a Venice Agent Skill so other
  agent runtimes can discover and use it. This is the first step toward the **Obscura Agents**
  platform.

## Architecture

| Layer | Path |
|---|---|
| Venice client (chat, embeddings, models, balance) | `src/venice/client.ts` |
| Payment-mode factory (apikey \| x402) | `src/venice/factory.ts` |
| MCP server + research tool | `src/mcp/server.ts`, `src/mcp/researchTool.ts` |
| Venice Agent Skill | `skills/obscura-agent/SKILL.md` |
| Model resolver + Privacy Receipts | `src/venice/models.ts`, `src/privacy/receipt.ts` |
| RAG store + tools (web_search, fetch_url) | `src/rag/store.ts`, `src/tools/` |
| Orchestrator (planner→executor loop, spend cap) | `src/agent/orchestrator.ts` |
| Cited dossier builder (strict JSON) | `src/agent/report.ts` |
| SSE research endpoint (server-side key) | `src/app/api/research/route.ts` |
| Research console UI | `src/app/page.tsx` |

## License

TBD.
