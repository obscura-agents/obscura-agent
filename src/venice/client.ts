import type { Balance, ChatRequest, ChatResponse, ModelSpec } from "./types";

export interface VeniceConfig {
  /** Bearer key for apikey mode. Omit in x402/wallet mode (auth is handled by fetchImpl). */
  apiKey?: string;
  baseUrl?: string;
  /** Inject a custom fetch (e.g. a wallet-signing fetch from venice-x402-client). Defaults to global fetch. */
  fetchImpl?: typeof fetch;
}

export class VeniceClient {
  private apiKey?: string;
  private baseUrl: string;
  private fetchImpl: typeof fetch;

  constructor(cfg: VeniceConfig) {
    this.apiKey = cfg.apiKey;
    this.baseUrl = (cfg.baseUrl ?? "https://api.venice.ai/api/v1").replace(/\/$/, "");
    this.fetchImpl = cfg.fetchImpl ?? fetch;
  }

  private authHeaders(): Record<string, string> {
    return this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {};
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...this.authHeaders() },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Venice ${path} failed: ${res.status} ${text}`);
    }
    return (await res.json()) as T;
  }

  private async get<T>(path: string): Promise<T> {
    const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
      headers: this.authHeaders(),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Venice ${path} failed: ${res.status} ${text}`);
    }
    return (await res.json()) as T;
  }

  chat(req: ChatRequest): Promise<ChatResponse> {
    return this.post<ChatResponse>("/chat/completions", req);
  }

  async embed(input: string | string[], model = "text-embedding-bge-m3"): Promise<number[][]> {
    const out = await this.post<{ data: Array<{ index: number; embedding: number[] }> }>("/embeddings", {
      model,
      input,
      encoding_format: "float",
    });
    return out.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
  }

  async listModels(type = "text"): Promise<ModelSpec[]> {
    const out = await this.get<{ data: ModelSpec[] }>(`/models?type=${encodeURIComponent(type)}`);
    return out.data;
  }

  private async postBinary(path: string, body: unknown): Promise<ArrayBuffer> {
    const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...this.authHeaders() },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Venice ${path} failed: ${res.status} ${text}`);
    }
    return res.arrayBuffer();
  }

  /** Native Venice text-to-image. Returns the first image as a base64 string. */
  async generateImage(
    prompt: string,
    opts?: {
      model?: string;
      negative_prompt?: string;
      width?: number;
      height?: number;
      aspect_ratio?: string;
      format?: string;
    },
  ): Promise<string> {
    const out = await this.post<{ images: string[] }>("/image/generate", {
      model: opts?.model ?? "venice-sd35",
      prompt,
      ...opts,
    });
    return out.images?.[0] ?? "";
  }

  /** Venice text-to-speech. Returns raw audio bytes (mp3 by default). */
  async speech(input: string, opts?: { model?: string; voice?: string }): Promise<ArrayBuffer> {
    return this.postBinary("/audio/speech", {
      model: opts?.model ?? "tts-kokoro",
      voice: opts?.voice ?? "af_sky",
      input,
    });
  }

  async getBalance(): Promise<Balance> {
    const out = await this.get<{ data: { accessPermitted: boolean; balances: { USD: number; DIEM: number } } }>(
      "/api_keys/rate_limits",
    );
    return { usd: out.data.balances.USD, diem: out.data.balances.DIEM, accessPermitted: out.data.accessPermitted };
  }
}
