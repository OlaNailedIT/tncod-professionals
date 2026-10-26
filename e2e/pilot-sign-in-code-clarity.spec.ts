import { expect, test } from "@playwright/test";

test("sign-in explains that the resend wait is not code expiry", async ({ page }) => {
  await page.route("**/api/auth/request-otp", async (route) => {
    expect(route.request().method()).toBe("POST");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, skipSend: true }),
    });
  });
  await page.goto("/sign-in");
  await page.getByLabel("Email address").fill("pilot-copy@example.invalid");

  const request = page.waitForResponse((response) =>
    response.url().endsWith("/api/auth/request-otp") && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Send sign-in code" }).click();
  const response = await request;

  // The intercepted request cannot send a real email.
  expect(await response.json()).toMatchObject({ ok: true, skipSend: true });
  await expect(page.getByRole("heading", { name: "Enter your code" })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Resend available in \d+s$/ })).toBeVisible();
  await expect(page.getByText(/countdown shows when you can request another code, not when this one expires/i)).toBeVisible();
});
