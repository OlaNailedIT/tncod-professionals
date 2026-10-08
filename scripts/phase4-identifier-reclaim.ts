/* eslint-disable no-console */
/**
 * Operator reclaim of soft-deleted identifiers (email/phone) for ONE confirmed user id.
 * Default: dry-run. Apply requires --apply, --snapshot-file, and PHASE4_RECLAIM_AUTHORIZED=YES.
 *
 * Usage (always register the server-only shim):
 *   npx tsx -r ./scripts/register-server-only.cjs scripts/phase4-identifier-reclaim.ts --user-id <uuid>
 *   npx tsx -r ./scripts/register-server-only.cjs scripts/phase4-identifier-reclaim.ts --user-id <uuid> --write-snapshot --snapshot-dir <outside-repo-dir>
 *   PHASE4_RECLAIM_AUTHORIZED=YES npx tsx -r ./scripts/register-server-only.cjs scripts/phase4-identifier-reclaim.ts --user-id <uuid> --apply --snapshot-file <path>
 *   PHASE4_RECLAIM_RESTORE_AUTHORIZED=YES npx tsx -r ./scripts/register-server-only.cjs scripts/phase4-identifier-reclaim.ts --restore --snapshot-file <path>
 *   PHASE4_RECLAIM_RESTORE_AUTHORIZED=YES npx tsx -r ./scripts/register-server-only.cjs scripts/phase4-identifier-reclaim.ts --restore --snapshot-file <path> --apply
 */
import fs from "fs";
import path from "path";
import {
  publicReclaimPreflight,
  reclaimSoftDeletedIdentifiers,
  restoreFromReclaimSnapshot,
  writeReclaimSnapshot,
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

function writeMaskedReport(result: ReclaimApplyResult) {
  const dir = path.resolve("scripts/reports");
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const file = path.join(dir, `phase4-identifier-reclaim-${stamp}.json`);
  const payload = {
    ...result,
    preflight: publicReclaimPreflight(result.preflight),
    recorded_at: new Date().toISOString(),
  };
  fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log("MASKED_REPORT", file);
}

function printResult(result: ReclaimApplyResult) {
  console.log("MODE", result.mode);
  console.log("OK", result.ok);
  console.log("CHANGED", result.changed);
  console.log("MESSAGE", result.message);
  console.log("PREFLIGHT", JSON.stringify(publicReclaimPreflight(result.preflight)));
  if (result.would_change) {
    console.log("WOULD_CHANGE", JSON.stringify(result.would_change));
  }
  if (result.snapshot_path) {
    console.log("SNAPSHOT_PATH", result.snapshot_path);
  }
}

async function main() {
  const restore = hasFlag("--restore");
  const apply = hasFlag("--apply");
  const writeSnapshot = hasFlag("--write-snapshot");
  const userId = argValue("--user-id");
  const snapshotFile = argValue("--snapshot-file");
  const snapshotDir = argValue("--snapshot-dir");

  if (restore) {
    if (!snapshotFile) {
      console.log("USAGE: --restore --snapshot-file <path> [--apply]");
      process.exit(1);
    }
    if (apply && process.env.PHASE4_RECLAIM_RESTORE_AUTHORIZED !== "YES") {
      console.log("REFUSED restore-apply without PHASE4_RECLAIM_RESTORE_AUTHORIZED=YES");
      process.exit(2);
    }
    const result = await restoreFromReclaimSnapshot({ snapshotFile, apply });
    printResult(result);
    writeMaskedReport(result);
    process.exit(result.ok ? 0 : 10);
  }

  if (!userId || !/^[0-9a-f-]{36}$/i.test(userId)) {
    console.log(
      "USAGE: npx tsx -r ./scripts/register-server-only.cjs scripts/phase4-identifier-reclaim.ts --user-id <uuid> [--write-snapshot --snapshot-dir <outside-repo> | --apply --snapshot-file <path>]",
    );
    process.exit(1);
  }

  if (writeSnapshot) {
    if (!snapshotDir) {
      console.log(
        "REFUSED --write-snapshot without --snapshot-dir (must be outside the repo with a private Windows ACL)",
      );
      process.exit(2);
    }
    try {
      const { path: snapPath, preflight } = await writeReclaimSnapshot({
        userId,
        dir: snapshotDir,
      });
      console.log("MODE write-snapshot");
      console.log("OK", true);
      // Path only — never print snapshot file contents or full identifiers.
      console.log("SNAPSHOT_PATH", snapPath);
      console.log("PREFLIGHT", JSON.stringify(preflight));
      console.log(
        "NOTE Snapshot contains full email/phone. Masked reports are not a rollback. Do not commit the snapshot file.",
      );
      process.exit(0);
    } catch (e) {
      console.log("MODE write-snapshot");
      console.log("OK", false);
      console.log("MESSAGE", e instanceof Error ? e.message : e);
      process.exit(10);
    }
  }

  if (apply && process.env.PHASE4_RECLAIM_AUTHORIZED !== "YES") {
    console.log("REFUSED apply without PHASE4_RECLAIM_AUTHORIZED=YES");
    process.exit(2);
  }

  if (apply && !snapshotFile) {
    console.log("REFUSED apply without --snapshot-file (write one with --write-snapshot first)");
    process.exit(2);
  }

  const result = await reclaimSoftDeletedIdentifiers({
    userId,
    apply,
    snapshotFile: snapshotFile ?? undefined,
  });
  printResult(result);
  writeMaskedReport(result);
  process.exit(result.ok ? 0 : 10);
}

main().catch((e) => {
  console.error("FATAL", e instanceof Error ? e.message : e);
  process.exit(1);
});
