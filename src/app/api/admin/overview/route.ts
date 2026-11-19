import { NextResponse } from "next/server";
import { requireAdminApi, AdminAccessError } from "@/lib/admin/authorization";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdminApi();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      premiumUsers,
      activeUsers,
      nonActiveUsers,
      totalQuestionsActive,
      newUsersThisMonth,
      quizLogCount,
      segmentCountsRaw,
    ] = await Promise.all([
      prisma.user.count({ where: { role: { not: "admin" } } }),
      prisma.user.count({ where: { role: { not: "admin" }, isPremium: true } }),
      prisma.user.count({ where: { role: { not: "admin" }, status: "Aktif" } }),
      prisma.user.count({
        where: { role: { not: "admin" }, status: "Nonaktif" },
      }),
      prisma.quizQuestion.count({ where: { isActive: true } }),
      prisma.user.count({
        where: { role: { not: "admin" }, createdAt: { gte: startOfMonth } },
      }),
      prisma.quizLog.count(),
      prisma.quizQuestion.groupBy({
        by: ["ageSegment"],
        where: { isActive: true },
        _count: { _all: true },
      }),
    ]);

    const segmentCounts = segmentCountsRaw.map((item) => ({
      segment: item.ageSegment,
      count: item._count._all,
    }));

    return NextResponse.json({
      data: {
        totalUsers,
        premiumUsers,
        activeUsers,
        nonActiveUsers,
        totalQuestionsActive,
        newUsersThisMonth,
        quizLogCount,
        segmentCounts,
      },
    });
  } catch (error) {
    if (error instanceof AdminAccessError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    console.error("Admin Overview API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
