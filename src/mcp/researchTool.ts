import type { VeniceClient } from "../venice/client";
import { runResearchSession } from "../agent/session";
import type { Dossier } from "../agent/report";

export interface ResearchToolResult {
  text: string;
  receiptCount: number;
}

/**
 * Pure wrapper that runs a full research session and renders the dossier as text.
 * Used by the MCP server's `research` tool (kept separate so it is unit-testable).
 */
export async function runResearchTool(
  client: VeniceClient,
  question: string,
  now?: () => string,
): Promise<ResearchToolResult> {
  // Holder object so the closure assignment isn't lost to control-flow narrowing.
  const captured: { dossier: Dossier | null; receipts: number } = { dossier: null, receipts: 0 };

  await runResearchSession({
    client,
    question,
    now,
    emit: (ev) => {
      if (ev.type === "receipt") captured.receipts++;
      if (ev.type === "dossier") captured.dossier = ev.dossier;
    },
  });

  const d = captured.dossier;
  const text = d
    ? `${d.summary}\n\nFindings:\n${d.findings
        .map((f) => `- ${f.claim} [${f.source_urls.join(", ")}]`)
        .join("\n")}`
    : "No dossier produced.";

  return { text, receiptCount: captured.receipts };
}
