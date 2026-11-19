// src/lib/admin/require-admin.ts
// Dipakai di setiap server component admin.
// Baca session lewat auth, lalu cek role dari DB (bukan dari session.user langsung).

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Belum login → ke halaman login
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Ambil role dari DB, bukan dari session.user
  // (Better Auth tidak selalu memasukkan custom field ke session object)
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  // User tidak ditemukan atau bukan admin → ke halaman utama
  if (!user || user.role !== "admin") {
    redirect("/home");
  }

  return user;
}
