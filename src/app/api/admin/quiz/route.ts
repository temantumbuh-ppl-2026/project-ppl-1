import { NextResponse } from "next/server";
import { requireAdminApi, AdminAccessError } from "@/lib/admin/authorization";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdminApi();

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
    if (error instanceof AdminAccessError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    console.error("Admin Quiz API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
