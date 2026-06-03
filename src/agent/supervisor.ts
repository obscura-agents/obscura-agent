import type { VeniceClient } from "../venice/client";
import type { ModelSpec, WebSearchCitation } from "../venice/types";
import { resolveDefaults } from "../venice/models";
import { runInvestigation, type RunArgs, type RunResult } from "./orchestrator";

// Strict json_schema: object with all props required + additionalProperties:false.
export const PLAN_SCHEMA = {
  name: "research_plan",
  strict: true,
  schema: {
    type: "object",
    properties: {
      subtasks: { type: "array", items: { type: "string" } },
    },
    required: ["subtasks"],
    additionalProperties: false,
  },
} as const;

/** Supervisor: decompose a question into focused, non-overlapping sub-questions. */
export async function planSubtasks(
  client: VeniceClient,
  model: string,
  question: string,
  max = 3,
): Promise<string[]> {
  const res = await client.chat({
    model,
    messages: [
      {
        role: "system",
        content:
          `Decompose the research question into at most ${max} focused, non-overlapping ` +
          "sub-questions that together fully cover it. Return only the sub-questions.",
      },
      { role: "user", content: question },
    ],
    response_format: { type: "json_schema", json_schema: PLAN_SCHEMA as unknown as Record<string, unknown> },
  });

  let subtasks: string[] = [];
  try {
    subtasks = JSON.parse(res.choices[0]?.message.content ?? "{}").subtasks ?? [];
  } catch {
    subtasks = [];
  }
  subtasks = subtasks.filter((s) => typeof s === "string" && s.trim()).slice(0, max);
  return subtasks.length ? subtasks : [question];
}

/** Merge parallel worker results into a single RunResult (dedup citations by url). */
export function mergeResults(subtasks: string[], results: RunResult[]): RunResult {
  const seen = new Set<string>();
  const citations: WebSearchCitation[] = [];
  const receipts: RunResult["receipts"] = [];
  const transcript: RunResult["transcript"] = [];

  results.forEach((r) => {
    for (const c of r.citations) {
      if (!seen.has(c.url)) {
        seen.add(c.url);
        citations.push(c);
      }
    }
    receipts.push(...r.receipts);
    transcript.push(...r.transcript);
  });

  const finalAnswer = subtasks
    .map((st, i) => `## ${st}\n${results[i]?.finalAnswer ?? ""}`)
    .join("\n\n");

  const stoppedReason = results.some((r) => r.stoppedReason === "completed") ? "completed" : "max_steps";

  return { finalAnswer, citations, receipts, transcript, stoppedReason };
}

export interface SupervisedArgs extends RunArgs {
  maxAgents?: number;
  /** Injectable worker (defaults to runInvestigation) — keeps the supervisor unit-testable. */
  runWorker?: (args: RunArgs) => Promise<RunResult>;
  /** Called once with the planned sub-questions (lets callers surface the plan live). */
  onPlan?: (subtasks: string[]) => void;
}

/** Run a supervised, multi-agent investigation: plan → parallel workers → merge. */
export async function runSupervised(args: SupervisedArgs): Promise<RunResult> {
  const runWorker = args.runWorker ?? runInvestigation;
  const models: ModelSpec[] = args.models;
  const planModel = resolveDefaults(models).tools;

  const subtasks = await planSubtasks(args.client, planModel, args.question, args.maxAgents ?? 3);
  args.onPlan?.(subtasks);

  const results = await Promise.all(
    subtasks.map((st) =>
      runWorker({
        client: args.client,
        models,
        question: st,
        maxSteps: args.maxSteps,
        minUsd: args.minUsd,
        now: args.now,
      }),
    ),
  );

  return mergeResults(subtasks, results);
}
