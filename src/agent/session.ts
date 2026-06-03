import type { VeniceClient } from "../venice/client";
import { resolveDefaults } from "../venice/models";
import { runInvestigation } from "./orchestrator";
import { runSupervised } from "./supervisor";
import { buildDossier, type Dossier } from "./report";
import { buildBriefing } from "./briefing";
import { runVaultSynthesis } from "./vault";
import { verifyFindings } from "./verify";
import { personaPrompt } from "./personas";
import type { PrivacyReceipt } from "../privacy/receipt";

export type ResearchEvent =
  | { type: "status"; message: string }
  | { type: "receipt"; receipt: PrivacyReceipt }
  | { type: "answer"; text: string }
  | { type: "dossier"; dossier: Dossier; stoppedReason: string }
  | { type: "plan"; subtasks: string[] }
  | { type: "activity"; action: string; detail?: string }
  | { type: "vault"; text: string }
  | { type: "cover"; dataUrl: string }
  | { type: "audio"; dataUrl: string };

export interface SessionArgs {
  client: VeniceClient;
  question: string;
  emit: (event: ResearchEvent) => void;
  now?: () => string;
  /** When true, a supervisor decomposes the question and runs parallel specialist agents. */
  withMultiAgent?: boolean;
  /** Max specialist agents in multi-agent mode (default 3). */
  maxAgents?: number;
  /** Recon model preference: "default" (balanced) or "uncensored". */
  modelPref?: "default" | "uncensored";
  /** Investigator persona key (see agent/personas.ts). */
  persona?: string;
  /** When true, run an adversarial skeptic pass that judges each finding before the dossier. */
  withVerify?: boolean;
  /** When true, run a final E2EE "vault" synthesis through an e2ee- model. */
  withVault?: boolean;
  /** When true, also generate a multimodal briefing (cover image + TTS audio) after the dossier. */
  withBriefing?: boolean;
}

export async function runResearchSession(a: SessionArgs): Promise<void> {
  a.emit({ type: "status", message: "Resolving models…" });
  const models = await a.client.listModels("text");
  const defaults = resolveDefaults(models);

  a.emit({
    type: "status",
    message: a.withMultiAgent ? "Dispatching specialist agents…" : "Investigating…",
  });
  const reconModelId = a.modelPref === "uncensored" ? defaults.uncensored : undefined;
  const personaStyle = personaPrompt(a.persona);
  const onActivity = (action: string, detail?: string) => a.emit({ type: "activity", action, detail });
  const onReceipt = (receipt: PrivacyReceipt) => a.emit({ type: "receipt", receipt });
  const run = a.withMultiAgent
    ? await runSupervised({
        client: a.client,
        models,
        question: a.question,
        now: a.now,
        maxAgents: a.maxAgents,
        modelId: reconModelId,
        personaPrompt: personaStyle,
        onActivity,
        onReceipt,
        onPlan: (subtasks) => a.emit({ type: "plan", subtasks }),
      })
    : await runInvestigation({
        client: a.client,
        models,
        question: a.question,
        now: a.now,
        modelId: reconModelId,
        personaPrompt: personaStyle,
        onActivity,
        onReceipt,
      });
  a.emit({ type: "answer", text: run.finalAnswer });

  a.emit({ type: "status", message: "Building dossier…" });
  const dossier = await buildDossier({
    client: a.client,
    model: defaults.tools,
    question: a.question,
    finalAnswer: run.finalAnswer,
    citations: run.citations,
  });

  if (a.withVerify && dossier.findings.length > 0) {
    a.emit({ type: "status", message: "Adversarially verifying findings…" });
    try {
      dossier.findings = await verifyFindings(a.client, defaults.tools, dossier.findings);
    } catch {
      // Keep the unverified findings if the skeptic pass fails.
    }
  }

  a.emit({ type: "dossier", dossier, stoppedReason: run.stoppedReason });

  if (a.withVault) {
    const vaultModel = defaults.vault ? models.find((m) => m.id === defaults.vault) : undefined;
    if (vaultModel) {
      a.emit({ type: "status", message: "Sealing a confidential brief (E2EE)…" });
      try {
        const vault = await runVaultSynthesis(a.client, vaultModel, dossier, a.now);
        a.emit({ type: "receipt", receipt: vault.receipt });
        if (vault.text) a.emit({ type: "vault", text: vault.text });
      } catch {
        // Vault is an enhancement — never fail the investigation over it.
      }
    }
  }

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
