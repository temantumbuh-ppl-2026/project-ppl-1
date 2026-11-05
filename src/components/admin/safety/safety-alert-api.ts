// Kontrak FE untuk monitoring safety admin (PB34/PB35).
//
// Endpoint backend:
//   GET   /api/admin/safety-alerts?status=&riskLevel=&category=&page=&limit=
//         -> { data: { alerts, total, page, limit } }
//   GET   /api/admin/safety-alerts/:id        -> { data: { alert } }
//   PATCH /api/admin/safety-alerts/:id        -> { data: { alert } }
//         body: { status, reviewNote?, expectedUpdatedAt }
//
// Hanya metadata. Isi percakapan, ringkasan, dan identitas pengguna tidak
// pernah dikirim ke halaman ini.

import {
  RiskLevel,
  SafetyAlertStatus,
  SafetyCategory,
} from "@/app/generated/prisma/enums";

export type AlertStatus = SafetyAlertStatus;
export type AlertRiskLevel = Exclude<RiskLevel, "NONE">;
export type AlertCategory = SafetyCategory;

export type SafetyAlertListItem = {
  id: string;
  anonymousUserId: string;
  riskLevel: AlertRiskLevel;
  category: AlertCategory;
  status: AlertStatus;
  createdAt: string;
  reviewedAt: string | null;
};

export type SafetyAlertDetail = SafetyAlertListItem & {
  updatedAt: string;
  reviewNote: string | null;
  reviewedByName: string | null;
  allowedStatuses: AlertStatus[];
};

export type SafetyAlertList = {
  alerts: SafetyAlertListItem[];
  total: number;
  page: number;
  limit: number;
};

export type SafetyAlertFilters = {
  status: AlertStatus | "all";
  riskLevel: AlertRiskLevel | "all";
  category: AlertCategory | "all";
  page: number;
  limit: number;
};

export const STATUS_OPTIONS: AlertStatus[] = [
  SafetyAlertStatus.OPEN,
  SafetyAlertStatus.REVIEWED,
  SafetyAlertStatus.RESOLVED,
];

export const RISK_OPTIONS: AlertRiskLevel[] = [RiskLevel.HIGH];

export const CATEGORY_OPTIONS = Object.values(SafetyCategory);

export const STATUS_LABELS: Record<AlertStatus, string> = {
  OPEN: "Belum ditinjau",
  REVIEWED: "Sedang ditinjau",
  RESOLVED: "Selesai",
};

export const RISK_LABELS: Record<AlertRiskLevel, string> = {
  HIGH: "Tinggi",
  ATTENTION: "Perlu perhatian",
};

export const CATEGORY_LABELS: Record<AlertCategory, string> = {
  SELF_HARM: "Menyakiti diri sendiri",
  HARM_TO_OTHERS: "Menyakiti orang lain",
  VIOLENCE_ABUSE: "Kekerasan atau penyalahgunaan",
  BULLYING_THREAT: "Perundungan atau ancaman",
  DOMESTIC_VIOLENCE: "Kekerasan dalam rumah tangga",
  GROOMING_EXPLOITATION: "Grooming atau eksploitasi",
  SEVERE_DISTRESS: "Tekanan emosional berat",
  OTHER: "Lainnya",
};

export const DEFAULT_ALERT_LIMIT = 10;
export const REVIEW_NOTE_MAX_LENGTH = 1000;

export function buildAlertListUrl(filters: SafetyAlertFilters) {
  const params = new URLSearchParams();
  params.set("status", filters.status);
  params.set("riskLevel", filters.riskLevel);
  params.set("category", filters.category);
  params.set("page", String(filters.page));
  params.set("limit", String(filters.limit));
  return `/api/admin/safety-alerts?${params.toString()}`;
}

export function parseAlertFilters(
  params: Pick<URLSearchParams, "get">,
): SafetyAlertFilters {
  const status = params.get("status");
  const riskLevel = params.get("riskLevel");
  const category = params.get("category");
  const page = Number(params.get("page"));
  const limit = Number(params.get("limit"));

  return {
    status:
      status === "all" || STATUS_OPTIONS.includes(status as AlertStatus)
        ? (status as SafetyAlertFilters["status"])
        : "OPEN",
    riskLevel:
      riskLevel === "all" || RISK_OPTIONS.includes(riskLevel as AlertRiskLevel)
        ? (riskLevel as SafetyAlertFilters["riskLevel"])
        : "HIGH",
    category: CATEGORY_OPTIONS.includes(category as AlertCategory)
      ? (category as AlertCategory)
      : "all",
    page: Number.isInteger(page) && page > 0 && page <= 1_000_000 ? page : 1,
    limit:
      Number.isInteger(limit) && limit > 0 && limit <= 50
        ? limit
        : DEFAULT_ALERT_LIMIT,
  };
}

export class SafetyAlertApiError extends Error {
  constructor(public readonly status: number) {
    super(
      status === 401
        ? "Sesi sudah berakhir. Silakan masuk kembali."
        : status === 403
          ? "Halaman ini hanya dapat diakses oleh admin."
          : status === 404
            ? "Alert tidak ditemukan atau sudah tidak tersedia."
            : status === 409
              ? "Alert telah diperbarui atau status sudah berubah. Muat ulang alert sebelum menyimpan lagi."
              : status === 400
                ? "Data tidak valid. Periksa status dan panjang catatan review."
                : status === 503
                  ? "Monitoring safety sedang tidak tersedia. Coba lagi beberapa saat."
                  : "Permintaan gagal. Periksa koneksi lalu coba lagi.",
    );
    this.name = "SafetyAlertApiError";
  }
}

export function safetyErrorMessage(error: unknown) {
  return error instanceof SafetyAlertApiError
    ? error.message
    : "Permintaan gagal. Periksa koneksi lalu coba lagi.";
}

export async function fetchSafetyAlerts(
  filters: SafetyAlertFilters,
  signal?: AbortSignal,
): Promise<SafetyAlertList> {
  const res = await fetch(buildAlertListUrl(filters), {
    cache: "no-store",
    signal,
  });
  if (!res.ok) throw new SafetyAlertApiError(res.status);
  const json = (await res.json()) as { data: SafetyAlertList };
  return json.data;
}

export async function fetchSafetyAlert(
  id: string,
  signal?: AbortSignal,
): Promise<SafetyAlertDetail> {
  const res = await fetch(
    `/api/admin/safety-alerts/${encodeURIComponent(id)}`,
    { cache: "no-store", signal },
  );
  if (!res.ok) throw new SafetyAlertApiError(res.status);
  const json = (await res.json()) as { data: { alert: SafetyAlertDetail } };
  return json.data.alert;
}

export async function updateSafetyAlert(
  id: string,
  input: {
    status: AlertStatus;
    reviewNote?: string | null;
    expectedUpdatedAt: string;
  },
): Promise<SafetyAlertDetail> {
  const res = await fetch(
    `/api/admin/safety-alerts/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  if (!res.ok) throw new SafetyAlertApiError(res.status);
  const json = (await res.json()) as { data: { alert: SafetyAlertDetail } };
  return json.data.alert;
}

export function formatAlertDate(iso: string | null) {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
