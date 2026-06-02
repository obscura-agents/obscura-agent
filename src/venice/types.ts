export type Role = "system" | "user" | "assistant" | "tool";

export interface ChatMessage {
  role: Role;
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

export interface ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string }; // arguments is a JSON-encoded STRING
}

export interface ToolDef {
  type: "function";
  function: { name: string; description: string; parameters: Record<string, unknown>; strict?: boolean };
}

export interface VeniceParameters {
  enable_web_search?: "auto" | "on" | "off";
  enable_web_scraping?: boolean;
  enable_web_citations?: boolean;
  enable_e2ee?: boolean;
  character_slug?: string;
}

export interface WebSearchCitation {
  title: string;
  url: string;
  content?: string;
  date?: string;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  tools?: ToolDef[];
  tool_choice?: "auto" | "none" | "required" | { type: "function"; function: { name: string } };
  parallel_tool_calls?: boolean;
  response_format?: { type: "json_schema"; json_schema: Record<string, unknown> } | { type: "text" };
  venice_parameters?: VeniceParameters;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface ChatResponse {
  id: string;
  model: string;
  choices: Array<{
    finish_reason: "stop" | "length" | "tool_calls";
    index: number;
    message: ChatMessage;
  }>;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  venice_parameters?: VeniceParameters & { web_search_citations?: WebSearchCitation[] };
}

export interface ModelCapabilities {
  supportsFunctionCalling: boolean;
  supportsResponseSchema: boolean;
  supportsWebSearch: boolean;
  supportsVision: boolean;
  supportsReasoning: boolean;
  supportsE2EE: boolean;
  supportsTeeAttestation: boolean;
}

export interface ModelSpec {
  id: string;
  type: string;
  model_spec: {
    name: string;
    privacy: "private" | "anonymized";
    availableContextTokens?: number;
    traits?: string[];
    capabilities?: ModelCapabilities;
    embeddingDimensions?: number;
  };
}

export interface Balance {
  usd: number;
  diem: number;
  accessPermitted: boolean;
}
