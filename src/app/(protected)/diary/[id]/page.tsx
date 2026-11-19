import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { DiaryPageClient } from "@/features/diary/components/DiaryPageClient";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function DiaryPage({ params }: PageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      isPremium: true,
      currentStreak: true,
      parentEmail: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <DiaryPageClient
      entryId={id}
      initialUserMeta={{
        id: user.id,
        name: user.name,
        plan: user.isPremium ? "premium" : "free",
        streakDays: user.currentStreak ?? 0,
        parentEmail: user.parentEmail ?? undefined,
      }}
    />
  );
}
