"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";

import { RiskBadge, StatusBadge } from "./SafetyBadges";
import {
  CATEGORY_LABELS,
  REVIEW_NOTE_MAX_LENGTH,
  STATUS_LABELS,
  STATUS_OPTIONS,
  formatAlertDate,
  type AlertStatus,
  type SafetyAlertDetail,
} from "./safety-alert-api";

type Props = {
  alert: SafetyAlertDetail;
  isSaving: boolean;
  saveError: string | null;
  isSaved: boolean;
  hasConflict: boolean;
  isReloading: boolean;
  onReload: () => void;
  onEdit: () => void;
  onSubmit: (input: { status: AlertStatus; reviewNote: string }) => void;
};

const card: React.CSSProperties = {
  background: "var(--tt-dashboard-card-bg)",
  border: "1px solid var(--tt-dashboard-card-border)",
  borderRadius: 18,
  boxShadow: "var(--tt-dashboard-card-shadow)",
  padding: 20,
};

const termStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "var(--tt-dashboard-text-2)",
};

const valueStyle: React.CSSProperties = {
  margin: "4px 0 0",
  fontSize: 14,
  fontWeight: 600,
  color: "var(--tt-dashboard-text)",
};

export function SafetyAlertDetailPage({
  alert,
  isSaving,
  saveError,
  isSaved,
  hasConflict,
  isReloading,
  onReload,
  onEdit,
  onSubmit,
}: Props) {
  const [status, setStatus] = useState<AlertStatus>(alert.status);
  const [reviewNote, setReviewNote] = useState(alert.reviewNote ?? "");

  const isDirty =
    status !== alert.status || reviewNote.trim() !== (alert.reviewNote ?? "");
  const isBlocked = isSaving || hasConflict || isReloading;

  return (
    <div
      style={{
        padding: "24px 28px",
        display: "flex",
        flexDirection: "column",
        gap: 20,
        maxWidth: 820,
      }}
    >
      <Link
        href="/admin/safety"
        style={{
          display: "inline-flex",
          minHeight: 44,
          alignItems: "center",
          gap: 6,
          fontSize: 14,
          fontWeight: 700,
          textDecoration: "none",
          color: "var(--tt-dashboard-brand-deep)",
        }}
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Kembali ke daftar alert
      </Link>

      <section aria-labelledby="alert-meta-title" style={card}>
        <h2
          id="alert-meta-title"
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 800,
            color: "var(--tt-dashboard-text)",
          }}
        >
          {CATEGORY_LABELS[alert.category]}
        </h2>
        <p
          style={{
            margin: "6px 0 0",
            fontSize: 13,
            color: "var(--tt-dashboard-text-2)",
          }}
        >
          Isi percakapan dan identitas pengguna tidak ditampilkan di halaman
          ini.
        </p>

        <dl
          style={{
            margin: "16px 0 0",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 16,
          }}
        >
          <div>
            <dt style={termStyle}>Identifier anonim</dt>
            <dd style={{ ...valueStyle, overflowWrap: "anywhere" }}>
              {alert.anonymousUserId}
            </dd>
          </div>
          <div>
            <dt style={termStyle}>Tingkat risiko</dt>
            <dd style={valueStyle}>
              <RiskBadge level={alert.riskLevel} />
            </dd>
          </div>
          <div>
            <dt style={termStyle}>Status</dt>
            <dd style={valueStyle}>
              <StatusBadge status={alert.status} />
            </dd>
          </div>
          <div>
            <dt style={termStyle}>Terdeteksi</dt>
            <dd style={valueStyle}>{formatAlertDate(alert.createdAt)}</dd>
          </div>
          <div>
            <dt style={termStyle}>Terakhir ditinjau</dt>
            <dd style={valueStyle}>
              {alert.reviewedAt
                ? `${formatAlertDate(alert.reviewedAt)}${
                    alert.reviewedByName ? ` oleh ${alert.reviewedByName}` : ""
                  }`
                : "Belum ditinjau"}
            </dd>
          </div>
        </dl>
      </section>

      <form
        aria-labelledby="alert-review-title"
        style={{ ...card, display: "grid", gap: 16 }}
        onSubmit={(event) => {
          event.preventDefault();
          if (isBlocked || !isDirty || !alert.allowedStatuses.includes(status))
            return;
          onSubmit({ status, reviewNote: reviewNote.trim() });
        }}
      >
        <h2
          id="alert-review-title"
          style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 800,
            color: "var(--tt-dashboard-text)",
          }}
        >
          Pembaruan status review
        </h2>

        <fieldset
          disabled={isBlocked}
          style={{ border: 0, margin: 0, padding: 0, display: "grid", gap: 8 }}
        >
          <legend style={{ ...termStyle, marginBottom: 8, padding: 0 }}>
            Status
          </legend>
          {STATUS_OPTIONS.map((option) => (
            <label
              key={option}
              style={{
                display: "flex",
                minHeight: 44,
                alignItems: "center",
                gap: 10,
                padding: "0 12px",
                borderRadius: 12,
                border: "1px solid var(--tt-dashboard-card-border)",
                fontSize: 14,
                fontWeight: 600,
                cursor:
                  isBlocked || !alert.allowedStatuses.includes(option)
                    ? "not-allowed"
                    : "pointer",
                opacity: !alert.allowedStatuses.includes(option) ? 0.5 : 1,
                color: "var(--tt-dashboard-text)",
                background:
                  status === option
                    ? "var(--tt-dashboard-brand-soft-2)"
                    : "transparent",
              }}
            >
              <input
                type="radio"
                name="status"
                value={option}
                checked={status === option}
                disabled={!alert.allowedStatuses.includes(option)}
                onChange={() => {
                  setStatus(option);
                  onEdit();
                }}
              />
              {STATUS_LABELS[option]}
            </label>
          ))}
        </fieldset>

        <p style={{ ...termStyle, margin: 0 }}>
          Review dilakukan berurutan: belum ditinjau, sedang ditinjau, lalu
          selesai. Catatan tetap dapat diperbarui setelah review selesai.
        </p>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={termStyle}>Catatan review (opsional)</span>
          <textarea
            value={reviewNote}
            disabled={isBlocked}
            maxLength={REVIEW_NOTE_MAX_LENGTH}
            rows={4}
            onChange={(event) => {
              setReviewNote(event.target.value);
              onEdit();
            }}
            style={{
              padding: 12,
              borderRadius: 12,
              border: "1px solid var(--tt-dashboard-card-border)",
              fontSize: 14,
              fontFamily: "inherit",
              resize: "vertical",
              color: "var(--tt-dashboard-text)",
              background: "var(--tt-dashboard-card-bg)",
            }}
          />
          <span style={{ fontSize: 12, color: "var(--tt-dashboard-text-2)" }}>
            Jangan menulis isi percakapan atau data pribadi pengguna di catatan.
            Kosongkan untuk menghapus catatan sebelumnya. ({reviewNote.length}/
            {REVIEW_NOTE_MAX_LENGTH})
          </span>
        </label>

        {saveError ? (
          <p
            role="alert"
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 600,
              color: "var(--tt-attention-text)",
            }}
          >
            {saveError}
          </p>
        ) : null}
        {hasConflict ? (
          <div style={{ display: "grid", gap: 8 }}>
            <p style={{ ...termStyle, margin: 0 }}>
              Muat ulang untuk menggunakan data terbaru. Perubahan yang belum
              tersimpan akan diganti.
            </p>
            <button type="button" disabled={isReloading} onClick={onReload}>
              {isReloading ? "Memuat..." : "Muat ulang alert"}
            </button>
          </div>
        ) : null}
        {isSaved && !saveError && !isDirty ? (
          <p
            role="status"
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 600,
              color: "var(--tt-dashboard-success)",
            }}
          >
            Status review berhasil diperbarui.
          </p>
        ) : null}

        <div>
          <button
            type="submit"
            disabled={isBlocked || !isDirty}
            style={{
              minHeight: 44,
              padding: "0 20px",
              borderRadius: 12,
              border: 0,
              fontSize: 14,
              fontWeight: 700,
              cursor: isBlocked || !isDirty ? "not-allowed" : "pointer",
              opacity: isBlocked || !isDirty ? 0.6 : 1,
              color: "var(--tt-dashboard-active-text)",
              background: "var(--tt-dashboard-button-bg)",
            }}
          >
            {isSaving ? "Menyimpan…" : "Simpan perubahan"}
          </button>
        </div>
      </form>
    </div>
  );
}
