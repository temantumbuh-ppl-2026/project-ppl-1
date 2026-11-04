"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { RiskBadge, StatusBadge } from "./SafetyBadges";
import {
  CATEGORY_LABELS,
  CATEGORY_OPTIONS,
  RISK_LABELS,
  RISK_OPTIONS,
  STATUS_LABELS,
  STATUS_OPTIONS,
  formatAlertDate,
  type SafetyAlertFilters,
  type SafetyAlertListItem,
} from "./safety-alert-api";

type Props = {
  alerts: SafetyAlertListItem[];
  total: number;
  filters: SafetyAlertFilters;
  onFilterChange: (patch: Partial<SafetyAlertFilters>) => void;
};

const card: React.CSSProperties = {
  background: "var(--tt-dashboard-card-bg)",
  border: "1px solid var(--tt-dashboard-card-border)",
  borderRadius: 18,
  boxShadow: "var(--tt-dashboard-card-shadow)",
};

const selectStyle: React.CSSProperties = {
  minHeight: 44,
  padding: "0 12px",
  borderRadius: 12,
  border: "1px solid var(--tt-dashboard-card-border)",
  background: "var(--tt-dashboard-card-bg)",
  color: "var(--tt-dashboard-text)",
  fontSize: 14,
  fontWeight: 600,
};

const labelStyle: React.CSSProperties = {
  display: "grid",
  gap: 4,
  fontSize: 12,
  fontWeight: 700,
  color: "var(--tt-dashboard-text-2)",
};

const cellStyle: React.CSSProperties = {
  padding: "14px 16px",
  textAlign: "left",
  fontSize: 14,
  color: "var(--tt-dashboard-text)",
  borderTop: "1px solid var(--tt-dashboard-card-border)",
};

const headStyle: React.CSSProperties = {
  padding: "12px 16px",
  textAlign: "left",
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "var(--tt-dashboard-text-2)",
};

