import { describe, it, expect } from "vitest";
import { dossierToMarkdown } from "../../src/agent/exportDossier";

describe("dossierToMarkdown", () => {
  it("renders a cited, verdict-annotated markdown dossier", () => {
    const md = dossierToMarkdown("what happened?", {
      summary: "a clear summary",
      findings: [{ claim: "X did Y", source_urls: ["https://s1"], verdict: "supported", reason: "ok" }],
      open_questions: ["what about Z?"],
    });

    expect(md).toContain("what happened?");
    expect(md).toContain("a clear summary");
    expect(md).toContain("X did Y");
    expect(md).toContain("https://s1");
    expect(md.toLowerCase()).toContain("supported");
    expect(md).toContain("what about Z?");
    expect(md).toContain("Powered by Venice");
  });

  it("includes the vault brief when provided", () => {
    const md = dossierToMarkdown("q", { summary: "s", findings: [], open_questions: [] }, "sealed text");
    expect(md).toContain("sealed text");
  });
});
