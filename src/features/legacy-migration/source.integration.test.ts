import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseGoogleFormExport } from "@/features/legacy-migration/source-parse";
import { runDryRunClassification, buildEmptyMemberIndex } from "@/features/legacy-migration/dry-run";
import { normalizePhone } from "@/features/registration/phone";

const RAW = path.resolve(
  process.cwd(),
  "scripts/migrations/phase18/raw/TNCOD-PROFESSIONALS-DIRECTORY-Responses.xlsx",
);

describe("Phase 18 live source parse + dry-run (when raw present)", () => {
  it("parses 18×43 and normalizes all Nigerian phones", () => {
    if (!fs.existsSync(RAW)) {
      expect(fs.existsSync(RAW)).toBe(false);
      return;
    }
    const parsed = parseGoogleFormExport(RAW);
    expect(parsed.rows.length).toBe(18);
    expect(parsed.headers.length).toBe(43);
    expect(parsed.authoritativeSheet).toBe("Form responses 1");
    expect(parsed.sourceSha256).toBe(
      "4EC0A1773D771F78488169B44DA7DCF424BD0354684A2D42F6C06264E12CE29C",
    );

    for (const row of parsed.rows) {
      expect(row.phoneNormalized).toBeTruthy();
      expect(row.phoneNormalized!.startsWith("234")).toBe(true);
      expect(row.phoneNormalized!.startsWith("27")).toBe(false);
      expect(normalizePhone(row.phoneRaw)).toBe(row.phoneNormalized);
    }

    const dry = runDryRunClassification({
      sourceSha256: parsed.sourceSha256,
      rows: parsed.rows,
      memberIndex: buildEmptyMemberIndex(),
    });
    expect(dry.summary.total).toBe(18);
    expect(dry.results.every((r) => r.mapped?.visibilityStatus === "PRIVATE")).toBe(true);
    expect(dry.results.every((r) => r.mapped?.verificationStatus === "NOT_REVIEWED")).toBe(true);
    expect(dry.results.every((r) => r.mapped?.createConsent === false)).toBe(true);
  });
});
