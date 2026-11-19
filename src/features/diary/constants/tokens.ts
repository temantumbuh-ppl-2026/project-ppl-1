// ============================================================
//  src/features/diary/constants/tokens.ts
//  Design tokens warna & tipografi TemanTumbuh
// ============================================================

// Legacy keys are retained for FE-07 callers; negative colours resolve to attention.
export const colors = {
  ink: "var(--tt-primary-700)",
  inkD: "var(--tt-primary-900)",
  inkM: "var(--tt-primary-500)",
  inkL: "var(--tt-primary-200)",
  inkS: "var(--tt-primary-50)",
  inkT: "var(--tt-primary-100)",
  bg: "var(--tt-gray-50)",
  white: "var(--tt-surface)",
  text: "var(--tt-gray-900)",
  muted: "var(--tt-gray-600)",
  sub: "var(--tt-gray-600)",
  bdL: "var(--tt-primary-200)",
  bd: "var(--tt-gray-200)",
  ok: "var(--tt-success-text)",
  okL: "var(--tt-success-bg)",
  okD: "var(--tt-success-text)",
  gold: "var(--tt-warning-text)",
  goldL: "var(--tt-warning-text)",
  goldS: "var(--tt-warning-bg)",
  orange: "var(--tt-attention-text)",
  orangeL: "var(--tt-attention-bg)",
  red: "var(--tt-attention-text)",
  redL: "var(--tt-attention-bg)",
  redD: "var(--tt-attention-text)",
  amber: "var(--tt-warning-text)",
  amberL: "var(--tt-warning-bg)",
  amberB: "var(--tt-attention-border)",
  paper: "var(--tt-surface)",
  paperL: "var(--tt-gray-50)",
  spine: "var(--tt-gray-200)",
} as const;

export const fonts = {
  sans: "var(--tt-font-sans)",
  serif: "var(--tt-font-sans)",
} as const;
