"use client";
import { useState } from "react";
import type { Dossier } from "../../agent/report";
import { EvidenceGraph } from "./EvidenceGraph";

export function DossierView({ dossier, running }: { dossier: Dossier | null; running?: boolean }) {
  const [view, setView] = useState<"list" | "graph">("list");

  return (
    <div className="panel dossier">
      <div className="dossier-head">
        <h4>Dossier</h4>
        {dossier && dossier.findings.length > 0 && (
          <div className="viewtoggle">
            <button type="button" className={view === "list" ? "on" : ""} onClick={() => setView("list")}>
              List
            </button>
            <button type="button" className={view === "graph" ? "on" : ""} onClick={() => setView("graph")}>
              Graph
            </button>
          </div>
        )}
      </div>

      {!dossier ? (
        <p className="empty">{running ? "Synthesizing a sourced dossier…" : "Awaiting an investigation."}</p>
      ) : (
        <>
          <p className="summary">{dossier.summary}</p>

          {dossier.findings.length > 0 && view === "graph" && <EvidenceGraph dossier={dossier} />}

          {dossier.findings.length > 0 && view === "list" && (
            <>
              <div className="sub">Findings</div>
              <ul>
                {dossier.findings.map((f, i) => (
                  <li className="finding" key={i}>
                    {f.verdict && (
                      <span className={`verdict ${f.verdict}`} title={f.reason}>
                        {f.verdict === "supported" ? "✓" : f.verdict === "refuted" ? "✗" : "?"} {f.verdict}
                      </span>
                    )}{" "}
                    {f.claim}
                    {f.source_urls.length > 0 && (
                      <div className="cites">
                        {f.source_urls.map((u, j) => (
                          <a key={j} href={u} target="_blank" rel="noreferrer">
                            [{j + 1}]
                          </a>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}

          {dossier.open_questions.length > 0 && (
            <>
              <div className="sub">Open questions</div>
              <ul>
                {dossier.open_questions.map((q, i) => (
                  <li className="finding" key={i}>
                    {q}
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  );
}
