// ============================================================
// src/lib/validations.ts
// Zod v4 compatible — pakai "error" bukan "required_error"
// ============================================================

import { z } from "zod";

function countWords(value: string) {
  return value.trim().match(/\S+/g)?.length ?? 0;
}

// ─── Register Schema ─────────────────────────────────────────
export const registerSchema = z
  .object({
    name: z
      .string({ error: "Nama wajib diisi" })
      .min(2, "Nama minimal 2 karakter")
      .max(50, "Nama maksimal 50 karakter")
      .trim(),

    email: z
      .string({ error: "Email wajib diisi" })
      .email("Format email tidak valid")
      .toLowerCase()
      .trim(),

    password: z
      .string({ error: "Password wajib diisi" })
      .min(8, "Password minimal 8 karakter")
      .regex(/[A-Z]/, "Harus ada minimal 1 huruf kapital")
      .regex(/[0-9]/, "Harus ada minimal 1 angka"),

    confirmPassword: z.string({ error: "Konfirmasi password wajib diisi" }),

    // Opsional — untuk laporan ke orang tua
    parentEmail: z
      .string()
      .email("Format email orang tua tidak valid")
      .toLowerCase()
      .trim()
      .optional()
      .or(z.literal("")),

    agreeToTerms: z.literal(true, {
      error: "Kamu harus menyetujui syarat dan ketentuan",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

// ─── Register Step Schemas (UI + API aligned) ───────────────
export const registerStep1Schema = z
  .object({
    email: z
      .string({ error: "Email wajib diisi" })
      .email("Format email tidak valid")
      .toLowerCase()
      .trim(),
    password: z
      .string({ error: "Password wajib diisi" })
      .min(8, "Password minimal 8 karakter"),
    confirm: z.string({ error: "Konfirmasi password wajib diisi" }),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Password tidak cocok",
    path: ["confirm"],
  });

export type RegisterStep1Input = z.infer<typeof registerStep1Schema>;

const uiCurrentYear = new Date().getFullYear();

export const registerStep2Schema = z.object({
  name: z
    .string({ error: "Nama wajib diisi" })
    .min(2, "Nama minimal 2 karakter")
    .max(50, "Nama maksimal 50 karakter")
    .trim(),
  birthYear: z
    .string({ error: "Tahun wajib diisi" })
    .regex(/^\d{4}$/, "Tahun tidak valid")
    .refine((y) => {
      const yr = parseInt(y, 10);
      return yr >= 1950 && yr <= uiCurrentYear;
    }, "Tahun lahir tidak valid"),
  gender: z.enum(["male", "female", "prefer_not"], {
    error: "Pilih salah satu",
  }),
});

export type RegisterStep2Input = z.infer<typeof registerStep2Schema>;

export const registerStep3Schema = z.object({
  parentEmail: z
    .string()
    .trim()
    .toLowerCase()
    .email("Format email tidak valid")
    .optional()
    .or(z.literal("")),
});

export type RegisterStep3Input = z.infer<typeof registerStep3Schema>;

// ─── Login Schema ─────────────────────────────────────────────
export const loginSchema = z.object({
  email: z
    .string({ error: "Email wajib diisi" })
    .email("Format email tidak valid")
    .toLowerCase()
    .trim(),

  password: z
    .string({ error: "Password wajib diisi" })
    .min(1, "Password tidak boleh kosong"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ─── Forgot / Reset / Change Password Schemas ───────────────
export const forgotPasswordSchema = z.object({
  email: z
    .string({ error: "Email wajib diisi" })
    .email("Format email tidak valid")
    .toLowerCase()
    .trim(),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string({ error: "Password baru wajib diisi" })
      .min(8, "Password minimal 8 karakter"),
    confirmNewPassword: z.string({
      error: "Konfirmasi password baru wajib diisi",
    }),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmNewPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({ error: "Password saat ini wajib diisi" })
      .min(1, "Password saat ini wajib diisi"),
    newPassword: z
      .string({ error: "Password baru wajib diisi" })
      .min(8, "Password baru minimal 8 karakter"),
    confirmNewPassword: z.string({
      error: "Konfirmasi password baru wajib diisi",
    }),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmNewPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "Password baru harus berbeda dari password lama",
    path: ["newPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// ─── Mood Check-In Schema ─────────────────────────────────────
export const moodCheckInSchema = z.object({
  moodLevel: z
    .number()
    .min(1, "Mood level minimal 1")
    .max(5, "Mood level maksimal 5")
    .int("Mood level harus bilangan bulat"),

  note: z
    .string()
    .refine((value) => countWords(value) <= 100, {
      message: "Catatan maksimal 100 kata",
    })
    .optional()
    .or(z.literal("")),
});

export type MoodCheckInInput = z.infer<typeof moodCheckInSchema>;

// ─── Diary Message Schema ─────────────────────────────────────
export const diaryMessageSchema = z.object({
  messageText: z
    .string({ error: "Pesan tidak boleh kosong" })
    .min(1, "Pesan tidak boleh kosong")
    .max(5000, "Pesan terlalu panjang (maksimal 5000 karakter)")
    .trim(),
});

export type DiaryMessageInput = z.infer<typeof diaryMessageSchema>;

// ─── Profile Update Schema ────────────────────────────────────
export const profileUpdateSchema = z.object({
  name: z
    .string()
    .min(2, "Nama minimal 2 karakter")
    .max(50, "Nama maksimal 50 karakter")
    .trim()
    .optional(),

  image: z.string().url("Format URL tidak valid").optional().or(z.literal("")),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export const profileEditFormSchema = z.object({
  name: z
    .string({ error: "Nama wajib diisi" })
    .min(2, "Nama minimal 2 karakter")
    .max(50, "Nama maksimal 50 karakter")
    .trim(),
  birthYear: z
    .string({ error: "Tahun lahir wajib diisi" })
    .regex(/^\d{4}$/, "Tahun lahir tidak valid")
    .refine((y) => {
      const yr = parseInt(y, 10);
      return yr >= 1950 && yr <= uiCurrentYear;
    }, "Tahun lahir tidak valid"),
  gender: z.enum(["male", "female", "prefer_not"], {
    error: "Pilih jenis kelamin",
  }),
  parentEmail: z
    .string()
    .trim()
    .toLowerCase()
    .email("Format email tidak valid")
    .optional()
    .or(z.literal("")),
});

export type ProfileEditFormInput = z.infer<typeof profileEditFormSchema>;

// ─── Parent Report Settings Schema ────────────────────────────
export const parentReportSchema = z.object({
  parentEmail: z
    .string()
    .email("Format email tidak valid")
    .toLowerCase()
    .trim()
    .optional()
    .or(z.literal("")),

  parentReportEnabled: z.boolean().optional(),
});

export type ParentReportInput = z.infer<typeof parentReportSchema>;

export const parentConsentTokenQuerySchema = z.object({
  token: z
    .string({ error: "Token wajib diisi" })
    .min(20, "Token tidak valid")
    .trim(),
});

export type ParentConsentTokenQueryInput = z.infer<
  typeof parentConsentTokenQuerySchema
>;

export const parentConsentDecisionSchema = z.object({
  token: z
    .string({ error: "Token wajib diisi" })
    .min(20, "Token tidak valid")
    .trim(),
  decision: z.enum(["accept", "reject"], {
    error: "Keputusan tidak valid",
  }),
});

export type ParentConsentDecisionInput = z.infer<
  typeof parentConsentDecisionSchema
>;
