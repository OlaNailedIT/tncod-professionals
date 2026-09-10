/**
 * Phase 18 — read-only source audit (no DB writes, no Auth).
 * Parses preserved XLSX via OOXML (no extra npm deps).
 *
 * Usage: node scripts/migrations/phase18/audit-source.mjs
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import os from "node:os";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAW = path.join(__dirname, "raw", "TNCOD-PROFESSIONALS-DIRECTORY-Responses.xlsx");
const REPORT_DIR = path.join(__dirname, "reports");

function sha256File(filePath) {
  const h = crypto.createHash("sha256");
  h.update(fs.readFileSync(filePath));
  return h.digest("hex").toUpperCase();
}

function unpackXlsx(xlsxPath) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "p18-audit-"));
  const zipPath = path.join(tmp, "src.zip");
  fs.copyFileSync(xlsxPath, zipPath);
  const dest = path.join(tmp, "unpacked");
  // PowerShell Expand-Archive on Windows
  execFileSync(
    "powershell.exe",
    ["-NoProfile", "-Command", `Expand-Archive -LiteralPath '${zipPath}' -DestinationPath '${dest}' -Force`],
    { stdio: "pipe" },
  );
  return { tmp, dest };
}

function decodeXmlEntities(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function parseSharedStrings(xml) {
  const strings = [];
  const siRe = /<si>([\s\S]*?)<\/si>/g;
  let m;
  while ((m = siRe.exec(xml))) {
    const chunk = m[1];
    const parts = [];
    const tRe = /<t[^>]*>([\s\S]*?)<\/t>/g;
    let tm;
    while ((tm = tRe.exec(chunk))) {
      parts.push(decodeXmlEntities(tm[1]));
    }
    strings.push(parts.join(""));
  }
  return strings;
}

/** Minimal sheet parser: returns Map "A1" -> value */
function parseSheet(xml, shared) {
  const cells = new Map();
  const cRe = /<c\s+([^>]+)>(?:<v>([\s\S]*?)<\/v>)?/g;
  let m;
  while ((m = cRe.exec(xml))) {
    const attrs = m[1];
    const refM = /r="([A-Z]+\d+)"/.exec(attrs);
    if (!refM) continue;
    const ref = refM[1];
    const typeM = /t="([^"]+)"/.exec(attrs);
    const t = typeM?.[1];
    const v = m[2] ?? "";
    if (t === "s") {
      cells.set(ref, shared[Number(v)] ?? "");
    } else if (t === "inlineStr") {
      // rare
      cells.set(ref, v);
    } else if (v !== "") {
      // number or date serial
      cells.set(ref, v);
    } else {
      cells.set(ref, "");
    }
  }
  // Also handle is/t inline
  const inlineRe = /<c\s+([^>]+)><is>([\s\S]*?)<\/is><\/c>/g;
  while ((m = inlineRe.exec(xml))) {
    const attrs = m[1];
    const refM = /r="([A-Z]+\d+)"/.exec(attrs);
    if (!refM) continue;
    const parts = [];
    const tRe = /<t[^>]*>([\s\S]*?)<\/t>/g;
    let tm;
    while ((tm = tRe.exec(m[2]))) parts.push(decodeXmlEntities(tm[1]));
    cells.set(refM[1], parts.join(""));
  }
  return cells;
}

function colToIndex(col) {
  let n = 0;
  for (const ch of col) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

function parseRef(ref) {
  const m = /^([A-Z]+)(\d+)$/.exec(ref);
  return { col: colToIndex(m[1]), row: Number(m[2]) };
}

function sheetToMatrix(cells) {
  let maxR = 0;
  let maxC = 0;
  for (const ref of cells.keys()) {
    const { col, row } = parseRef(ref);
    maxR = Math.max(maxR, row);
    maxC = Math.max(maxC, col);
  }
  const matrix = Array.from({ length: maxR }, () => Array(maxC + 1).fill(""));
  for (const [ref, val] of cells) {
    const { col, row } = parseRef(ref);
    matrix[row - 1][col] = typeof val === "string" ? val : String(val);
  }
  return matrix;
}

function maskEmail(e) {
  const s = e.trim().toLowerCase();
  const i = s.indexOf("@");
  if (i < 1) return "[invalid-email]";
  const local = s.slice(0, i);
  const domain = s.slice(i + 1);
  return `${local[0]}***@${domain[0]}***`;
}

function maskPhone(p) {
  const d = p.replace(/\D/g, "");
  if (d.length < 4) return "[phone]";
  return `***${d.slice(-4)}`;
}

function maskName(n) {
  const parts = n.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "[name]";
  return parts.map((p) => `${p[0]}***`).join(" ");
}

function isLikelyEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

/** NG-first + international digits; do NOT apply ZA 0→27 rewrite. */
function normalizePhoneNgAware(value) {
  let digits = value.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("00")) digits = digits.slice(2);
  // Nigerian local mobile: 0 + 10 digits total → 234...
  if (digits.length === 11 && digits.startsWith("0")) {
    return `234${digits.slice(1)}`;
  }
  if (digits.length === 13 && digits.startsWith("234")) return digits;
  if (digits.length === 10 && /^[789]/.test(digits)) {
    // bare NG mobile without leading 0
    return `234${digits}`;
  }
  if (digits.length >= 10 && digits.length <= 15) return digits;
  return null;
}

