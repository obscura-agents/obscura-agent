import { describe, it, expect, vi } from "vitest";
import { buildDossier, DOSSIER_SCHEMA } from "../../src/agent/report";
import type { VeniceClient } from "../../src/venice/client";

describe("buildDossier", () => {
  it("requests strict json_schema and parses the structured dossier", async () => {
    const chat = vi.fn().mockResolvedValue({
      choices: [
        {
          finish_reason: "stop",
          index: 0,
          message: { role: "assistant", content: '{"summary":"s","findings":[{"claim":"c","source_urls":["https://s1"]}],"open_questions":["q"]}' },
        },
      ],
      venice_parameters: {},
    });
    const client = { chat } as unknown as VeniceClient;

    const dossier = await buildDossier({
      client,
      model: "zai-org-glm-4.7",
      question: "q",
      finalAnswer: "ans",
      citations: [{ title: "T", url: "https://s1" }],
    });

    expect(dossier.summary).toBe("s");
    expect(dossier.findings[0].source_urls).toContain("https://s1");

    const req = chat.mock.calls[0][0];
    expect(req.response_format.type).toBe("json_schema");
    expect(req.response_format.json_schema.strict).toBe(true);
    // strict-mode invariants:
    expect(req.response_format.json_schema.schema.additionalProperties).toBe(false);
    expect(req.parallel_tool_calls).toBeUndefined(); // never combine structured outputs with parallel tools
    expect(DOSSIER_SCHEMA.schema.required).toContain("findings");
  });
});
