import type { VeniceClient } from "../venice/client";
import type { WebSearchCitation } from "../venice/types";

export type Verdict = "supported" | "refuted" | "uncertain";

export interface Finding {
  claim: string;
  source_urls: string[];
  /** Set by the adversarial verification pass (see agent/verify.ts). */
  verdict?: Verdict;
  reason?: string;
}

export interface Dossier {
  summary: string;
  findings: Finding[];
  open_questions: string[];
}

// Strict-mode json_schema: every object lists ALL props in required + additionalProperties:false.
export const DOSSIER_SCHEMA = {
  name: "obscura_dossier",
  strict: true,
  schema: {
    type: "object",
    properties: {
      summary: { type: "string" },
      findings: {
        type: "array",
        items: {
          type: "object",
          properties: {
            claim: { type: "string" },
            source_urls: { type: "array", items: { type: "string" } },
          },
          required: ["claim", "source_urls"],
          additionalProperties: false,
        },
      },
      open_questions: { type: "array", items: { type: "string" } },
    },
    required: ["summary", "findings", "open_questions"],
    additionalProperties: false,
  },
} as const;

export interface BuildDossierArgs {
  client: VeniceClient;
  model: string;
  question: string;
  finalAnswer: string;
  citations: WebSearchCitation[];
}

export async function buildDossier(a: BuildDossierArgs): Promise<Dossier> {
  const sources = a.citations.map((c, i) => `[${i + 1}] ${c.title} — ${c.url}`).join("\n");
  const res = await a.client.chat({
    model: a.model,
    messages: [
      {
        role: "system",
        content:
          "Produce a sourced research dossier. Every finding must cite the exact source URLs it relies on. " +
          "Only use the provided sources.",
      },
      {
        role: "user",
        content: `Question: ${a.question}\n\nDraft answer: ${a.finalAnswer}\n\nAvailable sources:\n${sources}`,
      },
    ],
    response_format: { type: "json_schema", json_schema: DOSSIER_SCHEMA as unknown as Record<string, unknown> },
  });
  return JSON.parse(res.choices[0]?.message.content ?? "{}") as Dossier;
}
