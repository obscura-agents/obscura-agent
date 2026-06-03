import { describe, it, expect, vi } from "vitest";
import { planSubtasks, mergeResults, runSupervised, PLAN_SCHEMA } from "../../src/agent/supervisor";
import type { VeniceClient } from "../../src/venice/client";
import type { RunResult } from "../../src/agent/orchestrator";

const models = [
  { id: "zai-org-glm-4.7", type: "text", model_spec: { name: "GLM", privacy: "private", traits: ["function_calling_default"], capabilities: { supportsFunctionCalling: true, supportsResponseSchema: true, supportsWebSearch: true, supportsVision: false, supportsReasoning: true, supportsE2EE: false, supportsTeeAttestation: false } } },
];

function planClient(content: string): VeniceClient {
  return {
    chat: vi.fn().mockResolvedValue({
      choices: [{ finish_reason: "stop", index: 0, message: { role: "assistant", content } }],
      venice_parameters: {},
    }),
  } as unknown as VeniceClient;
}

describe("planSubtasks", () => {
  it("returns the decomposed sub-questions (strict schema)", async () => {
    const client = planClient('{"subtasks":["who","when","impact"]}');
    const out = await planSubtasks(client, "zai-org-glm-4.7", "what happened", 3);
    expect(out).toEqual(["who", "when", "impact"]);
    const req = (client.chat as any).mock.calls[0][0];
    expect(req.response_format.json_schema.strict).toBe(true);
    expect(PLAN_SCHEMA.schema.required).toContain("subtasks");
  });

  it("falls back to the original question when none are returned", async () => {
    const client = planClient('{"subtasks":[]}');
    const out = await planSubtasks(client, "m", "the question", 3);
    expect(out).toEqual(["the question"]);
  });
});

describe("mergeResults", () => {
  it("merges worker outputs, dedups citations by url, concatenates receipts", () => {
    const a: RunResult = { finalAnswer: "A", citations: [{ title: "t", url: "u1" }], receipts: [{ step: 1 } as any], transcript: [], stoppedReason: "completed" };
    const b: RunResult = { finalAnswer: "B", citations: [{ title: "t", url: "u1" }, { title: "t2", url: "u2" }], receipts: [{ step: 2 } as any], transcript: [], stoppedReason: "completed" };
    const merged = mergeResults(["q1", "q2"], [a, b]);
    expect(merged.citations.map((c) => c.url)).toEqual(["u1", "u2"]);
    expect(merged.receipts.length).toBe(2);
    expect(merged.finalAnswer).toContain("A");
    expect(merged.finalAnswer).toContain("B");
    expect(merged.finalAnswer).toContain("q1");
  });
});

describe("runSupervised", () => {
  it("plans subtasks, runs one worker each, reports the plan, and merges", async () => {
    const client = planClient('{"subtasks":["q1","q2"]}');
    const resA: RunResult = { finalAnswer: "A", citations: [{ title: "t", url: "u1" }], receipts: [], transcript: [], stoppedReason: "completed" };
    const resB: RunResult = { finalAnswer: "B", citations: [{ title: "t", url: "u2" }], receipts: [], transcript: [], stoppedReason: "completed" };
    const runWorker = vi.fn().mockResolvedValueOnce(resA).mockResolvedValueOnce(resB);
    const onPlan = vi.fn();

    const out = await runSupervised({
      client,
      models: models as any,
      question: "Q",
      now: () => "t",
      runWorker,
      onPlan,
    });

    expect(onPlan).toHaveBeenCalledWith(["q1", "q2"]);
    expect(runWorker).toHaveBeenCalledTimes(2);
    expect(out.citations.map((c) => c.url)).toEqual(["u1", "u2"]);
    expect(out.finalAnswer).toContain("A");
    expect(out.finalAnswer).toContain("B");
  });
});
