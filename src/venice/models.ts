import type { ModelSpec } from "./types";

export interface ResolvedDefaults {
  tools: string; // recon-mode default (function calling + web search)
  uncensored: string; // uncensored private model for hard-but-legit subtasks
  vault: string | null; // e2ee/attested model for vault mode (no tools)
}

const FALLBACK = {
  tools: "zai-org-glm-4.7",
  uncensored: "venice-uncensored-1-2",
};

function byTrait(models: ModelSpec[], trait: string): string | undefined {
  return models.find((m) => m.model_spec.traits?.includes(trait))?.id;
}

export function resolveDefaults(models: ModelSpec[]): ResolvedDefaults {
  const tools =
    byTrait(models, "function_calling_default") ??
    byTrait(models, "default") ??
    models.find((m) => m.model_spec.capabilities?.supportsFunctionCalling)?.id ??
    FALLBACK.tools;
  const uncensored = byTrait(models, "most_uncensored") ?? FALLBACK.uncensored;
  const vault =
    models.find(
      (m) => m.model_spec.capabilities?.supportsTeeAttestation && m.model_spec.capabilities?.supportsE2EE,
    )?.id ?? null;
  return { tools, uncensored, vault };
}

export function classifyPrivacy(model: ModelSpec): { privacy_tier: string; e2ee_capable: boolean } {
  const caps = model.model_spec.capabilities;
  return {
    privacy_tier: model.model_spec.privacy,
    e2ee_capable: Boolean(caps?.supportsE2EE && caps?.supportsTeeAttestation),
  };
}
