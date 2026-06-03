"use client";
import { useState, useEffect, useRef } from "react";
import { ReceiptPanel } from "./ReceiptPanel";
import { DossierView } from "./DossierView";
import { dossierToMarkdown } from "../../agent/exportDossier";
import { DEMO_EVENTS, DEMO_QUESTION } from "./demoScript";
import { encodeShare } from "./share";
import { PERSONAS, type PersonaKey } from "../../agent/personas";
import type { PrivacyReceipt } from "../../privacy/receipt";
import type { Dossier } from "../../agent/report";

const SUGGESTIONS = [
  "What is Venice.ai's privacy model?",
  "Recent developments in zero-knowledge proofs",
  "How does TEE attestation work?",
];

const ACT_ICON: Record<string, string> = {
  web_search: "🔎",
  fetch_url: "📄",
  recall: "🧠",
  answer: "✒︎",
};

export function Console() {
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState("");
  const [isError, setIsError] = useState(false);
  const [receipts, setReceipts] = useState<PrivacyReceipt[]>([]);
  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [cover, setCover] = useState<string>("");
  const [audio, setAudio] = useState<string>("");
  const [vaultText, setVaultText] = useState<string>("");
  const [plan, setPlan] = useState<string[]>([]);
  const [activity, setActivity] = useState<{ action: string; detail?: string }[]>([]);
  const [deep, setDeep] = useState(false);
  const [model, setModel] = useState<"default" | "uncensored">("default");
  const [persona, setPersona] = useState<PersonaKey>("investigator");
  const [attachment, setAttachment] = useState<{ kind: "file" | "image"; dataUrl: string; name: string } | null>(null);
  const [running, setRunning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 25 * 1024 * 1024) {
      setIsError(true);
      setStatus("Attachment too large (max 25MB).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      setAttachment({
        kind: f.type.startsWith("image/") ? "image" : "file",
        dataUrl: String(reader.result),
        name: f.name,
      });
    reader.readAsDataURL(f);
    e.target.value = "";
  }
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<{ q: string; dossier: Dossier; vault?: string; ts: number }[]>([]);
  const feedRef = useRef<HTMLDivElement>(null);
  const dossierRef = useRef<Dossier | null>(null);
  const vaultRef = useRef("");

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight });
  }, [activity]);

  useEffect(() => {
    try {
      const h = JSON.parse(localStorage.getItem("obscura_history") || "[]");
      if (Array.isArray(h)) setHistory(h);
    } catch {
      // ignore corrupt history
    }
  }, []);

  function saveHistory(item: { q: string; dossier: Dossier; vault?: string; ts: number }) {
    setHistory((prev) => {
      const next = [item, ...prev].slice(0, 8);
      try {
        localStorage.setItem("obscura_history", JSON.stringify(next));
      } catch {
        // storage full / unavailable
      }
      return next;
    });
  }

  function loadHistory(item: { q: string; dossier: Dossier; vault?: string }) {
    resetState();
    setQuestion(item.q);
    setDossier(item.dossier);
    setVaultText(item.vault || "");
    dossierRef.current = item.dossier;
    vaultRef.current = item.vault || "";
    setStatus("Loaded from history");
  }

  function copyLink() {
    if (!dossier) return;
    const link = `${location.origin}/view#${encodeShare({ q: question, dossier, vault: vaultText || undefined })}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  function downloadMd() {
    if (!dossier) return;
    const md = dossierToMarkdown(question, dossier, vaultText || undefined);
    const url = URL.createObjectURL(new Blob([md], { type: "text/markdown" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "obscura-dossier.md";
    a.click();
    URL.revokeObjectURL(url);
  }

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

  function resetState() {
    setReceipts([]);
    setDossier(null);
    setCover("");
    setAudio("");
    setVaultText("");
    setPlan([]);
    setActivity([]);
    setIsError(false);
    setCopied(false);
    dossierRef.current = null;
    vaultRef.current = "";
  }

  function applyEvent(ev: { type: string; [k: string]: unknown }) {
    if (ev.type === "status") setStatus(String(ev.message));
    if (ev.type === "receipt") setReceipts((r) => [...r, ev.receipt as PrivacyReceipt]);
    if (ev.type === "activity")
      setActivity((a) => [...a, { action: String(ev.action), detail: ev.detail ? String(ev.detail) : undefined }]);
    if (ev.type === "plan") setPlan((ev.subtasks as string[]) ?? []);
    if (ev.type === "vault") {
      setVaultText(String(ev.text));
      vaultRef.current = String(ev.text);
    }
    if (ev.type === "cover") setCover(String(ev.dataUrl));
    if (ev.type === "audio") setAudio(String(ev.dataUrl));
    if (ev.type === "dossier") {
      setDossier(ev.dossier as Dossier);
      dossierRef.current = ev.dossier as Dossier;
      setStatus(`Investigation complete — ${String(ev.stoppedReason)}`);
    }
  }

  async function runDemo() {
    if (running) return;
    resetState();
    setQuestion(DEMO_QUESTION);
    setRunning(true);
    for (const ev of DEMO_EVENTS) {
      applyEvent(ev as { type: string; [k: string]: unknown });
      await new Promise((r) => setTimeout(r, ev.type === "activity" ? 480 : 760));
    }
    setRunning(false);
  }

  async function run(q: string) {
    if (!q.trim() || running) return;
    resetState();
    setRunning(true);
    setStatus("Opening the chamber");

    try {
      const byok = useOwnKey && apiKey.trim() ? { veniceApiKey: apiKey.trim() } : {};
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, deep, model, persona, ...(attachment ? { attachment } : {}), ...byok }),
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
          applyEvent(ev);
        }
      }

      if (dossierRef.current) {
        saveHistory({ q, dossier: dossierRef.current, vault: vaultRef.current || undefined, ts: Date.now() });
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

        <div className="attach-row">
          <button type="button" className="attach-btn" onClick={() => fileInputRef.current?.click()}>
            📎 Attach document / image
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.pptx,.xlsx,.txt,image/*"
            onChange={onPickFile}
            hidden
          />
          {attachment && (
            <span className="attach-chip">
              {attachment.kind === "image" ? "🖼️" : "📄"} {attachment.name}
              <button type="button" onClick={() => setAttachment(null)} aria-label="remove attachment">
                ✕
              </button>
            </span>
          )}
        </div>

        <button type="button" className="demo-cta" onClick={runDemo} disabled={running}>
          ▶ Watch a live demo — no key needed
        </button>

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

        <div className="deepmode">
          <button
            type="button"
            className={`deeptoggle${deep ? " on" : ""}`}
            onClick={() => setDeep(!deep)}
          >
            {deep ? "◉" : "○"} Deep mode
          </button>
          <span className="deepmode-note">
            supervisor dispatches parallel specialist agents · more thorough, more credits
          </span>
        </div>

        <div className="deepmode">
          <div className="keymode-toggle">
            <button type="button" className={model === "default" ? "on" : ""} onClick={() => setModel("default")}>
              Balanced
            </button>
            <button
              type="button"
              className={model === "uncensored" ? "on" : ""}
              onClick={() => setModel("uncensored")}
            >
              Uncensored
            </button>
          </div>
          <span className="deepmode-note">uncensored = won&apos;t refuse legitimate-but-hard topics</span>
        </div>

        <div className="deepmode">
          <div className="keymode-toggle">
            {(Object.keys(PERSONAS) as PersonaKey[]).map((k) => (
              <button key={k} type="button" className={persona === k ? "on" : ""} onClick={() => setPersona(k)}>
                {PERSONAS[k].label}
              </button>
            ))}
          </div>
          <span className="deepmode-note">persona shapes the investigator&apos;s style</span>
        </div>

        <p className={`status${isError ? " err" : ""}`}>
          {status}
          {running && <span className="blink"> ▍</span>}
        </p>

        {activity.length > 0 && (
          <div className="feed" ref={feedRef}>
            {activity.map((a, i) => (
              <div className="feed-line" key={i}>
                <span className="feed-ico">{ACT_ICON[a.action] ?? "▸"}</span>
                <span className="feed-act">{a.action.replace(/_/g, " ")}</span>
                {a.detail && <span className="feed-detail">{a.detail}</span>}
              </div>
            ))}
          </div>
        )}

        {!running && receipts.length === 0 && !dossier && (
          <div className="suggest">
            {SUGGESTIONS.map((s) => (
              <button key={s} type="button" onClick={() => { setQuestion(s); run(s); }}>
                {s}
              </button>
            ))}
          </div>
        )}

        {plan.length > 0 && (
          <div className="panel plan">
            <h4>⊞ Agents dispatched</h4>
            <ol>
              {plan.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ol>
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

        {dossier && (
          <div className="export-bar">
            <button type="button" className="btn" onClick={copyLink}>
              {copied ? "✓ Link copied" : "⧉ Copy share link"}
            </button>
            <button type="button" className="btn" onClick={downloadMd}>
              ⬇ Download .md
            </button>
          </div>
        )}

        {history.length > 0 && (
          <div className="history">
            <h4>Recent investigations</h4>
            <ul>
              {history.map((h, i) => (
                <li key={i}>
                  <button type="button" onClick={() => loadHistory(h)}>
                    {h.q}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
