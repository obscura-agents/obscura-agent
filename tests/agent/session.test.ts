import { describe, it, expect, vi } from "vitest";
import { runResearchSession } from "../../src/agent/session";
import type { VeniceClient } from "../../src/venice/client";

describe("runResearchSession", () => {
  it("emits step, receipt, and dossier events in order", async () => {
    const client = {
      listModels: vi.fn().mockResolvedValue([
        { id: "zai-org-glm-4.7", type: "text", model_spec: { name: "GLM", privacy: "private", traits: ["function_calling_default"], capabilities: { supportsFunctionCalling: true, supportsResponseSchema: true, supportsWebSearch: true, supportsVision: false, supportsReasoning: true, supportsE2EE: false, supportsTeeAttestation: false } } },
      ]),
      getBalance: vi.fn().mockResolvedValue({ usd: 10, diem: 1, accessPermitted: true }),
      chat: vi
        .fn()
        .mockResolvedValueOnce({ choices: [{ finish_reason: "stop", index: 0, message: { role: "assistant", content: "answer" } }], venice_parameters: { enable_e2ee: false } })
        .mockResolvedValueOnce({ choices: [{ finish_reason: "stop", index: 0, message: { role: "assistant", content: '{"summary":"s","findings":[],"open_questions":[]}' } }], venice_parameters: {} }),
      embed: vi.fn(),
    } as unknown as VeniceClient;

    const events: string[] = [];
    await runResearchSession({ client, question: "q", emit: (e) => events.push(e.type), now: () => "t" });

    expect(events).toContain("receipt");
    expect(events).toContain("dossier");
    expect(events[events.length - 1]).toBe("dossier");
  });
});
