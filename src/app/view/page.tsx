"use client";
import { useEffect, useState } from "react";
import { decodeShare, type SharePayload } from "../components/share";
import { DossierView } from "../components/DossierView";
import { Aperture } from "../components/Aperture";

export default function View() {
  const [payload, setPayload] = useState<SharePayload | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    setPayload(hash ? decodeShare<SharePayload>(hash) : null);
    setLoaded(true);
  }, []);

  return (
    <main className="app">
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
        <Aperture size={48} />
        <div>
          <h1 style={{ fontSize: "1.8rem", letterSpacing: "0.12em" }} className="brand">
            Obscura Agent
          </h1>
          <p className="eyebrow">shared dossier</p>
        </div>
      </div>

      {!loaded ? null : payload ? (
        <>
          <p className="lede" style={{ marginBottom: "1.5rem" }}>{payload.q}</p>
          <DossierView dossier={payload.dossier} />
          {payload.vault && (
            <div className="panel dossier vault-brief" style={{ marginTop: "1.5rem" }}>
              <h4>🔒 Vault brief — sealed (E2EE)</h4>
              <p className="summary">{payload.vault}</p>
            </div>
          )}
        </>
      ) : (
        <p className="empty" style={{ marginTop: "2rem" }}>
          No shared dossier found in this link.
        </p>
      )}

      <p style={{ marginTop: "2.5rem" }}>
        <a href="/" className="powered">
          ← Run your own investigation
        </a>
      </p>
    </main>
  );
}
