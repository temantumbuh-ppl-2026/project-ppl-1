import { expect, test } from "@playwright/test";

const unauthenticatedSession = {
  isAuthenticated: false,
  nextRoute: "/login",
};

test.describe("E2E MVP smoke coverage", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/auth/post-login-status", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(unauthenticatedSession),
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

  test("F001/F003 login menyediakan Google OAuth entry point dan validasi login manual", async ({
    page,
  }) => {
    let googleAuthRequested = false;
    await page.route("**/api/auth/sign-in/social", async (route) => {
      googleAuthRequested = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          url: "https://accounts.google.com/o/oauth2/v2/auth",
        }),
      });
    });

    await page.goto("/login");

    await expect(
      page.getByRole("heading", { name: /selamat datang kembali/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /masuk dengan google/i }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Masuk", exact: true }).click();
    await expect(page.getByText(/format email tidak valid/i)).toBeVisible();
    await expect(page.getByText(/password tidak boleh kosong/i)).toBeVisible();

    await page.getByRole("button", { name: /masuk dengan google/i }).click();
    await expect.poll(() => googleAuthRequested).toBe(true);
  });

  test("F001/F002 registrasi menyediakan Google OAuth entry point dan validasi form manual", async ({
    page,
  }) => {
    let googleAuthRequested = false;
    await page.route("**/api/auth/sign-in/social", async (route) => {
      googleAuthRequested = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          url: "https://accounts.google.com/o/oauth2/v2/auth",
        }),
      });
    });

    await page.goto("/register");

    await expect(
      page.getByRole("heading", { name: /buat akun/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /daftar dengan google/i }),
    ).toBeVisible();

    await page.getByLabel(/email/i).fill("email-salah");
    await page.getByLabel(/^password$/i).fill("pendek");
    await page.getByLabel(/konfirmasi password/i).fill("beda");
    await page.getByRole("button", { name: /daftar & verifikasi/i }).click();

    await expect(page.getByText(/format email tidak valid/i)).toBeVisible();
    await expect(page.getByText(/password tidak cocok/i)).toBeVisible();

    await page.getByRole("button", { name: /daftar dengan google/i }).click();
    await expect.poll(() => googleAuthRequested).toBe(true);
  });

  test("F005 reset password memvalidasi email sebelum meminta link reset", async ({
    page,
  }) => {
    await page.goto("/forgot-password");

    await expect(
      page.getByRole("heading", { name: /lupa password/i }),
    ).toBeVisible();
    await page.getByRole("button", { name: /kirim link reset/i }).click();

    await expect(page.getByText(/format email tidak valid/i)).toBeVisible();
  });

  const protectedMvpRoutes = [
    { code: "F004", route: "/profile", name: "Kelola Profil" },
    { code: "F006", route: "/baseline", name: "Baseline Questions" },
    { code: "F007", route: "/mood", name: "Mood Check-In" },
    {
      code: "F008",
      route: "/profile/parent-report",
      name: "Manage Parent Email",
    },
    { code: "F009", route: "/home", name: "User Dashboard" },
    { code: "F010", route: "/diary/today", name: "Safe Diary" },
    { code: "F011", route: "/diary/today", name: "Brave Choice" },
  ];

  for (const mvpRoute of protectedMvpRoutes) {
    test(`${mvpRoute.code} ${mvpRoute.name} dilindungi route guard saat belum login`, async ({
      page,
    }) => {
      await page.goto(mvpRoute.route);

      await expect(page).toHaveURL(/\/login/);
      await expect(
        page.getByRole("heading", { name: /selamat datang kembali/i }),
      ).toBeVisible({ timeout: 15_000 });
    });
  }
});
