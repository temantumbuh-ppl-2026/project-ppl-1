"use client";

// src/components/admin/BraveChoicePage.tsx

import { useState, useEffect, useTransition } from "react";
import {
  createQuizQuestionAction,
  updateQuizQuestionAction,
  deleteQuizQuestionAction,
  toggleQuizQuestionActiveAction,
} from "@/lib/admin/quiz-action";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Search,
  ChevronDown,
  AlertCircle,
  BookOpen,
  Filter,
} from "lucide-react";

export type QuizQuestion = {
  id: string;
  scenario: string;
  category: string;
  optionA: string;
  optionB: string;
  correctOption: string;
  explanationCorrect: string;
  explanationIncorrect: string;
  ageSegment: "ANAK" | "REMAJA" | "MAHASISWA" | "DEWASA_MUDA";
  isActive: boolean;
  createdAt: Date;
};

type Props = {
  initialQuestions: QuizQuestion[];
  onMutationSuccess?: () => void;
};

const SEGMENTS = [
  { value: "ANAK", label: "Anak (10–12 thn)", color: "#3b82f6" },
  { value: "REMAJA", label: "Remaja (13–17 thn)", color: "#8b5cf6" },
  { value: "MAHASISWA", label: "Mahasiswa (18–24 thn)", color: "#1a9688" },
  { value: "DEWASA_MUDA", label: "Dewasa Muda (25+ thn)", color: "#f59e0b" },
] as const;

type Segment = (typeof SEGMENTS)[number]["value"];
const SEG_MAP = Object.fromEntries(SEGMENTS.map((s) => [s.value, s])) as Record<
  Segment,
  (typeof SEGMENTS)[number]
>;

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100, 0] as const;
type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];

// ── Design tokens ─────────────────────────────────────────────────
const C = {
  text: "var(--tt-dashboard-text)",
  text2: "var(--tt-dashboard-text-2)",
  text3: "var(--tt-dashboard-text-3)",
  brand: "var(--tt-dashboard-brand)",
  success: "var(--tt-dashboard-success)",
  warning: "var(--tt-dashboard-warning)",
  danger: "var(--tt-dashboard-danger)",
  card: {
    background: "var(--tt-dashboard-card-bg)",
    border: "1px solid var(--tt-dashboard-card-border)",
    borderRadius: 18,
    boxShadow: "var(--tt-dashboard-card-shadow)",
    backdropFilter: "blur(18px) saturate(160%)",
  } as React.CSSProperties,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 12,
  border: "1.5px solid var(--tt-dashboard-card-border)",
  background: "rgba(255,255,255,0.85)",
  fontSize: 13,
  fontFamily: "inherit",
  color: C.text,
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s",
};
const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
  appearance: "none",
  WebkitAppearance: "none",
};

// Modal-specific
const mInput: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 10,
  border: "1.5px solid #d1ebe8",
  background: "#ffffff",
  fontSize: 14,
  fontFamily: "inherit",
  color: "#1a2e2b",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s",
  lineHeight: 1.5,
};
const mSelect: React.CSSProperties = {
  ...mInput,
  cursor: "pointer",
  appearance: "none",
  WebkitAppearance: "none",
};
const mLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: "#4a7a74",
  display: "block",
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

// ── Responsive hook ───────────────────────────────────────────────
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [breakpoint]);
  return isMobile;
}

// ── Section divider ───────────────────────────────────────────────
function SectionDivider({ label }: { label: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        margin: "4px 0 2px",
      }}
    >
      <div style={{ flex: 1, height: 1, background: "#e0f0ee" }} />
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: "#8bbdb7",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: "#e0f0ee" }} />
    </div>
  );
}

