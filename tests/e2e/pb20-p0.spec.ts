import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/auth/post-login-status", (route) =>
    route.fulfill({ json: { isAuthenticated: false, nextRoute: "/login" } }),
  );
  await page.route("**/api/auth/get-session", (route) =>
    route.fulfill({ json: null }),
  );
});

test("FE-01/02 login uses the PB20 palette, full targets and visible keyboard focus", async ({
  page,
}, testInfo) => {
  const hydrationErrors: string[] = [];
  page.on("console", (message) => {
    if (/hydration|hydrated|didn't match/i.test(message.text()))
      hydrationErrors.push(message.text());
  });
  await page.goto("/login");
  const email = page.getByRole("textbox", { name: "Email", exact: true });
  const submit = page.getByRole("button", { name: "Masuk", exact: true });
  await expect(email).toBeVisible();
  // Redesign auth: teal-dark (#087f76) dengan latar "paper" landing page.
  await expect(submit).toHaveCSS("background-color", "rgb(8, 127, 118)");
  await expect(submit).toHaveCSS("border-radius", "11px");
  await expect(page.locator(".tt-auth-redesign")).toHaveCSS(
    "background-color",
    "rgb(251, 250, 246)",
  );
  for (const control of [
    email,
    page.getByLabel("Password", { exact: true }),
    submit,
    page.getByRole("button", { name: "Tampilkan password" }),
  ]) {
    await expect
      .poll(async () => Math.round((await control.boundingBox())!.height))
      .toBeGreaterThanOrEqual(44);
  }
  await email.focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(email).toBeFocused();
  await expect(email).toHaveCSS("border-color", "rgb(8, 127, 118)");
  await expect(email).toHaveCSS(
    "box-shadow",
    "rgb(223, 247, 238) 0px 0px 0px 4px",
  );
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  const toggle = page.getByRole("button", { name: "Tampilkan password" });
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveCSS(
    "box-shadow",
    "rgb(184, 228, 225) 0px 0px 0px 3px",
  );
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute(
    "type",
    "text",
  );
  await submit.click();
  await expect(page.getByText(/format email tidak valid/i)).toBeVisible();
  const error = page.locator("#login-email-error");
  await expect(error).toHaveCSS("color", "rgb(138, 74, 31)");
  await expect(error.locator("svg")).toBeVisible();
  await expect(email).toHaveAttribute("aria-describedby", "login-email-error");
  await expect(email).toHaveAttribute("aria-invalid", "true");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  expect(hydrationErrors).toEqual([]);
  await page.screenshot({
    path: testInfo.outputPath("login-after.png"),
    fullPage: true,
  });
});

test("FE-02 register errors remain linked and use attention rather than red", async ({
  page,
}, testInfo) => {
  await page.goto("/register");
  await page.getByLabel("Email", { exact: true }).fill("email-salah");
  await page.getByLabel("Password", { exact: true }).fill("pendek");
  await page.getByLabel(/ulangi password|konfirmasi/i).fill("beda");
  await page
    .getByRole("button", { name: "Daftar & Verifikasi", exact: true })
    .click();
  await expect(page.getByText(/format email tidak valid/i)).toBeVisible();
  await expect(page.getByText(/password tidak cocok/i)).toBeVisible();
  await expect(page.locator("#reg-email-error")).toHaveCSS(
    "color",
    "rgb(138, 74, 31)",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  await page.screenshot({
    path: testInfo.outputPath("register-after.png"),
    fullPage: true,
  });
});

test("FE-02 profile dropdowns retain the shared keyboard ring and linked errors", async ({
  page,
}, testInfo) => {
  await page.route("**/api/auth/get-session", (route) =>
    route.fulfill({
      json: {
        user: {
          id: "preview-user",
          name: "Teman",
          email: "preview@example.com",
          profileFilled: false,
        },
        session: {
          id: "preview-session",
          userId: "preview-user",
          expiresAt: "2099-01-01T00:00:00.000Z",
        },
      },
    }),
  );
  await page.goto("/register?completeProfile=1");
  const year = page.getByRole("combobox", { name: "Tahun Lahir" });
  const gender = page.getByRole("combobox", { name: "Jenis Kelamin" });
  for (const control of [year, gender]) {
    await expect(control).toBeVisible();
    await control.focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Shift+Tab");
    await expect(control).toBeFocused();
    await expect
      .poll(async () => Math.round((await control.boundingBox())!.height))
      .toBeGreaterThanOrEqual(44);
    await expect(control).toHaveCSS("border-color", "rgb(8, 127, 118)");
    await expect(control).toHaveCSS(
      "box-shadow",
      "rgb(223, 247, 238) 0px 0px 0px 4px",
    );
  }
  await page.screenshot({
    path: testInfo.outputPath("register-profile-focus.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Lanjut", exact: true }).click();
  await expect(year).toHaveAttribute("aria-describedby", "reg-birthYear-error");
  await expect(gender).toHaveAttribute("aria-describedby", "reg-gender-error");
  for (const id of ["reg-birthYear-error", "reg-gender-error"]) {
    await expect(page.locator(`#${id} svg`)).toBeVisible();
  }
});
