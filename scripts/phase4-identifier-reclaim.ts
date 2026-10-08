/* eslint-disable no-console */
/**
 * Operator reclaim of soft-deleted identifiers (email/phone) for ONE confirmed user id.
 * Default: dry-run. Apply requires --apply and PHASE4_RECLAIM_AUTHORIZED=YES.
 *
 * Usage:
 *   npx tsx scripts/phase4-identifier-reclaim.ts --user-id <uuid>
 *   npx tsx scripts/phase4-identifier-reclaim.ts --user-id <uuid> --apply
 */
import fs from "fs";
import path from "path";
import {
  reclaimSoftDeletedIdentifiers,
  type ReclaimApplyResult,
} from "../src/features/registration/identifier-reclaim";

function argValue(flag: string): string | null {
  const i = process.argv.indexOf(flag);
  if (i < 0 || i + 1 >= process.argv.length) return null;
  return process.argv[i + 1];
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function writeReport(result: ReclaimApplyResult) {
  const dir = path.resolve("scripts/reports");
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const file = path.join(dir, `phase4-identifier-reclaim-${stamp}.json`);
  const payload = {
    ...result,
    recorded_at: new Date().toISOString(),
    // Never persist secrets; preflight already masks phone/email.
  };
  fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log("REPORT", file);
}

async function main() {
  const userId = argValue("--user-id");
  const apply = hasFlag("--apply");
  if (!userId || !/^[0-9a-f-]{36}$/i.test(userId)) {
    console.log("USAGE: npx tsx scripts/phase4-identifier-reclaim.ts --user-id <uuid> [--apply]");
    process.exit(1);
  }

  if (apply && process.env.PHASE4_RECLAIM_AUTHORIZED !== "YES") {
    console.log("REFUSED apply without PHASE4_RECLAIM_AUTHORIZED=YES");
    process.exit(2);
  }

  const result = await reclaimSoftDeletedIdentifiers({ userId, apply });
  console.log("MODE", result.mode);
  console.log("OK", result.ok);
  console.log("CHANGED", result.changed);
  console.log("MESSAGE", result.message);
  console.log("PREFLIGHT", JSON.stringify(result.preflight));
  writeReport(result);
  process.exit(result.ok ? 0 : 10);
}

main().catch((e) => {
  console.error("FATAL", e instanceof Error ? e.message : e);
  process.exit(1);
});
