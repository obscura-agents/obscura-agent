import type { ToolDef } from "../venice/types";

// Function definitions advertised to the model during the recon loop.
export const TOOL_DEFS: ToolDef[] = [
  {
    type: "function",
    function: {
      name: "web_search",
      description: "Search the web via Venice and return a summary with citations. Use for discovering sources.",
      parameters: {
        type: "object",
        properties: { query: { type: "string", description: "The search query" } },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "fetch_url",
      description: "Scrape and summarize a specific URL's content. Use to read a source found via web_search.",
      parameters: {
        type: "object",
        properties: { url: { type: "string", description: "The URL to read" } },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "recall",
      description: "Retrieve previously gathered evidence from private memory by semantic similarity.",
      parameters: {
        type: "object",
        properties: { query: { type: "string", description: "What to recall" } },
        required: ["query"],
      },
    },
  },
];
