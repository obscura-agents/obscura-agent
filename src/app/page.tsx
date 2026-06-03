"use client";
import { useState } from "react";
import { ReceiptPanel } from "./components/ReceiptPanel";
import { DossierView } from "./components/DossierView";
import type { PrivacyReceipt } from "../privacy/receipt";
import type { Dossier } from "../agent/report";

export default function Home() {
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState("");
  const [receipts, setReceipts] = useState<PrivacyReceipt[]>([]);
  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [running, setRunning] = useState(false);

  async function run() {
    setReceipts([]);
    setDossier(null);
    setRunning(true);
    setStatus("Starting…");
    const res = await fetch("/api/research", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        const payload = line.replace(/^data: /, "");
        if (payload === "[DONE]") continue;
        const ev = JSON.parse(payload);
        if (ev.type === "status") setStatus(ev.message);
        if (ev.type === "receipt") setReceipts((r) => [...r, ev.receipt]);
        if (ev.type === "dossier") {
          setDossier(ev.dossier);
          setStatus(`Done (${ev.stoppedReason})`);
        }
      }
    }
    setRunning(false);
  }

  return (
    <main className="app">
      <h1>Obscura Agent</h1>
      <p className="tagline">
        Private research that leaves no trace. <span className="powered">Powered by Venice</span>
      </p>
      <div className="composer">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a research question…"
        />
        <button onClick={run} disabled={running || !question}>
          {running ? "Investigating…" : "Investigate"}
        </button>
      </div>
      <p className="status">{status}</p>
      <div className="grid">
        <ReceiptPanel receipts={receipts} />
        <DossierView dossier={dossier} />
      </div>
    </main>
  );
}
