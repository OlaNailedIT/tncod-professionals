const fs = require("fs");
let raw = process.env.DATABASE_URL || "";
if (!raw && fs.existsSync(".env")) {
  const line = fs.readFileSync(".env", "utf8").split(/\r?\n/).find((l) => l.startsWith("DATABASE_URL="));
  raw = (line || "").replace(/^DATABASE_URL=/, "").replace(/^"|"$/g, "");
}
try {
  const x = new URL(raw);
  const db = x.pathname.replace(/^\//, "").split("?")[0];
  console.log(
    JSON.stringify({
      host: x.hostname,
      port: x.port || "5432",
      database: db,
      user: x.username,
      sslmode: x.searchParams.get("sslmode") || "n/a",
    }),
  );
} catch {
  console.log(JSON.stringify({ error: "parse_fail", hasUrl: Boolean(raw) }));
}
