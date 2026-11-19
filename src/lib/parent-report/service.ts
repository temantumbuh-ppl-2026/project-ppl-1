import { readFile } from "node:fs/promises";

import { ReportStatus, ReportType } from "@/app/generated/prisma/client";
import { sendEmail } from "@/lib/email";
import { getLocalDateString, parseDateString } from "@/lib/mood/service";
import prisma from "@/lib/prisma";
import { syncUserPremiumStatus } from "@/lib/subscription/service";

import { generatePremiumWeeklyReportPdf } from "./pdf";

const DEFAULT_TIMEZONE = "Asia/Jakarta";
const MS_PER_DAY = 86_400_000;

type ReportAction = {
  priorityLabel: string;
  label: string;
  desc: string;
};

type ReportInsight = {
  dateKey: string;
  dayName: string;
  dateLabel: string;
  mood: number;
  reflection: string;
  pattern: string;
  affirmation: string;
  actions: ReportAction[];
};

type ReportDay = {
  dateKey: string;
  dayName: string;
  dateLabel: string;
  score: number | null;
  moodLabel: string;
};

type MoodSummary = {
  average: number;
  averageLabel: string;
  filledDays: number;
  missingDays: number;
  conclusion: string;
  trend: string;
  guidance: string;
};

type PremiumSummary = {
  summary: string;
  patternSummary: string;
};

export type WeeklyParentReportData = {
  childName: string;
  parentEmail: string;
  timezone: string;
  generatedAtLabel: string;
  period: {
    startKey: string;
    endKey: string;
    dataEndKey: string;
    periodLabel: string;
    dataRangeLabel: string;
  };
  days: ReportDay[];
  moodSummary: MoodSummary;
  insights: ReportInsight[];
  hasData: boolean;
  premiumSummary: PremiumSummary | null;
};

type SendReportInput = {
  userId: string;
  timezone?: string | null;
  referenceDate?: Date;
  force?: boolean;
};

type BatchInput = {
  timezone?: string | null;
  referenceDate?: Date;
  limit?: number;
};

export class ParentReportError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 400, code = "PARENT_REPORT_ERROR") {
    super(message);
    this.name = "ParentReportError";
    this.status = status;
    this.code = code;
  }
}

export function normalizeReportTimezone(timezone?: string | null) {
  return timezone?.trim() || DEFAULT_TIMEZONE;
}

