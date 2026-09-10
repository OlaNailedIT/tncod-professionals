import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import os from "node:os";
import {
  AUTHORITATIVE_SHEET,
  REJECTED_SHEETS,
  type CanonicalLegacyRow,
} from "@/features/legacy-migration/types";
import { finalizeCanonicalRow } from "@/features/legacy-migration/map";

export type ParsedWorkbook = {
  sourcePath: string;
  sourceSha256: string;
  sheetNames: string[];
  authoritativeSheet: typeof AUTHORITATIVE_SHEET;
  rows: CanonicalLegacyRow[];
  headers: string[];
};

function sha256File(filePath: string): string {
  const h = crypto.createHash("sha256");
  h.update(fs.readFileSync(filePath));
  return h.digest("hex").toUpperCase();
}

function unpackXlsx(xlsxPath: string): { tmp: string; dest: string } {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "p18-parse-"));
  const zipPath = path.join(tmp, "src.zip");
  fs.copyFileSync(xlsxPath, zipPath);
  const dest = path.join(tmp, "unpacked");
  execFileSync(
    "powershell.exe",
    ["-NoProfile", "-Command", `Expand-Archive -LiteralPath '${zipPath}' -DestinationPath '${dest}' -Force`],
    { stdio: "pipe" },
  );
  return { tmp, dest };
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function parseSharedStrings(xml: string): string[] {
  const strings: string[] = [];
  for (const m of xml.matchAll(/<si>([\s\S]*?)<\/si>/g)) {
    const parts: string[] = [];
    for (const t of m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)) {
      parts.push(decodeXmlEntities(t[1]));
    }
    strings.push(parts.join(""));
  }
  return strings;
}

function parseSheet(xml: string, shared: string[]): Map<string, string> {
  const cells = new Map<string, string>();
  for (const m of xml.matchAll(/<c\s+([^>]+)>(?:<v>([\s\S]*?)<\/v>)?/g)) {
    const ref = /r="([A-Z]+\d+)"/.exec(m[1])?.[1];
    if (!ref) continue;
    const t = /t="([^"]+)"/.exec(m[1])?.[1];
    const v = m[2] ?? "";
    cells.set(ref, t === "s" ? (shared[Number(v)] ?? "") : v);
  }
  return cells;
}

