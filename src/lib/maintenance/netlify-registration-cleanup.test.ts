import { describe, expect, it, vi } from "vitest";
import { runScheduledRegistrationCleanup } from "./netlify-registration-cleanup";

const context = {
  deploy: { context: "production", published: true, id: "proof-deploy" },
  site: { name: "proof-site" },
};
const secret = "synthetic-test-only-maintenance-secret";

describe("Netlify scheduled registration cleanup", () => {
  it("addresses its own deploy and preserves the exact bearer authorization without redirects", async () => {
    const send = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 200 }));
    await runScheduledRegistrationCleanup(context, secret, send);
    expect(send).toHaveBeenCalledOnce();
    const [url, options] = send.mock.calls[0];
    expect(String(url)).toBe("https://proof-deploy--proof-site.netlify.app/api/internal/registration-cleanup");
    expect(options?.headers).toEqual({ authorization: `Bearer ${secret}` });
    expect(options?.redirect).toBe("error");
    expect(options?.signal).toBeInstanceOf(AbortSignal);
  });

  it.each([undefined, "deploy-preview", "branch-deploy", "dev"])(
    "does not run from context %s, including manual preview invocation",
    async (deployContext) => {
      const send = vi.fn<typeof fetch>();
      await expect(runScheduledRegistrationCleanup({
        ...context, deploy: { ...context.deploy, context: deployContext },
      }, secret, send)).rejects.toThrow("outside production");
      expect(send).not.toHaveBeenCalled();
    },
  );

  it("rejects an unpublished deploy even when its context says production", async () => {
    const send = vi.fn<typeof fetch>();
    await expect(runScheduledRegistrationCleanup({
      ...context, deploy: { ...context.deploy, published: false },
    }, secret, send)).rejects.toThrow("outside production");
    expect(send).not.toHaveBeenCalled();
  });

  it.each([undefined, "short"])("does not send an absent or short secret", async (value) => {
    const send = vi.fn<typeof fetch>();
    await expect(runScheduledRegistrationCleanup(context, value, send)).rejects.toThrow("configuration is incomplete");
    expect(send).not.toHaveBeenCalled();
  });

  it.each(["", "site.other.test", "user:password@host", "host:444", "host/path"])(
    "rejects an invalid runtime identity %s without making a request",
    async (name) => {
      const send = vi.fn<typeof fetch>();
      await expect(runScheduledRegistrationCleanup({ ...context, site: { name } }, secret, send))
        .rejects.toThrow("deployment identity is invalid");
      expect(send).not.toHaveBeenCalled();
    },
  );

  it("reports upstream failure without returning or logging a response body", async () => {
    const send = vi.fn<typeof fetch>().mockResolvedValue(new Response("private diagnostic", { status: 500 }));
    await expect(runScheduledRegistrationCleanup(context, secret, send)).rejects.toThrow("HTTP 500");
  });
});
