import {
  RiskLevel,
  SafetyAlertStatus,
  type Prisma,
} from "@/app/generated/prisma/client";
import { decrypt, encrypt } from "@/lib/encryption";
import prisma from "@/lib/prisma";
import type { SafetyAlertFilters, SafetyAlertReviewInput } from "./validation";

export class SafetyAlertError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "SafetyAlertError";
  }
}

const listSelect = {
  id: true,
  riskLevel: true,
  category: true,
  status: true,
  createdAt: true,
  reviewedAt: true,
  // Admins can identify the account for follow-up without reading its diary.
  diary: { select: { user: { select: { email: true } } } },
} satisfies Prisma.SafetyAlertSelect;

const detailSelect = {
  ...listSelect,
  updatedAt: true,
  reviewNote: true,
  reviewedBy: { select: { name: true } },
} satisfies Prisma.SafetyAlertSelect;

type AlertRow = Prisma.SafetyAlertGetPayload<{ select: typeof listSelect }>;
type AlertDetailRow = Prisma.SafetyAlertGetPayload<{
  select: typeof detailSelect;
}>;

function toListItem(row: AlertRow) {
  // Explicit projection also protects responses if a query is extended later.
  return {
    id: row.id,
    userEmail: row.diary.user.email,
    riskLevel: row.riskLevel,
    category: row.category,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
  };
}

export function allowedReviewStatuses(
  status: SafetyAlertStatus,
): SafetyAlertStatus[] {
  if (status === SafetyAlertStatus.OPEN)
    return [status, SafetyAlertStatus.REVIEWED];
  if (status === SafetyAlertStatus.REVIEWED)
    return [status, SafetyAlertStatus.RESOLVED];
  return [status];
}

function toDetail(row: AlertDetailRow) {
  return {
    ...toListItem(row),
    updatedAt: row.updatedAt.toISOString(),
    reviewNote:
      row.reviewNote === null
        ? null
        : decrypt(row.reviewNote, { allowLegacyPlaintext: false }),
    reviewedByName: row.reviewedBy?.name ?? null,
    allowedStatuses: allowedReviewStatuses(row.status),
  };
}

export async function listSafetyAlerts(filters: SafetyAlertFilters) {
  const where: Prisma.SafetyAlertWhereInput = {
    riskLevel: RiskLevel.HIGH,
    ...(filters.riskLevel === "ATTENTION"
      ? { AND: [{ riskLevel: RiskLevel.ATTENTION }] }
      : {}),
    ...(filters.status !== "all" ? { status: filters.status } : {}),
    ...(filters.category !== "all" ? { category: filters.category } : {}),
  };
  const [alerts, total] = await prisma.$transaction(
    [
      prisma.safetyAlert.findMany({
        where,
        select: listSelect,
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      prisma.safetyAlert.count({ where }),
    ],
    { isolationLevel: "RepeatableRead" },
  );
  return {
    alerts: alerts.map(toListItem),
    total,
    page: filters.page,
    limit: filters.limit,
  };
}

export async function getSafetyAlert(id: string) {
  const alert = await prisma.safetyAlert.findFirst({
    where: { id, riskLevel: RiskLevel.HIGH },
    select: detailSelect,
  });
  if (!alert)
    throw new SafetyAlertError(
      404,
      "SAFETY_ALERT_NOT_FOUND",
      "Safety alert tidak ditemukan.",
    );
  return toDetail(alert);
}

export async function reviewSafetyAlert(
  id: string,
  adminId: string,
  input: SafetyAlertReviewInput,
) {
  const encryptedNote =
    input.reviewNote === undefined
      ? undefined
      : input.reviewNote
        ? encrypt(input.reviewNote)
        : null;
  return prisma.$transaction(async (tx) => {
    const current = await tx.safetyAlert.findFirst({
      where: { id, riskLevel: RiskLevel.HIGH },
      select: { status: true, updatedAt: true },
    });
    if (!current)
      throw new SafetyAlertError(
        404,
        "SAFETY_ALERT_NOT_FOUND",
        "Safety alert tidak ditemukan.",
      );
    if (
      input.expectedUpdatedAt &&
      new Date(input.expectedUpdatedAt).getTime() !==
        current.updatedAt.getTime()
    ) {
      throw new SafetyAlertError(
        409,
        "SAFETY_REVIEW_CONFLICT",
        "Alert telah diperbarui. Muat ulang sebelum menyimpan.",
      );
    }
    if (!allowedReviewStatuses(current.status).includes(input.status)) {
      throw new SafetyAlertError(
        409,
        "SAFETY_STATUS_TRANSITION_INVALID",
        "Urutan status harus OPEN, REVIEWED, lalu RESOLVED.",
      );
    }
    const reviewedAt = new Date();
    // A same-status edit must change the version even within one millisecond.
    const updatedAt = new Date(
      Math.max(reviewedAt.getTime(), current.updatedAt.getTime() + 1),
    );
    const changed = await tx.safetyAlert.updateMany({
      where: {
        id,
        riskLevel: RiskLevel.HIGH,
        status: current.status,
        updatedAt: current.updatedAt,
      },
      data: {
        status: input.status,
        reviewedById: adminId,
        reviewedAt,
        updatedAt,
        ...(encryptedNote !== undefined ? { reviewNote: encryptedNote } : {}),
      },
    });
    if (changed.count !== 1)
      throw new SafetyAlertError(
        409,
        "SAFETY_REVIEW_CONFLICT",
        "Alert telah diperbarui. Muat ulang sebelum menyimpan.",
      );
    const updated = await tx.safetyAlert.findFirst({
      where: { id, riskLevel: RiskLevel.HIGH },
      select: detailSelect,
    });
    if (!updated)
      throw new SafetyAlertError(
        404,
        "SAFETY_ALERT_NOT_FOUND",
        "Safety alert tidak ditemukan.",
      );
    // Decryption/configuration failures must abort this transaction as well.
    return toDetail(updated);
  });
}