function colIndex(col: string): number {
  let n = 0;
  for (const ch of col) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

function toMatrix(cells: Map<string, string>): string[][] {
  let maxR = 0;
  let maxC = 0;
  for (const ref of cells.keys()) {
    const m = /^([A-Z]+)(\d+)$/.exec(ref)!;
    maxR = Math.max(maxR, Number(m[2]));
    maxC = Math.max(maxC, colIndex(m[1]));
  }
  const matrix = Array.from({ length: maxR }, () => Array(maxC + 1).fill(""));
  for (const [ref, val] of cells) {
    const m = /^([A-Z]+)(\d+)$/.exec(ref)!;
    matrix[Number(m[2]) - 1][colIndex(m[1])] = String(val ?? "");
  }
  return matrix;
}

function cleanHeader(h: string): string {
  return h.replace(/\s+/g, " ").trim();
}

function col(headers: string[], row: string[], re: RegExp): string {
  const idx = headers.findIndex((h) => re.test(h));
  if (idx < 0) return "";
  return String(row[idx] ?? "").trim();
}

export function assertAuthoritativeSheet(sheetNames: string[]): void {
  if (!sheetNames.includes(AUTHORITATIVE_SHEET)) {
    throw new Error(`Authoritative sheet missing: ${AUTHORITATIVE_SHEET}`);
  }
}

export function isRejectedMemberSourceSheet(name: string): boolean {
  return (REJECTED_SHEETS as readonly string[]).includes(name);
}

/**
 * Parse the preserved Google Form XLSX into canonical rows.
 * Uses Form responses 1 only.
 */
export function parseGoogleFormExport(sourcePath: string): ParsedWorkbook {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source file not found: ${sourcePath}`);
  }
  const sourceSha256 = sha256File(sourcePath);
  const { tmp, dest } = unpackXlsx(sourcePath);
  try {
    const workbookXml = fs.readFileSync(path.join(dest, "xl", "workbook.xml"), "utf8");
    const sheetNames = [...workbookXml.matchAll(/<sheet[^>]*name="([^"]+)"/g)].map((m) => m[1]);
    assertAuthoritativeSheet(sheetNames);

    const shared = parseSharedStrings(
      fs.readFileSync(path.join(dest, "xl", "sharedStrings.xml"), "utf8"),
    );
    const sheet1 = parseSheet(
      fs.readFileSync(path.join(dest, "xl", "worksheets", "sheet1.xml"), "utf8"),
      shared,
    );
    const matrix = toMatrix(sheet1);
    const headers = (matrix[0] || []).map(cleanHeader);
    let last = headers.length - 1;
    while (last > 0 && !headers[last]) last -= 1;
    const trimmedHeaders = headers.slice(0, last + 1);

    const rows: CanonicalLegacyRow[] = [];
    for (let r = 1; r < matrix.length; r++) {
      const raw = (matrix[r] || []).slice(0, trimmedHeaders.length).map((c) => String(c ?? "").trim());
      if (raw.every((c) => !c)) continue;

      const h = trimmedHeaders;
      rows.push(
        finalizeCanonicalRow({
          sourceRowNumber: r + 1,
          emailRaw: col(h, raw, /^Email address$/i),
          fullName: col(h, raw, /^Full Name$/i),
          preferredName: col(h, raw, /^Preferred Name/i) || null,
          phoneRaw: col(h, raw, /^Phone Number$/i),
          linkedinRaw: col(h, raw, /^LinkedIn Profile$/i) || null,
          categoryRaw: col(h, raw, /Which category best describes you/i) || null,
          jobTitle: col(h, raw, /Current Job Title/i) || null,
          industryRaw: col(h, raw, /Industry \/ Field/i) || null,
          organisationRaw: col(h, raw, /Name of Company or Business/i) || null,
          yearsBucket: col(h, raw, /Years of Professional Experience/i) || null,
          servicesRaw: col(h, raw, /What services do you provide/i) || null,
          skillsRaw: col(h, raw, /Key Professional Skills/i) || null,
          bioRaw: col(h, raw, /Short Professional Bio/i) || null,
          churchDepartment: col(h, raw, /Service\/Department in Church/i) || null,
          spotlightInterestRaw: col(h, raw, /interested in being featured/i) || null,
          businessName: col(h, raw, /^Business Name/i) || null,
          directoryConsentRaw: col(h, raw, /included in the TNCOD Professionals Directory/i) || null,
          whatsappConsentRaw: col(h, raw, /WhatsApp group/i) || null,
          referralsRaw: col(h, raw, /receiving referrals/i) || null,
          collaborationRaw: col(h, raw, /collaborations/i) || null,
          mentorshipRaw: col(h, raw, /mentoring/i) || null,
          historicalOnly: {
            gender: col(h, raw, /^Gender$/i) || null,
            birthday: col(h, raw, /^Birthday$/i) || null,
            whatsappNumber: col(h, raw, /WhatsApp Number/i) || null,
            blankEmailAddressColumn: col(h, raw, /^Email Address$/i) || null,
            spotlightStatus: col(h, raw, /^Spotlight Status$/i) || null,
            dateFeatured: col(h, raw, /^Date Featured$/i) || null,
            yearsBucket: col(h, raw, /Years of Professional Experience/i) || null,
            cacRegistered: col(h, raw, /registered with CAC/i) || null,
          },
        }),
      );
    }

    return {
      sourcePath,
      sourceSha256,
      sheetNames,
      authoritativeSheet: AUTHORITATIVE_SHEET,
      rows,
      headers: trimmedHeaders,
    };
  } finally {
    try {
      fs.rmSync(tmp, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
}
