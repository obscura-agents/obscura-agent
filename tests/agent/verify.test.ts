import { describe, it, expect, vi } from "vitest";
import { verifyFindings, VERIFY_SCHEMA } from "../../src/agent/verify";
import type { VeniceClient } from "../../src/venice/client";

describe("verifyFindings", () => {
  it("attaches a skeptic verdict + reason to each finding via strict structured output", async () => {
    const chat = vi.fn().mockResolvedValue({
      choices: [
        {
          finish_reason: "stop",
          index: 0,
          message: {
            role: "assistant",
            content:
              '{"verdicts":[{"verdict":"supported","reason":"matches the cited source"},{"verdict":"refuted","reason":"no source backs this"}]}',
          },
        },
      ],
      venice_parameters: {},
    });
    const client = { chat } as unknown as VeniceClient;

    const out = await verifyFindings(client, "zai-org-glm-4.7", [
      { claim: "a", source_urls: ["https://u"] },
      { claim: "b", source_urls: [] },
    ]);

    expect(out[0].verdict).toBe("supported");
    expect(out[0].reason).toContain("source");
    expect(out[1].verdict).toBe("refuted");

    const req = chat.mock.calls[0][0];
    expect(req.response_format.type).toBe("json_schema");
    expect(req.response_format.json_schema.strict).toBe(true);
    expect(VERIFY_SCHEMA.schema.additionalProperties).toBe(false);
  });

  it("returns [] without calling the model when there are no findings", async () => {
    const chat = vi.fn();
    const client = { chat } as unknown as VeniceClient;
    const out = await verifyFindings(client, "m", []);
    expect(out).toEqual([]);
    expect(chat).not.toHaveBeenCalled();
  });

  it("defaults to 'uncertain' when the model returns fewer verdicts than findings", async () => {
    const chat = vi.fn().mockResolvedValue({
      choices: [{ finish_reason: "stop", index: 0, message: { role: "assistant", content: '{"verdicts":[]}' } }],
      venice_parameters: {},
    });
    const client = { chat } as unknown as VeniceClient;
    const out = await verifyFindings(client, "m", [{ claim: "a", source_urls: [] }]);
    expect(out[0].verdict).toBe("uncertain");
  });
});
