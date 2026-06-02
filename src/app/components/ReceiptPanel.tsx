"use client";
import type { PrivacyReceipt } from "../../privacy/receipt";

export function ReceiptPanel({ receipts }: { receipts: PrivacyReceipt[] }) {
  return (
    <div className="receipts">
      <h3>Privacy Receipts</h3>
      {receipts.length === 0 && <p className="muted">No steps yet.</p>}
      {receipts.map((r, i) => (
        <div key={i} className="receipt">
          <span className={`badge ${r.mode}`}>{r.mode}</span>
          <span>{r.action}</span>
          <span className="muted">{r.model}</span>
          <span>tier: {r.privacy_tier}</span>
          <span>e2ee: {r.e2ee_applied ? "applied" : r.e2ee_capable ? "available" : "n/a"}</span>
          <span>attestation: {r.attestation}</span>
        </div>
      ))}
    </div>
  );
}
