import { describe, it, expect, vi, beforeEach } from "vitest";
import { VeniceClient } from "../../src/venice/client";

function mockFetchOnce(body: unknown, ok = true, status = 200, headers: Record<string, string> = {}) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    headers: { get: (k: string) => headers[k.toLowerCase()] ?? null },
    json: async () => body,
    text: async () => JSON.stringify(body),
  });
}

describe("VeniceClient.chat", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("posts to chat/completions with bearer auth and venice_parameters, and parses the response", async () => {
    const fetchMock = mockFetchOnce({
      id: "chatcmpl-1",
      model: "zai-org-glm-4.7",
      choices: [{ finish_reason: "stop", index: 0, message: { role: "assistant", content: "blue" } }],
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
      venice_parameters: { enable_e2ee: false, enable_web_search: "off", web_search_citations: [] },
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = new VeniceClient({ apiKey: "k" });
    const res = await client.chat({
      model: "zai-org-glm-4.7",
      messages: [{ role: "user", content: "why is the sky blue?" }],
      venice_parameters: { enable_web_search: "off" },
    });

    expect(res.choices[0].message.content).toBe("blue");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.venice.ai/api/v1/chat/completions");
    expect((init as any).headers.Authorization).toBe("Bearer k");
    const body = JSON.parse((init as any).body);
    expect(body.venice_parameters.enable_web_search).toBe("off");
  });

  it("throws a useful error on non-ok responses", async () => {
    vi.stubGlobal("fetch", mockFetchOnce({ error: "bad" }, false, 400));
    const client = new VeniceClient({ apiKey: "k" });
    await expect(
      client.chat({ model: "m", messages: [{ role: "user", content: "x" }] }),
    ).rejects.toThrow(/400/);
  });

  it("omits the Authorization header when no apiKey is given (wallet/x402 mode)", async () => {
    const fetchMock = mockFetchOnce({
      id: "x", model: "m",
      choices: [{ finish_reason: "stop", index: 0, message: { role: "assistant", content: "ok" } }],
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    });
    const client = new VeniceClient({ fetchImpl: fetchMock as unknown as typeof fetch });
    await client.chat({ model: "m", messages: [{ role: "user", content: "x" }] });
    const init = fetchMock.mock.calls[0][1] as any;
    expect(init.headers.Authorization).toBeUndefined();
  });

  it("uses the injected fetchImpl instead of global fetch", async () => {
    const fetchMock = mockFetchOnce({
      id: "x", model: "m",
      choices: [{ finish_reason: "stop", index: 0, message: { role: "assistant", content: "ok" } }],
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    });
    const client = new VeniceClient({ apiKey: "k", fetchImpl: fetchMock as unknown as typeof fetch });
    await client.chat({ model: "m", messages: [{ role: "user", content: "x" }] });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("VeniceClient.embed", () => {
  it("returns one vector per input", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchOnce({ object: "list", model: "text-embedding-bge-m3", data: [{ index: 0, embedding: [0.1, 0.2] }], usage: { prompt_tokens: 1, total_tokens: 1 } }),
    );
    const client = new VeniceClient({ apiKey: "k" });
    const vecs = await client.embed("hello");
    expect(vecs).toEqual([[0.1, 0.2]]);
  });
});

describe("VeniceClient.generateImage", () => {
  it("posts a prompt to /image/generate and returns the first base64 image", async () => {
    const fetchMock = mockFetchOnce({ id: "gen-1", images: ["BASE64DATA"], timing: { total: 10 } });
    vi.stubGlobal("fetch", fetchMock);
    const client = new VeniceClient({ apiKey: "k" });
    const img = await client.generateImage("a dark aperture", { aspect_ratio: "16:9" });
    expect(img).toBe("BASE64DATA");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.venice.ai/api/v1/image/generate");
    const body = JSON.parse((init as any).body);
    expect(body.model).toBe("venice-sd35");
    expect(body.prompt).toBe("a dark aperture");
    expect(body.aspect_ratio).toBe("16:9");
  });
});

describe("VeniceClient.speech", () => {
  it("posts text to /audio/speech and returns audio bytes", async () => {
    const buf = new ArrayBuffer(8);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => null },
      arrayBuffer: async () => buf,
      text: async () => "",
    });
    vi.stubGlobal("fetch", fetchMock);
    const client = new VeniceClient({ apiKey: "k" });
    const out = await client.speech("hello");
    expect(out).toBe(buf);
    const body = JSON.parse((fetchMock.mock.calls[0][1] as any).body);
    expect(body.model).toBe("tts-kokoro");
    expect(body.voice).toBe("af_sky");
    expect(body.input).toBe("hello");
  });
});

describe("VeniceClient.getBalance", () => {
  it("reads balances from /api_keys/rate_limits", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchOnce({ data: { accessPermitted: true, balances: { USD: 12.5, DIEM: 3 } } }),
    );
    const client = new VeniceClient({ apiKey: "k" });
    const bal = await client.getBalance();
    expect(bal).toEqual({ usd: 12.5, diem: 3, accessPermitted: true });
  });
});
