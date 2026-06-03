import type { VeniceClient } from "../venice/client";
import type { Dossier } from "./report";

export interface Briefing {
  coverDataUrl: string;
  audioDataUrl: string;
}

/**
 * Turn a dossier into a multimodal briefing using Venice's image + TTS endpoints:
 * a cover image and a spoken audio summary. Each modality degrades independently —
 * a failure in one (e.g. model unavailable) never blocks the other.
 */
export async function buildBriefing(client: VeniceClient, dossier: Dossier): Promise<Briefing> {
  const coverPrompt =
    `Minimal cinematic cover for a private research dossier about: "${dossier.summary}". ` +
    `Camera-obscura aesthetic — thin champagne-gold aperture line art on deep void-black, ` +
    `elegant, mysterious, lots of negative space, no text.`;

  const briefingText = [
    "Obscura Agent briefing.",
    dossier.summary,
    ...dossier.findings.slice(0, 3).map((f, i) => `Finding ${i + 1}. ${f.claim}`),
  ].join(" ");

  const [imgRes, audRes] = await Promise.allSettled([
    client.generateImage(coverPrompt, { aspect_ratio: "16:9", format: "webp" }),
    client.speech(briefingText),
  ]);

  const imgB64 = imgRes.status === "fulfilled" ? imgRes.value : "";
  const audioB64 =
    audRes.status === "fulfilled" ? Buffer.from(audRes.value).toString("base64") : "";

  return {
    coverDataUrl: imgB64 ? `data:image/webp;base64,${imgB64}` : "",
    audioDataUrl: audioB64 ? `data:audio/mp3;base64,${audioB64}` : "",
  };
}
