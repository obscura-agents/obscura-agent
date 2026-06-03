"use client";
import type { PrivacyReceipt } from "../../privacy/receipt";

export function ReceiptPanel({ receipts }: { receipts: PrivacyReceipt[] }) {
  return (
    <div className="panel dossier">
      <h4>Privacy Receipts</h4>
      {receipts.length === 0 ? (
        <p className="empty">No steps yet — each action will record how privacy was honored.</p>
      ) : (
        receipts.map((r, i) => (
          <div className="receipt" key={i} style={{ animationDelay: `${i * 0.04}s` }}>
            <span className={`badge${r.mode === "vault" ? " vault" : ""}`}>{r.mode}</span>
            <span>{r.action}</span>
            <span className="sep">·</span>
            <span className="model">{r.model}</span>
            <span className="sep">·</span>
            <span>{r.privacy_tier}</span>
            <span className="sep">·</span>
            <span>
              e2ee {r.e2ee_applied ? "on" : r.e2ee_capable ? "available" : "n/a"}
            </span>
            {r.attestation !== "not_requested" && (
              <>
                <span className="sep">·</span>
                <span>attestation {r.attestation}</span>
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
}
