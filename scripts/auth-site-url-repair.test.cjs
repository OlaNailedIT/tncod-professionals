const assert = require("node:assert/strict");
const test = require("node:test");
const { mergeRedirectAllowList } = require("./auth-site-url-repair.cjs");

test("repair preserves existing redirects and adds the three exact site callbacks once", () => {
  const existing = "https://existing.example/auth/callback,https://tncod-professionals-azure.vercel.app/auth/callback";
  const merged = mergeRedirectAllowList(existing).split(",");

  assert.deepEqual(merged, [
    "https://existing.example/auth/callback",
    "https://tncod-professionals-azure.vercel.app/auth/callback",
    "https://codprofessionals.viix.solutions/auth/callback",
    "https://codprofessionals.69resources.com/auth/callback",
  ]);
  assert.equal(mergeRedirectAllowList(merged.join(",")), merged.join(","));
});
