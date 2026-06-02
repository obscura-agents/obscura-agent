"use client";
import type { Dossier } from "../../agent/report";

export function DossierView({ dossier }: { dossier: Dossier | null }) {
  if (!dossier) return null;
  return (
    <div className="dossier">
      <h3>Dossier</h3>
      <p>{dossier.summary}</p>
      <h4>Findings</h4>
      <ul>
        {dossier.findings.map((f, i) => (
          <li key={i}>
            {f.claim}
            <div className="sources">
              {f.source_urls.map((u, j) => (
                <a key={j} href={u} target="_blank" rel="noreferrer">[{j + 1}]</a>
              ))}
            </div>
          </li>
        ))}
      </ul>
      {dossier.open_questions.length > 0 && (
        <>
          <h4>Open questions</h4>
          <ul>{dossier.open_questions.map((q, i) => <li key={i}>{q}</li>)}</ul>
        </>
      )}
    </div>
  );
}
