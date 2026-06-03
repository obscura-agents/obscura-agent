# Security Policy

## Reporting a vulnerability

Please report security issues **privately** — do not open a public issue.

Use GitHub's **"Report a vulnerability"** button on the repository's **Security** tab
(Security advisories). We'll acknowledge and respond as quickly as we can.

## How Obscura Agent handles secrets & privacy

- The **Venice API key is used server-side only** — it is never sent to the browser and is
  never written to logs.
- **BYOK** keys (a user's own Venice key entered in the UI) are sent **per request** and are
  **never stored** server-side; they live only in the user's browser.
- Inference runs on Venice's **zero-data-retention** API; the optional **Vault mode** routes the
  most sensitive synthesis through E2EE (`e2ee-`) models, and each step emits an honest
  **Privacy Receipt** that only reports what the API substantiates.

## Supported versions

This project is pre-1.0. Security fixes target the latest `main`.
