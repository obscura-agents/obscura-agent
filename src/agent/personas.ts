export interface Persona {
  label: string;
  prompt: string;
}

/** Investigator personas — applied as a system-prompt style (honest; no fake character slugs). */
export const PERSONAS = {
  investigator: {
    label: "Investigator",
    prompt: "Investigate thoroughly and neutrally; follow the evidence wherever it leads.",
  },
  skeptic: {
    label: "Skeptic",
    prompt:
      "Be highly skeptical. Demand strong, corroborated evidence, prefer primary sources, and explicitly flag weak or unsupported claims.",
  },
  analyst: {
    label: "Analyst",
    prompt:
      "Be structured and data-driven. Quantify and compare where possible, and organize findings into clear, decision-useful points.",
  },
} as const;

export type PersonaKey = keyof typeof PERSONAS;

export function personaPrompt(key?: string): string | undefined {
  if (key && key in PERSONAS) return PERSONAS[key as PersonaKey].prompt;
  return undefined;
}
