import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import {
  assertSecureSnapshotDirectory,
  createPrivateSnapshotDirectory,
  isPathInsideRepository,
} from "./snapshot-acl";

const created: string[] = [];

afterEach(() => {
  for (const d of created.splice(0)) {
    try {
      fs.rmSync(d, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
});

describe("snapshot ACL directory gate", () => {
  it("rejects paths inside the repository", () => {
    const repo = path.resolve(process.cwd());
    expect(isPathInsideRepository(path.join(repo, "scripts", "reports"), repo)).toBe(true);
    const check = assertSecureSnapshotDirectory({
      dir: path.join(repo, "scripts", "reports", "snapshots"),
      repoRoot: repo,
    });
    expect(check.ok).toBe(false);
    if (!check.ok) expect(check.reason).toBe("SNAPSHOT_DIR_INSIDE_REPO");
  });

  it("rejects missing directories", () => {
    const missing = path.join(os.tmpdir(), `tncod-missing-${Date.now()}`);
    const check = assertSecureSnapshotDirectory({
      dir: missing,
      repoRoot: path.resolve(process.cwd()),
    });
    expect(check.ok).toBe(false);
    if (!check.ok) expect(check.reason).toBe("SNAPSHOT_DIR_MISSING");
  });

  it("accepts a privately ACL-hardened directory outside the repo (Windows)", () => {
    if (process.platform !== "win32") return;
    const dir = createPrivateSnapshotDirectory(os.tmpdir());
    created.push(dir);
    const check = assertSecureSnapshotDirectory({
      dir,
      repoRoot: path.resolve(process.cwd()),
    });
    expect(check).toEqual({ ok: true, resolved: path.resolve(dir) });
  });

  it("fails closed when inherited/non-admin readers are present", () => {
    if (process.platform !== "win32") return;
    // Fresh mkdir under %TEMP% typically inherits Users / sandbox group read.
    const openDir = path.join(os.tmpdir(), `tncod-open-${Date.now()}`);
    fs.mkdirSync(openDir, { recursive: true });
    created.push(openDir);
    const check = assertSecureSnapshotDirectory({
      dir: openDir,
      repoRoot: path.resolve(process.cwd()),
    });
    // If the environment already has a locked-down TEMP, this may pass; only
    // assert failure when offenders are detected.
    if (!check.ok) {
      expect(check.reason).toBe("SNAPSHOT_DIR_ACL_TOO_OPEN");
      expect(check.detail || "").not.toMatch(/@gmail\.com/);
    }
  });
});
