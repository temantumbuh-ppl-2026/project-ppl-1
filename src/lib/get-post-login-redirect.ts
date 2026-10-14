import prisma from "@/lib/prisma";

export type PostLoginRoute =
  | "/login"
  | "/admin"
  | "/register?completeProfile=1"
  | "/mood"
  | "/home";

function getJakartaDayRange(now = new Date()) {
  const jakartaOffsetMs = 7 * 60 * 60 * 1000;

  // Geser ke "waktu Jakarta" tapi tetap diproses pakai UTC getter
  const jakartaNow = new Date(now.getTime() + jakartaOffsetMs);

  const year = jakartaNow.getUTCFullYear();
  const month = jakartaNow.getUTCMonth();
  const date = jakartaNow.getUTCDate();

  const startUtcMs = Date.UTC(year, month, date, 0, 0, 0, 0) - jakartaOffsetMs;
  const endUtcMs =
    Date.UTC(year, month, date + 1, 0, 0, 0, 0) - jakartaOffsetMs - 1;

  return {
    start: new Date(startUtcMs),
    end: new Date(endUtcMs),
  };
}

async function hasMoodToday(userId: string): Promise<boolean> {
  const { start, end } = getJakartaDayRange();

  const mood = await prisma.moodLog.findFirst({
    where: {
      userId,
      createdAt: {
        gte: start,
        lte: end,
      },
    },
    select: {
      id: true,
    },
  });

  return Boolean(mood);
}

export async function getPostLoginRedirect(
  userId: string,
): Promise<PostLoginRoute> {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      role: true,
      profileFilled: true,
    },
  });

  if (!user) {
    return "/login";
  }

  // Admin langsung masuk ke admin panel
  // Admin tidak perlu lewat profile, baseline, atau mood check-in user biasa.
  if (user.role === "admin") {
    return "/admin";
  }

  if (!user.profileFilled) {
    return "/register?completeProfile=1";
  }

  // Baseline tidak lagi menghalangi akses (FE-03). Alur mood sengaja dibiarkan apa adanya.
  const moodToday = await hasMoodToday(userId);

  if (!moodToday) {
    return "/mood";
  }

  return "/home";
}
