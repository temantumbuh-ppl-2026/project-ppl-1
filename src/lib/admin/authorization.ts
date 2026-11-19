import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export class AdminAccessError extends Error {
  constructor(public readonly status: 401 | 403) {
    super(status === 401 ? "Unauthorized" : "Forbidden");
    this.name = "AdminAccessError";
  }
}

export async function requireAdminApi(request?: Request) {
  const session = await auth.api.getSession({
    headers: request?.headers ?? (await headers()),
  });
  if (!session?.user?.id) throw new AdminAccessError(401);
  // Always read the current role; an old session must not retain admin access.
  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!admin || admin.role !== "admin") throw new AdminAccessError(403);
  return admin;
}
