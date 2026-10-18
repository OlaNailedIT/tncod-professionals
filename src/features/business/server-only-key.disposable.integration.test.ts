import { describe, it, expect } from "vitest";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { assertDisposableAuthEnv } from "@/features/registration/disposable-env-gate";
import { registerProfessional } from "@/features/registration/register";
import { createOwnBusiness } from "@/features/business/own-business";
import { uploadBusinessDocument, createAuthorizedDocumentSignedUrl } from "@/features/business/business-documents";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { setAccountStatus } from "@/server/auth/account-status";

describe.skipIf(process.env.PHASE4_DISPOSABLE_AUTH_TESTS !== "1")("modern administrative key actual consumers", () => {
  it("keeps documents private and synchronizes account status using the modern secret", async () => {
    expect(assertDisposableAuthEnv({ ...process.env, NEXT_PUBLIC_SUPABASE_URL: process.env.SUPABASE_URL }).ok).toBe(true);
    for (const [raw, port] of [[process.env.DATABASE_URL, "54322"], [process.env.SUPABASE_URL, "54321"]]) {
      const url = new URL(raw!); expect(url.hostname).toBe("127.0.0.1"); expect(url.port).toBe(port);
    }
    expect(process.env.SUPABASE_AUTH_SERVER_ONLY).toBe("1");
    expect(process.env.SUPABASE_SERVICE_ROLE_KEY?.startsWith("sb_secret_")).toBe(true);
    const prisma = new PrismaClient();
    const stamp = randomUUID().replaceAll("-", "");
    const checks: Array<{ name: string; pass: boolean }> = [];
    const check = (name: string, pass: boolean) => { checks.push({ name, pass }); expect(pass, name).toBe(true); };
    let actorId: string | undefined, ownerId: string | undefined;
    let failure: string | null = null;
    let awaiting = "read-only disposable prerequisites";
    let errorCategory: { type: string; code?: string } | null = null;
    try {
      const migrations = await prisma.$queryRaw<Array<{ present: string | null }>>`SELECT to_regclass('app.registration_provisioning')::text AS present`;
      check("registration schema present before fixture writes", Boolean(migrations[0]?.present));
      const reviewRoles = await prisma.role.findMany({ where: { name: { in: ["EXCO_ADMIN", "SUPER_ADMIN"] } }, include: { rolePermissions: { include: { permission: true } } } });
      check("disposable EXCO_ADMIN and SUPER_ADMIN document-review grants exist", reviewRoles.length === 2 && reviewRoles.every(r => r.rolePermissions.some(rp => rp.permission.key === "document.review")));
      const admin = createServiceRoleClient();
      const bucket = await admin.storage.getBucket("member-documents");
      check("existing document bucket is private with modern administrative key", !bucket.error && bucket.data.public === false);
      const register = async (label: string, phonePrefix: string) => {
        const result = await registerProfessional({ fullName: `Auth Consumer ${label}`, email: `autha.consumer.${label}.${stamp}@example.invalid`,
          phone: `+234${phonePrefix}${String(Date.now()).slice(-8)}`, professionalSituation: "Employee", profession: "Engineer",
          lookingFor: "Peers", offering: "Help", website: "", captchaToken: "test-turnstile-token" }, { clientKey: `${stamp}-${label}` });
        check(`synthetic ${label} registration persisted`, result.ok && result.userId !== "accepted" && result.userId !== "spam");
        if (!result.ok) throw new Error("fixture registration failed");
        return result.userId;
      };
      ownerId = await register("owner", "82");
      actorId = await register("actor", "83");
      const business = await createOwnBusiness(ownerId, { name: `Auth Consumer ${stamp}`, relationshipType: "OWNER" });
      check("real business command creates owner association", business.ok);
      if (!business.ok) throw new Error("business creation failed");
      const bytes = Buffer.from("%PDF-1.4\n% Synthetic modern-key consumer proof\n%%EOF\n");
      const uploaded = await uploadBusinessDocument({ authUserId: ownerId, businessId: business.businessId,
        documentType: "BUSINESS_REGISTRATION", fileName: "synthetic.pdf", bytes, claimedMimeType: "application/pdf" });
      check("real document upload persists metadata and private Storage object", uploaded.ok);
      if (!uploaded.ok) throw new Error("document upload failed");
      const doc = await prisma.document.findUniqueOrThrow({ where: { id: uploaded.documentId } });
      const publicRead = await fetch(`${process.env.SUPABASE_URL}/storage/v1/object/public/member-documents/${doc.storageKey}`, { signal: AbortSignal.timeout(5000) });
      check("private document not readable at the public object URL", !publicRead.ok);
      const signed = await createAuthorizedDocumentSignedUrl(ownerId, doc.id);
      const signedUrl = new URL(signed.url);
      check("owner signed URL is restricted to disposable Storage", signedUrl.hostname === "127.0.0.1" && signedUrl.port === "54321");
      const downloaded = await fetch(signed.url, { signal: AbortSignal.timeout(5000) });
      check("owner authorized signed download returns exact synthetic bytes", downloaded.ok && Buffer.from(await downloaded.arrayBuffer()).equals(bytes));
      await expect(createAuthorizedDocumentSignedUrl(actorId, doc.id)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
      check("unrelated MEMBER denied document URL by actual domain command", true);
      for (const roleName of ["EXCO_VIEWER", "EXCO_ADMIN", "SUPER_ADMIN"] as const) {
        awaiting = `${roleName} fixture assignment`;
        const role = await prisma.role.findUniqueOrThrow({ where: { name: roleName } });
        await prisma.userRole.create({ data: { userId: actorId, roleId: role.id } });
        if (roleName === "EXCO_VIEWER") {
          await expect(createAuthorizedDocumentSignedUrl(actorId, doc.id)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
          check("EXCO_VIEWER denied document URL", true);
        } else {
          awaiting = `${roleName} document authorization and signed download`;
          const reviewed = await createAuthorizedDocumentSignedUrl(actorId, doc.id);
          const response = await fetch(reviewed.url, { signal: AbortSignal.timeout(5000) });
          check(`${roleName} authorized document review downloads exact bytes`, response.ok && Buffer.from(await response.arrayBuffer()).equals(bytes));
        }
        if (roleName === "SUPER_ADMIN") {
          awaiting = "canonical account suspension with modern secret";
          await setAccountStatus(actorId, ownerId, "SUSPENDED");
          const banned = await admin.auth.admin.getUserById(ownerId);
          const suspended = await prisma.user.findUniqueOrThrow({ where: { id: ownerId } });
          check("canonical suspension synchronizes Auth ban and application status", !banned.error && Date.parse(banned.data.user.banned_until ?? "") > Date.now() && suspended.accountStatus === "SUSPENDED");
          await setAccountStatus(actorId, ownerId, "ACTIVE");
          const unbanned = await admin.auth.admin.getUserById(ownerId);
          const active = await prisma.user.findUniqueOrThrow({ where: { id: ownerId } });
          check("canonical activation restores Auth access and application status", !unbanned.error && !(Date.parse(unbanned.data.user.banned_until ?? "") > Date.now()) && active.accountStatus === "ACTIVE");
        }
        awaiting = `${roleName} temporary role removal`;
        await prisma.userRole.delete({ where: { userId_roleId: { userId: actorId, roleId: role.id } } });
      }
    } catch (error) {
      const safeTypes = ["AppError", "AssertionError", "PrismaClientKnownRequestError", "TypeError", "Error"];
      const type = error instanceof Error && safeTypes.includes(error.name) ? error.name : "unknown";
      const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
      errorCategory = { type, ...(/^(P\d{4}|UNAUTHORIZED|INTERNAL|NOT_FOUND|VALIDATION)$/.test(code) ? { code } : {}) };
      failure = checks.find(c => !c.pass)?.name ?? awaiting;
      if (!checks.some(c => !c.pass)) checks.push({ name: failure, pass: false });
    } finally {
      try {
        if (ownerId) {
          const unban = await createServiceRoleClient().auth.admin.updateUserById(ownerId, { ban_duration: "none" });
          if (unban.error) throw new Error("fixture unban failed");
          await prisma.user.update({ where: { id: ownerId }, data: { accountStatus: "ACTIVE" } });
        }
        if (actorId) await prisma.userRole.deleteMany({ where: { userId: actorId, role: { name: { in: ["EXCO_VIEWER", "EXCO_ADMIN", "SUPER_ADMIN"] } } } });
      } catch { failure ??= "synthetic fixture privilege/status cleanup"; checks.push({ name: "synthetic fixture privilege/status cleanup", pass: false }); }
      await prisma.$disconnect();
      const report = { source: "actual application domain commands + disposable Storage/Auth Admin; NOT browser/session or email delivery acceptance",
        at: new Date().toISOString(), database: "127.0.0.1:54322", auth: "127.0.0.1:54321", productionChanged: false,
        administrativeKey: "modern secret, not ordinary session key", fixtures: "unique synthetic records/documents retained; temporary privileged roles removed and owner reactivated",
        checks, passed: checks.filter(c => c.pass).length, failed: checks.filter(c => !c.pass).length, completed: failure === null, failure, errorCategory };
      await mkdir(".cache/auth-a", { recursive: true });
      await writeFile(".cache/auth-a/local-consumers.json", JSON.stringify(report, null, 2));
      console.log(JSON.stringify(report));
    }
    if (failure) throw new Error(failure);
  }, 90_000);
});
