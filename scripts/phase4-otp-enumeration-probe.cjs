/* eslint-disable no-console */
/**
 * Post-fix enumeration check:
 * 1) Same-origin /api/auth/request-otp responses identical for member vs unknown
 * 2) Sign-in JS must not call browser supabase.auth.signInWithOtp (no direct /otp from UI)
 */
const PROD = "https://tncod-professionals-azure.vercel.app";
const MEMBER = "smiley7605+tncodphase4oct03@gmail.com";
const UNKNOWN = `tncod-enum-${Date.now()}@example.invalid`;

async function requestOtp(email) {
  const res = await fetch(`${PROD}/api/auth/request-otp`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, next: "/dashboard" }),
  });
  const text = await res.text();
  return { status: res.status, body: text };
}

(async () => {
  const html = await (await fetch(`${PROD}/sign-in`)).text();
  const scripts = [...html.matchAll(/\/_next\/static\/[^"]+\.js/g)].map((m) => m[0]);
  let mentionsBrowserOtp = false;
  let mentionsRequestOtpRoute = false;
  for (const s of scripts) {
    const js = await (await fetch(`${PROD}${s}`)).text();
    if (js.includes("signInWithOtp") && js.includes("createBrowserClient")) {
      mentionsBrowserOtp = true;
    }
    if (js.includes("/api/auth/request-otp")) {
      mentionsRequestOtpRoute = true;
    }
  }
  console.log("bundle_has_request_otp_route", mentionsRequestOtpRoute);
  console.log("bundle_browser_signInWithOtp", mentionsBrowserOtp);

  const unknown = await requestOtp(UNKNOWN);
  const member = await requestOtp(MEMBER);
  console.log("unknown_status", unknown.status, "len", unknown.body.length);
  console.log("member_status", member.status, "len", member.body.length);
  const identical =
    unknown.status === member.status && unknown.body === member.body;
  console.log("SAME_ORIGIN_IDENTICAL", identical);

  const pass = identical && mentionsRequestOtpRoute && !mentionsBrowserOtp;
  console.log("ENUMERATION_CLASS", pass ? "PASS" : "FAIL");
  process.exit(pass ? 0 : 10);
})().catch((e) => {
  console.error("FATAL", e instanceof Error ? e.message : e);
  process.exit(1);
});
