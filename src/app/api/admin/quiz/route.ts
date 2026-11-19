import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
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

    const questions = await prisma.quizQuestion.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      select: {
        id: true,
        scenario: true,
        category: true,
        optionA: true,
        optionB: true,
        correctOption: true,
        explanationCorrect: true,
        explanationIncorrect: true,
        ageSegment: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ data: questions });
  } catch (error) {
    console.error("Admin Quiz API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
