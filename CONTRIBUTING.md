# Contributing to Obscura Agent

Thanks for your interest — contributions are welcome.

## Development setup

```bash
git clone https://github.com/obscura-agents/obscura-agent.git
cd obscura-agent
npm install
cp .env.local.example .env.local   # set VENICE_API_KEY, or just use BYOK in the UI
npm run dev                         # http://localhost:3000
```

You don't need a Venice key to develop: the test suite is fully mocked, and the site's
**"Watch a live demo"** replays a real investigation without one.

## Checks (please make sure these pass before opening a PR)

```bash
npm test        # unit tests (Vitest)
npm run typecheck
npm run build
```

## Guidelines

- **TDD** where there is logic — write a failing test first, keep tests fast and mocked.
- **Privacy first:** the Venice key stays server-side and is never logged; BYOK keys are
  per-request and never stored. Don't add anything that weakens this.
- **Honest receipts:** never claim a privacy property the API doesn't substantiate.
- **English** for all code, comments, and commit messages.
- **Conventional commits:** `feat:`, `fix:`, `chore:`, `docs:`, `style:`, `test:`.
- Keep PRs small and focused, targeting `main`.

## Project layout

See the **Architecture** table in the [README](README.md).

Powered by Venice.
