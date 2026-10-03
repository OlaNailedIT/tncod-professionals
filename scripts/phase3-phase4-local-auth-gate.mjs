import { execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

function localStatusEnv() {
  const output = execFileSync("cmd.exe", ["/d", "/s", "/c", "npx supabase status -o env"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return Object.fromEntries(
    output
      .split(/\r?\n/)
      .map((line) => line.match(/^([A-Z0-9_]+)="?(.*?)"?$/))
      .filter(Boolean)
      .map((match) => [match[1], match[2].replace(/"$/, "")]),
  );
}

const env = localStatusEnv();
const url = env.API_URL;
const publicKey = env.PUBLISHABLE_KEY || env.ANON_KEY;
const secretKey = env.SECRET_KEY || env.SERVICE_ROLE_KEY;
const databaseUrl = env.DB_URL;
if (!url || !publicKey || !secretKey || !databaseUrl) {
  throw new Error("Local Supabase status did not return the required endpoints and keys");
}

const publicClient = createClient(url, publicKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const adminClient = createClient(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
const marker = randomUUID();
const email = `phase4-gate-${marker}@example.test`;
let userId;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  const direct = await publicClient.auth.signUp({
    email: `direct-${email}`,
    password: `Local-only-${marker}!A9`,
  });
  assert(Boolean(direct.error), "direct public signup unexpectedly succeeded");

  const created = await adminClient.auth.admin.createUser({
    email,
    email_confirm: true,
  });
  assert(!created.error && created.data.user, `admin.createUser failed: ${created.error?.message}`);
  userId = created.data.user.id;

  const appUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { accountStatus: true },
  });
  assert(appUser?.accountStatus === "DEACTIVATED", "new Auth identity was not inert by default");

  const otpRequest = await publicClient.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  });
  assert(!otpRequest.error, `existing-user OTP request failed: ${otpRequest.error?.message}`);

  const link = await adminClient.auth.admin.generateLink({ type: "magiclink", email });
  const tokenHash = link.data?.properties?.hashed_token;
  assert(!link.error && tokenHash, `OTP link generation failed: ${link.error?.message}`);

  const exchange = await publicClient.auth.verifyOtp({ type: "magiclink", token_hash: tokenHash });
  assert(!exchange.error && exchange.data.session, `OTP exchange failed: ${exchange.error?.message}`);
  const replay = await publicClient.auth.verifyOtp({ type: "magiclink", token_hash: tokenHash });
  assert(Boolean(replay.error), "OTP replay unexpectedly succeeded");

  const keyHash = createHash("sha256").update(`gate-${marker}`).digest("hex");
  const decisions = [];
  for (let i = 0; i < 9; i += 1) {
    const rows = await prisma.$queryRawUnsafe(
      "SELECT allowed, retry_after_seconds FROM app.consume_registration_rate_limit($1, $2::integer, $3::integer)",
      keyHash,
      8,
      900,
    );
    decisions.push(rows[0]);
  }
  assert(decisions.slice(0, 8).every((row) => row.allowed), "rate limiter blocked before limit");
  assert(decisions[8]?.allowed === false, "rate limiter did not block the ninth attempt");

  console.log("PASSED: direct signup denied");
  console.log("PASSED: admin.createUser retained and new identity defaulted DEACTIVATED");
  console.log("PASSED: existing-user OTP request and exchange succeeded");
  console.log("PASSED: OTP replay denied");
  console.log("PASSED: distributed registration rate limit blocked attempt 9 of 9");
} finally {
  await prisma.registrationRateLimit?.deleteMany?.({ where: { clientKeyHash: marker } }).catch(() => {});
  if (userId) {
    await prisma.userRole.deleteMany({ where: { userId } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: userId } }).catch(() => {});
    await adminClient.auth.admin.deleteUser(userId).catch(() => {});
  }
  await prisma.$executeRawUnsafe(
    "DELETE FROM app.registration_rate_limits WHERE client_key_hash = $1",
    createHash("sha256").update(`gate-${marker}`).digest("hex"),
  ).catch(() => {});
  await prisma.$disconnect();
}
