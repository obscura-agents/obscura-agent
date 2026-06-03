import type { VeniceClient } from "../venice/client";
import { resolveDefaults } from "../venice/models";
import { runInvestigation } from "./orchestrator";
import { buildDossier, type Dossier } from "./report";
import { buildBriefing } from "./briefing";
import type { PrivacyReceipt } from "../privacy/receipt";

export type ResearchEvent =
  | { type: "status"; message: string }
  | { type: "receipt"; receipt: PrivacyReceipt }
  | { type: "answer"; text: string }
  | { type: "dossier"; dossier: Dossier; stoppedReason: string }
  | { type: "cover"; dataUrl: string }
  | { type: "audio"; dataUrl: string };

export interface SessionArgs {
  client: VeniceClient;
  question: string;
  emit: (event: ResearchEvent) => void;
  now?: () => string;
  /** When true, also generate a multimodal briefing (cover image + TTS audio) after the dossier. */
  withBriefing?: boolean;
}

export async function runResearchSession(a: SessionArgs): Promise<void> {
  a.emit({ type: "status", message: "Resolving models…" });
  const models = await a.client.listModels("text");
  const defaults = resolveDefaults(models);

  a.emit({ type: "status", message: "Investigating…" });
  const run = await runInvestigation({ client: a.client, models, question: a.question, now: a.now });
  for (const receipt of run.receipts) a.emit({ type: "receipt", receipt });
  a.emit({ type: "answer", text: run.finalAnswer });

  a.emit({ type: "status", message: "Building dossier…" });
  const dossier = await buildDossier({
    client: a.client,
    model: defaults.tools,
    question: a.question,
    finalAnswer: run.finalAnswer,
    citations: run.citations,
  });
  a.emit({ type: "dossier", dossier, stoppedReason: run.stoppedReason });

  if (a.withBriefing) {
    a.emit({ type: "status", message: "Composing a briefing…" });
    try {
      const briefing = await buildBriefing(a.client, dossier);
      if (briefing.coverDataUrl) a.emit({ type: "cover", dataUrl: briefing.coverDataUrl });
      if (briefing.audioDataUrl) a.emit({ type: "audio", dataUrl: briefing.audioDataUrl });
    } catch {
      // Briefing is a bonus — never fail the investigation over it.
    }
  }
}
