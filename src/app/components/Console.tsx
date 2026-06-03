"use client";
import { useState, useEffect } from "react";
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
  const [cover, setCover] = useState<string>("");
  const [audio, setAudio] = useState<string>("");
  const [vaultText, setVaultText] = useState<string>("");
  const [running, setRunning] = useState(false);

  // BYOK — bring your own Venice key (stored only in this browser).
  const [useOwnKey, setUseOwnKey] = useState(false);
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("obscura_venice_key");
    if (saved) {
      setApiKey(saved);
      setUseOwnKey(true);
    }
  }, []);

  function updateKey(v: string) {
    setApiKey(v);
    if (v.trim()) localStorage.setItem("obscura_venice_key", v.trim());
    else localStorage.removeItem("obscura_venice_key");
  }

  async function run(q: string) {
    if (!q.trim() || running) return;
    setReceipts([]);
    setDossier(null);
    setCover("");
    setAudio("");
    setVaultText("");
    setIsError(false);
    setRunning(true);
    setStatus("Opening the chamber");

    try {
      const byok = useOwnKey && apiKey.trim() ? { veniceApiKey: apiKey.trim() } : {};
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, ...byok }),
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
          if (ev.type === "vault") setVaultText(String(ev.text));
          if (ev.type === "cover") setCover(String(ev.dataUrl));
          if (ev.type === "audio") setAudio(String(ev.dataUrl));
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

        <div className="keymode">
          <div className="keymode-toggle">
            <button type="button" className={!useOwnKey ? "on" : ""} onClick={() => setUseOwnKey(false)}>
              Platform
            </button>
            <button type="button" className={useOwnKey ? "on" : ""} onClick={() => setUseOwnKey(true)}>
              Your Venice key
            </button>
          </div>
          {useOwnKey && (
            <div className="keymode-input">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => updateKey(e.target.value)}
                placeholder="your Venice API key"
                autoComplete="off"
                spellCheck={false}
              />
              <span className="keymode-note">
                Stored only in your browser · sent only with your request · never logged.
              </span>
            </div>
          )}
        </div>

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

        {vaultText && (
          <div className="panel dossier vault-brief">
            <h4>🔒 Vault brief — sealed (E2EE)</h4>
            <p className="summary">{vaultText}</p>
          </div>
        )}

        {(cover || audio) && (
          <div className="briefing">
            {cover && (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="briefing-cover" src={cover} alt="Dossier cover" />
            )}
            <div className="briefing-audio">
              <span className="briefing-label">Audio briefing</span>
              {audio ? (
                <audio controls src={audio} />
              ) : (
                <span className="empty">generating…</span>
              )}
            </div>
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
