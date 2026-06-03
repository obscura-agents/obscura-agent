import { describe, it, expect, vi } from "vitest";
import { buildBriefing } from "../../src/agent/briefing";
import type { VeniceClient } from "../../src/venice/client";

describe("buildBriefing", () => {
  it("produces a cover image data URL and an audio data URL from a dossier", async () => {
    const client = {
      generateImage: vi.fn().mockResolvedValue("IMG"),
      speech: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]).buffer),
    } as unknown as VeniceClient;

    const b = await buildBriefing(client, {
      summary: "the summary",
      findings: [{ claim: "c", source_urls: [] }],
      open_questions: [],
    });

    expect(b.coverDataUrl).toBe("data:image/webp;base64,IMG");
    expect(b.audioDataUrl.startsWith("data:audio/mp3;base64,")).toBe(true);

    expect((client.generateImage as any).mock.calls[0][0]).toContain("the summary");
    expect((client.speech as any).mock.calls[0][0]).toContain("the summary");
  });

  it("degrades gracefully when one modality fails", async () => {
    const client = {
      generateImage: vi.fn().mockRejectedValue(new Error("no image model")),
      speech: vi.fn().mockResolvedValue(new Uint8Array([9]).buffer),
    } as unknown as VeniceClient;

    const b = await buildBriefing(client, { summary: "s", findings: [], open_questions: [] });
    expect(b.coverDataUrl).toBe("");
    expect(b.audioDataUrl.startsWith("data:audio/mp3;base64,")).toBe(true);
  });
});
