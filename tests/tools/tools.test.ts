import { describe, it, expect, vi } from "vitest";
import { webSearch } from "../../src/tools/webSearch";
import { fetchUrl } from "../../src/tools/fetchUrl";
import type { VeniceClient } from "../../src/venice/client";

function fakeClient(response: any): VeniceClient {
  return { chat: vi.fn().mockResolvedValue(response) } as unknown as VeniceClient;
}

describe("webSearch tool", () => {
  it("requests venice web search and returns citations + summary", async () => {
    const client = fakeClient({
      choices: [{ finish_reason: "stop", index: 0, message: { role: "assistant", content: "summary text" } }],
      venice_parameters: { web_search_citations: [{ title: "T", url: "https://x", content: "c", date: "d" }] },
    });
    const out = await webSearch(client, "zai-org-glm-4.7", "latest AI news");
    expect(out.summary).toBe("summary text");
    expect(out.citations[0].url).toBe("https://x");
    const req = (client.chat as any).mock.calls[0][0];
    expect(req.venice_parameters.enable_web_search).toBe("on");
    expect(req.venice_parameters.enable_web_citations).toBe(true);
  });
});

describe("fetchUrl tool", () => {
  it("enables scraping for the given url", async () => {
    const client = fakeClient({
      choices: [{ finish_reason: "stop", index: 0, message: { role: "assistant", content: "scraped content" } }],
      venice_parameters: {},
    });
    const out = await fetchUrl(client, "zai-org-glm-4.7", "https://example.com");
    expect(out.content).toBe("scraped content");
    const req = (client.chat as any).mock.calls[0][0];
    expect(req.venice_parameters.enable_web_scraping).toBe(true);
    expect(req.messages[0].content).toContain("https://example.com");
  });
});
