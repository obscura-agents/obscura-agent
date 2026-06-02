import { classifyPrivacy } from "../venice/models";
import type { ChatResponse, ModelSpec } from "../venice/types";

export type Mode = "recon" | "vault";
export type Attestation = "not_requested" | "pending" | "verified";

export interface PrivacyReceipt {
  step: number;
  mode: Mode;
  action: string;
  model: string;
  privacy_tier: string;
  e2ee_applied: boolean;
  e2ee_capable: boolean;
  attestation: Attestation;
  timestamp: string;
}

export interface BuildReceiptArgs {
  step: number;
  mode: Mode;
  action: string;
  model: ModelSpec;
  response: ChatResponse;
  now: string; // ISO timestamp passed in (keeps the function pure/testable)
}

export function buildReceipt(a: BuildReceiptArgs): PrivacyReceipt {
  const { privacy_tier, e2ee_capable } = classifyPrivacy(a.model);
  // Honesty rule: report the ECHOED enable_e2ee from the response, not what we requested.
  const e2ee_applied = a.response.venice_parameters?.enable_e2ee === true;
  // Attestation can only be "verified" once GET /tee/attestation is live-confirmed (a later task).
  // Vault steps that applied E2EE are "pending"; everything else is "not_requested".
  const attestation: Attestation = a.mode === "vault" && e2ee_applied ? "pending" : "not_requested";
  return {
    step: a.step,
    mode: a.mode,
    action: a.action,
    model: a.model.id,
    privacy_tier,
    e2ee_applied,
    e2ee_capable,
    attestation,
    timestamp: a.now,
  };
}
