"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin/require-admin";
import prisma from "@/lib/prisma";

// ── Result type ──────────────────────────────────────────────────
export type ActionResult =
  | { success: true; message?: string }
  | { success: false; error: string };

function fail(error: string): ActionResult {
  return { success: false, error };
}
function ok(message?: string): ActionResult {
  return { success: true, message };
}

// ── Schemas ──────────────────────────────────────────────────────
const createSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi").max(120),
  email: z.string().trim().toLowerCase().email("Email tidak valid"),
  isPremium: z.boolean().optional().default(false),
  status: z.enum(["Aktif", "Nonaktif"]).optional().default("Aktif"),
});

const updateSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(120),
  isPremium: z.boolean(),
  status: z.enum(["Aktif", "Nonaktif"]),
});

// ── Actions ──────────────────────────────────────────────────────

/**
 * Buat user baru. emailVerified=true supaya saat user login pakai Google
 * dengan email ini, akan otomatis tersambung lewat accountLinking.
 */
export async function createUserAction(
  input: z.infer<typeof createSchema>,
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const parsed = createSchema.safeParse(input);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Payload tidak valid");
    }

    const { name, email, isPremium, status } = parsed.data;

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) return fail("Email sudah terdaftar");

    const newUserId = randomUUID();

    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          id: newUserId,
          name,
          email,
          emailVerified: true,
          isPremium,
          status,
          role: "user",
          profileFilled: false,
          currentStreak: 0,
        },
      });

      if (isPremium) {
        const now = new Date();
        const expiresAt = new Date(now);
        expiresAt.setFullYear(now.getFullYear() + 100);

        const payment = await tx.payment.create({
          data: {
            userId: newUserId,
            orderId: `admin-grant-${randomUUID()}`,
            grossAmount: 0,
            status: "settlement",
            durationMonths: 1200,
          },
        });

        await tx.subscription.create({
          data: {
            userId: newUserId,
            paymentId: payment.id,
            startedAt: now,
            expiresAt,
            isActive: true,
          },
        });
      }
    });

    revalidatePath("/admin/users");
    revalidatePath("/admin");
    return ok(`User ${email} berhasil dibuat`);
  } catch (e) {
    console.error("createUserAction:", e);
    return fail(e instanceof Error ? e.message : "Gagal menambahkan user");
  }
}

/**
 * Edit nama, premium, status. Email tidak bisa diubah.
 */
export async function updateUserAction(
  input: z.infer<typeof updateSchema>,
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const parsed = updateSchema.safeParse(input);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Payload tidak valid");
    }

    const { id, name, isPremium, status } = parsed.data;

    const current = await prisma.user.findUnique({
      where: { id },
      select: { isPremium: true },
    });
    if (!current) return fail("User tidak ditemukan");

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: { name, isPremium, status },
      });

      if (isPremium && !current.isPremium) {
        // Admin granted premium
        const now = new Date();
        const expiresAt = new Date(now);
        expiresAt.setFullYear(now.getFullYear() + 100);

        const payment = await tx.payment.create({
          data: {
            userId: id,
            orderId: `admin-grant-${randomUUID()}`,
            grossAmount: 0,
            status: "settlement",
            durationMonths: 1200,
          },
        });

        await tx.subscription.create({
          data: {
            userId: id,
            paymentId: payment.id,
            startedAt: now,
            expiresAt,
            isActive: true,
          },
        });
      } else if (!isPremium && current.isPremium) {
        // Admin revoked premium
        await tx.subscription.updateMany({
          where: { userId: id, isActive: true },
          data: { isActive: false },
        });
      }

      if (status === "Nonaktif") {
        await tx.session.deleteMany({
          where: { userId: id },
        });
      }
    });

    revalidatePath("/admin/users");
    return ok("Perubahan disimpan");
  } catch (e) {
    console.error("updateUserAction:", e);
    return fail(e instanceof Error ? e.message : "Gagal menyimpan perubahan");
  }
}

/**
 * Hapus user. Cascade akan menghapus session, account, payments, dll.
 */
export async function deleteUserAction(id: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    if (admin.id === id) return fail("Tidak bisa menghapus akun sendiri");

    await prisma.user.delete({ where: { id } });

    revalidatePath("/admin/users");
    revalidatePath("/admin");
    return ok("User dihapus");
  } catch (e) {
    console.error("deleteUserAction:", e);
    return fail(e instanceof Error ? e.message : "Gagal menghapus user");
  }
}

/**
 * Toggle Aktif ↔ Nonaktif.
 */
export async function toggleStatusAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();

    const current = await prisma.user.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!current) return fail("User tidak ditemukan");

    const next = current.status === "Aktif" ? "Nonaktif" : "Aktif";

    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id }, data: { status: next } });

      if (next === "Nonaktif") {
        await tx.session.deleteMany({
          where: { userId: id },
        });
      }
    });

    revalidatePath("/admin/users");
    return ok(`Status diubah ke ${next}`);
  } catch (e) {
    console.error("toggleStatusAction:", e);
    return fail(e instanceof Error ? e.message : "Gagal mengubah status");
  }
}

/**
 * Toggle Premium ↔ Basic.
 */
export async function togglePremiumAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();

    const current = await prisma.user.findUnique({
      where: { id },
      select: { isPremium: true },
    });
    if (!current) return fail("User tidak ditemukan");

    const next = !current.isPremium;

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: { isPremium: next },
      });

      if (next) {
        // Admin granted premium
        const now = new Date();
        const expiresAt = new Date(now);
        expiresAt.setFullYear(now.getFullYear() + 100);

        const payment = await tx.payment.create({
          data: {
            userId: id,
            orderId: `admin-grant-${randomUUID()}`,
            grossAmount: 0,
            status: "settlement",
            durationMonths: 1200,
          },
        });

        await tx.subscription.create({
          data: {
            userId: id,
            paymentId: payment.id,
            startedAt: now,
            expiresAt,
            isActive: true,
          },
        });
      } else {
        // Admin revoked premium
        await tx.subscription.updateMany({
          where: { userId: id, isActive: true },
          data: { isActive: false },
        });
      }
    });

    revalidatePath("/admin/users");
    revalidatePath("/admin");
    return ok(next ? "Dijadikan Premium (Admin Grant)" : "Diturunkan ke Basic");
  } catch (e) {
    console.error("togglePremiumAction:", e);
    return fail(e instanceof Error ? e.message : "Gagal mengubah premium");
  }
}
