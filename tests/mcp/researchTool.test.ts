import { describe, it, expect, vi } from "vitest";
import { runResearchTool } from "../../src/mcp/researchTool";
import type { VeniceClient } from "../../src/venice/client";

describe("runResearchTool", () => {
  it("returns dossier text + receipt count from a research run", async () => {
    const client = {
      listModels: vi.fn().mockResolvedValue([
        { id: "zai-org-glm-4.7", type: "text", model_spec: { name: "GLM", privacy: "private", traits: ["function_calling_default"], capabilities: { supportsFunctionCalling: true, supportsResponseSchema: true, supportsWebSearch: true, supportsVision: false, supportsReasoning: true, supportsE2EE: false, supportsTeeAttestation: false } } },
      ]),
      getBalance: vi.fn().mockResolvedValue({ usd: 10, diem: 1, accessPermitted: true }),
      chat: vi
        .fn()
        .mockResolvedValueOnce({ choices: [{ finish_reason: "stop", index: 0, message: { role: "assistant", content: "answer" } }], venice_parameters: { enable_e2ee: false } })
        .mockResolvedValueOnce({ choices: [{ finish_reason: "stop", index: 0, message: { role: "assistant", content: '{"summary":"the summary","findings":[{"claim":"c","source_urls":["https://s1"]}],"open_questions":[]}' } }], venice_parameters: {} }),
      embed: vi.fn(),
    } as unknown as VeniceClient;

    const out = await runResearchTool(client, "q", () => "t");
    expect(out.text).toContain("the summary");
    expect(out.text).toContain("https://s1");
    expect(out.receiptCount).toBeGreaterThanOrEqual(1);
  });
});
