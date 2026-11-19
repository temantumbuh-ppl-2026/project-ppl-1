import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (adminUser?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? "";
    const filter = searchParams.get("filter") ?? "all";
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const rawLimit = Number(searchParams.get("limit") ?? 10);
    const limit = Number.isNaN(rawLimit) || rawLimit < 0 ? 10 : rawLimit;

    const where: Record<string, unknown> = { role: { not: "admin" } };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }
    if (filter === "premium") where.isPremium = true;
    if (filter === "basic") where.isPremium = false;
    if (filter === "nonaktif") where.status = "Nonaktif";

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          isPremium: true,
          status: true,
          createdAt: true,
          birthYear: true,
          gender: true,
          profileFilled: true,
          currentStreak: true,
          parent: {
            select: { email: true, status: true },
          },
        },
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        ...(limit > 0 ? { skip: (page - 1) * limit, take: limit } : {}),
      }),
      prisma.user.count({ where }),
    ]);

    const mappedUsers = users.map(({ parent, ...u }) => ({
      ...u,
      parentEmail: parent?.email ?? null,
    }));

    return NextResponse.json({
      data: {
        users: mappedUsers,
        total,
        page,
        limit,
        currentSearch: search,
        currentFilter: filter,
      },
    });
  } catch (error) {
    console.error("Admin Users API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
