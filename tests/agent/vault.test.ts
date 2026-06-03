import { describe, it, expect, vi } from "vitest";
import { runVaultSynthesis } from "../../src/agent/vault";
import type { VeniceClient } from "../../src/venice/client";
import type { ModelSpec } from "../../src/venice/types";

const vaultModel: ModelSpec = {
  id: "e2ee-glm-5-1",
  type: "text",
  model_spec: {
    name: "GLM 5.1 E2EE",
    privacy: "private",
    capabilities: {
      supportsFunctionCalling: false,
      supportsResponseSchema: false,
      supportsWebSearch: false,
      supportsVision: false,
      supportsReasoning: true,
      supportsE2EE: true,
      supportsTeeAttestation: true,
    },
  },
};

const dossier = { summary: "the gist", findings: [{ claim: "c1", source_urls: [] }], open_questions: [] };

describe("runVaultSynthesis", () => {
  it("synthesizes through the e2ee model with enable_e2ee and a vault receipt that reflects the echoed value", async () => {
    const chat = vi.fn().mockResolvedValue({
      choices: [{ finish_reason: "stop", index: 0, message: { role: "assistant", content: "sealed brief" } }],
      venice_parameters: { enable_e2ee: true },
    });
    const client = { chat } as unknown as VeniceClient;

    const out = await runVaultSynthesis(client, vaultModel, dossier, () => "t");

    expect(out.text).toBe("sealed brief");
    expect(out.receipt.mode).toBe("vault");
    expect(out.receipt.e2ee_applied).toBe(true);
    expect(out.receipt.attestation).toBe("pending");

    const req = chat.mock.calls[0][0];
    expect(req.model).toBe("e2ee-glm-5-1");
    expect(req.venice_parameters.enable_e2ee).toBe(true);
    expect(req.tools).toBeUndefined(); // no tools under E2EE
  });

  it("honestly reports e2ee_applied=false when the API did not actually apply E2EE", async () => {
    const chat = vi.fn().mockResolvedValue({
      choices: [{ finish_reason: "stop", index: 0, message: { role: "assistant", content: "x" } }],
      venice_parameters: { enable_e2ee: false },
    });
    const client = { chat } as unknown as VeniceClient;
    const out = await runVaultSynthesis(client, vaultModel, dossier, () => "t");
    expect(out.receipt.e2ee_applied).toBe(false);
    expect(out.receipt.attestation).toBe("not_requested");
  });

  it("upgrades attestation to 'verified' when the TEE endpoint confirms it", async () => {
    const chat = vi.fn().mockResolvedValue({
      choices: [{ finish_reason: "stop", index: 0, message: { role: "assistant", content: "x" } }],
      venice_parameters: { enable_e2ee: true },
    });
    const getAttestation = vi.fn().mockResolvedValue({ verified: true });
    const client = { chat, getAttestation } as unknown as VeniceClient;

    const out = await runVaultSynthesis(client, vaultModel, dossier, () => "t");
    expect(out.receipt.attestation).toBe("verified");
    expect(getAttestation).toHaveBeenCalledWith("e2ee-glm-5-1");
  });
});
