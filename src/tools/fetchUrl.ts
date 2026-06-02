import type { VeniceClient } from "../venice/client";

export interface FetchUrlResult {
  content: string;
}

export async function fetchUrl(client: VeniceClient, model: string, url: string): Promise<FetchUrlResult> {
  const res = await client.chat({
    model,
    messages: [{ role: "user", content: `Extract and summarize the content of this URL: ${url}` }],
    venice_parameters: { enable_web_scraping: true },
  });
  return { content: res.choices[0]?.message.content ?? "" };
}