export async function sendWeeklyParentReportForUser(input: SendReportInput) {
  const timezone = normalizeReportTimezone(input.timezone);
  const now = input.referenceDate ?? new Date();
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: {
      id: true,
      name: true,
      status: true,
      parent: {
        select: {
          id: true,
          email: true,
          status: true,
          lastSentAt: true,
          lastReportStatus: true,
        },
      },
    },
  });

  if (!user) {
    throw new ParentReportError("User tidak ditemukan.", 404, "USER_NOT_FOUND");
  }

  if (user.status === "Nonaktif") {
    throw new ParentReportError(
      "Akun user sedang nonaktif.",
      403,
      "USER_INACTIVE",
    );
  }

  if (!user.parent || user.parent.status !== "verified") {
    throw new ParentReportError(
      "Email orang tua belum terverifikasi.",
      400,
      "PARENT_NOT_VERIFIED",
    );
  }

  const period = getWeeklyReportPeriod(now, timezone);
  if (!input.force && wasReportSentForPeriod(user.parent, period, timezone)) {
    return {
      success: true,
      skipped: true,
      reason: "already_sent",
      reportType: null,
      parentEmail: user.parent.email,
      period,
      filledDays: 0,
    };
  }

  const premiumStatus = await syncUserPremiumStatus(user.id);
  const reportType = premiumStatus.isPremium
    ? ReportType.premium_pdf
    : ReportType.free_summary;
  const report = await buildWeeklyParentReportData({
    userId: user.id,
    childName: user.name,
    parentEmail: user.parent.email,
    timezone,
    referenceDate: now,
    includeInsights: premiumStatus.isPremium,
  });

  if (!report.hasData) {
    return {
      success: true,
      skipped: true,
      reason: "no_data",
      reportType,
      parentEmail: report.parentEmail,
      period: report.period,
      filledDays: 0,
    };
  }

  try {
    if (premiumStatus.isPremium) {
      const reportHtml = await renderPremiumReportHtml(report);
      const pdf = generatePremiumWeeklyReportPdf(report);

      await sendEmail({
        to: report.parentEmail,
        subject: `Kabar Mingguan ${report.childName} - ${report.period.periodLabel}`,
        text: buildPremiumReportText(report),
        html: reportHtml,
        attachments: [
          {
            filename: buildPdfFileName(report),
            content: pdf,
            contentType: "application/pdf",
          },
        ],
      });
    } else {
      await sendEmail({
        to: report.parentEmail,
        subject: `Kabar Mood Mingguan ${report.childName} - ${report.period.periodLabel}`,
        text: buildBasicReportText(report),
        html: buildBasicReportHtml(report),
      });
    }

    await prisma.parent.update({
      where: { id: user.parent.id },
      data: {
        lastSentAt: now,
        lastReportType: reportType,
        lastReportStatus: ReportStatus.sent,
      },
    });

    return {
      success: true,
      skipped: false,
      reportType,
      parentEmail: report.parentEmail,
      period: report.period,
      filledDays: report.moodSummary.filledDays,
      generatedAt: now,
    };
  } catch (error) {
    await prisma.parent.update({
      where: { id: user.parent.id },
      data: {
        lastSentAt: now,
        lastReportType: reportType,
        lastReportStatus: ReportStatus.failed,
      },
    });

    console.error("Weekly parent report send failed:", error);
    throw new ParentReportError(
      "Gagal mengirim laporan mingguan. Periksa konfigurasi email dan coba lagi.",
      500,
      "SEND_FAILED",
    );
  }
}

