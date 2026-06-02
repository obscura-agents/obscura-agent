import { describe, it, expect } from "vitest";
import { resolveDefaults, classifyPrivacy } from "../../src/venice/models";
import type { ModelSpec } from "../../src/venice/types";

const models: ModelSpec[] = [
  { id: "zai-org-glm-4.7", type: "text", model_spec: { name: "GLM 4.7", privacy: "private", traits: ["default", "function_calling_default"], capabilities: { supportsFunctionCalling: true, supportsResponseSchema: true, supportsWebSearch: true, supportsVision: false, supportsReasoning: true, supportsE2EE: false, supportsTeeAttestation: false } } },
  { id: "venice-uncensored-1-2", type: "text", model_spec: { name: "Venice Uncensored 1.2", privacy: "private", traits: ["most_uncensored"], capabilities: { supportsFunctionCalling: true, supportsResponseSchema: true, supportsWebSearch: true, supportsVision: true, supportsReasoning: false, supportsE2EE: false, supportsTeeAttestation: false } } },
  { id: "e2ee-glm-5-1", type: "text", model_spec: { name: "GLM 5.1 E2EE", privacy: "private", traits: [], capabilities: { supportsFunctionCalling: false, supportsResponseSchema: false, supportsWebSearch: false, supportsVision: false, supportsReasoning: true, supportsE2EE: true, supportsTeeAttestation: true } } },
];

describe("resolveDefaults", () => {
  it("picks function-calling default, uncensored, and an e2ee model by trait/flags with fallbacks", () => {
    const d = resolveDefaults(models);
    expect(d.tools).toBe("zai-org-glm-4.7");
    expect(d.uncensored).toBe("venice-uncensored-1-2");
    expect(d.vault).toBe("e2ee-glm-5-1");
  });

  it("falls back to known ids when traits are missing", () => {
    const d = resolveDefaults([]);
    expect(d.tools).toBe("zai-org-glm-4.7");
    expect(d.uncensored).toBe("venice-uncensored-1-2");
  });
});

describe("classifyPrivacy", () => {
  it("returns tier + e2ee capability from the spec", () => {
    const c = classifyPrivacy(models[2]);
    expect(c).toEqual({ privacy_tier: "private", e2ee_capable: true });
  });
});
