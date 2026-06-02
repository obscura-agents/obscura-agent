import type { VeniceClient } from "../venice/client";
import { resolveDefaults } from "../venice/models";
import { runInvestigation } from "./orchestrator";
import { buildDossier, type Dossier } from "./report";
import type { PrivacyReceipt } from "../privacy/receipt";

export type ResearchEvent =
  | { type: "status"; message: string }
  | { type: "receipt"; receipt: PrivacyReceipt }
  | { type: "answer"; text: string }
  | { type: "dossier"; dossier: Dossier; stoppedReason: string };

export interface SessionArgs {
  client: VeniceClient;
  question: string;
  emit: (event: ResearchEvent) => void;
  now?: () => string;
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
}
