/**
 * Phase 4 Auth + Storage HTTP runtime validation against local disposable Supabase.
 * Does not print secret values. Does not build product UI.
 */
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, appendFileSync } from "node:fs";
import { resolve } from "node:path";

type Outcome = "PASSED" | "FAILED" | "SKIPPED";
type Row = { test: string; outcome: Outcome; detail: string };

const results: Row[] = [];
const root = resolve(process.cwd());

function record(test: string, ok: boolean, detail: string) {
  results.push({ test, outcome: ok ? "PASSED" : "FAILED", detail });
}

function skip(test: string, detail: string) {
  results.push({ test, outcome: "SKIPPED", detail });
}

function unquote(value: string): string {
  let current = value.trim();
  while (
    (current.startsWith('"') && current.endsWith('"') && current.length >= 2) ||
    (current.startsWith("'") && current.endsWith("'") && current.length >= 2)
  ) {
    current = current.slice(1, -1);
  }
  return current;
}

function loadEnvFile(path: string) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = unquote(trimmed.slice(eq + 1).trim());
    if (!process.env[key]) process.env[key] = value;
  }
}

function parseStatusEnv(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    const eq = line.indexOf("=");
    if (eq < 1) continue;
    out[line.slice(0, eq).trim()] = unquote(line.slice(eq + 1).trim());
  }
  return out;
}

function ensureLocalSupabaseEnv() {
  loadEnvFile(resolve(root, ".env"));
  loadEnvFile(resolve(root, ".env.local"));
  for (const key of [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ]) {
    if (process.env[key]) process.env[key] = unquote(process.env[key]!);
  }
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return;
  }
  const raw = execFileSync("npx", ["supabase", "status", "-o", "env"], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    shell: true,
  });
  const status = parseStatusEnv(raw);
  const url = status.API_URL || status.SUPABASE_URL;
  const anon = status.ANON_KEY || status.SUPABASE_ANON_KEY;
  const service = status.SERVICE_ROLE_KEY || status.SUPABASE_SERVICE_ROLE_KEY;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL && url) process.env.NEXT_PUBLIC_SUPABASE_URL = url;
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && anon) {
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = anon;
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY && service) {
    process.env.SUPABASE_SERVICE_ROLE_KEY = service;
  }
  const envPath = resolve(root, ".env");
  const existing = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
  const additions: string[] = [];
  if (!/^NEXT_PUBLIC_SUPABASE_URL=/m.test(existing) && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    additions.push(`NEXT_PUBLIC_SUPABASE_URL="${process.env.NEXT_PUBLIC_SUPABASE_URL}"`);
  }
  if (
    !/^NEXT_PUBLIC_SUPABASE_ANON_KEY=/m.test(existing) &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    additions.push(`NEXT_PUBLIC_SUPABASE_ANON_KEY="${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}"`);
  }
  if (
    !/^SUPABASE_SERVICE_ROLE_KEY=/m.test(existing) &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    additions.push(`SUPABASE_SERVICE_ROLE_KEY="${process.env.SUPABASE_SERVICE_ROLE_KEY}"`);
  }
  if (additions.length) {
    appendFileSync(envPath, `\n# Local disposable Supabase (gitignored)\n${additions.join("\n")}\n`);
  }
}

function psql(sql: string): string {
  return execFileSync(
    "docker",
    [
      "exec",
      "supabase_db_tncod-professional",
      "psql",
      "-U",
      "postgres",
      "-d",
      "postgres",
      "-v",
      "ON_ERROR_STOP=1",
      "-t",
      "-A",
      "-c",
      sql,
    ],
    { encoding: "utf8" },
  ).trim();
}

