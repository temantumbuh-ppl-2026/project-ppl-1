import {
  RISK_LABELS,
  STATUS_LABELS,
  type AlertRiskLevel,
  type AlertStatus,
} from "./safety-alert-api";

const BADGE_BASE: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "3px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
  whiteSpace: "nowrap",
  border: "1px solid transparent",
};

const RISK_STYLES: Record<AlertRiskLevel, React.CSSProperties> = {
  HIGH: {
    color: "var(--tt-attention-text)",
    background: "var(--tt-attention-bg)",
    borderColor: "var(--tt-attention-border)",
  },
  ATTENTION: {
    color: "var(--tt-dashboard-warning)",
    background: "var(--tt-dashboard-warning-soft)",
    borderColor: "var(--tt-dashboard-warning-soft)",
  },
};

const STATUS_STYLES: Record<AlertStatus, React.CSSProperties> = {
  OPEN: {
    color: "var(--tt-info-text)",
    background: "var(--tt-info-bg)",
  },
  REVIEWED: {
    color: "var(--tt-dashboard-warning)",
    background: "var(--tt-dashboard-warning-soft)",
  },
  RESOLVED: {
    color: "var(--tt-dashboard-success)",
    background: "var(--tt-dashboard-success-soft)",
  },
};

export function RiskBadge({ level }: { level: AlertRiskLevel }) {
  return (
    <span style={{ ...BADGE_BASE, ...RISK_STYLES[level] }}>
      {RISK_LABELS[level]}
    </span>
  );
}

export function StatusBadge({ status }: { status: AlertStatus }) {
  return (
    <span style={{ ...BADGE_BASE, ...STATUS_STYLES[status] }}>
      {STATUS_LABELS[status]}
    </span>
  );
}
