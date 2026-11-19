import { expect, test } from "@playwright/test";

test.describe("Auth dan route guard utama", () => {
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

  test("Halaman login memvalidasi input manual sebelum memanggil auth backend", async ({
    page,
  }) => {
    await page.goto("/login");

    await expect(page).toHaveURL(/\/login/);
    await expect(
      page.getByRole("heading", { name: /selamat datang kembali/i }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Masuk", exact: true }).click();

    await expect(page.getByText(/format email tidak valid/i)).toBeVisible();
    await expect(page.getByText(/password tidak boleh kosong/i)).toBeVisible();
  });

  test("Halaman register memvalidasi email dan password manual", async ({
    page,
  }) => {
    await page.goto("/register");

    await expect(page).toHaveURL(/\/register/);
    await page.getByLabel(/email/i).fill("email-salah");
    await page.getByLabel(/^password$/i).fill("pendek");
    await page.getByLabel(/ulangi password|konfirmasi/i).fill("beda");
    await page
      .getByRole("button", { name: "Daftar & Verifikasi", exact: true })
      .click();

    await expect(page.getByText(/format email tidak valid/i)).toBeVisible();
    await expect(page.getByText(/password tidak cocok/i)).toBeVisible();
  });

  test("User tanpa session diarahkan dari halaman protected ke login", async ({
    page,
  }) => {
    await page.goto("/home");

    await expect(page).toHaveURL(/\/login/);
  });

  test("User tanpa session tidak bisa membuka admin dashboard", async ({
    page,
  }) => {
    await page.goto("/admin");

    await expect(page).toHaveURL(/\/login/);
  });
});