export async function sendWeeklyParentReports(input: BatchInput = {}) {
  const timezone = normalizeReportTimezone(input.timezone);
  const now = input.referenceDate ?? new Date();
  const limit = input.limit && input.limit > 0 ? input.limit : 200;

  const parents = await prisma.parent.findMany({
    where: { status: "verified" },
    select: {
      userId: true,
      email: true,
    },
    take: limit,
    orderBy: { updatedAt: "asc" },
  });

  const results: Array<{
    userId: string;
    parentEmail: string;
    status: "sent" | "skipped" | "failed";
    reason?: string;
  }> = [];

  for (const parent of parents) {
    try {
      const result = await sendWeeklyParentReportForUser({
        userId: parent.userId,
        timezone,
        referenceDate: now,
        force: false,
      });

      results.push({
        userId: parent.userId,
        parentEmail: parent.email,
        status: result.skipped ? "skipped" : "sent",
        reason: result.skipped ? result.reason : undefined,
      });
    } catch (error) {
      results.push({
        userId: parent.userId,
        parentEmail: parent.email,
        status: "failed",
        reason: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return {
    success: true,
    timezone,
    processed: results.length,
    sent: results.filter((item) => item.status === "sent").length,
    skipped: results.filter((item) => item.status === "skipped").length,
    failed: results.filter((item) => item.status === "failed").length,
    results,
  };
}

export async function buildWeeklyParentReportData({
  userId,
  childName,
  parentEmail,
  timezone,
  referenceDate = new Date(),
  includeInsights,
}: {
  userId: string;
  childName: string;
  parentEmail: string;
  timezone: string;
  referenceDate?: Date;
  includeInsights: boolean;
}): Promise<WeeklyParentReportData> {
  const period = getWeeklyReportPeriod(referenceDate, timezone);
  const [moodLogs, insights] = await Promise.all([
    getMoodLogsForReport(userId, timezone, period.startKey, period.dataEndKey),
    includeInsights
      ? getInsightsForReport(userId, period.startKey, period.dataEndKey)
      : Promise.resolve([]),
  ]);

  const moodByDate = new Map(
    moodLogs.map((log) => [
      getLocalDateString(log.createdAt, timezone),
      log.moodScore,
    ]),
  );

  const days = listDateKeys(period.startKey, period.dataEndKey).map(
    (dateKey) => {
      const score = moodByDate.get(dateKey) ?? null;
      return {
        dateKey,
        dayName: formatDayName(dateKey),
        dateLabel: formatDateKey(dateKey),
        score,
        moodLabel: getMoodLabel(score),
      };
    },
  );

  const reportInsights = insights.map((insight) => {
    const dateKey = insight.date.toISOString().split("T")[0]!;
    return {
      dateKey,
      dayName: formatDayName(dateKey),
      dateLabel: formatDateKey(dateKey),
      mood: Number(insight.averageScore) || 0,
      reflection: insight.analysisText || "",
      pattern: insight.cognitivePattern || "",
      affirmation: insight.affirmation || "",
      actions: insight.recommendations.map((recommendation) => {
        const action = parseActionText(recommendation.actionText);
        return {
          priorityLabel: getPriorityLabel(recommendation.priority),
          label: action.label,
          desc: action.desc,
        };
      }),
    };
  });

  return {
    childName,
    parentEmail,
    timezone,
    generatedAtLabel: formatGeneratedAt(referenceDate, timezone),
    period,
    days,
    moodSummary: buildMoodSummary(days),
    insights: reportInsights,
    hasData: days.some((day) => day.score !== null),
    premiumSummary: includeInsights
      ? buildPremiumSummary(reportInsights)
      : null,
  };
}

function getWeeklyReportPeriod(referenceDate: Date, timezone: string) {
  const todayKey = getLocalDateString(referenceDate, timezone);
  const today = parseDateString(todayKey);
  const startDate = new Date(today);
  startDate.setUTCDate(
    today.getUTCDay() === 0
      ? today.getUTCDate()
      : today.getUTCDate() - today.getUTCDay(),
  );
  const endDate = new Date(startDate);
  endDate.setUTCDate(startDate.getUTCDate() + 6);

  const startKey = toDateKey(startDate);
  const endKey = toDateKey(endDate);
  const dataEndKey = todayKey < endKey ? todayKey : endKey;

  return {
    startKey,
    endKey,
    dataEndKey,
    periodLabel: `${formatDateKey(startKey, false)} - ${formatDateKey(endKey)}`,
    dataRangeLabel: `${formatDateKey(startKey, false)} - ${formatDateKey(dataEndKey)}`,
  };
}

function wasReportSentForPeriod(
  parent: {
    lastSentAt: Date | null;
    lastReportStatus: ReportStatus | null;
  },
  period: { startKey: string; endKey: string },
  timezone: string,
) {
  if (parent.lastReportStatus !== ReportStatus.sent || !parent.lastSentAt) {
    return false;
  }

  const sentKey = getLocalDateString(parent.lastSentAt, timezone);
  return sentKey >= period.startKey && sentKey <= period.endKey;
}

async function getMoodLogsForReport(
  userId: string,
  timezone: string,
  startKey: string,
  endKey: string,
) {
  const approxStart = new Date(
    parseDateString(startKey).getTime() - MS_PER_DAY,
  );
  const approxEnd = new Date(
    parseDateString(endKey).getTime() + MS_PER_DAY * 2,
  );
  const logs = await prisma.moodLog.findMany({
    where: {
      userId,
      createdAt: {
        gte: approxStart,
        lte: approxEnd,
      },
    },
    select: {
      moodScore: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return logs.filter((log) => {
    const key = getLocalDateString(log.createdAt, timezone);
    return key >= startKey && key <= endKey;
  });
}

async function getInsightsForReport(
  userId: string,
  startKey: string,
  endKey: string,
) {
  return prisma.insight.findMany({
    where: {
      userId,
      date: {
        gte: parseDateString(startKey),
        lte: parseDateString(endKey),
      },
    },
    include: {
      recommendations: {
        orderBy: { id: "asc" },
      },
    },
    orderBy: { date: "asc" },
  });
}

function buildMoodSummary(days: ReportDay[]): MoodSummary {
  const filled = days.filter((day) => day.score !== null) as Array<
    ReportDay & { score: number }
  >;
  const missingDays = days.length - filled.length;

  if (!filled.length) {
    return {
      average: 0,
      averageLabel: "Belum ada data",
      filledDays: 0,
      missingDays,
      conclusion: "",
      trend: "",
      guidance: "",
    };
  }

  const average = Number(
    (filled.reduce((sum, day) => sum + day.score, 0) / filled.length).toFixed(
      1,
    ),
  );
  const lowDays = filled.filter((day) => day.score <= 2).length;
  const positiveDays = filled.filter((day) => day.score >= 4).length;
  const first = filled[0]!;
  const last = filled[filled.length - 1]!;

  let conclusion = `Minggu ini ada ${filled.length} hari mood yang tercatat. Secara umum, suasana hati anak terlihat cukup stabil, dengan naik-turun kecil yang masih wajar.`;
  if (average >= 4.2) {
    conclusion = `Minggu ini ada ${filled.length} hari mood yang tercatat, dan suasana hati anak terlihat cenderung positif. Beberapa hari tampak ringan dan menyenangkan.`;
  } else if (average < 2.5) {
    conclusion = `Minggu ini ada ${filled.length} hari mood yang tercatat, dan suasana hati anak tampak lebih berat dari biasanya. Kehadiran yang tenang dan konsisten akan sangat membantu.`;
  } else if (lowDays >= 2) {
    conclusion = `Minggu ini ada ${filled.length} hari mood yang tercatat. Ada beberapa hari yang terasa lebih rendah, sehingga anak mungkin sedang membutuhkan ruang yang aman untuk ditemani.`;
  }

  const delta = last.score - first.score;
  let trend =
    "Dari awal hingga akhir data yang tersedia, suasana hati terlihat relatif seimbang.";
  if (filled.length < 2) {
    trend =
      "Karena baru ada satu hari mood yang tercatat, perubahan antarhari belum terlihat jelas.";
  } else if (delta >= 1) {
    trend =
      "Menjelang akhir data yang tersedia, suasana hati terlihat bergerak lebih baik.";
  } else if (delta <= -1) {
    trend =
      "Menjelang akhir data yang tersedia, suasana hati terlihat sedikit menurun.";
  }

  let guidance =
    "Bapak/Ibu bisa tetap membuka percakapan ringan, memberi apresiasi atas hal kecil yang berjalan baik, dan menjaga suasana rumah tetap nyaman untuk bercerita.";
  if (lowDays > 0) {
    guidance =
      "Saat anak tampak lebih murung, coba mulai dari pertanyaan sederhana seperti, 'Hari ini ada yang terasa berat?' lalu beri waktu untuk menjawab tanpa perlu didesak.";
  } else if (positiveDays >= Math.max(2, filled.length - 1)) {
    guidance =
      "Suasana positif ini bisa dijaga dengan rutinitas yang terasa menyenangkan, waktu istirahat yang cukup, dan obrolan kecil yang hangat.";
  }

  return {
    average,
    averageLabel: getAverageLabel(average),
    filledDays: filled.length,
    missingDays,
    conclusion,
    trend,
    guidance,
  };
}

function buildPremiumSummary(insights: ReportInsight[]): PremiumSummary {
  if (!insights.length) {
    return {
      summary:
        "Belum ada catatan pendamping tambahan pada periode ini. Laporan tetap berfokus pada mood harian yang sudah tercatat.",
      patternSummary:
        "Pola yang lebih rinci belum terlihat, tetapi data mood harian tetap bisa menjadi bahan obrolan ringan di rumah.",
    };
  }

  const reflections = insights
    .map((insight) => insight.reflection)
    .filter(Boolean)
    .slice(0, 3);
  const patterns = insights
    .map((insight) => insight.pattern)
    .filter(Boolean)
    .slice(0, 3);

  return {
    summary: reflections.length
      ? `Hal yang tampak minggu ini: ${reflections.join(" ")}`
      : "Ada beberapa catatan pendamping, tetapi rangkumannya belum lengkap pada periode ini.",
    patternSummary: patterns.length
      ? `Pola yang perlu diperhatikan: ${patterns.join(" ")}`
      : "Pola yang lebih rinci belum terlihat pada periode ini.",
  };
}

async function renderPremiumReportHtml(report: WeeklyParentReportData) {
  const template = await readFile(
    new URL("./templates/premium-weekly-report.html", import.meta.url),
    "utf8",
  );
  const values: Record<string, string> = {
    childName: escapeHtml(report.childName),
    periodLabel: escapeHtml(report.period.periodLabel),
    generatedAtLabel: escapeHtml(report.generatedAtLabel),
    moodConclusion: escapeHtml(report.moodSummary.conclusion),
    moodTrend: escapeHtml(report.moodSummary.trend),
    moodGuidance: escapeHtml(report.moodSummary.guidance),
    moodRows: renderMoodRows(report.days),
    premiumSummary: escapeHtml(
      report.premiumSummary?.summary ??
        "Belum ada catatan pendamping tambahan pada periode ini.",
    ),
    patternSummary: escapeHtml(
      report.premiumSummary?.patternSummary ??
        "Pola yang lebih rinci belum terlihat pada periode ini.",
    ),
    insightRows: renderInsightRows(report.insights),
  };

  return template.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_, key: string) => {
    return values[key] ?? "";
  });
}

function buildBasicReportHtml(report: WeeklyParentReportData) {
  return `
    <div style="margin:0;padding:0;background:#f0f7f6;font-family:'Segoe UI',Arial,sans-serif;color:#16313b;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f0f7f6;padding:32px 12px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:640px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 12px 40px rgba(26,150,136,0.08);">
              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#144949 0%,#1a9688 60%,#4ecfc3 100%);padding:28px 28px 24px;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:rgba(255,255,255,0.7);">TEMANTUMBUH</p>
                  <h1 style="margin:0;font-size:22px;line-height:1.3;color:#ffffff;font-weight:800;">Kabar Mingguan ${escapeHtml(report.childName)}</h1>
                  <p style="margin:8px 0 0;font-size:13px;line-height:1.7;color:rgba(255,255,255,0.85);">Halo Bapak/Ibu, berikut kabar singkat tentang suasana hati ${escapeHtml(report.childName)} minggu ini.</p>
                </td>
              </tr>

              <!-- Period -->
              <tr>
                <td style="padding:20px 28px 0;">
                  <div style="background:#f0faf9;border:1.5px solid rgba(26,150,136,0.18);border-radius:14px;padding:14px 16px;">
                    <p style="margin:0 0 3px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#1a9688;">Periode</p>
                    <p style="margin:0;font-size:16px;font-weight:800;color:#16313b;">${escapeHtml(report.period.periodLabel)}</p>
                    <p style="margin:6px 0 0;font-size:11px;color:#58707c;">Hari yang tercatat: ${escapeHtml(report.period.dataRangeLabel)}</p>
                  </div>
                </td>
              </tr>

              <!-- Cerita Minggu Ini -->
              <tr>
                <td style="padding:24px 28px 0;">
                  <h2 style="margin:0 0 10px;font-size:17px;font-weight:800;color:#16313b;">Cerita Minggu Ini</h2>
                  <p style="margin:0 0 8px;font-size:14px;line-height:1.85;color:#2c3e50;">${escapeHtml(report.moodSummary.conclusion)}</p>
                  <p style="margin:0 0 8px;font-size:14px;line-height:1.85;color:#2c3e50;">${escapeHtml(report.moodSummary.trend)}</p>
                  <p style="margin:0;font-size:14px;line-height:1.85;color:#2c3e50;">${escapeHtml(report.moodSummary.guidance)}</p>
                </td>
              </tr>

              <!-- Catatan Harian -->
              <tr>
                <td style="padding:24px 28px 0;">
                  <div style="height:1px;background:rgba(26,150,136,0.12);margin-bottom:16px;"></div>
                  <h2 style="margin:0 0 12px;font-size:17px;font-weight:800;color:#16313b;">Catatan Harian</h2>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:separate;border-spacing:0 6px;">
                    ${renderBasicMoodRows(report.days)}
                  </table>
                </td>
              </tr>

              <!-- Premium Notice (no link, just notice) -->
              <tr>
                <td style="padding:28px 28px 0;">
                  <div style="height:1px;background:rgba(26,150,136,0.12);margin-bottom:20px;"></div>
                  <div style="border-radius:16px;overflow:hidden;background:#f8fafa;border:1px solid #e0ebe9;padding:24px 20px;">
                    <!-- Blurred content preview -->
                    <div style="opacity:0.3;filter:blur(2px);-webkit-filter:blur(2px);">
                      <p style="margin:0 0 6px;font-size:15px;font-weight:800;color:#16313b;">Hal yang Terlihat</p>
                      <p style="margin:0 0 6px;font-size:13px;line-height:1.7;color:#2c3e50;">Pola emosional dan catatan pendamping yang lebih detail tersedia di laporan premium...</p>
                      <p style="margin:0;font-size:13px;line-height:1.7;color:#2c3e50;">Rekomendasi langkah konkret untuk mendampingi anak...</p>
                    </div>
                    <!-- Notice -->
                    <div style="margin-top:16px;text-align:center;padding:14px 12px;background:#ffffff;border-radius:12px;border:1px solid rgba(26,150,136,0.14);">
                      <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#16313b;">Laporan lebih lengkap tersedia untuk akun Premium</p>
                      <p style="margin:0;font-size:12px;line-height:1.6;color:#58707c;">Untuk mendapatkan insight harian, pola emosional, dan rekomendasi personal, minta ${escapeHtml(report.childName)} untuk upgrade akunnya ke Premium melalui aplikasi TemanTumbuh.</p>
                    </div>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding:28px 28px 28px;text-align:center;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#1a9688;">TemanTumbuh</p>
                  <p style="margin:0;font-size:11px;line-height:1.7;color:#58707c;">Semoga laporan ini membantu Bapak/Ibu menemani ${escapeHtml(report.childName)} dengan lebih hangat.</p>
                </td>
              </tr>
            </table>

            <p style="margin:16px 0 0;font-size:11px;color:#8fa3a0;text-align:center;">TemanTumbuh 2026 - Menemani tumbuh kembang anak dengan aman</p>
          </td>
        </tr>
      </table>
    </div>
  `;
}

function buildBasicReportText(report: WeeklyParentReportData) {
  return [
    `Halo Bapak/Ibu, berikut kabar singkat tentang suasana hati ${report.childName} minggu ini.`,
    `Periode: ${report.period.periodLabel}`,
    "",
    report.moodSummary.conclusion,
    report.moodSummary.trend,
    report.moodSummary.guidance,
    "",
    "Catatan harian:",
    ...report.days.map((day) => {
      const mood =
        day.score === null
          ? "Belum ada mood tercatat"
          : `${day.moodLabel} (${day.score}/5)`;
      return `- ${day.dayName}, ${day.dateLabel}: ${mood}`;
    }),
    "",
    `Semoga laporan ini membantu Bapak/Ibu menemani ${report.childName} dengan lebih hangat.`,
  ].join("\n");
}

function buildPremiumReportText(report: WeeklyParentReportData) {
  return [
    `Halo Bapak/Ibu, berikut kabar mingguan ${report.childName}.`,
    `Periode: ${report.period.periodLabel}`,
    "",
    report.moodSummary.conclusion,
    report.premiumSummary?.summary ??
      "Belum ada catatan pendamping tambahan pada periode ini.",
    report.premiumSummary?.patternSummary ??
      "Pola yang lebih rinci belum terlihat pada periode ini.",
    "",
    "Laporan lengkap ada pada PDF terlampir.",
  ].join("\n");
}

function renderMoodRows(days: ReportDay[]) {
  return days
    .map((day) => {
      const moodColor =
        day.score === null
          ? "#8fa3a0"
          : day.score >= 4
            ? "#059669"
            : day.score >= 3
              ? "#d97706"
              : "#dc2626";
      const moodFace = getMoodFaceSvg(day.score);
      const moodText =
        day.score === null
          ? "Belum ada mood"
          : `${escapeHtml(day.moodLabel)} (${day.score}/5)`;
      return `
        <tr>
          <td style="padding:10px 14px;background:#f8fcfb;border:1px solid rgba(26,150,136,0.12);border-right:0;border-radius:10px 0 0 10px;font-size:13px;font-weight:700;color:#16313b;">${escapeHtml(day.dayName)}, ${escapeHtml(day.dateLabel)}</td>
          <td style="padding:10px 14px;background:#f8fcfb;border:1px solid rgba(26,150,136,0.12);border-left:0;border-radius:0 10px 10px 0;font-size:13px;font-weight:600;color:${moodColor};text-align:right;vertical-align:middle;">
            <span style="display:inline-block;vertical-align:middle;margin-right:6px;">${moodFace}</span>
            <span style="vertical-align:middle;">${moodText}</span>
          </td>
        </tr>
      `;
    })
    .join("");
}

function renderBasicMoodRows(days: ReportDay[]) {
  return days
    .map((day) => {
      const moodColor =
        day.score === null
          ? "#8fa3a0"
          : day.score >= 4
            ? "#059669"
            : day.score >= 3
              ? "#d97706"
              : "#dc2626";
      const moodFace = getMoodFaceSvg(day.score);
      const moodText =
        day.score === null
          ? "Belum ada mood"
          : `${escapeHtml(day.moodLabel)} (${day.score}/5)`;
      return `
        <tr>
          <td style="padding:10px 14px;background:#f8fcfb;border:1px solid rgba(26,150,136,0.12);border-right:0;border-radius:10px 0 0 10px;font-size:13px;font-weight:700;color:#16313b;">${escapeHtml(day.dayName)}, ${escapeHtml(day.dateLabel)}</td>
          <td style="padding:10px 14px;background:#f8fcfb;border:1px solid rgba(26,150,136,0.12);border-left:0;border-radius:0 10px 10px 0;font-size:13px;font-weight:600;color:${moodColor};text-align:right;vertical-align:middle;">
            <span style="display:inline-block;vertical-align:middle;margin-right:6px;">${moodFace}</span>
            <span style="vertical-align:middle;">${moodText}</span>
          </td>
        </tr>
      `;
    })
    .join("");
}

function getMoodFaceSvg(score: number | null): string {
  if (score === null) return "";
  const size = 18;
  const colors: Record<number, string> = {
    1: "#EF4444",
    2: "#F97316",
    3: "#EAB308",
    4: "#22C55E",
    5: "#10B981",
  };
  const color = colors[score] ?? "#8fa3a0";

  // Simple circle face SVG
  const mouth =
    score >= 4
      ? `<path d="M6 11c0 0 1.5 2.5 3 2.5s3-2.5 3-2.5" stroke="${color}" stroke-width="1.2" fill="none" stroke-linecap="round"/>`
      : score === 3
        ? `<line x1="6" y1="12" x2="12" y2="12" stroke="${color}" stroke-width="1.2" stroke-linecap="round"/>`
        : `<path d="M6 13c0 0 1.5-2.5 3-2.5s3 2.5 3 2.5" stroke="${color}" stroke-width="1.2" fill="none" stroke-linecap="round"/>`;

  return `<svg width="${size}" height="${size}" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="9" cy="9" r="8" stroke="${color}" stroke-width="1.5" fill="none"/><circle cx="6.5" cy="7.5" r="1" fill="${color}"/><circle cx="11.5" cy="7.5" r="1" fill="${color}"/>${mouth}</svg>`;
}

function renderInsightRows(insights: ReportInsight[]) {
  if (!insights.length) {
    return `<p style="margin:0;font-size:14px;line-height:1.8;color:#222222;">Belum ada catatan tambahan pada periode ini.</p>`;
  }

  return insights
    .map((insight) => {
      const actions = insight.actions.length
        ? `<ul style="margin:10px 0 0;padding-left:18px;color:#222222;font-size:13px;line-height:1.7;">${insight.actions
            .map(
              (action) =>
                `<li><strong>${escapeHtml(action.priorityLabel)}:</strong> ${escapeHtml(action.label)} - ${escapeHtml(action.desc)}</li>`,
            )
            .join("")}</ul>`
        : "";

      return `
        <div style="margin:0 0 12px;padding:14px 16px;border:1px solid #dddddd;border-radius:12px;background:#ffffff;">
          <p style="margin:0 0 8px;font-size:13px;font-weight:800;color:#111111;">${escapeHtml(insight.dayName)}, ${escapeHtml(insight.dateLabel)}</p>
          <p style="margin:0 0 6px;font-size:13px;line-height:1.7;color:#222222;"><strong>Yang terlihat:</strong> ${escapeHtml(insight.reflection || "Belum tersedia.")}</p>
          <p style="margin:0 0 6px;font-size:13px;line-height:1.7;color:#222222;"><strong>Pola:</strong> ${escapeHtml(insight.pattern || "Belum tersedia.")}</p>
          <p style="margin:0;font-size:13px;line-height:1.7;color:#222222;"><strong>Kalimat penguat:</strong> ${escapeHtml(insight.affirmation || "Belum tersedia.")}</p>
          ${actions}
        </div>
      `;
    })
    .join("");
}

function parseActionText(actionText: string) {
  try {
    const parsed = JSON.parse(actionText) as {
      label?: unknown;
      desc?: unknown;
    };

    return {
      label:
        typeof parsed.label === "string" && parsed.label.trim()
          ? parsed.label.trim()
          : "Langkah kecil",
      desc:
        typeof parsed.desc === "string" && parsed.desc.trim()
          ? parsed.desc.trim()
          : "Pilih satu langkah ringan yang terasa aman dilakukan.",
    };
  } catch {
    return {
      label: "Langkah kecil",
      desc: actionText,
    };
  }
}

function getPriorityLabel(priority: string) {
  if (priority === "TINGGI") return "Prioritas tinggi";
  if (priority === "RENDAH") return "Prioritas ringan";
  return "Prioritas sedang";
}

function getMoodLabel(score: number | null) {
  if (score === null) return "Belum ada mood tercatat";
  const labels: Record<number, string> = {
    1: "Sangat Sedih",
    2: "Sedih",
    3: "Biasa Aja",
    4: "Senang",
    5: "Sangat Senang",
  };
  return labels[score] ?? "Tidak diketahui";
}

function getAverageLabel(score: number) {
  if (score >= 4.5) return "Sangat baik";
  if (score >= 3.5) return "Cenderung baik";
  if (score >= 2.5) return "Cukup stabil";
  if (score >= 1.5) return "Perlu dijaga";
  return "Perlu perhatian";
}

function listDateKeys(startKey: string, endKey: string) {
  const dates: string[] = [];
  const cursor = parseDateString(startKey);
  const end = parseDateString(endKey);

  while (cursor <= end) {
    dates.push(toDateKey(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
}

function toDateKey(date: Date) {
  return date.toISOString().split("T")[0]!;
}

function formatDayName(dateKey: string) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "UTC",
    weekday: "long",
  }).format(parseDateString(dateKey));
}

function formatDateKey(dateKey: string, includeYear = true) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    ...(includeYear ? { year: "numeric" as const } : {}),
  }).format(parseDateString(dateKey));
}

function formatGeneratedAt(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: timezone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function buildPdfFileName(report: WeeklyParentReportData) {
  const safeName = report.childName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

  return `laporan-mingguan-${safeName || "temantumbuh"}-${report.period.startKey}.pdf`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
