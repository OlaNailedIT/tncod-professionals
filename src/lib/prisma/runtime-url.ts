/**
 * Serverless functions can each create a Prisma pool. Supabase's session pooler
 * limits sessions to its configured pool size, so use the transaction pooler
 * with one Prisma connection per process. This only changes runtime use of a
 * Supabase pooler URL; the schema's DATABASE_URL remains unchanged for migrations.
 */
export function runtimePrismaUrl(databaseUrl: string | undefined): string | undefined {
  if (!databaseUrl) return databaseUrl;

  let url: URL;
  try {
    url = new URL(databaseUrl);
  } catch {
    return databaseUrl;
  }

  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !url.hostname.endsWith(".pooler.supabase.com") ||
    !["5432", "6543"].includes(url.port)
  ) {
    return databaseUrl;
  }

  url.port = "6543";
  url.searchParams.set("pgbouncer", "true");
  url.searchParams.set("connection_limit", "1");
  return url.toString();
}
