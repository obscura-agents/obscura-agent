"use client";
import type { Dossier } from "../../agent/report";

const VERDICT_COLOR: Record<string, string> = {
  supported: "#8fce9a",
  refuted: "#e08a6a",
  uncertain: "#938b7d",
};

function host(u: string): string {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return u;
  }
}

/** Bipartite "evidence board": findings (left) linked to their sources (right). */
export function EvidenceGraph({ dossier }: { dossier: Dossier }) {
  const findings = dossier.findings;
  const sources = Array.from(new Set(findings.flatMap((f) => f.source_urls)));

  if (!findings.length) return <p className="empty">No findings to graph.</p>;

  const W = 560;
  const rowH = 46;
  const padY = 26;
  const fx = 26;
  const sx = 300;
  const h = Math.max(findings.length, sources.length, 1) * rowH + padY * 2;
  const fOff = (h - findings.length * rowH) / 2;
  const sOff = (h - sources.length * rowH) / 2;
  const fy = (i: number) => fOff + i * rowH + rowH / 2;
  const sy = (i: number) => sOff + i * rowH + rowH / 2;

  return (
    <div className="graph-wrap">
      <svg viewBox={`0 0 ${W} ${h}`} width="100%" className="graph" role="img" aria-label="Evidence graph">
        {findings.flatMap((f, i) =>
          f.source_urls.map((u, j) => {
            const si = sources.indexOf(u);
            return (
              <line
                key={`${i}-${j}`}
                x1={fx + 9}
                y1={fy(i)}
                x2={sx - 6}
                y2={sy(si)}
                className="graph-edge"
              />
            );
          }),
        )}

        {findings.map((f, i) => (
          <g key={`f${i}`}>
            <circle cx={fx + 3} cy={fy(i)} r="6" fill="none" stroke={VERDICT_COLOR[f.verdict ?? "uncertain"]} strokeWidth="1.6">
              <title>{f.claim}</title>
            </circle>
            <text x={fx + 18} y={fy(i) + 4} className="graph-num">
              {i + 1}
            </text>
          </g>
        ))}

        {sources.map((u, i) => (
          <g key={`s${i}`}>
            <circle cx={sx} cy={sy(i)} r="4" className="graph-srcdot" />
            <text x={sx + 12} y={sy(i) + 4} className="graph-src">
              {host(u)}
            </text>
          </g>
        ))}
      </svg>

      <ol className="graph-legend">
        {findings.map((f, i) => (
          <li key={i}>
            <span className={`verdict ${f.verdict ?? "uncertain"}`}>{f.verdict ?? "uncertain"}</span> {f.claim}
          </li>
        ))}
      </ol>
    </div>
  );
}
