import { expect, test, type Page, type Route } from "@playwright/test";

// Semua endpoint auth di-mock: tidak ada akun, email, atau OAuth sungguhan yang dipakai.

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function mockGuest(page: Page) {
  await page.route("**/api/auth/post-login-status", (route) =>
    json(route, { isAuthenticated: false, nextRoute: "/login" }),
  );
  await page.route("**/api/auth/get-session", (route) => json(route, null));
}

async function mockIncompleteProfileSession(page: Page) {
  await page.route("**/api/auth/get-session", (route) =>
    json(route, {
      user: {
        id: "preview-user",
        name: "Teman Uji",
        email: "preview@example.com",
        profileFilled: false,
      },
      session: {
        id: "preview-session",
        userId: "preview-user",
        expiresAt: "2099-01-01T00:00:00.000Z",
      },
    }),
  );
}

test.describe("Redesign login", () => {
  test.beforeEach(async ({ page }) => mockGuest(page));

  test("login email mengirim payload existing dan Enter men-submit form", async ({
    page,
  }) => {
    let payload: Record<string, unknown> | null = null;
    await page.route("**/api/auth/sign-in/email", (route) => {
      payload = route.request().postDataJSON();
      return json(route, {
        redirect: false,
        token: "mock-token",
        user: { id: "preview-user", email: "teman@example.com" },
      });
    });

    await page.goto("/login");
    await page
      .getByRole("textbox", { name: "Email", exact: true })
      .fill("Teman@Example.com");
    await page.getByLabel("Password", { exact: true }).fill("rahasia123");
    await page.getByLabel("Password", { exact: true }).press("Enter");

    await expect(page.getByText("Login berhasil.")).toBeVisible();
    expect(payload).toMatchObject({
      email: "teman@example.com",
      password: "rahasia123",
      callbackURL: "/login",
    });
  });

  test("login gagal menampilkan pesan dari server", async ({ page }) => {
    await page.route("**/api/auth/sign-in/email", (route) =>
      json(
        route,
        {
          code: "INVALID_EMAIL_OR_PASSWORD",
          message: "Invalid email or password",
        },
        401,
      ),
    );

    await page.goto("/login");
    await page
      .getByRole("textbox", { name: "Email", exact: true })
      .fill("teman@example.com");
    await page.getByLabel("Password", { exact: true }).fill("salah123");
    await page.getByRole("button", { name: "Masuk", exact: true }).click();

    await expect(
      page.getByText("Email atau password tidak valid."),
    ).toBeVisible();
  });

  test("tombol Google memakai callback existing", async ({ page }) => {
    let payload: Record<string, unknown> | null = null;
    await page.route("**/api/auth/sign-in/social", (route) => {
      payload = route.request().postDataJSON();
      return json(route, { url: "/__google-mock", redirect: true });
    });
    await page.route("**/__google-mock", (route) =>
      route.fulfill({ contentType: "text/html", body: "<p>google mock</p>" }),
    );

    await page.goto("/login");
    await page.getByRole("button", { name: "Masuk dengan Google" }).click();
    await expect(page).toHaveURL(/__google-mock/);
    expect(payload).toMatchObject({
      provider: "google",
      callbackURL: "/login",
    });
  });

  test("link pendukung mengarah ke route existing", async ({ page }) => {
    await page.goto("/login");
    await expect(
      page.getByRole("link", { name: "Lupa password?" }),
    ).toHaveAttribute("href", "/forgot-password");
    await expect(
      page.getByRole("link", { name: "Daftar Gratis" }).last(),
    ).toHaveAttribute("href", "/register");
  });
});

