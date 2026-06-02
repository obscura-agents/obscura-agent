import type { Balance, ChatRequest, ChatResponse, ModelSpec } from "./types";

export interface VeniceConfig {
  apiKey: string;
  baseUrl?: string;
}

export class VeniceClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(cfg: VeniceConfig) {
    this.apiKey = cfg.apiKey;
    this.baseUrl = (cfg.baseUrl ?? "https://api.venice.ai/api/v1").replace(/\/$/, "");
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Venice ${path} failed: ${res.status} ${text}`);
    }
    return (await res.json()) as T;
  }

  private async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
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

  async getBalance(): Promise<Balance> {
    const out = await this.get<{ data: { accessPermitted: boolean; balances: { USD: number; DIEM: number } } }>(
      "/api_keys/rate_limits",
    );
    return { usd: out.data.balances.USD, diem: out.data.balances.DIEM, accessPermitted: out.data.accessPermitted };
  }
}
