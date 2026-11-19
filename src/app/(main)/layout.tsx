import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getBaselineByUserId } from "@/lib/baseline/service";

import { AppSidebarShell } from "@/components/layout/app-sidebar-shell";

function getLocalDateString(date: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch {
    return date.toISOString().split("T")[0];
  }
}

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  const timezone = "Asia/Jakarta";
  const todayLocal = getLocalDateString(new Date(), timezone);

  const [user, baseline, lastMoodLog] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        image: true,
        profileFilled: true,
        isPremium: true,
      },
    }),
    getBaselineByUserId(userId),
    prisma.moodLog.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        createdAt: true,
      },
    }),
  ]);

  if (!user?.profileFilled) {
    redirect("/register?completeProfile=1");
  }

  if (!baseline) {
    redirect("/baseline");
  }

  const hasFilledMoodToday =
    lastMoodLog &&
    getLocalDateString(lastMoodLog.createdAt, timezone) === todayLocal;

  if (!hasFilledMoodToday) {
    redirect("/mood");
  }

  return (
    <AppSidebarShell
      user={{
        name: user.name ?? "Teman",
        email: user.email ?? "",
        image: user.image ?? null,
        isPremium: Boolean(user.isPremium),
      }}
    >
      {children}
    </AppSidebarShell>
  );
}
