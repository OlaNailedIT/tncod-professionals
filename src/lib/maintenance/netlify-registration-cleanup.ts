export type NetlifyMaintenanceContext = {
  deploy: { context?: string; published?: boolean; id: string };
  site: { name: string };
};

/** Scheduled server entry point; reuses the existing authenticated cleanup route. */
export async function runScheduledRegistrationCleanup(
  context: NetlifyMaintenanceContext,
  secret: string | undefined,
  send: typeof fetch = fetch,
): Promise<void> {
  if (context.deploy.context !== "production" || !context.deploy.published) {
    throw new Error("Scheduled maintenance is disabled outside production");
  }
  if (!secret || secret.length < 32) {
    throw new Error("Scheduled maintenance configuration is incomplete");
  }

  if (![context.deploy.id, context.site.name].every((value) => /^[a-z0-9-]+$/i.test(value))) {
    throw new Error("Scheduled maintenance deployment identity is invalid");
  }
  const origin = `https://${context.deploy.id}--${context.site.name}.netlify.app`;

  // Address this exact deploy, not the custom domain that may still point at Vercel.
  // Never forward the bearer secret to a redirect destination or print response bodies.
  const response = await send(new URL("/api/internal/registration-cleanup", origin), {
    headers: { authorization: `Bearer ${secret}` },
    redirect: "error",
    signal: AbortSignal.timeout(25_000),
  });
  if (!response.ok) {
    throw new Error(`Scheduled registration cleanup failed (HTTP ${response.status})`);
  }
}
