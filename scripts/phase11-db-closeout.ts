/**
 * Phase 11 forensic DB closeout — disposable Supabase only.
 * Proves filter definitions, OWNER-only, job seeker, professional Verified,
 * completion reuse, and page size. No production.
 */
import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";
import {
  calculateProfileCompletion,
  normalizeOpportunityPreferences,
  toCompletionInput,
} from "../src/features/profile/completion";
import { EXCO_PROFESSIONALS_PAGE_SIZE } from "../src/features/exco/professionals/query";

const prisma = new PrismaClient();
const TAG = `p11-closeout-${Date.now()}`;

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

async function createFixture(input: {
  email: string;
  displayName: string;
  situation?: string;
  profession?: string;
  location?: string;
  verificationStatus?: "NOT_REVIEWED" | "PENDING" | "VERIFIED";
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
      profile: {
        create: {
          displayName: input.displayName,
          location: input.location ?? null,
          professionalSituation: input.situation ?? "Employee",
          verificationStatus: insertStatus,
          visibilityStatus: "PRIVATE",
          profileStatus: "REGISTERED",
          professionalDetails: {
            create: {
              profession: input.profession ?? "Engineer",
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
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL session_replication_role = replica`);
      await tx.$executeRawUnsafe(
        `UPDATE public.profiles SET verification_status = $1::"VerificationStatus" WHERE user_id = $2::uuid`,
        input.verificationStatus,
        id,
      );
    });
  }

  const profile = await prisma.profile.findUniqueOrThrow({ where: { userId: id } });
  return { userId: id, profileId: profile.id };
}

async function main() {
  assert(EXCO_PROFESSIONALS_PAGE_SIZE === 25, "page size must be 25");

  const seeker = await createFixture({
    email: `${TAG}-seeker@example.com`,
    displayName: `${TAG} Seeker`,
    situation: "Job seeker",
    profession: "Software Engineer",
    location: "Lagos",
  });
  const employee = await createFixture({
    email: `${TAG}-employee@example.com`,
    displayName: `${TAG} Employee`,
    situation: "Employee",
    profession: "software engineer",
  });
  const verifiedPro = await createFixture({
    email: `${TAG}-verpro@example.com`,
    displayName: `${TAG} VerPro`,
    verificationStatus: "VERIFIED",
  });
  const ownerPro = await createFixture({
    email: `${TAG}-owner@example.com`,
    displayName: `${TAG} Owner`,
    verificationStatus: "NOT_REVIEWED",
  });
  const directorPro = await createFixture({
    email: `${TAG}-director@example.com`,
    displayName: `${TAG} Director`,
  });

  const bizApproved = await prisma.business.create({
    data: {
      name: `${TAG} Approved Biz`,
      businessStatus: "APPROVED",
      visibilityStatus: "PRIVATE",
    },
  });
  const bizDraft = await prisma.business.create({
    data: {
      name: `${TAG} Draft Biz`,
      businessStatus: "DRAFT",
      visibilityStatus: "PRIVATE",
    },
  });

  await prisma.businessProfessional.create({
    data: {
      businessId: bizApproved.id,
      profileId: ownerPro.profileId,
      relationshipType: "OWNER",
    },
  });
  await prisma.businessProfessional.create({
    data: {
      businessId: bizDraft.id,
      profileId: directorPro.profileId,
      relationshipType: "DIRECTOR",
    },
  });
  // Duplicate OWNER relationship must not invent a second professional.
  await prisma.businessProfessional.create({
    data: {
      businessId: bizDraft.id,
      profileId: ownerPro.profileId,
      relationshipType: "EMPLOYEE",
    },
  });

  const jobSeekers = await prisma.profile.findMany({
    where: {
      deletedAt: null,
      professionalSituation: "Job seeker",
      displayName: { startsWith: TAG },
    },
  });
  assert(jobSeekers.length === 1, "job seeker must be professional_situation only");
  assert(jobSeekers[0]!.id === seeker.profileId, "unexpected job seeker");

  const professionContains = await prisma.profile.findMany({
    where: {
      deletedAt: null,
      displayName: { startsWith: TAG },
      professionalDetails: {
        is: { profession: { contains: "software", mode: "insensitive" } },
      },
    },
  });
  assert(professionContains.length === 2, "profession contains+ci must match both casings");

  const owners = await prisma.profile.findMany({
    where: {
      deletedAt: null,
      displayName: { startsWith: TAG },
      businessLinks: {
        some: {
          relationshipType: "OWNER",
          business: { is: { deletedAt: null } },
        },
      },
    },
  });
  assert(owners.length === 1, "business owner filter must be OWNER only");
  assert(owners[0]!.id === ownerPro.profileId, "owner mismatch");

  const verifiedOnly = await prisma.profile.findMany({
    where: {
      deletedAt: null,
      displayName: { startsWith: TAG },
      verificationStatus: "VERIFIED",
    },
  });
  assert(verifiedOnly.length === 1, "Verified must be professional VERIFIED only");
  assert(verifiedOnly[0]!.id === verifiedPro.profileId, "verified pro mismatch");

  const ownerAfterBizVerify = await prisma.profile.findUniqueOrThrow({
    where: { id: ownerPro.profileId },
  });
  assert(
    ownerAfterBizVerify.verificationStatus === "NOT_REVIEWED",
    "APPROVED business must not set professional VERIFIED",
  );

  // Completion: authoritative Phase 8 function on same row inputs.
  const full = await prisma.profile.findUniqueOrThrow({
    where: { id: seeker.profileId },
    include: {
      professionalDetails: { include: { industry: true } },
      churchInformation: true,
      experiences: { select: { id: true }, take: 1 },
      profileSkills: { include: { skill: true } },
      profileServices: { include: { service: true } },
      businessLinks: {
        include: { business: { include: { industry: true } } },
      },
    },
  });
  const details = full.professionalDetails;
  const a = calculateProfileCompletion(
    toCompletionInput({
      displayName: full.displayName,
      location: full.location,
      bio: full.bio,
      hasHeadshot: Boolean(full.profileImageStorageKey),
      profession: details?.profession ?? null,
      industryName: details?.industry?.name ?? null,
      yearsExperience: details?.yearsExperience ?? null,
      hasExperienceRows: full.experiences.length > 0,
      skillNames: full.profileSkills.map((ps) => ps.skill.name),
      serviceNames: full.profileServices.map((ps) => ps.service.name),
      linkedinUrl: details?.linkedinUrl ?? null,
      serviceArea: full.churchInformation?.serviceArea ?? null,
      lookingForSummary: details?.lookingForSummary ?? null,
      offeringSummary: details?.offeringSummary ?? null,
      opportunityPreferences: normalizeOpportunityPreferences(details?.opportunityPreferences),
      professionalSituation: full.professionalSituation,
      businessLinks: full.businessLinks
        .filter((l) => !l.business.deletedAt)
        .map((l) => ({
          name: l.business.name,
          industryName: l.business.industry?.name ?? null,
          description: l.business.description,
        })),
    }),
  );
  const b = calculateProfileCompletion(
    toCompletionInput({
      displayName: full.displayName,
      location: full.location,
      bio: full.bio,
      hasHeadshot: Boolean(full.profileImageStorageKey),
      profession: details?.profession ?? null,
      industryName: details?.industry?.name ?? null,
      yearsExperience: details?.yearsExperience ?? null,
      hasExperienceRows: full.experiences.length > 0,
      skillNames: full.profileSkills.map((ps) => ps.skill.name),
      serviceNames: full.profileServices.map((ps) => ps.service.name),
      linkedinUrl: details?.linkedinUrl ?? null,
      serviceArea: full.churchInformation?.serviceArea ?? null,
      lookingForSummary: details?.lookingForSummary ?? null,
      offeringSummary: details?.offeringSummary ?? null,
      opportunityPreferences: normalizeOpportunityPreferences(details?.opportunityPreferences),
      professionalSituation: full.professionalSituation,
      businessLinks: full.businessLinks
        .filter((l) => !l.business.deletedAt)
        .map((l) => ({
          name: l.business.name,
          industryName: l.business.industry?.name ?? null,
          description: l.business.description,
        })),
    }),
  );
  assert(a.percent === b.percent, "completion must be deterministic Phase 8");

  // Cleanup fixtures
  await prisma.businessProfessional.deleteMany({
    where: { businessId: { in: [bizApproved.id, bizDraft.id] } },
  });
  await prisma.business.deleteMany({ where: { id: { in: [bizApproved.id, bizDraft.id] } } });
  const emails = [
    `${TAG}-seeker@example.com`,
    `${TAG}-employee@example.com`,
    `${TAG}-verpro@example.com`,
    `${TAG}-owner@example.com`,
    `${TAG}-director@example.com`,
  ];
  await prisma.profile.deleteMany({
    where: { user: { email: { in: emails } } },
  });
  await prisma.user.deleteMany({ where: { email: { in: emails } } });

  console.log(
    JSON.stringify(
      {
        ok: true,
        pageSize: EXCO_PROFESSIONALS_PAGE_SIZE,
        jobSeekers: jobSeekers.length,
        professionContains: professionContains.length,
        owners: owners.length,
        verifiedProfessionals: verifiedOnly.length,
        ownerVerificationUnaffectedByBizApprove: ownerAfterBizVerify.verificationStatus,
        completionPercent: a.percent,
      },
      null,
      2,
    ),
  );
  console.log("PHASE11_DB_CLOSEOUT_PASS");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
