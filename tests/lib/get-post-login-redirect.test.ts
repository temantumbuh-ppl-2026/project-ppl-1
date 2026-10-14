import { describe, it, expect, vi, beforeEach } from "vitest";
import { getPostLoginRedirect } from "@/lib/get-post-login-redirect";
import prisma from "@/lib/prisma";

// Harus di-mock duluan sebelum import apapun yang dependensinya server-only
vi.mock("server-only", () => ({}));

vi.mock("@/lib/prisma", () => ({
  default: {
    user: { findUnique: vi.fn() },
    moodLog: { findFirst: vi.fn() },
  },
}));

// Mock baseline/service agar tidak ikut load server-only
vi.mock("@/lib/baseline/service", () => ({
  getBaselineByUserId: vi.fn(),
}));

// Import setelah semua mock terdaftar
import { getBaselineByUserId } from "@/lib/baseline/service";

const mockUserFindUnique = vi.mocked(prisma.user.findUnique);
const mockMoodFindFirst = vi.mocked(prisma.moodLog.findFirst);
const mockGetBaselineByUserId = vi.mocked(getBaselineByUserId);

describe("lib/get-post-login-redirect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Harus return /login jika user tidak ditemukan", async () => {
    mockUserFindUnique.mockResolvedValue(null);

    const result = await getPostLoginRedirect("user-nonexistent");

    expect(result).toBe("/login");
  });

  it("Harus return /admin jika user adalah admin", async () => {
    mockUserFindUnique.mockResolvedValue({
      role: "admin",
      profileFilled: true,
    } as never);

    const result = await getPostLoginRedirect("admin1");

    expect(result).toBe("/admin");
  });

  it("Harus return /register?completeProfile=1 jika profileFilled = false", async () => {
    mockUserFindUnique.mockResolvedValue({
      role: "user",
      profileFilled: false,
    } as never);

    const result = await getPostLoginRedirect("user1");

    expect(result).toBe("/register?completeProfile=1");
  });

  // FE-03: baseline tidak lagi menghalangi akses.
  it("Harus return /home walaupun baseline belum diisi, asalkan mood hari ini sudah", async () => {
    mockUserFindUnique.mockResolvedValue({
      role: "user",
      profileFilled: true,
    } as never);
    mockGetBaselineByUserId.mockResolvedValue(null);
    mockMoodFindFirst.mockResolvedValue({ id: "mood-1" } as never);

    const result = await getPostLoginRedirect("user1");

    expect(result).toBe("/home");
  });

  it("Tidak boleh lagi membaca baseline saat menentukan rute", async () => {
    mockUserFindUnique.mockResolvedValue({
      role: "user",
      profileFilled: true,
    } as never);
    mockMoodFindFirst.mockResolvedValue({ id: "mood-1" } as never);

    await getPostLoginRedirect("user1");

    expect(mockGetBaselineByUserId).not.toHaveBeenCalled();
  });

  // Alur mood sengaja tidak diubah oleh FE-03.
  it("Harus tetap return /mood jika mood hari ini belum diisi", async () => {
    mockUserFindUnique.mockResolvedValue({
      role: "user",
      profileFilled: true,
    } as never);
    mockMoodFindFirst.mockResolvedValue(null);

    const result = await getPostLoginRedirect("user1");

    expect(result).toBe("/mood");
  });

  it("Harus return /mood walaupun baseline belum diisi, jika mood hari ini juga belum", async () => {
    mockUserFindUnique.mockResolvedValue({
      role: "user",
      profileFilled: true,
    } as never);
    mockGetBaselineByUserId.mockResolvedValue(null);
    mockMoodFindFirst.mockResolvedValue(null);

    const result = await getPostLoginRedirect("user1");

    expect(result).toBe("/mood");
  });

  it("Harus return /home jika profil dan mood hari ini sudah terisi", async () => {
    mockUserFindUnique.mockResolvedValue({
      role: "user",
      profileFilled: true,
    } as never);
    mockMoodFindFirst.mockResolvedValue({ id: "mood-1" } as never);

    const result = await getPostLoginRedirect("user1");

    expect(result).toBe("/home");
  });
});
