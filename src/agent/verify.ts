import type { VeniceClient } from "../venice/client";
import type { Finding, Verdict } from "./report";

// Strict json_schema: every object lists all props in required + additionalProperties:false.
export const VERIFY_SCHEMA = {
  name: "verification",
  strict: true,
  schema: {
    type: "object",
    properties: {
      verdicts: {
        type: "array",
        items: {
          type: "object",
          properties: {
            verdict: { type: "string", enum: ["supported", "refuted", "uncertain"] },
            reason: { type: "string" },
          },
          required: ["verdict", "reason"],
          additionalProperties: false,
        },
      },
    },
    required: ["verdicts"],
    additionalProperties: false,
  },
} as const;

/**
 * Adversarial pass: a skeptic checks each finding against its own cited sources and
 * returns a verdict (supported / refuted / uncertain) + reason. Defaults to
 * "uncertain" for any finding the model fails to judge — never silently drops one.
 */
export async function verifyFindings(
  client: VeniceClient,
  model: string,
  findings: Finding[],
): Promise<Finding[]> {
  if (findings.length === 0) return [];

  const list = findings
    .map((f, i) => `${i + 1}. CLAIM: ${f.claim}\n   SOURCES: ${f.source_urls.join(", ") || "(none)"}`)
    .join("\n");

  const res = await client.chat({
    model,
    messages: [
      {
        role: "system",
        content:
          "You are a skeptical fact-checker. For each numbered finding, judge whether its cited " +
          "sources actually support the claim. Return a verdict per finding IN ORDER: 'supported' " +
          "(sources back it), 'refuted' (sources contradict or are absent), or 'uncertain'.",
      },
      { role: "user", content: list },
    ],
    response_format: { type: "json_schema", json_schema: VERIFY_SCHEMA as unknown as Record<string, unknown> },
  });

  let verdicts: Array<{ verdict: Verdict; reason: string }> = [];
  try {
    verdicts = JSON.parse(res.choices[0]?.message.content ?? "{}").verdicts ?? [];
  } catch {
    verdicts = [];
  }

  return findings.map((f, i) => ({
    ...f,
    verdict: verdicts[i]?.verdict ?? "uncertain",
    reason: verdicts[i]?.reason ?? "",
  }));
}
