import type { Dossier } from "../../agent/report";

export interface SharePayload {
  q: string;
  dossier: Dossier;
  vault?: string;
}

/** Encode a payload as url-safe base64 (for a shareable #hash link — no backend needed). */
export function encodeShare(obj: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeShare<T = SharePayload>(s: string): T | null {
  try {
    const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as T;
  } catch {
    return null;
  }
}
