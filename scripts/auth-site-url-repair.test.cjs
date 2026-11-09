const assert = require("node:assert/strict");
const test = require("node:test");
const { mergeRedirectAllowList, parseArgs, buildUrlPatch, main } = require("./auth-site-url-repair.cjs");

const previousSite = "https://tncod-professionals-olanailedits-projects.vercel.app/";
const officialSite = "https://codprofessionals.69resources.com/";
const existing = [
  "https://existing.example/auth/callback",
  "https://tncod-professionals-azure.vercel.app/auth/callback",
  "https://codprofessionals.viix.solutions/auth/callback",
  "https://codprofessionals.69resources.com/auth/callback",
];
const addition = "https://codprofessionals.69resources.com/auth/callback**";

function currentConfig(overrides = {}) {
  return {
    site_url: previousSite,
    uri_allow_list: existing.join(","),
    disable_signup: true,
    external_email_enabled: true,
    ...overrides,
  };
}

test("only adds the official callback query pattern and preserves every existing redirect", () => {
  const merged = mergeRedirectAllowList(existing.join(",")).split(",");
  assert.deepEqual(merged, [...existing, addition]);
  assert.equal(mergeRedirectAllowList(merged.join(",")), merged.join(","));
});

test("default and --verify-only are read only; write mode requires an exact target and observed Site URL", () => {
  assert.deepEqual(parseArgs([]), { apply: false, expected: undefined });
  assert.deepEqual(parseArgs(["--verify-only"]), { apply: false, expected: undefined });
  assert.deepEqual(parseArgs([
    "--apply",
    "--project-ref=brpppukzqgpzxjelwwrj",
    `--expected-site-url=${previousSite}`,
  ]), { apply: true, expected: previousSite });
  assert.throws(() => parseArgs(["--apply"]), /requires/);
  assert.throws(() => parseArgs(["--apply", "--project-ref=other", `--expected-site-url=${previousSite}`]), /requires/);
  assert.throws(() => parseArgs(["--apply", "--verify-only"]), /Invalid/);
  assert.throws(() => parseArgs(["--verify-only", "--expected-site-url="]), /only accepted/);
  assert.throws(() => parseArgs(["--apply", "--apply"]), /Invalid/);
  assert.throws(() => parseArgs(["--unexpected"]), /Invalid/);
});

test("cutover patch changes only the Site URL and one additive redirect", () => {
  assert.deepEqual(buildUrlPatch(currentConfig(), previousSite), {
    site_url: officialSite,
    uri_allow_list: [...existing, addition].join(","),
  });
  const alreadyUpdated = currentConfig({ site_url: officialSite, uri_allow_list: [...existing, addition].join(",") });
  assert.deepEqual(buildUrlPatch(alreadyUpdated, officialSite), {
    site_url: officialSite,
    uri_allow_list: alreadyUpdated.uri_allow_list,
  });
});

test("cutover refuses stale or unsafe hosted preflight state", () => {
  assert.throws(() => buildUrlPatch(currentConfig(), officialSite), /changed/);
  assert.throws(() => buildUrlPatch(currentConfig({ site_url: "https://unknown.example/" }), "https://unknown.example/"), /outside/);
  assert.throws(() => buildUrlPatch(currentConfig({ disable_signup: false }), previousSite), /preconditions/);
  assert.throws(() => buildUrlPatch(currentConfig({ external_email_enabled: false }), previousSite), /preconditions/);
  assert.throws(() => buildUrlPatch(currentConfig({ uri_allow_list: existing.slice(0, -1).join(",") }), previousSite), /redirects changed/);
});

test("bare invocation makes one GET and never patches hosted Auth", async () => {
  const methods = [];
  const updated = currentConfig({ site_url: officialSite, uri_allow_list: [...existing, addition].join(",") });
  await main([], {
    token: "synthetic-test-token",
    fetch: async (_url, options) => {
      methods.push(options.method || "GET");
      return { ok: true, json: async () => updated };
    },
    log: () => {},
  });
  assert.deepEqual(methods, ["GET"]);
});

test("approved apply shape patches only two URL fields and verifies readback", async () => {
  const methods = [];
  let patchBody;
  const updated = currentConfig({ site_url: officialSite, uri_allow_list: [...existing, addition].join(",") });
  await main(["--apply", "--project-ref=brpppukzqgpzxjelwwrj", `--expected-site-url=${previousSite}`], {
    token: "synthetic-test-token",
    fetch: async (_url, options) => {
      methods.push(options.method || "GET");
      if (options.method === "PATCH") {
        patchBody = JSON.parse(options.body);
        return { ok: true, status: 200 };
      }
      return { ok: true, json: async () => methods.length === 1 ? currentConfig() : updated };
    },
    log: () => {},
  });
  assert.deepEqual(methods, ["GET", "PATCH", "GET"]);
  assert.deepEqual(patchBody, { site_url: officialSite, uri_allow_list: [...existing, addition].join(",") });
});

test("stale expected Site URL stops before PATCH", async () => {
  const methods = [];
  await assert.rejects(() => main([
    "--apply", "--project-ref=brpppukzqgpzxjelwwrj", `--expected-site-url=${officialSite}`,
  ], {
    token: "synthetic-test-token",
    fetch: async (_url, options) => {
      methods.push(options.method || "GET");
      return { ok: true, json: async () => currentConfig() };
    },
    log: () => {},
  }), /changed/);
  assert.deepEqual(methods, ["GET"]);
});
