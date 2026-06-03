import { describe, it, expect } from "vitest";
import { encodeShare, decodeShare } from "../../src/app/components/share";

describe("share encode/decode", () => {
  it("round-trips a payload through url-safe base64 (incl. unicode)", () => {
    const payload = { q: "what — privacy? café", dossier: { summary: "s", findings: [], open_questions: [] }, vault: "🔒" };
    const enc = encodeShare(payload);
    expect(enc).not.toContain("+");
    expect(enc).not.toContain("/");
    expect(enc).not.toContain("=");
    expect(decodeShare(enc)).toEqual(payload);
  });

  it("returns null on garbage", () => {
    expect(decodeShare("!!!not-base64!!!")).toBeNull();
  });
});
