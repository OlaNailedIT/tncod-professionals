/** Hosting deployment context, deliberately independent of NODE_ENV (also used by local builds). */
export function isProductionDeployment(env: Record<string, string | undefined> = process.env): boolean {
  return env.VERCEL_ENV === "production" || env.CONTEXT === "production";
}
