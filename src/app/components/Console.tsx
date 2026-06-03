"use client";
import { useState } from "react";
import { ReceiptPanel } from "./ReceiptPanel";
import { DossierView } from "./DossierView";
import type { PrivacyReceipt } from "../../privacy/receipt";
import type { Dossier } from "../../agent/report";

const SUGGESTIONS = [
  "What is Venice.ai's privacy model?",
  "Recent developments in zero-knowledge proofs",
  "How does TEE attestation work?",
];

export function Console() {
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState("");
  const [isError, setIsError] = useState(false);
  const [receipts, setReceipts] = useState<PrivacyReceipt[]>([]);
  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [running, setRunning] = useState(false);

  async function run(q: string) {
    if (!q.trim() || running) return;
    setReceipts([]);
    setDossier(null);
    setIsError(false);
    setRunning(true);
    setStatus("Opening the chamber");

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });

      if (!res.ok || !res.body) {
        const msg = await res.text().catch(() => "Request failed");
        setIsError(true);
        setStatus(msg || `Error ${res.status}`);
        setRunning(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const part of parts) {
          const payload = part.replace(/^data: /, "").trim();
          if (!payload || payload === "[DONE]") continue;
          let ev: { type: string; [k: string]: unknown };
          try {
            ev = JSON.parse(payload);
          } catch {
            continue;
          }
          if (ev.type === "status") setStatus(String(ev.message));
          if (ev.type === "receipt") setReceipts((r) => [...r, ev.receipt as PrivacyReceipt]);
          if (ev.type === "dossier") {
            setDossier(ev.dossier as Dossier);
            setStatus(`Investigation complete — ${String(ev.stoppedReason)}`);
          }
        }
      }
    } catch (e) {
      setIsError(true);
      setStatus((e as Error).message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="console">
      <div className="console-bar">
        <span className="led" />
        Research console
      </div>
      <div className="console-body">
        <form
          className="composer"
          onSubmit={(e) => {
            e.preventDefault();
            run(question);
          }}
        >
          <div className="field">
            <label htmlFor="q">Your question</label>
            <input
              id="q"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask anything worth keeping private…"
              autoComplete="off"
            />
          </div>
          <button className="btn" type="submit" disabled={running || !question.trim()}>
            {running ? "Investigating" : "Investigate"}
          </button>
        </form>

        <p className={`status${isError ? " err" : ""}`}>
          {status}
          {running && <span className="blink"> ▍</span>}
        </p>

        {!running && receipts.length === 0 && !dossier && (
          <div className="suggest">
            {SUGGESTIONS.map((s) => (
              <button key={s} type="button" onClick={() => { setQuestion(s); run(s); }}>
                {s}
              </button>
            ))}
          </div>
        )}

        {(running || receipts.length > 0 || dossier) && (
          <div className="results">
            <ReceiptPanel receipts={receipts} />
            <DossierView dossier={dossier} running={running} />
          </div>
        )}
      </div>
    </div>
  );
}
