import { messageText, type VeniceClient } from "../venice/client";
import type { Balance, ChatMessage, ContentPart, ModelSpec, WebSearchCitation } from "../venice/types";
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
  /** Override the recon model id (e.g. an uncensored model). Defaults to the trait-resolved default. */
  modelId?: string;
  /** Live: called before each action (planning/tool) so callers can stream the agent's "thinking". */
  onActivity?: (action: string, detail?: string) => void;
  /** Live: called as each privacy receipt is produced (instead of only in the returned aggregate). */
  onReceipt?: (receipt: PrivacyReceipt) => void;
  /** Optional persona style appended to the system prompt. */
  personaPrompt?: string;
  /** Optional attachment (a document or image, as a data URL) to investigate. */
  attachment?: { kind: "file" | "image"; dataUrl: string; name: string };
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
  "You are Obscura Agent, a private research agent. Decompose the question, use web_search to find sources, " +
  "fetch_url to read them, and recall to revisit gathered evidence. Cite sources. When you have enough " +
  "evidence, stop and give a concise answer. Refuse only genuinely illegitimate requests.";

export async function runInvestigation(args: RunArgs): Promise<RunResult> {
  const now = args.now ?? (() => new Date().toISOString());
  const maxSteps = args.maxSteps ?? 8;
  const minUsd = args.minUsd ?? 0.25;
  const defaults = resolveDefaults(args.models);
  const modelId = args.modelId ?? defaults.tools;
  const reconModel = args.models.find((m) => m.id === modelId) ?? args.models[0];

  const store = new VectorStore();
  const citations: WebSearchCitation[] = [];
  const receipts: PrivacyReceipt[] = [];
  let userContent: string | ContentPart[] = args.question;
  if (args.attachment) {
    const part: ContentPart =
      args.attachment.kind === "image"
        ? { type: "image_url", image_url: { url: args.attachment.dataUrl } }
        : { type: "file", file: { file_data: args.attachment.dataUrl, filename: args.attachment.name } };
    userContent = [{ type: "text", text: args.question }, part];
  }

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: args.personaPrompt ? `${SYSTEM_PROMPT} Adopt this persona: ${args.personaPrompt}` : SYSTEM_PROMPT,
    },
    { role: "user", content: userContent },
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
      args.onActivity?.("answer", "synthesizing the answer");
      const answerReceipt = buildReceipt({ step, mode: "recon", action: "answer", model: reconModel!, response: res, now: now() });
      receipts.push(answerReceipt);
      args.onReceipt?.(answerReceipt);
      stoppedReason = "completed";
      return {
        finalAnswer: messageText(choice.message.content),
        citations,
        receipts,
        transcript: messages,
        stoppedReason,
      };
    }

    for (const call of choice.message.tool_calls) {
      const action = call.function.name;
      const params = JSON.parse(call.function.arguments) as Record<string, string>;
      args.onActivity?.(action, params.query ?? params.url ?? "");
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
      const toolReceipt = buildReceipt({ step, mode: "recon", action, model: reconModel!, response: res, now: now() });
      receipts.push(toolReceipt);
      args.onReceipt?.(toolReceipt);
    }
  }

  return { finalAnswer: "", citations, receipts, transcript: messages, stoppedReason };
}
