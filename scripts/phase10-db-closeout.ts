/**
 * Phase 10 forensic DB closeout — disposable Supabase only.
 * Proves metric definitions, date boundaries, and domain separation.
 */
import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";
import { registrationWindowStartUtc } from "../src/features/exco/metric-window";
import { computeExcoDashboardMetrics } from "../src/features/exco/compute-dashboard-metrics";
import {
  calculateProfileCompletion,
  normalizeOpportunityPreferences,
  toCompletionInput,
} from "../src/features/profile/completion";

const prisma = new PrismaClient();
const TAG = `p10-closeout-${Date.now()}`;

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

async function createMemberFixture(input: {
  email: string;
  createdAt: Date;
  situation?: string;
  verificationStatus?: "NOT_REVIEWED" | "PENDING" | "UNDER_REVIEW" | "VERIFIED" | "REJECTED" | "NEEDS_CLARIFICATION";
  displayName?: string;
}) {
  const id = randomUUID();
  const insertStatus =
    input.verificationStatus === "PENDING" || input.verificationStatus === "NOT_REVIEWED"
      ? input.verificationStatus
      : "NOT_REVIEWED";

  await prisma.user.create({
    data: {
      id,
      email: input.email,
      phone: null,
      accountStatus: "ACTIVE",
      createdAt: input.createdAt,
      updatedAt: input.createdAt,
      profile: {
        create: {
          displayName: input.displayName ?? "P10 Fixture",
          professionalSituation: input.situation ?? "Employee",
          verificationStatus: insertStatus,
          visibilityStatus: "PRIVATE",
          profileStatus: "REGISTERED",
          professionalDetails: {
            create: {
              profession: "Engineer",
              lookingForSummary: "Peers",
              offeringSummary: "Help",
              opportunityPreferences: {},
            },
          },
        },
      },
    },
  });

  if (input.verificationStatus && input.verificationStatus !== insertStatus) {
    // Disposable fixture only — single transaction so SET LOCAL applies to the UPDATE.
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL session_replication_role = replica`);
      await tx.$executeRawUnsafe(
        `UPDATE public.profiles SET verification_status = $1::"VerificationStatus" WHERE user_id = $2::uuid`,
        input.verificationStatus,
        id,
      );
    });
  }

  return id;
}

async function main() {
  const now = new Date();
  const windowStart = registrationWindowStartUtc(now, 30);
  const justBefore = new Date(windowStart.getTime() - 1000);
  const older = new Date(windowStart.getTime() - 40 * 24 * 60 * 60 * 1000);

  const before = await computeExcoDashboardMetrics(prisma, now);

  const atBoundary = await createMemberFixture({
    email: `${TAG}-boundary@example.com`,
    createdAt: windowStart,
  });
  const beforeBoundary = await createMemberFixture({
    email: `${TAG}-before@example.com`,
    createdAt: justBefore,
  });
  const currentDay = await createMemberFixture({
    email: `${TAG}-today@example.com`,
    createdAt: now,
  });
  const oldReg = await createMemberFixture({
    email: `${TAG}-old@example.com`,
    createdAt: older,
  });
  const jobSeeker = await createMemberFixture({
    email: `${TAG}-seeker@example.com`,
    createdAt: now,
    situation: "Job seeker",
  });
  const pendingPro = await createMemberFixture({
    email: `${TAG}-pend-pro@example.com`,
    createdAt: now,
    verificationStatus: "PENDING",
  });
  const verifiedPro = await createMemberFixture({
    email: `${TAG}-ver-pro@example.com`,
    createdAt: now,
    verificationStatus: "VERIFIED",
  });

  const bizPending = await prisma.business.create({
    data: {
      name: `${TAG}-biz-pending`,
      businessStatus: "SUBMITTED",
      visibilityStatus: "PRIVATE",
    },
  });
  const bizVerified = await prisma.business.create({
    data: {
      name: `${TAG}-biz-verified`,
      businessStatus: "APPROVED",
      visibilityStatus: "PRIVATE",
    },
  });

  const after = await computeExcoDashboardMetrics(prisma, now);

  assert(
    after.newRegistrationsLast30Days === before.newRegistrationsLast30Days + 5,
    `new registrations expected +5 (boundary, today, seeker, pend, ver); got ${before.newRegistrationsLast30Days} → ${after.newRegistrationsLast30Days}`,
  );
  // beforeBoundary + oldReg excluded from 30d window
  assert(
    after.totalProfessionals === before.totalProfessionals + 7,
    `total professionals +7 expected; got ${before.totalProfessionals} → ${after.totalProfessionals}`,
  );
  assert(
    after.seekingEmployment === before.seekingEmployment + 1,
    "seeking employment +1",
  );
  assert(
    after.pendingProfessionalVerification === before.pendingProfessionalVerification + 1,
    "pending professional +1",
  );
  assert(
    after.verifiedProfessionals === before.verifiedProfessionals + 1,
    "verified professionals +1",
  );
  assert(after.businesses === before.businesses + 2, "businesses +2");
  assert(
    after.pendingBusinessVerification === before.pendingBusinessVerification + 1,
    "pending business +1",
  );
  assert(
    after.verifiedBusinesses === before.verifiedBusinesses + 1,
    "verified businesses +1",
  );

  // Domain separation: approving business must not change professional verification counts
  const proBeforeApprove = after.verifiedProfessionals;
  const pendProBeforeApprove = after.pendingProfessionalVerification;
  await prisma.business.update({
    where: { id: bizPending.id },
    data: { businessStatus: "APPROVED" },
  });
  const afterBizApprove = await computeExcoDashboardMetrics(prisma, now);
  assert(
    afterBizApprove.verifiedProfessionals === proBeforeApprove,
    "business approve must not change verified professionals",
  );
  assert(
    afterBizApprove.pendingProfessionalVerification === pendProBeforeApprove,
    "business approve must not change pending professionals",
  );
  assert(
    afterBizApprove.verifiedBusinesses === after.verifiedBusinesses + 1,
    "verified businesses should increase after approve",
  );
  assert(
    afterBizApprove.pendingBusinessVerification === after.pendingBusinessVerification - 1,
    "pending business should decrease after approve",
  );

  // Professional verification change must not change business metrics
  const bizVerBefore = afterBizApprove.verifiedBusinesses;
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL session_replication_role = replica`);
    await tx.$executeRawUnsafe(
      `UPDATE public.profiles SET verification_status = 'VERIFIED'::"VerificationStatus" WHERE user_id = $1::uuid`,
      pendingPro,
    );
  });
  const afterProVerify = await computeExcoDashboardMetrics(prisma, now);
  assert(
    afterProVerify.verifiedBusinesses === bizVerBefore,
    "professional verify must not change verified businesses",
  );

  // Phase 8 completion consistency: dashboard completeProfiles === manual loop
  const manualComplete = await (async () => {
    const profiles = await prisma.profile.findMany({
      where: { deletedAt: null },
      include: {
        professionalDetails: { include: { industry: { select: { name: true } } } },
        churchInformation: true,
        experiences: { select: { id: true }, take: 1 },
        profileSkills: { include: { skill: { select: { name: true } } } },
        profileServices: { include: { service: { select: { name: true } } } },
        businessLinks: {
          include: { business: { include: { industry: { select: { name: true } } } } },
        },
      },
    });
    let n = 0;
    for (const profile of profiles) {
      const details = profile.professionalDetails;
      const result = calculateProfileCompletion(
        toCompletionInput({
          displayName: profile.displayName,
          location: profile.location,
          bio: profile.bio,
          hasHeadshot: Boolean(profile.profileImageStorageKey),
          profession: details?.profession ?? null,
          industryName: details?.industry?.name ?? null,
          yearsExperience: details?.yearsExperience ?? null,
          hasExperienceRows: profile.experiences.length > 0,
          skillNames: profile.profileSkills.map((ps) => ps.skill.name),
          serviceNames: profile.profileServices.map((ps) => ps.service.name),
          linkedinUrl: details?.linkedinUrl ?? null,
          serviceArea: profile.churchInformation?.serviceArea ?? null,
          lookingForSummary: details?.lookingForSummary ?? null,
          offeringSummary: details?.offeringSummary ?? null,
          opportunityPreferences: normalizeOpportunityPreferences(details?.opportunityPreferences),
          professionalSituation: profile.professionalSituation,
          businessLinks: profile.businessLinks
            .filter((l) => !l.business.deletedAt)
            .map((l) => ({
              name: l.business.name,
              industryName: l.business.industry?.name ?? null,
              description: l.business.description,
            })),
        }),
      );
      if (result.percent === 100) n += 1;
    }
    return n;
  })();
  assert(
    afterProVerify.completeProfiles === manualComplete,
    `complete profiles mismatch dashboard=${afterProVerify.completeProfiles} manual=${manualComplete}`,
  );

  // Soft-delete cleanup of fixtures
  const emails = [
    `${TAG}-boundary@example.com`,
    `${TAG}-before@example.com`,
    `${TAG}-today@example.com`,
    `${TAG}-old@example.com`,
    `${TAG}-seeker@example.com`,
    `${TAG}-pend-pro@example.com`,
    `${TAG}-ver-pro@example.com`,
  ];
  for (const email of emails) {
    const u = await prisma.user.findUnique({ where: { email }, include: { profile: true } });
    if (u?.profile) {
      await prisma.professionalDetails.deleteMany({ where: { profileId: u.profile.id } });
      await prisma.profile.delete({ where: { id: u.profile.id } });
    }
    if (u) await prisma.user.delete({ where: { id: u.id } });
  }
  await prisma.business.deleteMany({ where: { name: { startsWith: TAG } } });

  // Route audit markers
  assert(!process.env.PHASE10_ALLOW_ADMIN, "sanity");

  console.log(
    JSON.stringify(
      {
        ok: true,
        windowStart: windowStart.toISOString(),
        fixtureIds: { atBoundary, beforeBoundary, currentDay, oldReg, jobSeeker, pendingPro, verifiedPro },
        bizIds: { bizPending: bizPending.id, bizVerified: bizVerified.id },
        metricsAfter: afterProVerify,
      },
      null,
      2,
    ),
  );
  console.log("PHASE10_DB_CLOSEOUT_PASS");
}

main()
  .catch((err) => {
    console.error("PHASE10_DB_CLOSEOUT_FAIL", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
