import { createAuthFetch } from "venice-x402-client";
import { VeniceClient } from "./client";

export interface ClientEnv {
  OBSCURA_PAYMENT_MODE?: string;
  VENICE_API_KEY?: string;
  VENICE_BASE_URL?: string;
  WALLET_PRIVATE_KEY?: string;
  WALLET_KEY?: string;
}

/**
 * Build a VeniceClient for the configured payment mode:
 * - "apikey" (default): bearer key auth.
 * - "x402": wallet-signed fetch (self-funding via Base USDC), no API key.
 */
export function createVeniceClient(env: ClientEnv, userKey?: string): VeniceClient {
  // BYOK: a user-provided key wins over platform secrets — lets the app run
  // free-to-host with each user funding their own Venice access.
  if (userKey && userKey.trim()) {
    return new VeniceClient({ apiKey: userKey.trim(), baseUrl: env.VENICE_BASE_URL });
  }

  const mode = env.OBSCURA_PAYMENT_MODE ?? "apikey";

  if (mode === "x402") {
    const pk = env.WALLET_PRIVATE_KEY ?? env.WALLET_KEY;
    if (!pk) throw new Error("x402 mode requires WALLET_PRIVATE_KEY (or WALLET_KEY)");
    const authFetch = createAuthFetch(pk) as unknown as typeof fetch;
    return new VeniceClient({ baseUrl: "https://api.venice.ai/api/v1", fetchImpl: authFetch });
  }

  if (!env.VENICE_API_KEY) throw new Error("apikey mode requires VENICE_API_KEY");
  return new VeniceClient({ apiKey: env.VENICE_API_KEY, baseUrl: env.VENICE_BASE_URL });
}
