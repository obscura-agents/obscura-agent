import type { Metadata } from "next";
import { Console } from "../components/Console";

export const metadata: Metadata = {
  title: "Console — Obscura Agent",
  description: "Run a private, autonomous research investigation.",
};

export default function AppPage() {
  return (
    <main className="app-page">
      <div className="container">
        <div className="section-head" data-reveal>
          <span className="eyebrow">Research console</span>
          <h2>Run an investigation.</h2>
          <p>
            Ask a question, attach a document or image, or speak it. Every step leaves a privacy
            receipt; the result is a sourced dossier you can trust.
          </p>
        </div>
        <Console />
      </div>
    </main>
  );
}