export function SafetyAlertsPage({
  alerts,
  total,
  filters,
  onFilterChange,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(total / filters.limit));
  const hasFilter =
    filters.status !== "all" ||
    filters.riskLevel !== "all" ||
    filters.category !== "all";

  return (
    <div
      style={{
        padding: "24px 28px",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 13,
          lineHeight: 1.5,
          color: "var(--tt-dashboard-text-2)",
        }}
      >
        Halaman ini hanya menampilkan metadata alert. Isi percakapan dan
        identitas pengguna sengaja tidak ditampilkan.
      </p>

      <form
        aria-label="Filter alert"
        onSubmit={(event) => event.preventDefault()}
        style={{
          ...card,
          padding: 16,
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          alignItems: "flex-end",
        }}
      >
        <label style={labelStyle}>
          Status
          <select
            style={selectStyle}
            value={filters.status}
            onChange={(event) =>
              onFilterChange({
                status: event.target.value as SafetyAlertFilters["status"],
              })
            }
          >
            <option value="all">Semua status</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </label>

        <label style={labelStyle}>
          Tingkat risiko
          <select
            style={selectStyle}
            value={filters.riskLevel}
            onChange={(event) =>
              onFilterChange({
                riskLevel: event.target
                  .value as SafetyAlertFilters["riskLevel"],
              })
            }
          >
            <option value="all">Semua risiko</option>
            {RISK_OPTIONS.map((level) => (
              <option key={level} value={level}>
                {RISK_LABELS[level]}
              </option>
            ))}
          </select>
        </label>

        <label style={labelStyle}>
          Kategori
          <select
            style={selectStyle}
            value={filters.category}
            onChange={(event) =>
              onFilterChange({
                category: event.target.value as SafetyAlertFilters["category"],
              })
            }
          >
            <option value="all">Semua kategori</option>
            {CATEGORY_OPTIONS.map((category) => (
              <option key={category} value={category}>
                {CATEGORY_LABELS[category]}
              </option>
            ))}
          </select>
        </label>

        {hasFilter ? (
          <button
            type="button"
            onClick={() =>
              onFilterChange({
                status: "all",
                riskLevel: "all",
                category: "all",
              })
            }
            style={{
              ...selectStyle,
              cursor: "pointer",
              color: "var(--tt-dashboard-brand-deep)",
            }}
          >
            Reset filter
          </button>
        ) : null}
      </form>

      {alerts.length === 0 ? (
        <div
          role="status"
          style={{
            ...card,
            padding: "48px 24px",
            display: "grid",
            justifyItems: "center",
            gap: 8,
            textAlign: "center",
          }}
        >
          <ShieldCheck
            size={32}
            aria-hidden="true"
            style={{ color: "var(--tt-dashboard-brand)" }}
          />
          <p
            style={{
              margin: 0,
              fontWeight: 800,
              fontSize: 16,
              color: "var(--tt-dashboard-text)",
            }}
          >
            {hasFilter
              ? "Tidak ada alert yang cocok dengan filter"
              : "Belum ada alert safety"}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              color: "var(--tt-dashboard-text-2)",
            }}
          >
            {hasFilter
              ? "Coba ubah atau reset filter untuk melihat alert lain."
              : "Alert akan muncul di sini saat percakapan terdeteksi berisiko tinggi."}
          </p>
        </div>
      ) : (
        <div style={{ ...card, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <caption
                style={{
                  position: "absolute",
                  width: 1,
                  height: 1,
                  overflow: "hidden",
                  clip: "rect(0 0 0 0)",
                }}
              >
                Daftar alert safety
              </caption>
              <thead>
                <tr>
                  <th scope="col" style={headStyle}>
                    Waktu
                  </th>
                  <th scope="col" style={headStyle}>
                    Kategori
                  </th>
                  <th scope="col" style={headStyle}>
                    Risiko
                  </th>
                  <th scope="col" style={headStyle}>
                    Status
                  </th>
                  <th scope="col" style={headStyle}>
                    <span
                      style={{
                        position: "absolute",
                        width: 1,
                        height: 1,
                        overflow: "hidden",
                        clip: "rect(0 0 0 0)",
                      }}
                    >
                      Aksi
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert) => (
                  <tr key={alert.id}>
                    <td style={cellStyle}>
                      {formatAlertDate(alert.createdAt)}
                    </td>
                    <td style={cellStyle}>{CATEGORY_LABELS[alert.category]}</td>
                    <td style={cellStyle}>
                      <RiskBadge level={alert.riskLevel} />
                    </td>
                    <td style={cellStyle}>
                      <StatusBadge status={alert.status} />
                    </td>
                    <td style={{ ...cellStyle, textAlign: "right" }}>
                      <Link
                        href={`/admin/safety/${alert.id}`}
                        style={{
                          display: "inline-flex",
                          minHeight: 44,
                          alignItems: "center",
                          padding: "0 14px",
                          borderRadius: 10,
                          fontWeight: 700,
                          fontSize: 13,
                          textDecoration: "none",
                          color: "var(--tt-dashboard-active-text)",
                          background: "var(--tt-dashboard-button-bg)",
                        }}
                      >
                        Tinjau
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <nav
            aria-label="Paginasi"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              padding: "12px 16px",
              borderTop: "1px solid var(--tt-dashboard-card-border)",
              fontSize: 13,
              color: "var(--tt-dashboard-text-2)",
            }}
          >
            <span>
              {total.toLocaleString("id-ID")} alert · Halaman {filters.page}{" "}
              dari {totalPages}
            </span>
            <span style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                style={{ ...selectStyle, cursor: "pointer" }}
                disabled={filters.page <= 1}
                onClick={() => onFilterChange({ page: filters.page - 1 })}
              >
                Sebelumnya
              </button>
              <button
                type="button"
                style={{ ...selectStyle, cursor: "pointer" }}
                disabled={filters.page >= totalPages}
                onClick={() => onFilterChange({ page: filters.page + 1 })}
              >
                Berikutnya
              </button>
            </span>
          </nav>
        </div>
      )}
    </div>
  );
}
