/**
 * Synthetic development seed. Do not execute against production.
 * Status: DEFINED. Not executed in Phase 2.
 */
import {
  PrismaClient,
  AppRole,
  ProfileStatus,
  VerificationStatus,
  VisibilityStatus,
  OpportunityType,
  BusinessProfessionalRelationship,
} from "@prisma/client";

const prisma = new PrismaClient();

const PERMISSIONS = [
  "professional.view",
  "professional.edit",
  "professional.verify",
  "professional.publish",
  "business.view",
  "business.manage",
  "business.verify",
  "business.publish",
  "opportunity.view",
  "opportunity.manage",
  "document.view",
  "document.review",
  "spotlight.manage",
  "user.manage",
  "user.manage_roles",
  "audit.view",
  "configuration.manage",
  "report.view",
] as const;

/** Keep in sync with src/security/permissions.ts ROLE_PERMISSION_KEYS */
const ROLE_GRANTS: Record<AppRole, readonly (typeof PERMISSIONS)[number][]> = {
  MEMBER: [
    "professional.view",
    "professional.edit",
    "business.view",
    "business.manage",
    "opportunity.view",
    "document.view",
  ],
  EXCO_VIEWER: [
    "professional.view",
    "business.view",
    "opportunity.view",
    "report.view",
  ],
  EXCO_ADMIN: [
    "professional.view",
    "professional.verify",
    "professional.publish",
    "business.view",
    "business.manage",
    "business.verify",
    "business.publish",
    "opportunity.view",
    "opportunity.manage",
    "document.view",
    "document.review",
    "spotlight.manage",
    "audit.view",
    "report.view",
  ],
  SUPER_ADMIN: PERMISSIONS,
};

