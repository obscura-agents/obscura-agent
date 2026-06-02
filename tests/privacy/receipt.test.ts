import { describe, it, expect } from "vitest";
import { buildReceipt } from "../../src/privacy/receipt";
import type { ChatResponse, ModelSpec } from "../../src/venice/types";

const reconModel: ModelSpec = { id: "zai-org-glm-4.7", type: "text", model_spec: { name: "GLM", privacy: "private", capabilities: { supportsFunctionCalling: true, supportsResponseSchema: true, supportsWebSearch: true, supportsVision: false, supportsReasoning: true, supportsE2EE: false, supportsTeeAttestation: false } } };

const reconResponse = { venice_parameters: { enable_e2ee: false } } as ChatResponse;

describe("buildReceipt", () => {
  it("reports the ECHOED e2ee value, not the requested one, and never over-claims attestation", () => {
    const r = buildReceipt({ step: 1, mode: "recon", action: "web_search", model: reconModel, response: reconResponse, now: "2026-06-02T00:00:00Z" });
    expect(r).toEqual({
      step: 1,
      mode: "recon",
      action: "web_search",
      model: "zai-org-glm-4.7",
      privacy_tier: "private",
      e2ee_applied: false,
      e2ee_capable: false,
      attestation: "not_requested",
      timestamp: "2026-06-02T00:00:00Z",
    });
  });

  it("marks attestation 'pending' (never 'verified') for a vault step until the endpoint is live-verified", () => {
    const vaultModel: ModelSpec = { id: "e2ee-glm-5-1", type: "text", model_spec: { name: "E2EE", privacy: "private", capabilities: { supportsFunctionCalling: false, supportsResponseSchema: false, supportsWebSearch: false, supportsVision: false, supportsReasoning: true, supportsE2EE: true, supportsTeeAttestation: true } } };
    const vaultResponse = { venice_parameters: { enable_e2ee: true } } as ChatResponse;
    const r = buildReceipt({ step: 2, mode: "vault", action: "synthesize", model: vaultModel, response: vaultResponse, now: "2026-06-02T00:00:01Z" });
    expect(r.e2ee_applied).toBe(true);
    expect(r.e2ee_capable).toBe(true);
    expect(r.attestation).toBe("pending");
  });
});