/** Existing platform helper (ZA-first) — for conflict analysis only. */
function normalizePhoneZaFirst(value) {
  let digits = value.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 10 && digits.startsWith("0")) {
    digits = `27${digits.slice(1)}`;
  }
  if (digits.length >= 10 && digits.length <= 15) return digits;
  return null;
}

function normalizeEmail(e) {
  return e.trim().toLowerCase();
}

function excelSerialToIso(serial) {
  const n = Number(serial);
  if (!Number.isFinite(n) || n < 1) return null;
  // Excel epoch 1899-12-30
  const ms = Date.UTC(1899, 11, 30) + n * 86400000;
  return new Date(ms).toISOString();
}

function main() {
  if (!fs.existsSync(RAW)) {
    console.error("RAW SOURCE MISSING:", RAW);
    process.exit(1);
  }

  const hash = sha256File(RAW);
  const stat = fs.statSync(RAW);
  const { tmp, dest } = unpackXlsx(RAW);

  const workbookXml = fs.readFileSync(path.join(dest, "xl", "workbook.xml"), "utf8");
  const sheetNames = [...workbookXml.matchAll(/name="([^"]+)"/g)].map((m) => m[1]);

  const shared = parseSharedStrings(
    fs.readFileSync(path.join(dest, "xl", "sharedStrings.xml"), "utf8"),
  );

  const sheet1Xml = fs.readFileSync(path.join(dest, "xl", "worksheets", "sheet1.xml"), "utf8");
  const matrix = sheetToMatrix(parseSheet(sheet1Xml, shared));

  // Headers from row 1; data from row 2+
  const headers = (matrix[0] || []).map((h) => h.replace(/\s+/g, " ").trim());
  // Trim trailing empty columns
  let lastCol = headers.length - 1;
  while (lastCol > 0 && !headers[lastCol]) lastCol--;
  const colCount = lastCol + 1;
  const trimmedHeaders = headers.slice(0, colCount);

  const dataRows = [];
  for (let r = 1; r < matrix.length; r++) {
    const row = (matrix[r] || []).slice(0, colCount).map((c) => String(c ?? "").trim());
    if (row.every((c) => !c)) continue;
    dataRows.push(row);
  }

  const colStats = trimmedHeaders.map((name, idx) => {
    const values = dataRows.map((r) => r[idx] ?? "");
    const populated = values.filter((v) => v.length > 0);
    const distinct = new Set(populated.map((v) => v.toLowerCase()));
    const samples = [...distinct].slice(0, 5).map((v) => {
      const raw = populated.find((p) => p.toLowerCase() === v) ?? v;
      if (isLikelyEmail(raw)) return maskEmail(raw);
      if (/\d{7,}/.test(raw) && /phone|whatsapp/i.test(name)) return maskPhone(raw);
      if (/name/i.test(name) && !/company|business|file|profile/i.test(name)) return maskName(raw);
      if (/^https?:\/\//i.test(raw) || raw.includes("drive.google.com")) return "[url]";
      return raw.length > 60 ? `${raw.slice(0, 57)}…` : raw;
    });
    return {
      index: idx,
      name,
      populated: populated.length,
      blank: dataRows.length - populated.length,
      distinct: distinct.size,
      samples,
    };
  });

  // Identity analysis
  const emailIdx = trimmedHeaders.findIndex((h) => /^Email Address$/i.test(h));
  const emailCollectorIdx = trimmedHeaders.findIndex((h) => /^Email address$/i.test(h));
  const phoneIdx = trimmedHeaders.findIndex((h) => /^Phone Number$/i.test(h));
  const whatsappIdx = trimmedHeaders.findIndex((h) => /WhatsApp Number/i.test(h));
  const nameIdx = trimmedHeaders.findIndex((h) => /^Full Name$/i.test(h));
  const tsIdx = trimmedHeaders.findIndex((h) => /^Timestamp$/i.test(h));

  const records = dataRows.map((row, i) => {
    const emailRaw = row[emailIdx] || row[emailCollectorIdx] || "";
    const phoneRaw = row[phoneIdx] || "";
    const waRaw = row[whatsappIdx] || "";
    const email = emailRaw ? normalizeEmail(emailRaw) : "";
    const phoneNg = phoneRaw ? normalizePhoneNgAware(phoneRaw) : null;
    const phoneZa = phoneRaw ? normalizePhoneZaFirst(phoneRaw) : null;
    const waNg = waRaw ? normalizePhoneNgAware(waRaw) : null;
    let ts = row[tsIdx] || "";
    if (/^\d+(\.\d+)?$/.test(ts)) ts = excelSerialToIso(ts) || ts;
    return {
      sourceRow: i + 2,
      emailValid: email ? isLikelyEmail(email) : false,
      email,
      phoneNg,
      phoneZa,
      waNg,
      phoneRawPresent: Boolean(phoneRaw),
      waDiffersFromPhone: Boolean(phoneNg && waNg && phoneNg !== waNg),
      namePresent: Boolean(row[nameIdx]),
      timestamp: ts,
      emailCollector: row[emailCollectorIdx] ? normalizeEmail(row[emailCollectorIdx]) : "",
      emailQuestion: row[emailIdx] ? normalizeEmail(row[emailIdx]) : "",
      emailsMismatch:
        row[emailCollectorIdx] &&
        row[emailIdx] &&
        normalizeEmail(row[emailCollectorIdx]) !== normalizeEmail(row[emailIdx]),
    };
  });

  // Duplicate analysis within source
  const byEmail = new Map();
  const byPhone = new Map();
  for (const r of records) {
    if (r.emailValid) {
      if (!byEmail.has(r.email)) byEmail.set(r.email, []);
      byEmail.get(r.email).push(r.sourceRow);
    }
    if (r.phoneNg) {
      if (!byPhone.has(r.phoneNg)) byPhone.set(r.phoneNg, []);
      byPhone.get(r.phoneNg).push(r.sourceRow);
    }
  }
  const duplicateEmails = [...byEmail.entries()].filter(([, rows]) => rows.length > 1);
  const duplicatePhones = [...byPhone.entries()].filter(([, rows]) => rows.length > 1);

  // Exact duplicate rows (all cells)
  const rowFingerprints = new Map();
  for (let i = 0; i < dataRows.length; i++) {
    const fp = dataRows[i].join("\u0001").toLowerCase();
    if (!rowFingerprints.has(fp)) rowFingerprints.set(fp, []);
    rowFingerprints.get(fp).push(i + 2);
  }
  const exactDupRows = [...rowFingerprints.values()].filter((rows) => rows.length > 1);

  const invalidEmails = records.filter((r) => r.email && !r.emailValid).length;
  const missingEmails = records.filter((r) => !r.email).length;
  const invalidPhones = records.filter((r) => r.phoneRawPresent && !r.phoneNg).length;
  const missingPhones = records.filter((r) => !r.phoneRawPresent).length;
  const zaConflictRisk = records.filter(
    (r) => r.phoneNg && r.phoneZa && r.phoneNg !== r.phoneZa,
  ).length;

  // Category / consent / spotlight columns for distribution (no PII)
  function dist(headerRe) {
    const idx = trimmedHeaders.findIndex((h) => headerRe.test(h));
    if (idx < 0) return null;
    const counts = {};
    for (const row of dataRows) {
      const v = (row[idx] || "(blank)").trim() || "(blank)";
      counts[v] = (counts[v] || 0) + 1;
    }
    return { header: trimmedHeaders[idx], counts };
  }

  const report = {
    generatedAt: new Date().toISOString(),
    source: {
      preservedPath: "scripts/migrations/phase18/raw/TNCOD-PROFESSIONALS-DIRECTORY-Responses.xlsx",
      originalPath: "C:\\Users\\O\\Downloads\\TNCOD PROFESSIONALS DIRECTORY (Responses).xlsx",
      bytes: stat.size,
      sha256: hash,
      sheets: sheetNames,
      authoritativeSheet: "Form responses 1",
      derivedSheets: sheetNames.filter((s) => s !== "Form responses 1"),
      tableHint: "Form_Responses A1:AQ19 (43 cols)",
    },
    inventory: {
      headerColumns: colCount,
      dataRows: dataRows.length,
      blankRowsSkipped: matrix.length - 1 - dataRows.length,
      exactDuplicateRowGroups: exactDupRows.length,
      exactDuplicateRowGroupsDetail: exactDupRows,
    },
    columns: colStats,
    identity: {
      records: records.length,
      usableEmail: records.filter((r) => r.emailValid).length,
      missingEmail: missingEmails,
      invalidEmail: invalidEmails,
      usablePhoneNg: records.filter((r) => r.phoneNg).length,
      missingPhone: missingPhones,
      invalidPhoneNg: invalidPhones,
      whatsappDiffersFromPhone: records.filter((r) => r.waDiffersFromPhone).length,
      emailCollectorVsQuestionMismatch: records.filter((r) => r.emailsMismatch).length,
      duplicateEmailGroups: duplicateEmails.map(([email, rows]) => ({
        email: maskEmail(email),
        rows,
      })),
      duplicatePhoneGroups: duplicatePhones.map(([phone, rows]) => ({
        phone: `***${phone.slice(-4)}`,
        rows,
      })),
      zaFirstNormalizerConflictsWithNg: zaConflictRisk,
      note: "Existing-member DB match not executed in this audit (analysis-only; no production queries required for Gate A mapping).",
    },
    distributions: {
      category: dist(/Which category best describes you/i),
      tncodMember: dist(/Are you a member of TNCOD/i),
      cacRegistered: dist(/registered with CAC/i),
      spotlightInterest: dist(/interested in being featured/i),
      directoryConsent: dist(/included in the TNCOD Professionals Directory/i),
      whatsappConsent: dist(/WhatsApp group/i),
      referrals: dist(/receiving referrals/i),
      collaborations: dist(/collaborations/i),
      mentoring: dist(/mentoring/i),
      spotlightStatus: dist(/^Spotlight Status$/i),
    },
    privacyFlags: {
      piiColumns: trimmedHeaders.filter((h) =>
        /name|email|phone|whatsapp|address|birthday|photo|linkedin|cac|consent/i.test(h),
      ).length,
      driveUploadColumns: trimmedHeaders.filter((h) =>
        /photo|company profile|cac certificate|upload/i.test(h),
      ),
      consentColumns: trimmedHeaders.filter((h) => /consent/i.test(h)),
      verificationLike: "None that map to platform VerificationStatus — DO NOT infer VERIFIED",
    },
  };

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const outJson = path.join(REPORT_DIR, "source-audit.json");
  fs.writeFileSync(outJson, JSON.stringify(report, null, 2), "utf8");

  // Human summary (no raw PII)
  const md = [];
  md.push("# Phase 18 — Source audit report (machine-generated, masked)");
  md.push("");
  md.push(`Generated: ${report.generatedAt}`);
  md.push(`SHA256: \`${hash}\``);
  md.push(`Bytes: ${stat.size}`);
  md.push(`Sheets: ${sheetNames.join(" | ")}`);
  md.push(`Authoritative sheet: **Form responses 1**`);
  md.push(`Data rows: **${dataRows.length}** | Columns: **${colCount}**`);
  md.push("");
  md.push("## Column inventory");
  md.push("");
  md.push("| # | Column | Populated | Blank | Distinct |");
  md.push("| --- | --- | ---: | ---: | ---: |");
  for (const c of colStats) {
    md.push(`| ${c.index + 1} | ${c.name.replace(/\|/g, "/")} | ${c.populated} | ${c.blank} | ${c.distinct} |`);
  }
  md.push("");
  md.push("## Identity summary");
  md.push("");
  md.push(`- Usable emails: ${report.identity.usableEmail}`);
  md.push(`- Missing emails: ${report.identity.missingEmail}`);
  md.push(`- Invalid emails: ${report.identity.invalidEmail}`);
  md.push(`- Usable phones (NG-aware): ${report.identity.usablePhoneNg}`);
  md.push(`- Missing phones: ${report.identity.missingPhone}`);
  md.push(`- Invalid phones (NG-aware): ${report.identity.invalidPhoneNg}`);
  md.push(`- Duplicate email groups: ${duplicateEmails.length}`);
  md.push(`- Duplicate phone groups: ${duplicatePhones.length}`);
  md.push(`- Exact duplicate row groups: ${exactDupRows.length}`);
  md.push(`- ZA-first normalizer would mis-code NG numbers: ${zaConflictRisk}/${dataRows.length}`);
  md.push("");
  md.push("## Distributions (selected)");
  for (const [k, v] of Object.entries(report.distributions)) {
    if (!v) continue;
    md.push("");
    md.push(`### ${k}`);
    for (const [val, n] of Object.entries(v.counts)) {
      md.push(`- ${val}: ${n}`);
    }
  }
  const outMd = path.join(REPORT_DIR, "source-audit.md");
  fs.writeFileSync(outMd, md.join("\n"), "utf8");

  console.log(JSON.stringify({ ok: true, outJson, outMd, dataRows: dataRows.length, cols: colCount, hash }, null, 2));

  // cleanup temp
  try {
    fs.rmSync(tmp, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
}

main();
