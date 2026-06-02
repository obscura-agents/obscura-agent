import type { VeniceClient } from "../venice/client";
import type { Balance, ChatMessage, ModelSpec, WebSearchCitation } from "../venice/types";
import { resolveDefaults } from "../venice/models";
import { buildReceipt, type PrivacyReceipt } from "../privacy/receipt";
import { TOOL_DEFS } from "../tools/registry";
import { webSearch } from "../tools/webSearch";
import { fetchUrl } from "../tools/fetchUrl";
import { VectorStore } from "../rag/store";

export interface RunArgs {
  client: VeniceClient;
  models: ModelSpec[];
  question: string;
  maxSteps?: number;
  minUsd?: number;
  now?: () => string;
}

export type StoppedReason = "completed" | "max_steps" | "spend_cap";

export interface RunResult {
  finalAnswer: string;
  citations: WebSearchCitation[];
  receipts: PrivacyReceipt[];
  transcript: ChatMessage[];
  stoppedReason: StoppedReason;
}

const SYSTEM_PROMPT =
  "You are GhostWire, a private research agent. Decompose the question, use web_search to find sources, " +
  "fetch_url to read them, and recall to revisit gathered evidence. Cite sources. When you have enough " +
  "evidence, stop and give a concise answer. Refuse only genuinely illegitimate requests.";

export async function runInvestigation(args: RunArgs): Promise<RunResult> {
  const now = args.now ?? (() => new Date().toISOString());
  const maxSteps = args.maxSteps ?? 8;
  const minUsd = args.minUsd ?? 0.25;
  const defaults = resolveDefaults(args.models);
  const reconModel = args.models.find((m) => m.id === defaults.tools) ?? args.models[0];
  const modelId = defaults.tools;

  const store = new VectorStore();
  const citations: WebSearchCitation[] = [];
  const receipts: PrivacyReceipt[] = [];
  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: args.question },
  ];

  let stoppedReason: StoppedReason = "max_steps";

  for (let step = 1; step <= maxSteps; step++) {
    // Spend-cap circuit breaker BEFORE spending on this step.
    // Tolerate an unreadable balance (e.g. an inference-only key that cannot
    // read /api_keys/rate_limits): degrade to "no cap" instead of hard-failing.
    let balance: Balance | null = null;
    try {
      balance = await args.client.getBalance();
    } catch {
      balance = null;
    }
    if (balance && balance.usd < minUsd) {
      stoppedReason = "spend_cap";
      break;
    }

    const res = await args.client.chat({
      model: modelId,
      messages,
      tools: TOOL_DEFS,
      tool_choice: "auto",
      parallel_tool_calls: false,
    });
    const choice = res.choices[0];
    messages.push(choice.message);

    if (choice.finish_reason !== "tool_calls" || !choice.message.tool_calls?.length) {
      receipts.push(buildReceipt({ step, mode: "recon", action: "answer", model: reconModel!, response: res, now: now() }));
      stoppedReason = "completed";
      return {
        finalAnswer: choice.message.content ?? "",
        citations,
        receipts,
        transcript: messages,
        stoppedReason,
      };
    }

    for (const call of choice.message.tool_calls) {
      const action = call.function.name;
      const params = JSON.parse(call.function.arguments) as Record<string, string>;
      let toolContent = "";

      if (action === "web_search") {
        const out = await webSearch(args.client, modelId, params.query);
        citations.push(...out.citations);
        toolContent = out.summary + "\n" + out.citations.map((c) => `- ${c.title} ${c.url}`).join("\n");
      } else if (action === "fetch_url") {
        const out = await fetchUrl(args.client, modelId, params.url);
        toolContent = out.content;
        const [vec] = await args.client.embed(out.content || params.url);
        store.add(params.url, out.content, vec);
      } else if (action === "recall") {
        const [vec] = await args.client.embed(params.query);
        toolContent = store.query(vec, 5).map((h) => `(${h.score.toFixed(2)}) ${h.text}`).join("\n") || "No memory yet.";
      } else {
        toolContent = `Unknown tool: ${action}`;
      }

      messages.push({ role: "tool", tool_call_id: call.id, content: toolContent });
      receipts.push(buildReceipt({ step, mode: "recon", action, model: reconModel!, response: res, now: now() }));
    }
  }

  return { finalAnswer: "", citations, receipts, transcript: messages, stoppedReason };
}
