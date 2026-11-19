// src/lib/admin/require-admin.ts
// Dipakai di setiap server component admin.
// Baca session lewat auth, lalu cek role dari DB (bukan dari session.user langsung).

import { redirect } from "next/navigation";
import { requireAdminApi, AdminAccessError } from "./authorization";

export async function requireAdmin() {
  try {
    return await requireAdminApi();
  } catch (error) {
    if (error instanceof AdminAccessError)
      redirect(error.status === 401 ? "/login" : "/home");
    throw error;
  }
}
