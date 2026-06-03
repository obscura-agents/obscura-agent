---
name: obscura-agent
description: Use when you need private, autonomous, cited web research that leaves no trace — runs on Venice (zero data retention), handles legitimate-but-hard topics, and returns a sourced dossier with per-step privacy receipts.
---

# Obscura Agent

Private, autonomous research agent on Venice. Give it a question; it plans, searches and
scrapes the web, builds private memory, and returns a sourced dossier — proving, per step,
that nothing leaked.

## How to invoke

| Surface | How |
|---|---|
| **MCP** | Run the `obscura-agent` MCP server (`npm run mcp`) and call the `research` tool with `{ "question": "..." }`. Returns the dossier as text. |
| **HTTP** | `POST /api/research` with `{ "question": "..." }` → a Server-Sent Events stream of `status`, `receipt`, `answer`, and `dossier` events, terminated by `data: [DONE]`. |

## Modes

- **recon** (default): private-tier Venice models + web search/scrape + function calling.
- **vault**: E2EE (`e2ee-`) models, no tools — for the most sensitive synthesis.

## Privacy receipts

Every step emits a receipt: `mode`, `model`, `privacy_tier`, `e2ee_applied` (read from the
echoed `venice_parameters.enable_e2ee`), `e2ee_capable`, and `attestation`. Receipts only claim
what the API substantiates — cryptographic attestation stays `pending` until the
`/tee/attestation` endpoint is verified live.

## Configuration

- **apikey mode** (default): set `VENICE_API_KEY`.
- **x402 mode** (self-funding): set `OBSCURA_PAYMENT_MODE=x402` and `WALLET_PRIVATE_KEY` — the
  agent pays per request in USDC on Base, no API key.

## Gotchas

- The Venice key is never exposed client-side; all calls are server-side only.
- Venice needs an active balance (Pro includes free API credit) or a funded Base wallet.
- Under active E2EE (vault mode), Venice disables tools/search — so the tool-using recon loop
  runs on private-tier (non-E2EE) models; vault is reserved for tool-free synthesis.

Powered by Venice.