// ── Modal (bottom-sheet on mobile, centered on desktop) ───────────
function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;
  return (
    <>
      <style>{`
        .tt-modal-overlay { display:flex; align-items:center; justify-content:center; padding:16px; }
        .tt-modal-sheet   { border-radius:20px; max-height:90vh; }
        @media (max-width:639px) {
          .tt-modal-overlay { padding:12px; }
          .tt-modal-sheet   { max-height:92vh; }
        }
        .tt-form-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        @media (max-width:480px) {
          .tt-form-grid { grid-template-columns:1fr !important; }
        }
      `}</style>
      <div
        className="tt-modal-overlay"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 999,
          background: "rgba(15,23,30,0.6)",
          backdropFilter: "blur(6px)",
        }}
        onClick={onClose}
      >
        <div
          className="tt-modal-sheet"
          style={{
            width: "100%",
            maxWidth: 600,
            overflowY: "auto",
            background: "#ffffff",
            boxShadow:
              "0 -8px 48px rgba(0,0,0,0.2), 0 4px 24px rgba(0,0,0,0.1)",
            border: "1px solid rgba(0,0,0,0.06)",
            display: "flex",
            flexDirection: "column",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              padding: "14px 20px",
              borderBottom: "1px solid #c8ede9",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#1a9688",
              position: "sticky",
              top: 0,
              zIndex: 1,
              flexShrink: 0,
              borderRadius: "20px 20px 0 0",
            }}
          >
            <p
              style={{
                fontWeight: 700,
                fontSize: 15,
                color: "#fff",
                letterSpacing: "0.01em",
              }}
            >
              {title}
            </p>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                border: "1.5px solid rgba(255,255,255,0.35)",
                background: "rgba(255,255,255,0.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#fff",
              }}
            >
              <X size={14} strokeWidth={2.5} />
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: "20px", background: "#f9fffe", flex: 1 }}>
            {children}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Toggle ────────────────────────────────────────────────────────
function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        width: 42,
        height: 24,
        borderRadius: 100,
        border: "none",
        background: checked ? "#1a9688" : "rgba(0,0,0,0.12)",
        cursor: "pointer",
        position: "relative",
        transition: "background 0.2s",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#fff",
          position: "absolute",
          top: 3,
          left: checked ? 21 : 3,
          transition: "left 0.2s",
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
        }}
      />
    </button>
  );
}

// ── Form Data ─────────────────────────────────────────────────────
type FormData = {
  scenario: string;
  category: string;
  optionA: string;
  optionB: string;
  correctOption: "A" | "B";
  explanationCorrect: string;
  explanationIncorrect: string;
  ageSegment: Segment;
  isActive: boolean;
};
const emptyForm: FormData = {
  scenario: "",
  category: "",
  optionA: "",
  optionB: "",
  correctOption: "A",
  explanationCorrect: "",
  explanationIncorrect: "",
  ageSegment: "ANAK",
  isActive: true,
};

