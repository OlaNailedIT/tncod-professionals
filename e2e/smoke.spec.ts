import { test, expect } from "@playwright/test";

test("landing page renders join CTA", async ({ request }) => {
  const res = await request.get("/");
  expect(res.ok()).toBeTruthy();
  const html = await res.text();
  expect(html).toContain("TNCOD Professionals");
  expect(html).toContain("Join TNCOD Professionals");
});

test("session probe returns JSON without a product login page", async ({ request }) => {
  const res = await request.get("/api/runtime/session");
  expect(res.ok()).toBeTruthy();
  const body = (await res.json()) as { supabaseConfigured?: boolean; sessionPresent?: boolean };
  expect(typeof body.supabaseConfigured).toBe("boolean");
  expect(body.sessionPresent).toBe(false);
});

test("design-system surface includes forms and status patterns", async ({ request }) => {
  const res = await request.get("/design-system");
  expect(res.ok()).toBeTruthy();
  const html = await res.text();
  expect(html).toContain("Layout &amp; spacing");
  expect(html).toContain("Core components");
  expect(html).toContain("Data &amp; status patterns");
  expect(html).toContain("Forms &amp; input patterns");
  expect(html).toContain("Feedback &amp; interaction patterns");
  expect(html).toContain("Application shells");
  expect(html).toContain("Enter a valid email address.");
  expect(html).toContain("No items yet");
  expect(html).toContain("Member vs EXCO density");
});

test("register redirects to join", async ({ request }) => {
  const res = await request.get("/register", { maxRedirects: 0 });
  expect([307, 308, 302]).toContain(res.status());
  expect(res.headers()["location"] || "").toContain("/join");
});
