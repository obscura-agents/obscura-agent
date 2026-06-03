import type { ResearchEvent } from "../../agent/session";

export const DEMO_QUESTION = "How does Venice.ai keep prompts private?";

const ts = "demo";

function reconReceipt(action: string): ResearchEvent {
  return {
    type: "receipt",
    receipt: {
      step: 1,
      mode: "recon",
      action,
      model: "zai-org-glm-4.7",
      privacy_tier: "private",
      e2ee_applied: false,
      e2ee_capable: false,
      attestation: "not_requested",
      timestamp: ts,
    },
  };
}

/** A scripted, realistic investigation — replayed client-side so the site is alive without a key. */
export const DEMO_EVENTS: ResearchEvent[] = [
  { type: "status", message: "Opening the chamber" },
  { type: "status", message: "Investigating…" },

  { type: "activity", action: "web_search", detail: "Venice.ai privacy architecture zero data retention" },
  reconReceipt("web_search"),
  { type: "activity", action: "fetch_url", detail: "https://docs.venice.ai/overview/privacy" },
  reconReceipt("fetch_url"),
  { type: "activity", action: "web_search", detail: "Venice TEE E2EE attested models" },
  reconReceipt("web_search"),
  { type: "activity", action: "fetch_url", detail: "https://venice.ai/blog/venice-launches-end-to-end-encrypted-ai" },
  reconReceipt("fetch_url"),
  { type: "activity", action: "recall", detail: "decentralized GPU providers" },
  reconReceipt("recall"),
  { type: "activity", action: "answer", detail: "synthesizing the answer" },
  reconReceipt("answer"),

  { type: "status", message: "Adversarially verifying findings…" },
  { type: "status", message: "Building dossier…" },
  {
    type: "dossier",
    stoppedReason: "completed",
    dossier: {
      summary:
        "Venice keeps prompts private by architecture rather than policy: conversations are stored only in the user's browser, the API retains nothing, requests are routed through a proxy that strips identity, and an E2EE/TEE mode lets sensitive inference run inside attested enclaves.",
      findings: [
        {
          claim: "Venice does not store prompts or responses on its servers; history lives in the user's browser.",
          source_urls: ["https://docs.venice.ai/overview/privacy"],
          verdict: "supported",
          reason: "Stated directly on the privacy docs page.",
        },
        {
          claim: "Inference is routed to decentralized GPU providers with metadata/IP stripped at a proxy.",
          source_urls: ["https://docs.venice.ai/overview/privacy"],
          verdict: "supported",
          reason: "Described in the privacy architecture section.",
        },
        {
          claim: "E2EE/TEE 'e2ee-' models run inside attested enclaves (Intel TDX + NVIDIA confidential compute).",
          source_urls: ["https://venice.ai/blog/venice-launches-end-to-end-encrypted-ai"],
          verdict: "uncertain",
          reason: "Announced; cryptographic attestation should be verified live before relying on it.",
        },
      ],
      open_questions: ["Is the TEE attestation endpoint publicly queryable for verification?"],
    },
  },

  { type: "status", message: "Sealing a confidential brief (E2EE)…" },
  {
    type: "receipt",
    receipt: {
      step: 0,
      mode: "vault",
      action: "sealed-synthesis",
      model: "e2ee-glm-5-1",
      privacy_tier: "private",
      e2ee_applied: true,
      e2ee_capable: true,
      attestation: "pending",
      timestamp: ts,
    },
  },
  {
    type: "vault",
    text:
      "Sealed brief: Venice's privacy is structural — no server-side retention, identity stripped before inference, " +
      "and an attested E2EE path for the most sensitive work. The remaining gap is making cryptographic attestation " +
      "verifiable end-to-end, which would turn 'private by design' into 'private and provable'.",
  },
  { type: "status", message: "Demo complete — this was a scripted replay (no API key used)." },
];