function jsonHeaders(key: string, extra?: Record<string, string>) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function adminCreateUser(
  api: string,
  service: string,
  body: Record<string, unknown>,
): Promise<{ ok: boolean; id?: string; status: number; err?: string }> {
  const res = await fetch(`${api}/auth/v1/admin/users`, {
    method: "POST",
    headers: jsonHeaders(service),
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let parsed: { id?: string; msg?: string; error?: string } = {};
  try {
    parsed = JSON.parse(text) as { id?: string; msg?: string; error?: string };
  } catch {
    parsed = {};
  }
  return {
    ok: res.ok,
    id: parsed.id,
    status: res.status,
    err: parsed.msg || parsed.error || (res.ok ? undefined : `http_${res.status}`),
  };
}

async function signIn(
  api: string,
  anon: string,
  email: string,
  password: string,
): Promise<{ ok: boolean; token?: string; status: number }> {
  const res = await fetch(`${api}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: jsonHeaders(anon),
    body: JSON.stringify({ email, password }),
  });
  const parsed = (await res.json()) as { access_token?: string };
  return { ok: res.ok, token: parsed.access_token, status: res.status };
}

async function storageRequest(
  api: string,
  anon: string,
  method: string,
  objectPath: string,
  token: string | null,
  body?: Buffer,
): Promise<{ status: number }> {
  const headers: Record<string, string> = {
    apikey: anon,
    Authorization: `Bearer ${token ?? anon}`,
  };
  if (body) headers["Content-Type"] = "application/pdf";
  const res = await fetch(`${api}/storage/v1/object/member-documents/${objectPath}`, {
    method,
    headers,
    body,
  });
  await res.arrayBuffer();
  return { status: res.status };
}

function isDeniedHttp(status: number) {
  return status === 400 || status === 401 || status === 403 || status === 404;
}

async function main() {
  ensureLocalSupabaseEnv();
  const api = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  record(
    "env_public_url_present",
    Boolean(api && api.startsWith("http")),
    api ? "url_present" : "missing",
  );
  record("env_anon_present", Boolean(anon), anon ? "present" : "missing");
  record("env_service_present", Boolean(service), service ? "present" : "missing");
  record(
    "env_no_public_service_role",
    !process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY,
    "checked",
  );
  if (!api || !anon || !service) {
    console.log(JSON.stringify({ results }, null, 2));
    process.exit(1);
  }

  const stamp = Date.now();
  const password = "Phase4-local-test-only-1";
  const lifecycleEmail = `phase4.lifecycle.${stamp}@tncod.test`;
  const metaEmail = `phase4.meta.${stamp}@tncod.test`;
  const ownerEmail = `phase4.owner.${stamp}@tncod.test`;
  const otherEmail = `phase4.other.${stamp}@tncod.test`;
  const excoEmail = `phase4.exco.${stamp}@tncod.test`;
  const conflictId = randomUUID();
  const conflictEmail = `phase4.conflict.${stamp}@tncod.test`;

  const created = await adminCreateUser(api, service, {
    email: lifecycleEmail,
    password,
    email_confirm: true,
  });
  record(
    "auth_admin_create_user",
    Boolean(created.ok && created.id),
    created.ok ? "created" : `status=${created.status} ${created.err ?? ""}`,
  );
  if (!created.id) {
    console.log(JSON.stringify({ results }, null, 2));
    process.exit(1);
  }

  const authCount = psql(`SELECT count(*) FROM auth.users WHERE id = '${created.id}'`);
  const publicCount = psql(`SELECT count(*) FROM public.users WHERE id = '${created.id}'`);
  const emailMatch = psql(
    `SELECT count(*) FROM public.users WHERE id = '${created.id}' AND email = '${lifecycleEmail}'`,
  );
  const roleNames = psql(
    `SELECT coalesce(string_agg(r.name::text, ',' ORDER BY r.name::text), '') FROM public.user_roles ur JOIN public.roles r ON r.id = ur.role_id WHERE ur.user_id = '${created.id}'`,
  );
  const accountStatus = psql(
    `SELECT account_status::text FROM public.users WHERE id = '${created.id}'`,
  );
  record("auth_users_row", authCount === "1", `count=${authCount}`);
  record("public_users_synced", publicCount === "1", `count=${publicCount}`);
  record("identity_ids_equal", publicCount === "1" && authCount === "1", "auth.id=public.id");
  record("synced_email_matches", emailMatch === "1", `count=${emailMatch}`);
  record("default_role_member_only", roleNames === "MEMBER", `roles=${roleNames}`);
  record("default_account_active", accountStatus === "ACTIVE", `status=${accountStatus}`);
  record(
    "no_profile_auto_created",
    psql(`SELECT count(*) FROM public.profiles WHERE user_id = '${created.id}'`) === "0",
    "profiles=0",
  );

  const metaUser = await adminCreateUser(api, service, {
    email: metaEmail,
    password,
    email_confirm: true,
    user_metadata: {
      role: "SUPER_ADMIN",
      roles: ["EXCO_ADMIN", "SUPER_ADMIN"],
      verification_status: "VERIFIED",
      visibility_status: "DIRECTORY",
      account_status: "SUSPENDED",
      permissions: ["user.manage_roles"],
    },
    app_metadata: { role: "EXCO_ADMIN", provider_role: "SUPER_ADMIN" },
  });
  record(
    "malicious_metadata_auth_create",
    Boolean(metaUser.ok && metaUser.id),
    metaUser.ok ? "created" : `status=${metaUser.status}`,
  );
  if (metaUser.id) {
    const metaRoles = psql(
      `SELECT coalesce(string_agg(r.name::text, ',' ORDER BY r.name::text), '') FROM public.user_roles ur JOIN public.roles r ON r.id = ur.role_id WHERE ur.user_id = '${metaUser.id}'`,
    );
    const metaAccount = psql(
      `SELECT account_status::text FROM public.users WHERE id = '${metaUser.id}'`,
    );
    const metaProfiles = psql(`SELECT count(*) FROM public.profiles WHERE user_id = '${metaUser.id}'`);
    record("malicious_metadata_roles_member_only", metaRoles === "MEMBER", `roles=${metaRoles}`);
    record("malicious_metadata_account_not_elevated", metaAccount === "ACTIVE", `status=${metaAccount}`);
    record("malicious_metadata_no_directory_profile", metaProfiles === "0", `profiles=${metaProfiles}`);
  }

  psql(
    `INSERT INTO public.users (id, email, created_at, updated_at) VALUES ('${conflictId}', '${conflictEmail}', now(), now())`,
  );
  const conflictAuth = await adminCreateUser(api, service, {
    id: conflictId,
    email: `phase4.conflict2.${stamp}@tncod.test`,
    password,
    email_confirm: true,
  });
  record(
    "duplicate_id_auth_create",
    Boolean(conflictAuth.ok),
    conflictAuth.ok ? "auth_ok" : `status=${conflictAuth.status} ${conflictAuth.err ?? ""}`,
  );
  const conflictPublic = psql(`SELECT count(*) FROM public.users WHERE id = '${conflictId}'`);
  const conflictRoles = psql(
    `SELECT count(*) FROM public.user_roles ur JOIN public.roles r ON r.id = ur.role_id WHERE ur.user_id = '${conflictId}' AND r.name = 'MEMBER'`,
  );
  record("duplicate_id_single_public_user", conflictPublic === "1", `count=${conflictPublic}`);
  record("duplicate_id_member_role_filled", conflictRoles === "1", `member_roles=${conflictRoles}`);

  const del = await fetch(`${api}/auth/v1/admin/users/${created.id}`, {
    method: "DELETE",
    headers: jsonHeaders(service),
  });
  record("auth_user_delete_http", del.ok || del.status === 200, `status=${del.status}`);
  const authAfter = psql(`SELECT count(*) FROM auth.users WHERE id = '${created.id}'`);
  const publicAfter = psql(`SELECT count(*) FROM public.users WHERE id = '${created.id}'`);
  record("auth_delete_removes_auth_row", authAfter === "0", `auth_count=${authAfter}`);
  record(
    "auth_delete_preserves_public_user",
    publicAfter === "1",
    `public_count=${publicAfter}`,
  );

  const owner = await adminCreateUser(api, service, {
    email: ownerEmail,
    password,
    email_confirm: true,
  });
  const other = await adminCreateUser(api, service, {
    email: otherEmail,
    password,
    email_confirm: true,
  });
  const exco = await adminCreateUser(api, service, {
    email: excoEmail,
    password,
    email_confirm: true,
  });
  record("storage_identities_created", Boolean(owner.id && other.id && exco.id), "three_users");
  if (!owner.id || !other.id || !exco.id) {
    console.log(JSON.stringify({ results }, null, 2));
    process.exit(1);
  }
  psql(
    `INSERT INTO public.user_roles (user_id, role_id) SELECT '${exco.id}'::uuid, id FROM public.roles WHERE name = 'EXCO_ADMIN' ON CONFLICT DO NOTHING`,
  );

  const ownerSession = await signIn(api, anon, ownerEmail, password);
  const otherSession = await signIn(api, anon, otherEmail, password);
  const excoSession = await signIn(api, anon, excoEmail, password);
  record("owner_sign_in", Boolean(ownerSession.token), `status=${ownerSession.status}`);
  record("other_sign_in", Boolean(otherSession.token), `status=${otherSession.status}`);
  record("exco_sign_in", Boolean(excoSession.token), `status=${excoSession.status}`);
  if (!ownerSession.token || !otherSession.token || !excoSession.token) {
    console.log(JSON.stringify({ results }, null, 2));
    process.exit(1);
  }

  const docId = randomUUID();
  const ownerPath = `documents/${owner.id}/${docId}`;
  const payload = Buffer.from("%PDF-1.4 phase4-runtime-test");
  const uploadOwn = await storageRequest(api, anon, "POST", ownerPath, ownerSession.token, payload);
  record("http_owner_upload", uploadOwn.status === 200, `status=${uploadOwn.status}`);

  const anonRead = await storageRequest(api, anon, "GET", ownerPath, null);
  record("http_anon_read_denied", isDeniedHttp(anonRead.status), `status=${anonRead.status}`);

  const ownerRead = await storageRequest(api, anon, "GET", ownerPath, ownerSession.token);
  record("http_owner_read", ownerRead.status === 200, `status=${ownerRead.status}`);

  const otherRead = await storageRequest(api, anon, "GET", ownerPath, otherSession.token);
  record("http_cross_user_read_denied", isDeniedHttp(otherRead.status), `status=${otherRead.status}`);

  const otherUploadToOwner = await storageRequest(
    api,
    anon,
    "POST",
    `documents/${owner.id}/${randomUUID()}`,
    otherSession.token,
    payload,
  );
  record(
    "http_cross_user_upload_denied",
    isDeniedHttp(otherUploadToOwner.status),
    `status=${otherUploadToOwner.status}`,
  );

  const otherDelete = await storageRequest(api, anon, "DELETE", ownerPath, otherSession.token);
  record(
    "http_cross_user_delete_denied",
    isDeniedHttp(otherDelete.status),
    `status=${otherDelete.status}`,
  );

  const badFolder = await storageRequest(
    api,
    anon,
    "POST",
    `leaks/${owner.id}/${randomUUID()}`,
    ownerSession.token,
    payload,
  );
  record("http_path_non_documents_denied", isDeniedHttp(badFolder.status), `status=${badFolder.status}`);

  const excoRead = await storageRequest(api, anon, "GET", ownerPath, excoSession.token);
  record("http_exco_review_read", excoRead.status === 200, `status=${excoRead.status}`);

  const excoDelete = await storageRequest(api, anon, "DELETE", ownerPath, excoSession.token);
  record("http_exco_delete_denied", isDeniedHttp(excoDelete.status), `status=${excoDelete.status}`);

  const ownerDelete = await storageRequest(api, anon, "DELETE", ownerPath, ownerSession.token);
  record("http_owner_delete", ownerDelete.status === 200, `status=${ownerDelete.status}`);

  skip("signed_url_subsystem", "not part of approved Phase 4 implementation");

  const failed = results.filter((r) => r.outcome === "FAILED");
  console.log(JSON.stringify({ failed: failed.length, results }, null, 2));
  process.exit(failed.length ? 1 : 0);
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : "unknown";
  console.error("RUNTIME_SCRIPT_ERROR", message);
  process.exit(1);
});
