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

  it("Harus return /baseline jika belum mengisi baseline", async () => {
    mockUserFindUnique.mockResolvedValue({
      role: "user",
      profileFilled: true,
    } as never);
    mockGetBaselineByUserId.mockResolvedValue(null);

    const result = await getPostLoginRedirect("user1");

    expect(result).toBe("/baseline");
  });

  it("Harus return /mood jika baseline ada tapi belum isi mood hari ini", async () => {
    mockUserFindUnique.mockResolvedValue({
      role: "user",
      profileFilled: true,
    } as never);
    mockGetBaselineByUserId.mockResolvedValue({ id: "base-1" } as never);
    mockMoodFindFirst.mockResolvedValue(null);

    const result = await getPostLoginRedirect("user1");

    expect(result).toBe("/mood");
  });

  it("Harus return /home jika semua sudah diisi", async () => {
    mockUserFindUnique.mockResolvedValue({
      role: "user",
      profileFilled: true,
    } as never);
    mockGetBaselineByUserId.mockResolvedValue({ id: "base-1" } as never);
    mockMoodFindFirst.mockResolvedValue({ id: "mood-1" } as never);

    const result = await getPostLoginRedirect("user1");

    expect(result).toBe("/home");
  });
});
