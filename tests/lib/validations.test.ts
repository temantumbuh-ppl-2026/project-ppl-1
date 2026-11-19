import { describe, it, expect } from "vitest";
import {
  registerSchema,
  registerStep1Schema,
  registerStep2Schema,
  registerStep3Schema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  moodCheckInSchema,
  diaryMessageSchema,
  profileUpdateSchema,
  parentConsentTokenQuerySchema,
  parentConsentDecisionSchema,
} from "@/lib/validations";

describe("lib/validations", () => {
  // ─────────────────────────────────────
  // registerSchema
  // ─────────────────────────────────────
  describe("registerSchema", () => {
    const validData = {
      name: "Budi Santoso",
      email: "budi@example.com",
      password: "Password1",
      confirmPassword: "Password1",
      agreeToTerms: true as const,
    };

    it("Harus valid dengan data yang benar", () => {
      expect(registerSchema.safeParse(validData).success).toBe(true);
    });

    it("Harus gagal jika nama kurang dari 2 karakter", () => {
      const result = registerSchema.safeParse({ ...validData, name: "A" });
      expect(result.success).toBe(false);
    });

    it("Harus gagal jika email tidak valid", () => {
      const result = registerSchema.safeParse({
        ...validData,
        email: "bukan-email",
      });
      expect(result.success).toBe(false);
    });

    it("Harus gagal jika password kurang dari 8 karakter", () => {
      const result = registerSchema.safeParse({
        ...validData,
        password: "Pass1",
        confirmPassword: "Pass1",
      });
      expect(result.success).toBe(false);
    });

    it("Harus gagal jika password tanpa huruf kapital", () => {
      const result = registerSchema.safeParse({
        ...validData,
        password: "password1",
        confirmPassword: "password1",
      });
      expect(result.success).toBe(false);
    });

    it("Harus gagal jika password tanpa angka", () => {
      const result = registerSchema.safeParse({
        ...validData,
        password: "Password",
        confirmPassword: "Password",
      });
      expect(result.success).toBe(false);
    });

    it("Harus gagal jika confirmPassword tidak cocok", () => {
      const result = registerSchema.safeParse({
        ...validData,
        confirmPassword: "Berbeda1",
      });
      expect(result.success).toBe(false);
    });

    it("Harus gagal jika agreeToTerms bukan true", () => {
      const result = registerSchema.safeParse({
        ...validData,
        agreeToTerms: false,
      });
      expect(result.success).toBe(false);
    });

    it("Harus valid dengan parentEmail opsional", () => {
      const result = registerSchema.safeParse({
        ...validData,
        parentEmail: "ortu@example.com",
      });
      expect(result.success).toBe(true);
    });

    it("Harus valid jika parentEmail string kosong", () => {
      const result = registerSchema.safeParse({
        ...validData,
        parentEmail: "",
      });
      expect(result.success).toBe(true);
    });

    it("Harus lowercase email otomatis", () => {
      const result = registerSchema.safeParse({
        ...validData,
        email: "BUDI@EXAMPLE.COM",
      });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.email).toBe("budi@example.com");
    });
  });

  // ─────────────────────────────────────
  // registerStep1Schema
  // ─────────────────────────────────────
  describe("registerStep1Schema", () => {
    it("Harus valid dengan email, password, dan confirm yang benar", () => {
      const result = registerStep1Schema.safeParse({
        email: "test@example.com",
        password: "Password1",
        confirm: "Password1",
      });
      expect(result.success).toBe(true);
    });

    it("Harus gagal jika password dan confirm tidak cocok", () => {
      const result = registerStep1Schema.safeParse({
        email: "test@example.com",
        password: "Password1",
        confirm: "Berbeda1",
      });
      expect(result.success).toBe(false);
    });

    it("Harus gagal jika email tidak valid", () => {
      const result = registerStep1Schema.safeParse({
        email: "invalid",
        password: "Password1",
        confirm: "Password1",
      });
      expect(result.success).toBe(false);
    });
  });

  // ─────────────────────────────────────
  // registerStep2Schema
  // ─────────────────────────────────────
  describe("registerStep2Schema", () => {
    it("Harus valid dengan data yang benar", () => {
      const result = registerStep2Schema.safeParse({
        name: "Budi",
        birthYear: "2000",
        gender: "male",
      });
      expect(result.success).toBe(true);
    });

    it("Harus gagal jika gender tidak valid", () => {
      const result = registerStep2Schema.safeParse({
        name: "Budi",
        birthYear: "2000",
        gender: "nonbinary",
      });
      expect(result.success).toBe(false);
    });

    it("Harus gagal jika birthYear kurang dari 1950", () => {
      const result = registerStep2Schema.safeParse({
        name: "Budi",
        birthYear: "1900",
        gender: "female",
      });
      expect(result.success).toBe(false);
    });

    it("Harus gagal jika birthYear bukan 4 digit angka", () => {
      const result = registerStep2Schema.safeParse({
        name: "Budi",
        birthYear: "abcd",
        gender: "male",
      });
      expect(result.success).toBe(false);
    });

    it("Harus valid untuk semua pilihan gender", () => {
      for (const gender of ["male", "female", "prefer_not"]) {
        const result = registerStep2Schema.safeParse({
          name: "Test",
          birthYear: "2000",
          gender,
        });
        expect(result.success).toBe(true);
      }
    });
  });

  // ─────────────────────────────────────
  // registerStep3Schema
  // ─────────────────────────────────────
  describe("registerStep3Schema", () => {
    it("Harus valid jika parentEmail diisi dengan benar", () => {
      const result = registerStep3Schema.safeParse({
        parentEmail: "ortu@example.com",
      });
      expect(result.success).toBe(true);
    });

    it("Harus valid jika parentEmail kosong", () => {
      const result = registerStep3Schema.safeParse({ parentEmail: "" });
      expect(result.success).toBe(true);
    });

    it("Harus valid jika parentEmail tidak diisi sama sekali", () => {
      const result = registerStep3Schema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  // ─────────────────────────────────────
  // loginSchema
  // ─────────────────────────────────────
  describe("loginSchema", () => {
    it("Harus valid dengan email dan password yang benar", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
        password: "abc",
      });
      expect(result.success).toBe(true);
    });

    it("Harus gagal jika email tidak valid", () => {
      const result = loginSchema.safeParse({
        email: "bukan-email",
        password: "abc",
      });
      expect(result.success).toBe(false);
    });

    it("Harus gagal jika password kosong", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
        password: "",
      });
      expect(result.success).toBe(false);
    });
  });

  // ─────────────────────────────────────
  // forgotPasswordSchema
  // ─────────────────────────────────────
  describe("forgotPasswordSchema", () => {
    it("Harus valid dengan email yang benar", () => {
      const result = forgotPasswordSchema.safeParse({
        email: "user@example.com",
      });
      expect(result.success).toBe(true);
    });

    it("Harus gagal jika email tidak valid", () => {
      const result = forgotPasswordSchema.safeParse({ email: "bukan" });
      expect(result.success).toBe(false);
    });
  });

  // ─────────────────────────────────────
  // resetPasswordSchema
  // ─────────────────────────────────────
  describe("resetPasswordSchema", () => {
    it("Harus valid jika password baru dan konfirmasi cocok", () => {
      const result = resetPasswordSchema.safeParse({
        newPassword: "NewPass1",
        confirmNewPassword: "NewPass1",
      });
      expect(result.success).toBe(true);
    });

    it("Harus gagal jika konfirmasi tidak cocok", () => {
      const result = resetPasswordSchema.safeParse({
        newPassword: "NewPass1",
        confirmNewPassword: "Berbeda1",
      });
      expect(result.success).toBe(false);
    });

    it("Harus gagal jika password baru kurang dari 8 karakter", () => {
      const result = resetPasswordSchema.safeParse({
        newPassword: "ab",
        confirmNewPassword: "ab",
      });
      expect(result.success).toBe(false);
    });
  });

  // ─────────────────────────────────────
  // changePasswordSchema
  // ─────────────────────────────────────
  describe("changePasswordSchema", () => {
    it("Harus valid jika semua field benar dan password berbeda", () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: "OldPass1",
        newPassword: "NewPass1",
        confirmNewPassword: "NewPass1",
      });
      expect(result.success).toBe(true);
    });

    it("Harus gagal jika password baru sama dengan password lama", () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: "SamePass1",
        newPassword: "SamePass1",
        confirmNewPassword: "SamePass1",
      });
      expect(result.success).toBe(false);
    });

    it("Harus gagal jika konfirmasi tidak cocok", () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: "OldPass1",
        newPassword: "NewPass1",
        confirmNewPassword: "BedaPass1",
      });
      expect(result.success).toBe(false);
    });

    it("Harus gagal jika currentPassword kosong", () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: "",
        newPassword: "NewPass1",
        confirmNewPassword: "NewPass1",
      });
      expect(result.success).toBe(false);
    });
  });

  // ─────────────────────────────────────
  // moodCheckInSchema
  // ─────────────────────────────────────
  describe("moodCheckInSchema", () => {
    it("Harus valid dengan moodLevel 1-5", () => {
      for (const moodLevel of [1, 2, 3, 4, 5]) {
        const result = moodCheckInSchema.safeParse({ moodLevel });
        expect(result.success).toBe(true);
      }
    });

    it("Harus gagal jika moodLevel kurang dari 1", () => {
      expect(moodCheckInSchema.safeParse({ moodLevel: 0 }).success).toBe(false);
    });

    it("Harus gagal jika moodLevel lebih dari 5", () => {
      expect(moodCheckInSchema.safeParse({ moodLevel: 6 }).success).toBe(false);
    });

    it("Harus gagal jika moodLevel bukan bilangan bulat", () => {
      expect(moodCheckInSchema.safeParse({ moodLevel: 2.5 }).success).toBe(
        false,
      );
    });

    it("Harus valid dengan note opsional", () => {
      const result = moodCheckInSchema.safeParse({
        moodLevel: 3,
        note: "Lumayan baik",
      });
      expect(result.success).toBe(true);
    });

    it("Harus valid dengan note tepat 100 kata", () => {
      const note = Array.from(
        { length: 100 },
        (_, index) => `kata${index}`,
      ).join(" ");
      const result = moodCheckInSchema.safeParse({ moodLevel: 3, note });
      expect(result.success).toBe(true);
    });

    it("Harus gagal jika note lebih dari 100 kata", () => {
      const note = Array.from(
        { length: 101 },
        (_, index) => `kata${index}`,
      ).join(" ");
      const result = moodCheckInSchema.safeParse({ moodLevel: 3, note });
      expect(result.success).toBe(false);
    });
  });

  // ─────────────────────────────────────
  // diaryMessageSchema
  // ─────────────────────────────────────
  describe("diaryMessageSchema", () => {
    it("Harus valid dengan pesan yang benar", () => {
      const result = diaryMessageSchema.safeParse({
        messageText: "Halo, apa kabar?",
      });
      expect(result.success).toBe(true);
    });

    it("Harus gagal jika messageText kosong", () => {
      const result = diaryMessageSchema.safeParse({ messageText: "" });
      expect(result.success).toBe(false);
    });

    it("Harus gagal jika messageText lebih dari 5000 karakter", () => {
      const result = diaryMessageSchema.safeParse({
        messageText: "a".repeat(5001),
      });
      expect(result.success).toBe(false);
    });
  });

  // ─────────────────────────────────────
  // profileUpdateSchema
  // ─────────────────────────────────────
  describe("profileUpdateSchema", () => {
    it("Harus valid jika semua field diisi dengan benar", () => {
      const result = profileUpdateSchema.safeParse({
        name: "Budi",
        image: "https://example.com/photo.jpg",
      });
      expect(result.success).toBe(true);
    });

    it("Harus valid jika semua field kosong (semua opsional)", () => {
      const result = profileUpdateSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("Harus gagal jika image bukan URL valid", () => {
      const result = profileUpdateSchema.safeParse({ image: "bukan-url" });
      expect(result.success).toBe(false);
    });

    it("Harus gagal jika nama kurang dari 2 karakter", () => {
      const result = profileUpdateSchema.safeParse({ name: "A" });
      expect(result.success).toBe(false);
    });
  });

  // ─────────────────────────────────────
  // parentConsentTokenQuerySchema
  // ─────────────────────────────────────
  describe("parentConsentTokenQuerySchema", () => {
    it("Harus valid jika token >= 20 karakter", () => {
      const result = parentConsentTokenQuerySchema.safeParse({
        token: "a".repeat(20),
      });
      expect(result.success).toBe(true);
    });

    it("Harus gagal jika token kurang dari 20 karakter", () => {
      const result = parentConsentTokenQuerySchema.safeParse({
        token: "pendek",
      });
      expect(result.success).toBe(false);
    });

    it("Harus gagal jika token tidak ada", () => {
      const result = parentConsentTokenQuerySchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  // ─────────────────────────────────────
  // parentConsentDecisionSchema
  // ─────────────────────────────────────
  describe("parentConsentDecisionSchema", () => {
    it("Harus valid jika decision = accept", () => {
      const result = parentConsentDecisionSchema.safeParse({
        token: "a".repeat(20),
        decision: "accept",
      });
      expect(result.success).toBe(true);
    });

    it("Harus valid jika decision = reject", () => {
      const result = parentConsentDecisionSchema.safeParse({
        token: "a".repeat(20),
        decision: "reject",
      });
      expect(result.success).toBe(true);
    });

    it("Harus gagal jika decision bukan accept atau reject", () => {
      const result = parentConsentDecisionSchema.safeParse({
        token: "a".repeat(20),
        decision: "maybe",
      });
      expect(result.success).toBe(false);
    });
  });
});
