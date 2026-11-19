import { expect, test } from "@playwright/test";

test.describe("NFR browser smoke", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/auth/post-login-status", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          isAuthenticated: false,
          nextRoute: "/login",
        }),
      });
    });

    await page.route("**/api/auth/get-session", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "null",
      });
    });
  });

  test("NFR-COMP/PERF public auth pages render across configured browsers within MVP budget", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });

    await page.goto("/login");
    await expect(
      page.getByRole("heading", { name: /selamat datang kembali/i }),
    ).toBeVisible({ timeout: 15_000 });

    const start = Date.now();
    const response = await page.reload({
      waitUntil: "domcontentloaded",
    });

    expect(response?.ok()).toBe(true);
    await expect(
      page.getByRole("heading", { name: /selamat datang kembali/i }),
    ).toBeVisible();
    const elapsedMs = Date.now() - start;
    expect(elapsedMs).toBeLessThan(5_000);

    const horizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(horizontalOverflow).toBe(false);
    expect(consoleErrors).toEqual([]);
  });

  test("NFR-SEC security headers dikirim pada halaman publik", async ({
    page,
  }) => {
    const response = await page.goto("/login", {
      waitUntil: "domcontentloaded",
    });
    const headers = response?.headers() ?? {};

    expect(headers["strict-transport-security"]).toContain("includeSubDomains");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["permissions-policy"]).toContain("camera=()");
  });
});