// ── Question Form ─────────────────────────────────────────────────
function QuestionForm({
  initial,
  onSubmit,
  onCancel,
  loading,
}: {
  initial: FormData;
  onSubmit: (d: FormData) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<FormData>(initial);
  function set<K extends keyof FormData>(k: K, v: FormData[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.scenario.trim() || !form.optionA.trim() || !form.optionB.trim())
      return;
    onSubmit(form);
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: 14 }}
    >
      <SectionDivider label="Info Soal" />

      <div className="tt-form-grid">
        <div>
          <label style={mLabel}>
            Kategori <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <input
            type="text"
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
            placeholder="misal: Sosial, Akademik…"
            required
            style={mInput}
          />
        </div>
        <div>
          <label style={mLabel}>
            Segmen Usia <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <div style={{ position: "relative" }}>
            <select
              value={form.ageSegment}
              onChange={(e) => set("ageSegment", e.target.value as Segment)}
              style={{ ...mSelect, paddingRight: 32 }}
            >
              {SEGMENTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              strokeWidth={2}
              style={{
                position: "absolute",
                right: 11,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#8bbdb7",
                pointerEvents: "none",
              }}
            />
          </div>
        </div>
      </div>

      <div>
        <label style={mLabel}>
          Skenario / Pertanyaan <span style={{ color: "#ef4444" }}>*</span>
        </label>
        <textarea
          value={form.scenario}
          onChange={(e) => set("scenario", e.target.value)}
          placeholder="Tulis skenario atau pertanyaan di sini…"
          rows={3}
          required
          style={{ ...mInput, resize: "vertical", minHeight: 88 }}
        />
      </div>

      <SectionDivider label="Pilihan Jawaban" />

      <div className="tt-form-grid">
        <div>
          <label style={mLabel}>
            Pilihan A <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <input
            type="text"
            value={form.optionA}
            onChange={(e) => set("optionA", e.target.value)}
            placeholder="Opsi A…"
            required
            style={mInput}
          />
        </div>
        <div>
          <label style={mLabel}>
            Pilihan B <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <input
            type="text"
            value={form.optionB}
            onChange={(e) => set("optionB", e.target.value)}
            placeholder="Opsi B…"
            required
            style={mInput}
          />
        </div>
      </div>

      <div>
        <label style={mLabel}>Jawaban Benar</label>
        <div style={{ display: "flex", gap: 10 }}>
          {(["A", "B"] as const).map((opt) => {
            const sel = form.correctOption === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => set("correctOption", opt)}
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.15s",
                  border: sel ? "2px solid #1a9688" : "1.5px solid #d1ebe8",
                  background: sel ? "#1a9688" : "#fff",
                  color: sel ? "#fff" : "#4a7a74",
                  boxShadow: sel ? "0 3px 12px rgba(26,150,136,0.25)" : "none",
                }}
              >
                {sel ? "✓ " : ""}Pilihan {opt}
              </button>
            );
          })}
        </div>
      </div>

      <SectionDivider label="Penjelasan" />

      <div>
        <label style={{ ...mLabel, color: "#1a9688" }}>
          ✓ Penjelasan Jawaban Benar
        </label>
        <textarea
          value={form.explanationCorrect}
          onChange={(e) => set("explanationCorrect", e.target.value)}
          placeholder="Penjelasan mengapa jawaban ini benar…"
          rows={3}
          style={{
            ...mInput,
            resize: "vertical",
            border: "1.5px solid #b6ddd9",
            background: "#f0faf9",
          }}
        />
      </div>

      <div>
        <label style={{ ...mLabel, color: "#b45309" }}>
          ✕ Penjelasan Jawaban Salah
        </label>
        <textarea
          value={form.explanationIncorrect}
          onChange={(e) => set("explanationIncorrect", e.target.value)}
          placeholder="Penjelasan mengapa jawaban ini salah…"
          rows={3}
          style={{
            ...mInput,
            resize: "vertical",
            border: "1.5px solid #fcd9aa",
            background: "#fffbf5",
          }}
        />
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 14,
          borderTop: "1px solid #e0f0ee",
          marginTop: 2,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            cursor: "pointer",
          }}
          onClick={() => set("isActive", !form.isActive)}
        >
          <Toggle
            checked={form.isActive}
            onChange={(v) => set("isActive", v)}
          />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#4a7a74" }}>
            Soal aktif
          </span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              height: 44,
              padding: "0 20px",
              borderRadius: 10,
              border: "1.5px solid #d1ebe8",
              background: "#fff",
              color: "#4a7a74",
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              height: 44,
              padding: "0 24px",
              borderRadius: 10,
              background: loading ? "rgba(26,150,136,0.5)" : "#1a9688",
              border: "none",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "inherit",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "0 4px 14px rgba(26,150,136,0.3)",
              display: "flex",
              alignItems: "center",
              gap: 7,
            }}
          >
            {loading ? (
              "Menyimpan…"
            ) : (
              <>
                <Check size={14} strokeWidth={2.5} /> Simpan
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}

// ── Delete Confirm ────────────────────────────────────────────────
function DeleteConfirm({
  open,
  question,
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean;
  question: QuizQuestion | null;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <Modal open={open} onClose={onCancel} title="Hapus Soal">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div
          style={{
            display: "flex",
            gap: 12,
            padding: "14px 16px",
            borderRadius: 13,
            background: "rgba(239,68,68,0.07)",
            border: "1px solid rgba(239,68,68,0.18)",
            alignItems: "flex-start",
          }}
        >
          <AlertCircle
            size={17}
            strokeWidth={2}
            color="#ef4444"
            style={{ flexShrink: 0, marginTop: 1 }}
          />
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#ef4444" }}>
              Tindakan ini tidak bisa dibatalkan
            </p>
            <p
              style={{
                fontSize: 12,
                color: C.text2,
                marginTop: 4,
                lineHeight: 1.5,
              }}
            >
              Soal ini akan dihapus permanen dari database.
            </p>
          </div>
        </div>
        {question && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: 13,
              background: "rgba(0,0,0,0.04)",
              border: "1px solid var(--tt-dashboard-card-border)",
            }}
          >
            <p style={{ fontSize: 11, color: C.text3, marginBottom: 4 }}>
              Soal yang akan dihapus:
            </p>
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: C.text,
                lineHeight: 1.5,
              }}
            >
              {question.scenario}
            </p>
          </div>
        )}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              height: 44,
              padding: "0 20px",
              borderRadius: 10,
              border: "1.5px solid #d1ebe8",
              background: "#fff",
              color: "#4a7a74",
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              height: 44,
              padding: "0 22px",
              borderRadius: 10,
              background: loading ? "rgba(239,68,68,0.5)" : "#ef4444",
              border: "none",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "inherit",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              boxShadow: loading ? "none" : "0 4px 14px rgba(239,68,68,0.25)",
            }}
          >
            {loading ? (
              "Menghapus…"
            ) : (
              <>
                <Trash2 size={13} strokeWidth={2} /> Hapus
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Mobile Question Card ──────────────────────────────────────────
function QuestionCard({
  q,
  index,
  onEdit,
  onDelete,
  onToggle,
}: {
  q: QuizQuestion;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const seg = SEG_MAP[q.ageSegment];
  return (
    <div
      style={{
        ...C.card,
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        borderRadius: 14,
      }}
    >
      {/* Top: badges + actions */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <span
            style={{
              fontSize: 10,
              color: C.text3,
              fontVariantNumeric: "tabular-nums",
              alignSelf: "center",
            }}
          >
            #{index}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "3px 10px",
              borderRadius: 100,
              background: seg.color + "18",
              color: seg.color,
            }}
          >
            {seg.label}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: "3px 10px",
              borderRadius: 100,
              background: "rgba(0,0,0,0.05)",
              color: C.text3,
            }}
          >
            {q.category}
          </span>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button
            type="button"
            onClick={onEdit}
            title="Edit"
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              border: "1px solid var(--tt-dashboard-card-border)",
              background: "rgba(26,150,136,0.08)",
              color: C.brand,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <Pencil size={13} strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            title="Hapus"
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              border: "1px solid rgba(239,68,68,0.2)",
              background: "rgba(239,68,68,0.07)",
              color: C.danger,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <Trash2 size={13} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Skenario */}
      <p
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: C.text,
          lineHeight: 1.5,
        }}
      >
        {q.scenario}
      </p>

      {/* Pilihan A & B */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {(["A", "B"] as const).map((opt) => {
          const isCorrect = q.correctOption === opt;
          return (
            <div
              key={opt}
              style={{
                padding: "8px 12px",
                borderRadius: 10,
                fontSize: 12,
                border: `1.5px solid ${isCorrect ? "#b6ddd9" : "var(--tt-dashboard-card-border)"}`,
                background: isCorrect ? "#f0faf9" : "rgba(0,0,0,0.02)",
                color: isCorrect ? "#1a9688" : C.text2,
                fontWeight: isCorrect ? 700 : 400,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  marginRight: 4,
                  opacity: 0.7,
                }}
              >
                {opt}.
              </span>
              {opt === "A" ? q.optionA : q.optionB}
              {isCorrect && (
                <span style={{ marginLeft: 4, fontSize: 10 }}>✓</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer: status toggle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 8,
          borderTop: "1px solid var(--tt-dashboard-card-border)",
        }}
      >
        <span
          style={{
            fontSize: 12,
            color: q.isActive ? C.success : C.text3,
            fontWeight: 600,
          }}
        >
          {q.isActive ? "● Aktif" : "○ Nonaktif"}
        </span>
        <Toggle checked={q.isActive} onChange={onToggle} />
      </div>
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────────
function PaginationBar({
  total,
  pageSize,
  currentPage,
  onPageChange,
  onPageSizeChange,
}: {
  total: number;
  pageSize: PageSizeOption;
  currentPage: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: PageSizeOption) => void;
}) {
  const isAll = pageSize === 0;
  const totalPages = isAll ? 1 : Math.ceil(total / pageSize);
  const from = isAll ? 1 : (currentPage - 1) * pageSize + 1;
  const to = isAll ? total : Math.min(currentPage * pageSize, total);

  const btnBase: React.CSSProperties = {
    width: 34,
    height: 34,
    borderRadius: 9,
    border: "1.5px solid var(--tt-dashboard-card-border)",
    background: "rgba(255,255,255,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: C.text2,
    flexShrink: 0,
  };

  const btnActive: React.CSSProperties = {
    ...btnBase,
    background: "#1a9688",
    borderColor: "#1a9688",
    color: "#fff",
    fontWeight: 700,
  };

  function pageNumbers(): (number | "…")[] {
    if (totalPages <= 7)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = new Set<number>([1, totalPages, currentPage]);
    if (currentPage > 1) pages.add(currentPage - 1);
    if (currentPage < totalPages) pages.add(currentPage + 1);
    const sorted = Array.from(pages).sort((a, b) => a - b);
    const result: (number | "…")[] = [];
    let prev = 0;
    for (const p of sorted) {
      if (p - prev > 1) result.push("…");
      result.push(p);
      prev = p;
    }
    return result;
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 10,
        padding: "12px 16px",
        borderTop: "1px solid var(--tt-dashboard-card-border)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <p style={{ fontSize: 12, color: C.text3, whiteSpace: "nowrap" }}>
          Tampilkan
        </p>
        <div style={{ position: "relative" }}>
          <select
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value) as PageSizeOption);
              onPageChange(1);
            }}
            style={{
              ...selectStyle,
              width: "auto",
              height: 34,
              padding: "0 28px 0 10px",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {PAGE_SIZE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt === 0 ? "Semua" : `${opt} baris`}
              </option>
            ))}
          </select>
          <ChevronDown
            size={12}
            strokeWidth={2}
            style={{
              position: "absolute",
              right: 9,
              top: "50%",
              transform: "translateY(-50%)",
              color: C.text3,
              pointerEvents: "none",
            }}
          />
        </div>
        <p style={{ fontSize: 12, color: C.text3, whiteSpace: "nowrap" }}>
          {total === 0 ? "0" : `${from}–${to}`} / {total} soal
        </p>
      </div>

      {!isAll && totalPages > 1 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            flexWrap: "wrap",
          }}
        >
          {pageNumbers().map((p, i) =>
            p === "…" ? (
              <span
                key={`e-${i}`}
                style={{
                  width: 34,
                  height: 34,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  color: C.text3,
                }}
              >
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p as number)}
                style={p === currentPage ? btnActive : btnBase}
              >
                <span style={{ fontSize: 12 }}>{p}</span>
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────
export function BraveChoicePage({
  initialQuestions,
  onMutationSuccess,
}: Props) {
  const isMobile = useIsMobile();
  const [, startTransition] = useTransition();

  const [questions, setQuestions] = useState<QuizQuestion[]>(initialQuestions);

  // Sync with props when revalidated
  useEffect(() => {
    setQuestions(initialQuestions);
  }, [initialQuestions]);

  const [search, setSearch] = useState("");
  const [segFilter, setSegFilter] = useState<Segment | "all">("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [showFilters, setShowFilters] = useState(false);

  const [pageSize, setPageSize] = useState<PageSizeOption>(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [modalState, setModalState] = useState<"none" | "create" | "edit">(
    "none",
  );
  const [editTarget, setEditTarget] = useState<QuizQuestion | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<QuizQuestion | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = questions.filter((q) => {
    const matchSearch =
      !search.trim() ||
      q.scenario.toLowerCase().includes(search.toLowerCase()) ||
      q.category.toLowerCase().includes(search.toLowerCase());
    const matchSeg = segFilter === "all" || q.ageSegment === segFilter;
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && q.isActive) ||
      (statusFilter === "inactive" && !q.isActive);
    return matchSearch && matchSeg && matchStatus;
  });

  function handleSearch(v: string) {
    setSearch(v);
    setCurrentPage(1);
  }
  function handleSegFilter(v: Segment | "all") {
    setSegFilter(v);
    setCurrentPage(1);
  }
  function handleStatusFilter(v: "all" | "active" | "inactive") {
    setStatusFilter(v);
    setCurrentPage(1);
  }

  const paginated =
    pageSize === 0
      ? filtered
      : filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const activeCount = questions.filter((q) => q.isActive).length;

  async function handleCreate(data: FormData) {
    setSaving(true);
    setError(null);
    try {
      const result = await createQuizQuestionAction(data);
      if (!result.success) {
        setError(result.error);
      } else {
        setModalState("none");
        onMutationSuccess?.();
      }
    } catch {
      setError("Gagal menyimpan soal. Silakan coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(data: FormData) {
    if (!editTarget) return;
    setSaving(true);
    setError(null);
    try {
      const result = await updateQuizQuestionAction({
        id: editTarget.id,
        ...data,
      });
      if (!result.success) {
        setError(result.error);
      } else {
        setModalState("none");
        setEditTarget(null);
        onMutationSuccess?.();
      }
    } catch {
      setError("Gagal mengubah soal. Silakan coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);
    try {
      const result = await deleteQuizQuestionAction(deleteTarget.id);
      if (!result.success) {
        setError(result.error);
      } else {
        setDeleteTarget(null);
        onMutationSuccess?.();
      }
    } catch {
      setError("Gagal menghapus soal. Silakan coba lagi.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleToggleActive(q: QuizQuestion) {
    startTransition(async () => {
      // Optimistic update
      setQuestions((prev) =>
        prev.map((item) =>
          item.id === q.id ? { ...item, isActive: !item.isActive } : item,
        ),
      );

      const result = await toggleQuizQuestionActiveAction(q.id);
      if (!result.success) {
        // Revert optimistic update on failure
        setQuestions((prev) =>
          prev.map((item) =>
            item.id === q.id ? { ...item, isActive: !item.isActive } : item,
          ),
        );
        setError(result.error);
      }
    });
  }

  const pad = isMobile ? "14px" : "24px 28px";

  return (
    <div
      style={{
        padding: pad,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* Error banner */}
      {error && (
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            padding: "12px 16px",
            borderRadius: 13,
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
          }}
        >
          <AlertCircle size={15} strokeWidth={2} color={C.danger} />
          <p style={{ fontSize: 13, color: C.danger, flex: 1 }}>{error}</p>
          <button
            type="button"
            onClick={() => setError(null)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: C.danger,
            }}
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>
      )}

      {/* ── Top bar ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        {/* Stats */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { label: "Total", value: questions.length, color: C.brand },
            { label: "Aktif", value: activeCount, color: C.success },
            {
              label: "Nonaktif",
              value: questions.length - activeCount,
              color: C.text3,
            },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                ...C.card,
                padding: isMobile ? "8px 12px" : "10px 18px",
                display: "flex",
                alignItems: "baseline",
                gap: 6,
              }}
            >
              <p
                style={{
                  fontSize: isMobile ? 18 : 24,
                  fontWeight: 900,
                  color: s.color,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {s.value}
              </p>
              <p style={{ fontSize: 10, fontWeight: 600, color: C.text3 }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Tambah button */}
        <button
          type="button"
          onClick={() => {
            setModalState("create");
            setEditTarget(null);
          }}
          style={{
            height: 42,
            padding: "0 18px",
            borderRadius: 13,
            background: "var(--tt-dashboard-button-bg)",
            border: "none",
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            fontFamily: "inherit",
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(26,150,136,0.3)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            whiteSpace: "nowrap",
          }}
        >
          <Plus size={16} strokeWidth={2.5} />
          {isMobile ? "Tambah" : "Tambah Soal"}
        </button>
      </div>

      {/* ── Filters ── */}
      {isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Search + filter toggle */}
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search
                size={14}
                strokeWidth={2}
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: C.text3,
                  pointerEvents: "none",
                }}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Cari skenario atau kategori…"
                style={{ ...inputStyle, height: 42, paddingLeft: 36 }}
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                flexShrink: 0,
                border: showFilters
                  ? "1.5px solid var(--tt-dashboard-brand)"
                  : "1.5px solid var(--tt-dashboard-card-border)",
                background: showFilters
                  ? "rgba(26,150,136,0.08)"
                  : "rgba(255,255,255,0.85)",
                color: showFilters ? C.brand : C.text3,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <Filter size={15} strokeWidth={2} />
            </button>
          </div>

          {/* Collapsible filter panel */}
          {showFilters && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ position: "relative" }}>
                <select
                  value={segFilter}
                  onChange={(e) =>
                    handleSegFilter(e.target.value as Segment | "all")
                  }
                  style={{ ...selectStyle, height: 42, paddingRight: 32 }}
                >
                  <option value="all">Semua Segmen</option>
                  {SEGMENTS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={13}
                  strokeWidth={2}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: C.text3,
                    pointerEvents: "none",
                  }}
                />
              </div>
              <div style={{ position: "relative" }}>
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    handleStatusFilter(
                      e.target.value as "all" | "active" | "inactive",
                    )
                  }
                  style={{ ...selectStyle, height: 42, paddingRight: 32 }}
                >
                  <option value="all">Semua Status</option>
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                </select>
                <ChevronDown
                  size={13}
                  strokeWidth={2}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: C.text3,
                    pointerEvents: "none",
                  }}
                />
              </div>
              <p style={{ fontSize: 12, color: C.text3 }}>
                {filtered.length} dari {questions.length} soal
              </p>
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div
            style={{
              position: "relative",
              flex: 1,
              minWidth: 200,
              maxWidth: 360,
            }}
          >
            <Search
              size={14}
              strokeWidth={2}
              style={{
                position: "absolute",
                left: 13,
                top: "50%",
                transform: "translateY(-50%)",
                color: C.text3,
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Cari skenario atau kategori…"
              style={{ ...inputStyle, height: 40, paddingLeft: 36 }}
            />
          </div>
          <div style={{ position: "relative" }}>
            <select
              value={segFilter}
              onChange={(e) =>
                handleSegFilter(e.target.value as Segment | "all")
              }
              style={{
                ...selectStyle,
                height: 40,
                paddingRight: 32,
                minWidth: 165,
              }}
            >
              <option value="all">Semua Segmen</option>
              {SEGMENTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              strokeWidth={2}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: C.text3,
                pointerEvents: "none",
              }}
            />
          </div>
          <div style={{ position: "relative" }}>
            <select
              value={statusFilter}
              onChange={(e) =>
                handleStatusFilter(
                  e.target.value as "all" | "active" | "inactive",
                )
              }
              style={{
                ...selectStyle,
                height: 40,
                paddingRight: 32,
                minWidth: 130,
              }}
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
            <ChevronDown
              size={13}
              strokeWidth={2}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: C.text3,
                pointerEvents: "none",
              }}
            />
          </div>
          <p style={{ fontSize: 12, color: C.text3, whiteSpace: "nowrap" }}>
            {filtered.length} dari {questions.length} soal
          </p>
        </div>
      )}

      {/* ── Content ── */}
      {filtered.length === 0 ? (
        <div
          style={{
            ...C.card,
            padding: 60,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            color: C.text3,
          }}
        >
          <BookOpen size={36} strokeWidth={1.2} />
          <p style={{ fontSize: 14, fontWeight: 600 }}>
            Tidak ada soal ditemukan
          </p>
          <p style={{ fontSize: 12 }}>
            Coba ubah filter atau tambahkan soal baru.
          </p>
        </div>
      ) : isMobile ? (
        /* Mobile: card list + pagination */
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {paginated.map((q, i) => {
            const rowNumber =
              pageSize === 0 ? i + 1 : (currentPage - 1) * pageSize + i + 1;
            return (
              <QuestionCard
                key={q.id}
                q={q}
                index={rowNumber}
                onEdit={() => {
                  setEditTarget(q);
                  setModalState("edit");
                }}
                onDelete={() => setDeleteTarget(q)}
                onToggle={() => handleToggleActive(q)}
              />
            );
          })}
          <div style={{ ...C.card, borderRadius: 14, overflow: "hidden" }}>
            <PaginationBar
              total={filtered.length}
              pageSize={pageSize}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      ) : (
        /* Desktop: table */
        <div style={{ ...C.card, overflow: "hidden" }}>
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 760,
              }}
            >
              <thead>
                <tr style={{ background: "rgba(26,150,136,0.04)" }}>
                  {[
                    "#",
                    "Kategori",
                    "Skenario",
                    "Pilihan A",
                    "Pilihan B",
                    "Benar",
                    "Segmen",
                    "Status",
                    "Aksi",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "11px 14px",
                        fontSize: 10,
                        fontWeight: 700,
                        color: C.text3,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        borderBottom:
                          "1px solid var(--tt-dashboard-card-border)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((q, i) => {
                  const seg = SEG_MAP[q.ageSegment];
                  const rowNumber =
                    pageSize === 0
                      ? i + 1
                      : (currentPage - 1) * pageSize + i + 1;
                  return (
                    <tr
                      key={q.id}
                      style={{
                        background:
                          i % 2 === 0
                            ? "transparent"
                            : "rgba(26,150,136,0.015)",
                      }}
                    >
                      <td
                        style={{
                          padding: "12px 14px",
                          fontSize: 11,
                          color: C.text3,
                          borderBottom:
                            "1px solid var(--tt-dashboard-card-border)",
                          whiteSpace: "nowrap",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {rowNumber}
                      </td>
                      <td
                        style={{
                          padding: "12px 14px",
                          fontSize: 12,
                          color: C.text3,
                          borderBottom:
                            "1px solid var(--tt-dashboard-card-border)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {q.category}
                      </td>
                      <td
                        style={{
                          padding: "12px 14px",
                          fontSize: 13,
                          color: C.text,
                          borderBottom:
                            "1px solid var(--tt-dashboard-card-border)",
                          maxWidth: 240,
                        }}
                      >
                        <p
                          style={{
                            fontWeight: 600,
                            lineHeight: 1.4,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {q.scenario}
                        </p>
                      </td>
                      <td
                        style={{
                          padding: "12px 14px",
                          fontSize: 12,
                          color: C.text2,
                          borderBottom:
                            "1px solid var(--tt-dashboard-card-border)",
                          maxWidth: 130,
                        }}
                      >
                        <span
                          style={{
                            display: "block",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {q.optionA}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "12px 14px",
                          fontSize: 12,
                          color: C.text2,
                          borderBottom:
                            "1px solid var(--tt-dashboard-card-border)",
                          maxWidth: 130,
                        }}
                      >
                        <span
                          style={{
                            display: "block",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {q.optionB}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "12px 14px",
                          borderBottom:
                            "1px solid var(--tt-dashboard-card-border)",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            padding: "3px 10px",
                            borderRadius: 100,
                            background: "var(--tt-dashboard-success-soft)",
                            color: C.success,
                          }}
                        >
                          {q.correctOption}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "12px 14px",
                          borderBottom:
                            "1px solid var(--tt-dashboard-card-border)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "3px 10px",
                            borderRadius: 100,
                            background: seg.color + "18",
                            color: seg.color,
                          }}
                        >
                          {seg.label}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "12px 14px",
                          borderBottom:
                            "1px solid var(--tt-dashboard-card-border)",
                        }}
                      >
                        <Toggle
                          checked={q.isActive}
                          onChange={() => handleToggleActive(q)}
                        />
                      </td>
                      <td
                        style={{
                          padding: "12px 14px",
                          borderBottom:
                            "1px solid var(--tt-dashboard-card-border)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            type="button"
                            onClick={() => {
                              setEditTarget(q);
                              setModalState("edit");
                            }}
                            title="Edit"
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 9,
                              border:
                                "1px solid var(--tt-dashboard-card-border)",
                              background: "rgba(26,150,136,0.08)",
                              color: C.brand,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                            }}
                          >
                            <Pencil size={13} strokeWidth={2} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(q)}
                            title="Hapus"
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 9,
                              border: "1px solid rgba(239,68,68,0.2)",
                              background: "rgba(239,68,68,0.07)",
                              color: C.danger,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                            }}
                          >
                            <Trash2 size={13} strokeWidth={2} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <PaginationBar
            total={filtered.length}
            pageSize={pageSize}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
        </div>
      )}

      {/* Modals */}
      <Modal
        open={modalState === "create"}
        onClose={() => setModalState("none")}
        title="Tambah Soal Baru"
      >
        <QuestionForm
          initial={emptyForm}
          onSubmit={handleCreate}
          onCancel={() => setModalState("none")}
          loading={saving}
        />
      </Modal>

      <Modal
        open={modalState === "edit" && !!editTarget}
        onClose={() => {
          setModalState("none");
          setEditTarget(null);
        }}
        title="Edit Soal"
      >
        {editTarget && (
          <QuestionForm
            initial={{
              scenario: editTarget.scenario,
              category: editTarget.category,
              optionA: editTarget.optionA,
              optionB: editTarget.optionB,
              correctOption: editTarget.correctOption as "A" | "B",
              explanationCorrect: editTarget.explanationCorrect,
              explanationIncorrect: editTarget.explanationIncorrect,
              ageSegment: editTarget.ageSegment,
              isActive: editTarget.isActive,
            }}
            onSubmit={handleEdit}
            onCancel={() => {
              setModalState("none");
              setEditTarget(null);
            }}
            loading={saving}
          />
        )}
      </Modal>

      <DeleteConfirm
        open={!!deleteTarget}
        question={deleteTarget}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