async function main() {
  for (const key of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key },
      create: { key },
      update: {},
    });
  }

  for (const name of [
    AppRole.MEMBER,
    AppRole.EXCO_VIEWER,
    AppRole.EXCO_ADMIN,
    AppRole.SUPER_ADMIN,
  ]) {
    await prisma.role.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  }

  for (const roleName of Object.keys(ROLE_GRANTS) as AppRole[]) {
    const role = await prisma.role.findUniqueOrThrow({ where: { name: roleName } });
    for (const key of ROLE_GRANTS[roleName]) {
      const permission = await prisma.permission.findUniqueOrThrow({ where: { key } });
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: role.id, permissionId: permission.id },
        },
        create: { roleId: role.id, permissionId: permission.id },
        update: {},
      });
    }
  }

  for (const s of [
    { name: "Accounting", slug: "accounting", category: "Finance" },
    { name: "Graphic Design", slug: "graphic-design", category: "Creative" },
  ]) {
    await prisma.skill.upsert({ where: { slug: s.slug }, create: s, update: { name: s.name } });
  }

  await prisma.service.upsert({
    where: { slug: "tax-advisory" },
    create: { name: "Tax Advisory", slug: "tax-advisory", category: "Finance" },
    update: {},
  });

  const industry = await prisma.industry.upsert({
    where: { slug: "professional-services" },
    create: { name: "Professional Services", slug: "professional-services" },
    update: {},
  });

  const fixtures: Array<{
    email: string;
    displayName: string;
    profileStatus: ProfileStatus;
    verificationStatus: VerificationStatus;
    visibilityStatus: VisibilityStatus;
  }> = [
    {
      email: "incomplete.private@seed.test",
      displayName: "Seed Incomplete Private",
      profileStatus: ProfileStatus.INCOMPLETE,
      verificationStatus: VerificationStatus.NOT_REVIEWED,
      visibilityStatus: VisibilityStatus.PRIVATE,
    },
    {
      email: "complete.private@seed.test",
      displayName: "Seed Complete Private",
      profileStatus: ProfileStatus.COMPLETE,
      verificationStatus: VerificationStatus.NOT_REVIEWED,
      visibilityStatus: VisibilityStatus.PRIVATE,
    },
    {
      email: "complete.members@seed.test",
      displayName: "Seed Complete Members",
      profileStatus: ProfileStatus.COMPLETE,
      verificationStatus: VerificationStatus.NOT_REVIEWED,
      visibilityStatus: VisibilityStatus.MEMBERS_ONLY,
    },
    {
      email: "submitted.private@seed.test",
      displayName: "Seed Submitted Private",
      profileStatus: ProfileStatus.SUBMITTED,
      verificationStatus: VerificationStatus.PENDING,
      visibilityStatus: VisibilityStatus.PRIVATE,
    },
    {
      email: "pending.members@seed.test",
      displayName: "Seed Pending Members",
      profileStatus: ProfileStatus.SUBMITTED,
      verificationStatus: VerificationStatus.PENDING,
      visibilityStatus: VisibilityStatus.MEMBERS_ONLY,
    },
    {
      email: "verified.members@seed.test",
      displayName: "Seed Verified Members",
      profileStatus: ProfileStatus.COMPLETE,
      verificationStatus: VerificationStatus.VERIFIED,
      visibilityStatus: VisibilityStatus.MEMBERS_ONLY,
    },
    {
      email: "verified.directory@seed.test",
      displayName: "Seed Verified Directory",
      profileStatus: ProfileStatus.COMPLETE,
      verificationStatus: VerificationStatus.VERIFIED,
      visibilityStatus: VisibilityStatus.DIRECTORY,
    },
    {
      email: "rejected.members@seed.test",
      displayName: "Seed Rejected Members",
      profileStatus: ProfileStatus.COMPLETE,
      verificationStatus: VerificationStatus.REJECTED,
      visibilityStatus: VisibilityStatus.MEMBERS_ONLY,
    },
    {
      email: "coowner.two@seed.test",
      displayName: "Seed Co-owner Two",
      profileStatus: ProfileStatus.COMPLETE,
      verificationStatus: VerificationStatus.VERIFIED,
      visibilityStatus: VisibilityStatus.MEMBERS_ONLY,
    },
  ];

  for (const f of fixtures) {
    const insertVerification =
      f.verificationStatus === VerificationStatus.NOT_REVIEWED ||
      f.verificationStatus === VerificationStatus.PENDING
        ? f.verificationStatus
        : VerificationStatus.NOT_REVIEWED;
    const insertVisibility =
      f.visibilityStatus === VisibilityStatus.DIRECTORY
        ? VisibilityStatus.MEMBERS_ONLY
        : f.visibilityStatus;
    await prisma.user.upsert({
      where: { email: f.email },
      create: {
        id: crypto.randomUUID(),
        email: f.email,
        profile: {
          create: {
            displayName: f.displayName,
            profileStatus: f.profileStatus,
            verificationStatus: insertVerification,
            visibilityStatus: insertVisibility,
            publicSlug: null,
            professionalDetails: { create: { profession: "Seed Profession" } },
          },
        },
      },
      update: {},
    });
  }

  const memberRole = await prisma.role.findUniqueOrThrow({ where: { name: AppRole.MEMBER } });
  const viewerRole = await prisma.role.findUniqueOrThrow({ where: { name: AppRole.EXCO_VIEWER } });
  const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: AppRole.EXCO_ADMIN } });
  const superRole = await prisma.role.findUniqueOrThrow({ where: { name: AppRole.SUPER_ADMIN } });

  async function ensureRole(email: string, roleId: string) {
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId } },
      create: { userId: user.id, roleId },
      update: {},
    });
  }

  for (const email of [
    "incomplete.private@seed.test",
    "complete.private@seed.test",
    "complete.members@seed.test",
    "submitted.private@seed.test",
    "pending.members@seed.test",
    "verified.members@seed.test",
    "verified.directory@seed.test",
    "rejected.members@seed.test",
    "coowner.two@seed.test",
  ]) {
    await ensureRole(email, memberRole.id);
  }

  const staff = [
    {
      email: "viewer.only@seed.test",
      displayName: "Seed EXCO Viewer",
      roleId: viewerRole.id,
    },
    {
      email: "admin.exco@seed.test",
      displayName: "Seed EXCO Admin",
      roleId: adminRole.id,
    },
    {
      email: "super.admin@seed.test",
      displayName: "Seed Super Admin",
      roleId: superRole.id,
    },
  ];
  for (const s of staff) {
    await prisma.user.upsert({
      where: { email: s.email },
      create: {
        id: crypto.randomUUID(),
        email: s.email,
        profile: {
          create: {
            displayName: s.displayName,
            profileStatus: ProfileStatus.COMPLETE,
            verificationStatus: VerificationStatus.NOT_REVIEWED,
            visibilityStatus: VisibilityStatus.PRIVATE,
          },
        },
      },
      update: {},
    });
    await ensureRole(s.email, s.roleId);
  }

  const adminForJwt = await prisma.user.findUniqueOrThrow({
    where: { email: "admin.exco@seed.test" },
  });
  await prisma.$executeRaw`SELECT set_config('request.jwt.claim.sub', ${adminForJwt.id}::text, false)`;
  await prisma.$executeRaw`SELECT set_config('request.jwt.claim.role', 'authenticated', false)`;

  for (const f of fixtures) {
    const profile = await prisma.profile.findFirstOrThrow({
      where: { user: { email: f.email } },
    });
    await prisma.profile.update({
      where: { id: profile.id },
      data: {
        verificationStatus: f.verificationStatus,
        visibilityStatus: f.visibilityStatus,
        publicSlug:
          f.visibilityStatus === VisibilityStatus.DIRECTORY ? f.email.split("@")[0]! : null,
      },
    });
  }
  for (const s of staff) {
    const profile = await prisma.profile.findFirstOrThrow({
      where: { user: { email: s.email } },
    });
    await prisma.profile.update({
      where: { id: profile.id },
      data: {
        verificationStatus: VerificationStatus.VERIFIED,
        visibilityStatus: VisibilityStatus.PRIVATE,
      },
    });
  }

  const pOwner = await prisma.profile.findFirstOrThrow({
    where: { user: { email: "verified.members@seed.test" } },
  });
  const pPartner = await prisma.profile.findFirstOrThrow({
    where: { user: { email: "coowner.two@seed.test" } },
  });

  const business =
    (await prisma.business.findFirst({ where: { name: "Seed Advisory Ltd" } })) ??
    (await prisma.business.create({
      data: {
        name: "Seed Advisory Ltd",
        industryId: industry.id,
        businessStatus: "APPROVED",
        visibilityStatus: VisibilityStatus.PRIVATE,
      },
    }));

  await prisma.businessProfessional.upsert({
    where: {
      businessId_profileId: { businessId: business.id, profileId: pOwner.id },
    },
    create: {
      businessId: business.id,
      profileId: pOwner.id,
      relationshipType: BusinessProfessionalRelationship.OWNER,
    },
    update: {},
  });
  await prisma.businessProfessional.upsert({
    where: {
      businessId_profileId: { businessId: business.id, profileId: pPartner.id },
    },
    create: {
      businessId: business.id,
      profileId: pPartner.id,
      relationshipType: BusinessProfessionalRelationship.PARTNER,
    },
    update: {},
  });

  const businessB =
    (await prisma.business.findFirst({ where: { name: "Seed Partner Practice" } })) ??
    (await prisma.business.create({
      data: {
        name: "Seed Partner Practice",
        industryId: industry.id,
        businessStatus: "DRAFT",
        visibilityStatus: VisibilityStatus.PRIVATE,
      },
    }));
  await prisma.businessProfessional.upsert({
    where: {
      businessId_profileId: { businessId: businessB.id, profileId: pPartner.id },
    },
    create: {
      businessId: businessB.id,
      profileId: pPartner.id,
      relationshipType: BusinessProfessionalRelationship.OWNER,
    },
    update: {},
  });

  const adminUser = await prisma.user.findUniqueOrThrow({
    where: { email: "admin.exco@seed.test" },
  });

  async function ensureOpportunity(
    createdById: string,
    type: OpportunityType,
    title: string,
    extra: {
      locationPreference?: string;
      status?: "DRAFT" | "ACTIVE" | "CLOSED" | "EXPIRED";
    } = {},
  ) {
    const existing = await prisma.opportunity.findFirst({ where: { createdById, title } });
    if (existing) return existing;
    const status = extra.status ?? "ACTIVE";
    return prisma.opportunity.create({
      data: {
        createdById,
        profileId: null,
        type,
        title,
        description: `${title} — seeded Phase 16 opportunity.`,
        locationPreference: extra.locationPreference,
        status,
        publishedAt: status === "ACTIVE" ? new Date() : null,
      },
    });
  }

  await ensureOpportunity(adminUser.id, OpportunityType.JOBS, "Community roles board sample", {
    locationPreference: "Lagos",
    status: "ACTIVE",
  });
  await ensureOpportunity(adminUser.id, OpportunityType.BUSINESS, "Business collaboration sample", {
    status: "ACTIVE",
  });
  await ensureOpportunity(adminUser.id, OpportunityType.COLLABORATION, "Open collaboration sample", {
    status: "DRAFT",
  });

  async function ensureDocument(profileId: string, userId: string, fileName: string, fileSize: number) {
    const existing = await prisma.document.findFirst({ where: { profileId, fileName } });
    if (existing) return existing;
    const id = crypto.randomUUID();
    return prisma.document.create({
      data: {
        id,
        profileId,
        documentType: "CV",
        storageKey: `documents/${userId}/${id}`,
        fileName,
        mimeType: "application/pdf",
        fileSize,
      },
    });
  }
  await ensureDocument(pOwner.id, pOwner.userId, "cv-a.pdf", 1024);
  await ensureDocument(pPartner.id, pPartner.userId, "cv-b.pdf", 2048);

  const adminUser = await prisma.user.findUniqueOrThrow({
    where: { email: "admin.exco@seed.test" },
  });
  if (
    !(await prisma.verificationRecord.findFirst({
      where: { profileId: pOwner.id, notes: { contains: "Seed verification note A" } },
    }))
  ) {
    await prisma.verificationRecord.create({
      data: {
        profileId: pOwner.id,
        reviewerId: adminUser.id,
        processStatus: "COMPLETED",
        decision: "APPROVED",
        notes: "Seed verification note A — never expose to members or directory",
      },
    });
  }
  if (
    !(await prisma.verificationRecord.findFirst({
      where: { profileId: pPartner.id, notes: { contains: "Seed verification note B" } },
    }))
  ) {
    await prisma.verificationRecord.create({
      data: {
        profileId: pPartner.id,
        reviewerId: adminUser.id,
        processStatus: "PENDING",
        notes: "Seed verification note B",
      },
    });
  }
  if (!(await prisma.adminNote.findFirst({ where: { note: "Seed admin note A — internal only" } }))) {
    await prisma.adminNote.create({
      data: {
        profileId: pOwner.id,
        authorId: adminUser.id,
        note: "Seed admin note A — internal only",
      },
    });
  }
  if (!(await prisma.adminNote.findFirst({ where: { note: "Seed admin note B — internal only" } }))) {
    await prisma.adminNote.create({
      data: {
        profileId: pPartner.id,
        authorId: adminUser.id,
        note: "Seed admin note B — internal only",
      },
    });
  }
  await prisma.churchInformation.upsert({
    where: { profileId: pOwner.id },
    create: { profileId: pOwner.id, serviceArea: "Seed service area — never public" },
    update: {},
  });
  const ownerUser = await prisma.user.findUniqueOrThrow({
    where: { email: "verified.members@seed.test" },
  });
  if (
    !(await prisma.consent.findFirst({
      where: { userId: ownerUser.id, consentType: "DIRECTORY_VISIBILITY", version: "v1" },
    }))
  ) {
    await prisma.consent.create({
      data: {
        userId: ownerUser.id,
        consentType: "DIRECTORY_VISIBILITY",
        version: "v1",
        granted: true,
        grantedAt: new Date(),
      },
    });
  }

  const directoryProfile = await prisma.profile.findFirstOrThrow({
    where: { user: { email: "verified.directory@seed.test" } },
  });
  if (!(await prisma.publication.findFirst({ where: { profileId: directoryProfile.id } }))) {
    await prisma.publication.create({
      data: {
        profileId: directoryProfile.id,
        status: "PUBLISHED",
        resultingVisibility: VisibilityStatus.DIRECTORY,
        actorId: adminUser.id,
      },
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
