"use client";
import type { Dossier } from "../../agent/report";

export function DossierView({ dossier, running }: { dossier: Dossier | null; running?: boolean }) {
  return (
    <div className="panel dossier">
      <h4>Dossier</h4>
      {!dossier ? (
        <p className="empty">{running ? "Synthesizing a sourced dossier…" : "Awaiting an investigation."}</p>
      ) : (
        <>
          <p className="summary">{dossier.summary}</p>

          {dossier.findings.length > 0 && (
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
