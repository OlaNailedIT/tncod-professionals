import { describe, expect, it, vi } from "vitest";
import { completePkceCallback } from "./pkce-callback";

describe("PKCE auth callback", () => {
  it("exchanges a verifier-bound query code and preserves a safe destination", async () => {
    const url = new URL(
      "https://tncod-professionals-azure.vercel.app/auth/callback" +
        "?code=pkce-code&next=%2Fexco%3Ftab%3Dmembers",
    );
    const exchangeCode = vi.fn().mockResolvedValue({ error: null });

    await expect(completePkceCallback(url.searchParams, exchangeCode)).resolves.toEqual({
      ok: true,
      next: "/exco?tab=members",
    });
    expect(exchangeCode).toHaveBeenCalledOnce();
    expect(exchangeCode).toHaveBeenCalledWith("pkce-code");
  });

  it("does not accept uncorrelated access and refresh tokens from the URL hash", async () => {
    const url = new URL(
      "https://tncod-professionals-azure.vercel.app/auth/callback" +
        "?next=%2Fprofile#access_token=attacker-access&refresh_token=attacker-refresh",
    );
    const exchangeCode = vi.fn();

    await expect(completePkceCallback(url.searchParams, exchangeCode)).resolves.toEqual({
      ok: false,
      message: "That sign-in link is invalid or has expired.",
    });
    expect(exchangeCode).not.toHaveBeenCalled();
  });

  it("fails closed when the PKCE exchange is rejected", async () => {
    const url = new URL(
      "https://tncod-professionals-azure.vercel.app/auth/callback?code=expired-code",
    );
    const exchangeCode = vi.fn().mockResolvedValue({ error: new Error("expired") });

    await expect(completePkceCallback(url.searchParams, exchangeCode)).resolves.toEqual({
      ok: false,
      message: "That sign-in link is invalid or has expired.",
    });
    expect(exchangeCode).toHaveBeenCalledOnce();
  });
});
