/**
 * Phase 18 — extract identity keys only (masked report) from preserved XLSX.
 * No DB writes.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import os from "node:os";
import crypto from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAW = path.join(__dirname, "raw", "TNCOD-PROFESSIONALS-DIRECTORY-Responses.xlsx");

function unpack(xlsxPath) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "p18-id-"));
  const zipPath = path.join(tmp, "src.zip");
  fs.copyFileSync(xlsxPath, zipPath);
  const dest = path.join(tmp, "unpacked");
  execFileSync("powershell.exe", [
    "-NoProfile",
    "-Command",
    `Expand-Archive -LiteralPath '${zipPath}' -DestinationPath '${dest}' -Force`,
  ]);
  return { tmp, dest };
}

function decode(s) {
  return s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');
}

function sharedStrings(xml) {
  const out = [];
  for (const m of xml.matchAll(/<si>([\s\S]*?)<\/si>/g)) {
    const parts = [];
    for (const t of m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)) parts.push(decode(t[1]));
    out.push(parts.join(""));
  }
  return out;
}

function parseSheet(xml, shared) {
  const cells = new Map();
  for (const m of xml.matchAll(/<c\s+([^>]+)>(?:<v>([\s\S]*?)<\/v>)?/g)) {
    const ref = /r="([A-Z]+\d+)"/.exec(m[1])?.[1];
    if (!ref) continue;
    const t = /t="([^"]+)"/.exec(m[1])?.[1];
    const v = m[2] ?? "";
    cells.set(ref, t === "s" ? (shared[Number(v)] ?? "") : v);
  }
  return cells;
}

function colIndex(col) {
  let n = 0;
  for (const ch of col) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

function toMatrix(cells) {
  let maxR = 0,
    maxC = 0;
  for (const ref of cells.keys()) {
    const m = /^([A-Z]+)(\d+)$/.exec(ref);
    maxR = Math.max(maxR, Number(m[2]));
    maxC = Math.max(maxC, colIndex(m[1]));
  }
  const matrix = Array.from({ length: maxR }, () => Array(maxC + 1).fill(""));
  for (const [ref, val] of cells) {
    const m = /^([A-Z]+)(\d+)$/.exec(ref);
    matrix[Number(m[2]) - 1][colIndex(m[1])] = String(val ?? "");
  }
  return matrix;
}

function normalizeEmail(e) {
  return e.trim().toLowerCase();
}

function normalizePhoneNg(value) {
  let d = value.replace(/\D/g, "");
  if (!d) return null;
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 11 && d.startsWith("0")) return `234${d.slice(1)}`;
  if (d.length === 13 && d.startsWith("234")) return d;
  if (d.length === 10 && /^[789]/.test(d)) return `234${d}`;
  if (d.length >= 10 && d.length <= 15) return d;
  return null;
}

function maskEmail(e) {
  const i = e.indexOf("@");
  return `${e[0]}***@${e[i + 1]}***`;
}

async function matchLocal() {
  let PrismaClient;
  try {
    ({ PrismaClient } = await import("@prisma/client"));
  } catch {
    return { localDb: false };
  }
  const prisma = new PrismaClient();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      select: { id: true, email: true, phone: true, profile: { select: { id: true, displayName: true } } },
    });
    return { localDb: true, users };
  } catch (e) {
    return { localDb: false, error: String(e.message || e) };
  } finally {
    await prisma.$disconnect();
  }
}

const { tmp, dest } = unpack(RAW);
const shared = sharedStrings(fs.readFileSync(path.join(dest, "xl", "sharedStrings.xml"), "utf8"));
const matrix = toMatrix(
  parseSheet(fs.readFileSync(path.join(dest, "xl", "worksheets", "sheet1.xml"), "utf8"), shared),
);
const headers = matrix[0].map((h) => h.replace(/\s+/g, " ").trim());
const emailIdx = headers.findIndex((h) => /^Email address$/i.test(h));
const phoneIdx = headers.findIndex((h) => /^Phone Number$/i.test(h));
const nameIdx = headers.findIndex((h) => /^Full Name$/i.test(h));

const legacy = [];
for (let r = 1; r < matrix.length; r++) {
  const row = matrix[r];
  if (!row || row.every((c) => !String(c).trim())) continue;
  const email = normalizeEmail(row[emailIdx] || "");
  const phone = normalizePhoneNg(row[phoneIdx] || "");
  legacy.push({ sourceRow: r + 1, email, phone, namePresent: Boolean(String(row[nameIdx] || "").trim()) });
}

const db = await matchLocal();
const emailSet = new Map();
const phoneSet = new Map();
if (db.localDb) {
  for (const u of db.users) {
    emailSet.set(normalizeEmail(u.email), u);
    if (u.phone) phoneSet.set(u.phone.replace(/\D/g, ""), u);
  }
}

const classifications = legacy.map((L) => {
  const byEmail = L.email ? emailSet.get(L.email) : null;
  const byPhone = L.phone ? phoneSet.get(L.phone) : null;
  let classification = "LIKELY_NEW_MEMBER";
  if (!L.email && !L.phone) classification = "UNMATCHABLE";
  else if (byEmail && byPhone && byEmail.id !== byPhone.id) classification = "CONFLICTING_IDENTITY";
  else if (byEmail || byPhone) classification = "MATCHED_TO_EXISTING_MEMBER";
  return {
    sourceRow: L.sourceRow,
    classification,
    email: L.email ? maskEmail(L.email) : null,
    matchedBy: byEmail ? "email" : byPhone ? "phone" : null,
  };
});

const summary = {
  localDb: Boolean(db.localDb),
  localUserCount: db.localDb ? db.users.length : 0,
  counts: {
    MATCHED_TO_EXISTING_MEMBER: classifications.filter((c) => c.classification === "MATCHED_TO_EXISTING_MEMBER").length,
    LIKELY_NEW_MEMBER: classifications.filter((c) => c.classification === "LIKELY_NEW_MEMBER").length,
    CONFLICTING_IDENTITY: classifications.filter((c) => c.classification === "CONFLICTING_IDENTITY").length,
    UNMATCHABLE: classifications.filter((c) => c.classification === "UNMATCHABLE").length,
    DUPLICATE_WITHIN_LEGACY_SOURCE: 0,
    AMBIGUOUS_IDENTITY: 0,
  },
  rows: classifications,
};

fs.writeFileSync(
  path.join(__dirname, "reports", "identity-analysis.json"),
  JSON.stringify(summary, null, 2),
);
console.log(JSON.stringify({ ok: true, ...summary.counts, localDb: summary.localDb, localUserCount: summary.localUserCount }, null, 2));
try {
  fs.rmSync(tmp, { recursive: true, force: true });
} catch {
  /* ignore */
}
