import { messageText, type VeniceClient } from "../venice/client";
import type { WebSearchCitation } from "../venice/types";

export interface WebSearchResult {
  summary: string;
  citations: WebSearchCitation[];
}

export async function webSearch(client: VeniceClient, model: string, query: string): Promise<WebSearchResult> {
  const res = await client.chat({
    model,
    messages: [{ role: "user", content: query }],
    venice_parameters: { enable_web_search: "on", enable_web_citations: true },
  });
  return {
    summary: messageText(res.choices[0]?.message.content),
    citations: res.venice_parameters?.web_search_citations ?? [],
  };
}
