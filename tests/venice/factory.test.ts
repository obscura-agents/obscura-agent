import { describe, it, expect, vi } from "vitest";

vi.mock("venice-x402-client", () => ({
  createAuthFetch: vi.fn(() => (() => {}) as unknown as typeof fetch),
}));

import { createVeniceClient } from "../../src/venice/factory";
import { createAuthFetch } from "venice-x402-client";

describe("createVeniceClient", () => {
  it("apikey mode builds a bearer client without touching x402", () => {
    const c = createVeniceClient({ OBSCURA_PAYMENT_MODE: "apikey", VENICE_API_KEY: "k" });
    expect(c).toBeTruthy();
    expect(createAuthFetch).not.toHaveBeenCalled();
  });

  it("defaults to apikey mode when OBSCURA_PAYMENT_MODE is unset", () => {
    const c = createVeniceClient({ VENICE_API_KEY: "k" });
    expect(c).toBeTruthy();
  });

  it("x402 mode builds a wallet-signed client via createAuthFetch", () => {
    createVeniceClient({ OBSCURA_PAYMENT_MODE: "x402", WALLET_PRIVATE_KEY: "0xabc" });
    expect(createAuthFetch).toHaveBeenCalledWith("0xabc");
  });

  it("throws when the required secret is missing", () => {
    expect(() => createVeniceClient({ OBSCURA_PAYMENT_MODE: "x402" })).toThrow(/WALLET/);
    expect(() => createVeniceClient({ OBSCURA_PAYMENT_MODE: "apikey" })).toThrow(/VENICE_API_KEY/);
  });
});
