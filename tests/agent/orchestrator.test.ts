import { describe, it, expect, vi } from "vitest";
import { runInvestigation } from "../../src/agent/orchestrator";
import type { VeniceClient } from "../../src/venice/client";

// chat() is called THREE times in this flow:
//   1) main loop step 1 -> requests a web_search tool call
//   2) the web_search tool itself calls chat (returns the summary + citations)
//   3) main loop step 2 -> final answer ("stop")
function scriptedClient() {
  const chat = vi
    .fn()
    // (1) main loop: ask for a tool call
    .mockResolvedValueOnce({
      choices: [
        {
          finish_reason: "tool_calls",
          index: 0,
          message: {
            role: "assistant",
            content: null,
            tool_calls: [{ id: "call_1", type: "function", function: { name: "web_search", arguments: '{"query":"acme breach"}' } }],
          },
        },
      ],
      venice_parameters: { enable_e2ee: false },
    })
    // (2) the web_search tool's own chat call: summary + citations
    .mockResolvedValueOnce({
      choices: [{ finish_reason: "stop", index: 0, message: { role: "assistant", content: "summary text" } }],
      venice_parameters: { enable_e2ee: false, web_search_citations: [{ title: "T", url: "https://s1", content: "c", date: "d" }] },
    })
    // (3) main loop step 2: final answer
    .mockResolvedValueOnce({
      choices: [{ finish_reason: "stop", index: 0, message: { role: "assistant", content: "done" } }],
      venice_parameters: { enable_e2ee: false },
    });
  const embed = vi.fn().mockResolvedValue([[0.1, 0.2]]);
  const getBalance = vi.fn().mockResolvedValue({ usd: 10, diem: 1, accessPermitted: true });
  return { chat, embed, getBalance } as unknown as VeniceClient;
}

const models = [
  { id: "zai-org-glm-4.7", type: "text", model_spec: { name: "GLM", privacy: "private", traits: ["function_calling_default"], capabilities: { supportsFunctionCalling: true, supportsResponseSchema: true, supportsWebSearch: true, supportsVision: false, supportsReasoning: true, supportsE2EE: false, supportsTeeAttestation: false } } },
];

describe("runInvestigation", () => {
  it("executes a tool call, collects citations + a receipt, and stops on finish_reason stop", async () => {
    const client = scriptedClient();
    const result = await runInvestigation({
      client,
      models: models as any,
      question: "What happened in the Acme breach?",
      maxSteps: 5,
      minUsd: 0.5,
      now: () => "2026-06-02T00:00:00Z",
    });

    expect((client.chat as any)).toHaveBeenCalledTimes(3);
    expect(result.citations.map((c) => c.url)).toContain("https://s1");
    expect(result.receipts.length).toBeGreaterThanOrEqual(1);
    expect(result.receipts[0].mode).toBe("recon");
    expect(result.finalAnswer).toBe("done");
  });

  it("halts via the spend-cap circuit breaker when balance is below minUsd", async () => {
    const client = scriptedClient();
    (client.getBalance as any).mockResolvedValue({ usd: 0.1, diem: 0, accessPermitted: true });
    const result = await runInvestigation({
      client,
      models: models as any,
      question: "x",
      maxSteps: 5,
      minUsd: 0.5,
      now: () => "t",
    });
    expect(result.stoppedReason).toBe("spend_cap");
    expect((client.chat as any)).not.toHaveBeenCalled();
  });
});
