import type { VeniceClient } from "../venice/client";
import type { ModelSpec } from "../venice/types";
import { buildReceipt, type PrivacyReceipt } from "../privacy/receipt";
import type { Dossier } from "./report";

export interface VaultResult {
  text: string;
  receipt: PrivacyReceipt;
}

/**
 * Vault mode: re-synthesize the investigation through an E2EE (`e2ee-`) model with
 * `enable_e2ee` — no tools, no system prompt reliance (E2EE disables those). The
 * receipt reports the ECHOED `enable_e2ee`, so we never over-claim privacy.
 */
export async function runVaultSynthesis(
  client: VeniceClient,
  vaultModel: ModelSpec,
  dossier: Dossier,
  now?: () => string,
): Promise<VaultResult> {
  const ts = (now ?? (() => new Date().toISOString()))();
  const evidence = [
    dossier.summary,
    ...dossier.findings.map((f, i) => `${i + 1}. ${f.claim}`),
  ].join("\n");

  const res = await client.chat({
    model: vaultModel.id,
    messages: [
      {
        role: "user",
        content:
          "Write a concise, confidential brief synthesizing the following research findings. " +
          "Be direct and analytical.\n\n" +
          evidence,
      },
    ],
    venice_parameters: { enable_e2ee: true },
  });

  const receipt = buildReceipt({
    step: 0,
    mode: "vault",
    action: "sealed-synthesis",
    model: vaultModel,
    response: res,
    now: ts,
  });

  // If E2EE actually applied, try to upgrade the receipt to cryptographically verified.
  if (receipt.attestation === "pending") {
    try {
      const att = await client.getAttestation(vaultModel.id);
      if (att.verified) receipt.attestation = "verified";
    } catch {
      // Endpoint unavailable / unverified — honestly stay "pending".
    }
  }

  return { text: res.choices[0]?.message.content ?? "", receipt };
}