test.describe("Redesign register", () => {
  test("daftar email → menunggu verifikasi → kirim ulang → ganti email", async ({
    page,
  }) => {
    await mockGuest(page);
    let signUpPayload: Record<string, unknown> | null = null;
    let resendPayload: Record<string, unknown> | null = null;

    await page.route("**/api/auth/check-email", (route) =>
      json(route, { exists: false }),
    );
    await page.route("**/api/auth/sign-up/email", (route) => {
      signUpPayload = route.request().postDataJSON();
      return json(route, { token: null, user: { id: "new-user" } });
    });
    await page.route("**/api/auth/send-verification-email", (route) => {
      resendPayload = route.request().postDataJSON();
      return json(route, { status: true });
    });

    await page.goto("/register");
    await expect(
      page.getByRole("list", { name: /langkah 1 dari 3/i }),
    ).toBeVisible();
    await page.getByLabel("Email", { exact: true }).fill("Baru@Example.com");
    await page.getByLabel("Password", { exact: true }).fill("rahasia123");
    await page.getByLabel("Konfirmasi Password").fill("rahasia123");
    await page
      .getByRole("button", { name: "Daftar & Verifikasi", exact: true })
      .click();

    await expect(
      page.getByRole("heading", { name: "Cek email kamu." }),
    ).toBeVisible();
    await expect(page.getByText("baru@example.com")).toBeVisible();
    expect(signUpPayload).toMatchObject({
      email: "baru@example.com",
      password: "rahasia123",
      name: "baru",
      callbackURL: "/register?completeProfile=1",
    });
    // Belum terverifikasi: stepper tetap di tahap Akun.
    await expect(
      page.getByRole("list", { name: /langkah 1 dari 3/i }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Kirim Ulang Verifikasi" }).click();
    await expect(page.getByText(/sudah dikirim ulang/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Kirim Ulang Verifikasi" }),
    ).toBeDisabled();
    expect(resendPayload).toEqual({
      email: "baru@example.com",
      callbackURL: "/register?completeProfile=1",
    });

    await page.getByRole("button", { name: "Ganti email" }).click();
    await expect(page.getByLabel("Email", { exact: true })).toHaveValue(
      "baru@example.com",
    );
  });

  test("email terdaftar menampilkan alert dengan link login", async ({
    page,
  }) => {
    await mockGuest(page);
    await page.route("**/api/auth/check-email", (route) =>
      json(route, { exists: true }),
    );

    await page.goto("/register");
    await page.getByLabel("Email", { exact: true }).fill("lama@example.com");
    await page.getByLabel("Password", { exact: true }).fill("rahasia123");
    await page.getByLabel("Konfirmasi Password").fill("rahasia123");
    await page.getByLabel("Konfirmasi Password").press("Enter");

    await expect(page.getByText("Email sudah terdaftar")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Masuk ke akun" }),
    ).toHaveAttribute("href", "/login");
  });

  test("Google register memakai callback pelengkapan profil", async ({
    page,
  }) => {
    await mockGuest(page);
    let payload: Record<string, unknown> | null = null;
    await page.route("**/api/auth/sign-in/social", (route) => {
      payload = route.request().postDataJSON();
      return json(route, { url: "/__google-mock", redirect: true });
    });
    await page.route("**/__google-mock", (route) =>
      route.fulfill({ contentType: "text/html", body: "<p>google mock</p>" }),
    );

    await page.goto("/register");
    await page.getByRole("button", { name: "Daftar dengan Google" }).click();
    await expect(page).toHaveURL(/__google-mock/);
    expect(payload).toMatchObject({
      provider: "google",
      callbackURL: "/register?completeProfile=1",
    });
  });

  test("completeProfile=1: data diri → laporan, kembali mempertahankan isian", async ({
    page,
  }) => {
    await mockIncompleteProfileSession(page);
    let updatePayload: Record<string, unknown> | null = null;
    await page.route("**/api/auth/update-user", (route) => {
      updatePayload = route.request().postDataJSON();
      return json(route, { status: true });
    });
    await page.route("**/home", (route) =>
      route.fulfill({ contentType: "text/html", body: "<p>home mock</p>" }),
    );

    await page.goto("/register?completeProfile=1");

    // Akun sudah dibuat/terverifikasi → tahap 2 aktif, tanpa jalan kembali ke Akun.
    await expect(
      page.getByRole("list", { name: /langkah 2 dari 3/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /kembali ke akun/i }),
    ).toHaveCount(0);
    await expect(
      page.getByText("Dengan mendaftar, kamu menyetujui"),
    ).toHaveCount(0);
    await expect(page.getByLabel("Nama Lengkap")).toHaveValue("Teman Uji");
    await expect(page.getByLabel(/password/i)).toHaveCount(0);

    await page.getByRole("combobox", { name: "Tahun Lahir" }).click();
    await page.getByRole("option", { name: "2008" }).click();
    await page.getByRole("combobox", { name: "Jenis Kelamin" }).click();
    await page.getByRole("option", { name: "Perempuan" }).click();
    await page.getByRole("button", { name: "Lanjut", exact: true }).click();

    await expect(
      page.getByRole("list", { name: /langkah 3 dari 3/i }),
    ).toBeVisible();
    const parentEmail = page.getByLabel(/email orang tua/i);
    await parentEmail.fill("bukan-email");
    await page.getByRole("button", { name: "Selesai" }).click();
    await expect(page.locator("#reg-parentEmail-error")).toBeVisible();

    await parentEmail.fill("wali@example.com");
    await page.getByRole("button", { name: "Kembali", exact: true }).click();
    await expect(
      page.getByRole("list", { name: /langkah 2 dari 3/i }),
    ).toBeVisible();
    await expect(page.getByLabel("Nama Lengkap")).toHaveValue("Teman Uji");
    await expect(
      page.getByRole("combobox", { name: "Tahun Lahir" }),
    ).toHaveText(/2008/);

    await page.getByRole("button", { name: "Lanjut", exact: true }).click();
    await expect(page.getByLabel(/email orang tua/i)).toHaveValue(
      "wali@example.com",
    );
    // Field opsional: dikosongkan tetap boleh selesai.
    await page.getByLabel(/email orang tua/i).fill("");
    await page.getByRole("button", { name: "Selesai" }).click();

    await expect.poll(() => updatePayload).not.toBeNull();
    expect(updatePayload).toMatchObject({
      name: "Teman Uji",
      birthYear: 2008,
      gender: "female",
      parentEmail: null,
      profileFilled: true,
    });
  });

  test("completeProfile=1 tanpa sesi dikembalikan ke login", async ({
    page,
  }) => {
    await mockGuest(page);
    await page.goto("/register?completeProfile=1");
    await expect(page).toHaveURL(/\/login/, { timeout: 20_000 });
  });
});
