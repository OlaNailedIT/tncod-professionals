import { test, expect, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { DIRECTORY_PAGE_SIZE } from "../src/features/directory/query";

const prisma = new PrismaClient();

async function forceStatus(
  profileId: string,
  verification: string,
  visibility: string,
  slug: string | null,
) {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL session_replication_role = replica`);
    await tx.$executeRawUnsafe(
      `UPDATE public.profiles
       SET verification_status = $1::"VerificationStatus",
           visibility_status = $2::"VisibilityStatus",
           public_slug = $3
       WHERE id = $4::uuid`,
      verification,
      visibility,
      slug,
      profileId,
    );
  });
}

async function registerViaUi(page: Page, email: string, phone: string, name: string) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.goto("/join", { waitUntil: "load" });
      await page.getByLabel(/Full name/i).fill(name);
      await page.getByLabel(/Phone \/ WhatsApp/i).fill(phone);
      await page.getByLabel(/^Email/i).fill(email);
      await page.getByLabel(/Professional status/i).selectOption("Employee");
      await page.getByLabel(/What do you do professionally/i).fill("Engineer");
      await page.getByLabel(/Company, organisation or business/i).fill("TNCOD");
      await page.getByLabel(/What are you looking for/i).fill("Peers");
      await page.getByLabel(/What can you offer/i).fill("Help");
      await page.getByRole("button", { name: /Create my professional record/i }).click();
      await expect(page).toHaveURL(/\/join\/success/, { timeout: 60_000 });
      return;
    } catch (err) {
      lastError = err;
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`registerViaUi failed for ${email}`);
}

test.describe("Phase 13 forensic closeout", () => {
  test.setTimeout(420_000);

  test("directory list, detail, negatives, responsive, a11y", async ({ page }) => {
    expect(DIRECTORY_PAGE_SIZE).toBe(25);
    const stamp = Date.now();
    const listedEmail = `p13c-listed-${stamp}@example.com`;
    const hiddenEmail = `p13c-hidden-${stamp}@example.com`;
    const phoneL = `+2782${String(stamp).slice(-7)}`;
    const phoneH = `+2783${String(stamp).slice(-7)}`;
    const listedSlug = `p13c-listed-${stamp}`;
    const hiddenSlug = `p13c-hidden-${stamp}`;

    await registerViaUi(page, listedEmail, phoneL, "P13C Listed Pro");
    await registerViaUi(page, hiddenEmail, phoneH, "P13C Hidden Pro");

    const listed = await prisma.user.findFirst({
      where: { email: listedEmail },
      include: { profile: true },
    });
    const hidden = await prisma.user.findFirst({
      where: { email: hiddenEmail },
      include: { profile: true },
    });
    expect(listed?.profile && hidden?.profile).toBeTruthy();

    await forceStatus(listed!.profile!.id, "VERIFIED", "DIRECTORY", listedSlug);
    await forceStatus(hidden!.profile!.id, "VERIFIED", "MEMBERS_ONLY", hiddenSlug);

    // Anonymous directory
    await page.goto("/professionals", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Professionals Directory/i })).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByRole("link", { name: /P13C Listed Pro/i })).toBeVisible();
    await expect(page.getByText("Verified").first()).toBeVisible();
    await expect(page.getByRole("link", { name: /P13C Hidden Pro/i })).toHaveCount(0);

    // Search
    await page.getByLabel(/^Search$/i).fill("Listed Pro");
    await page.getByRole("button", { name: /^Apply$/i }).click();
    await expect(page).toHaveURL(/q=/, { timeout: 30_000 });
    await expect(page.getByRole("link", { name: /P13C Listed Pro/i })).toBeVisible();

    // Detail
    await page.getByRole("link", { name: /P13C Listed Pro/i }).click();
    await expect(page).toHaveURL(new RegExp(`/professionals/${listedSlug}`));
    await expect(page.getByRole("heading", { name: /P13C Listed Pro/i })).toBeVisible();
    await expect(page.getByText(/Contact details|not available here/i).first()).toBeVisible();
    await expect(page.getByText(listedEmail)).toHaveCount(0);

    // Negatives — privacy-safe unavailable
    await page.goto(`/professionals/${hiddenSlug}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Professional unavailable/i })).toBeVisible({
      timeout: 30_000,
    });
    await page.goto(`/professionals/p13c-never-${stamp}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Professional unavailable/i })).toBeVisible();

    // No /directory product
    await page.goto("/directory", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Professionals Directory/i })).toHaveCount(0);

    // Responsive
    for (const width of [320, 375, 390, 430, 768, 1024, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/professionals", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: /Professionals Directory/i })).toBeVisible();
    }

    // Keyboard: search focusable
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/professionals", { waitUntil: "domcontentloaded" });
    await page.getByLabel(/^Search$/i).focus();
    await expect(page.getByLabel(/^Search$/i)).toBeFocused();
  });
});
