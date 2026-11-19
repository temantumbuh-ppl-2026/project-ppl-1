"use client";

// src/components/admin/UsersPage.tsx
// Full CRUD: Add, Edit, Delete, Toggle Status, Toggle Premium, View Detail, Link Parent

import {
  updateUserAction,
  deleteUserAction,
  toggleStatusAction,
  togglePremiumAction,
  linkParentAction,
  unlinkParentAction,
} from "@/lib/admin/action";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  Mail,
  Calendar,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  Power,
  Crown,
  Users as UsersIcon,
  X,
  Check,
  AlertCircle,
  ChevronDown,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────
type User = {
  id: string;
  name: string;
  email: string;
  isPremium: boolean;
  status: string;
  createdAt: Date;
  birthYear: number | null;
  gender: string | null;
  profileFilled: boolean;
  currentStreak: number;
  parentEmail?: string | null;
};

type Props = {
  users: User[];
  total: number;
  page: number;
  limit: number;
  currentSearch: string;
  currentFilter: string;
};

const MOBILE_BREAKPOINT = 768;
const LIMIT_OPTIONS = [5, 10, 25, 50, 100, 0]; // 0 = semua

// ── Hooks & helpers ──────────────────────────────────────────────
function useIsMobile(breakpoint = MOBILE_BREAKPOINT) {
  const [m, setM] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    setM(mq.matches);
    const h = (e: MediaQueryListEvent) => setM(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, [breakpoint]);
  return m;
}

function fmt(date: Date) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
function fmtLong(date: Date) {
  return new Date(date).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}
function resolveAge(birthYear: number | null) {
  if (!birthYear) return "—";
  return `${new Date().getFullYear() - birthYear} thn`;
}
function limitLabel(n: number) {
  return n === 0 ? "Semua" : `${n}`;
}

// ── Tokens ────────────────────────────────────────────────────────
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
  th: {
    textAlign: "left" as const,
    padding: "11px 16px",
    fontSize: 10,
    fontWeight: 700,
    color: "var(--tt-dashboard-text-3)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    borderBottom: "1px solid var(--tt-dashboard-card-border)",
    whiteSpace: "nowrap" as const,
  },
  td: {
    padding: "12px 16px",
    fontSize: 13,
    color: "var(--tt-dashboard-text-2)",
    borderBottom: "1px solid var(--tt-dashboard-card-border)",
    verticalAlign: "middle" as const,
  },
};

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
const mLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: "#4a7a74",
  display: "block",
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

// ── Small components ─────────────────────────────────────────────
function Badge({
  label,
  variant,
}: {
  label: string;
  variant: "success" | "warning" | "danger" | "muted";
}) {
  const map = {
    success: { bg: "var(--tt-dashboard-success-soft)", color: C.success },
    warning: { bg: "var(--tt-dashboard-warning-soft)", color: C.warning },
    danger: { bg: "rgba(239,68,68,0.1)", color: C.danger },
    muted: { bg: "var(--tt-dashboard-chip-bg)", color: C.text3 },
  };
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        padding: "3px 10px",
        borderRadius: 100,
        background: map[variant].bg,
        color: map[variant].color,
        whiteSpace: "nowrap",
        display: "inline-block",
      }}
    >
      {label}
    </span>
  );
}

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.31,
        background: "linear-gradient(135deg, #1a9688 0%, #0f7a6e 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 800,
        fontSize: size * 0.34,
        color: "#fff",
        flexShrink: 0,
      }}
    >
      {initials(name)}
    </div>
  );
}

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

// ── Modal ─────────────────────────────────────────────────────────
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
        .tt-um-overlay { display:flex; align-items:center; justify-content:center; padding:16px; }
        .tt-um-sheet   { border-radius:20px; max-height:90vh; }
        @media (max-width:639px) {
          .tt-um-overlay { padding:12px; }
          .tt-um-sheet   { max-height:92vh; }
        }
      `}</style>
      <div
        className="tt-um-overlay"
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
          className="tt-um-sheet"
          style={{
            width: "100%",
            maxWidth: 540,
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
            <p style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>
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
          <div style={{ padding: "20px", background: "#f9fffe", flex: 1 }}>
            {children}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Action Dropdown Menu (Portal-based) ───────────────────────────
type MenuItem = {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  divider?: boolean;
};

function ActionMenu({ items }: { items: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null,
  );
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Recalculate position on open
  const handleOpen = () => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const menuWidth = 220;
    const spaceBelow = window.innerHeight - rect.bottom;
    const menuHeight = items.length * 42 + 16; // rough estimate

    const top =
      spaceBelow > menuHeight ? rect.bottom + 6 : rect.top - menuHeight - 6;

    const left = rect.right - menuWidth;

    setCoords({ top, left });
    setOpen(true);
  };

  // Close on outside click / escape / scroll
  useEffect(() => {
    if (!open) return;

    function onDocClick(e: MouseEvent) {
      if (btnRef.current && btnRef.current.contains(e.target as Node)) return;
      if (menuRef.current && menuRef.current.contains(e.target as Node)) return;
      setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onScroll() {
      setOpen(false);
    }

    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  const dropdown =
    open && coords
      ? createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              minWidth: 220,
              zIndex: 9999,
              background: "#fff",
              borderRadius: 12,
              border: "1px solid var(--tt-dashboard-card-border)",
              boxShadow:
                "0 10px 36px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.06)",
              padding: 6,
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            {items.map((it, idx) => (
              <div key={idx}>
                {it.divider && (
                  <div
                    style={{
                      height: 1,
                      background: "var(--tt-dashboard-card-border)",
                      margin: "4px 0",
                    }}
                  />
                )}
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    it.onClick();
                  }}
                  style={{
                    width: "100%",
                    border: "none",
                    background: "transparent",
                    padding: "9px 12px",
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: "inherit",
                    color: it.danger ? C.danger : C.text2,
                    fontSize: 13,
                    fontWeight: 500,
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = it.danger
                      ? "rgba(239,68,68,0.07)"
                      : "rgba(26,150,136,0.07)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <span
                    style={{
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 16,
                    }}
                  >
                    {it.icon}
                  </span>
                  <span>{it.label}</span>
                </button>
              </div>
            ))}
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={open ? () => setOpen(false) : handleOpen}
        title="Aksi"
        style={{
          width: 32,
          height: 32,
          borderRadius: 9,
          border: "1px solid var(--tt-dashboard-card-border)",
          background: open ? "rgba(26,150,136,0.12)" : "rgba(255,255,255,0.7)",
          color: C.text2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "all 0.15s",
        }}
      >
        <MoreVertical size={14} strokeWidth={2} />
      </button>
      {dropdown}
    </>
  );
}

// ── Filter Bar ────────────────────────────────────────────────────
function FilterBar({
  currentSearch,
  currentFilter,
  currentLimit,
  isMobile,
}: {
  currentSearch: string;
  currentFilter: string;
  currentLimit: number;
  isMobile: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const navigate = useCallback(
    (search: string, filter: string, limit: number, page = 1) => {
      const sp = new URLSearchParams();
      if (search) sp.set("search", search);
      if (filter && filter !== "all") sp.set("filter", filter);
      if (limit !== 10) sp.set("limit", String(limit));
      if (page > 1) sp.set("page", String(page));
      startTransition(() => {
        router.push(`/admin/users${sp.toString() ? `?${sp.toString()}` : ""}`);
      });
    },
    [router],
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        gap: 10,
        alignItems: isMobile ? "stretch" : "center",
        flexWrap: "wrap",
      }}
    >
      {/* Search form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          navigate(String(fd.get("search") ?? ""), currentFilter, currentLimit);
        }}
        style={{
          display: "flex",
          gap: 8,
          flex: isMobile ? "1 1 auto" : 1,
          minWidth: 0,
          width: isMobile ? "100%" : undefined,
        }}
      >
        <div
          style={{
            position: "relative",
            flex: 1,
            minWidth: 0,
            maxWidth: isMobile ? "100%" : 360,
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
              color: "var(--tt-dashboard-text-3)",
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            name="search"
            defaultValue={currentSearch}
            placeholder="Cari nama atau email…"
            style={{
              width: "100%",
              height: 42,
              paddingLeft: 36,
              paddingRight: 14,
              borderRadius: 12,
              border: "1.5px solid var(--tt-dashboard-card-border)",
              background: "rgba(255,255,255,0.75)",
              fontSize: 13,
              fontFamily: "inherit",
              color: C.text,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
        <button
          type="submit"
          style={{
            height: 42,
            padding: "0 16px",
            borderRadius: 12,
            background: "var(--tt-dashboard-button-bg)",
            border: "none",
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            fontFamily: "inherit",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(26,150,136,0.25)",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          Cari
        </button>
      </form>

      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        {/* Filter status/plan */}
        <div style={{ position: "relative", flex: isMobile ? 1 : undefined }}>
          <select
            value={currentFilter}
            onChange={(e) =>
              navigate(currentSearch, e.target.value, currentLimit)
            }
            style={{
              height: 42,
              padding: "0 36px 0 14px",
              borderRadius: 12,
              border: "1.5px solid var(--tt-dashboard-card-border)",
              background: "rgba(255,255,255,0.75)",
              fontSize: 13,
              fontFamily: "inherit",
              color: C.text,
              outline: "none",
              cursor: "pointer",
              width: isMobile ? "100%" : "auto",
              appearance: "none",
              WebkitAppearance: "none",
            }}
          >
            <option value="all">Semua</option>
            <option value="premium">Premium</option>
            <option value="basic">Basic</option>
            <option value="nonaktif">Nonaktif</option>
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

        {/* Limit per halaman */}
        <div style={{ position: "relative", flex: isMobile ? 1 : undefined }}>
          <select
            value={currentLimit}
            onChange={(e) =>
              navigate(currentSearch, currentFilter, Number(e.target.value))
            }
            style={{
              height: 42,
              padding: "0 36px 0 14px",
              borderRadius: 12,
              border: "1.5px solid var(--tt-dashboard-card-border)",
              background: "rgba(255,255,255,0.75)",
              fontSize: 13,
              fontFamily: "inherit",
              color: C.text,
              outline: "none",
              cursor: "pointer",
              width: isMobile ? "100%" : "auto",
              appearance: "none",
              WebkitAppearance: "none",
            }}
          >
            {LIMIT_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {limitLabel(n)}
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
      </div>
    </div>
  );
}

// ── Form Data ─────────────────────────────────────────────────────
type UserFormData = {
  name: string;
  email: string;
  isPremium: boolean;
  status: "Aktif" | "Nonaktif";
};

// ── User Form (Add / Edit) ───────────────────────────────────────
function UserForm({
  initial,
  onSubmit,
  onCancel,
  loading,
  isEdit,
}: {
  initial: UserFormData;
  onSubmit: (d: UserFormData) => void;
  onCancel: () => void;
  loading: boolean;
  isEdit: boolean;
}) {
  const [form, setForm] = useState<UserFormData>(initial);
  function set<K extends keyof UserFormData>(k: K, v: UserFormData[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    onSubmit(form);
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: 14 }}
    >
      {!isEdit && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 11,
            background: "rgba(26,150,136,0.07)",
            border: "1px solid rgba(26,150,136,0.18)",
            fontSize: 12,
            color: C.brand,
            lineHeight: 1.5,
          }}
        >
          User akan menerima undangan via email. Pastikan email sudah benar.
        </div>
      )}

      <div>
        <label style={mLabel}>
          Nama Lengkap <span style={{ color: "#ef4444" }}>*</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="misal: Andi Pratama"
          required
          style={mInput}
        />
      </div>

      <div>
        <label style={mLabel}>
          Email <span style={{ color: "#ef4444" }}>*</span>
        </label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          placeholder="user@email.com"
          required
          disabled={isEdit}
          style={{
            ...mInput,
            background: isEdit ? "#f3f7f6" : "#fff",
            color: isEdit ? "#7d9d99" : "#1a2e2b",
            cursor: isEdit ? "not-allowed" : "text",
          }}
        />
        {isEdit && (
          <p style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>
            Email tidak bisa diubah karena terikat dengan akun Google Login.
          </p>
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          marginTop: 4,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 14px",
            borderRadius: 11,
            border: "1px solid #d1ebe8",
            background: "#fff",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Crown
              size={15}
              strokeWidth={2}
              color={form.isPremium ? C.warning : C.text3}
            />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                Akun Premium
              </p>
              <p style={{ fontSize: 11, color: C.text3, marginTop: 1 }}>
                {form.isPremium
                  ? "User punya akses fitur premium"
                  : "User akan jadi Basic"}
              </p>
            </div>
          </div>
          <Toggle
            checked={form.isPremium}
            onChange={(v) => set("isPremium", v)}
          />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 14px",
            borderRadius: 11,
            border: "1px solid #d1ebe8",
            background: "#fff",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Power
              size={15}
              strokeWidth={2}
              color={form.status === "Aktif" ? C.success : C.text3}
            />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                Status Akun
              </p>
              <p style={{ fontSize: 11, color: C.text3, marginTop: 1 }}>
                {form.status === "Aktif"
                  ? "User bisa login & pakai aplikasi"
                  : "Akun dinonaktifkan"}
              </p>
            </div>
          </div>
          <Toggle
            checked={form.status === "Aktif"}
            onChange={(v) => set("status", v ? "Aktif" : "Nonaktif")}
          />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          justifyContent: "flex-end",
          paddingTop: 14,
          borderTop: "1px solid #e0f0ee",
          marginTop: 4,
        }}
      >
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
            padding: "0 22px",
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
              <Check size={14} strokeWidth={2.5} />{" "}
              {isEdit ? "Simpan Perubahan" : "Undang User"}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

// ── User Detail Modal Body ───────────────────────────────────────
function UserDetailBody({
  user,
  onClose,
}: {
  user: User;
  onClose: () => void;
}) {
  const rows: { label: string; value: React.ReactNode }[] = [
    {
      label: "Nama",
      value: (
        <span style={{ fontWeight: 700, color: C.text }}>{user.name}</span>
      ),
    },
    {
      label: "Email",
      value: <span style={{ wordBreak: "break-all" }}>{user.email}</span>,
    },
    {
      label: "Status",
      value: (
        <Badge
          label={user.status}
          variant={user.status === "Aktif" ? "success" : "danger"}
        />
      ),
    },
    {
      label: "Plan",
      value: (
        <Badge
          label={user.isPremium ? "Premium" : "Basic"}
          variant={user.isPremium ? "warning" : "muted"}
        />
      ),
    },
    {
      label: "Profil",
      value: (
        <Badge
          label={user.profileFilled ? "Lengkap" : "Belum"}
          variant={user.profileFilled ? "success" : "muted"}
        />
      ),
    },
    { label: "Usia", value: resolveAge(user.birthYear) },
    { label: "Gender", value: user.gender ?? "—" },
    {
      label: "Streak",
      value: user.currentStreak > 0 ? `${user.currentStreak} hari 🔥` : "—",
    },
    { label: "Bergabung", value: fmtLong(user.createdAt) },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "16px 18px",
          borderRadius: 14,
          background:
            "linear-gradient(135deg, rgba(26,150,136,0.08) 0%, rgba(26,150,136,0.02) 100%)",
          border: "1px solid #d1ebe8",
        }}
      >
        <Avatar name={user.name} size={56} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <p
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: C.text,
              lineHeight: 1.2,
            }}
          >
            {user.name}
          </p>
          <p
            style={{
              fontSize: 12,
              color: C.text3,
              marginTop: 3,
              wordBreak: "break-all",
            }}
          >
            {user.email}
          </p>
        </div>
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          border: "1px solid #d1ebe8",
          overflow: "hidden",
        }}
      >
        {rows.map((r, i) => (
          <div
            key={r.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "11px 16px",
              borderBottom:
                i === rows.length - 1 ? "none" : "1px solid #ecf6f4",
            }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: C.text3,
                width: 96,
                flexShrink: 0,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              {r.label}
            </p>
            <div style={{ fontSize: 13, color: C.text2, flex: 1, minWidth: 0 }}>
              {r.value}
            </div>
          </div>
        ))}
      </div>

      {user.parentEmail && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 12,
            background: "rgba(139,92,246,0.07)",
            border: "1px solid rgba(139,92,246,0.2)",
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#7c3aed",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: 4,
            }}
          >
            Akun Orang Tua Tersambung
          </p>
          <p
            style={{
              fontSize: 12,
              color: C.text3,
              marginTop: 2,
              wordBreak: "break-all",
            }}
          >
            {user.parentEmail}
          </p>
        </div>
      )}

      <div
        style={{ display: "flex", justifyContent: "flex-end", paddingTop: 6 }}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            height: 42,
            padding: "0 22px",
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
          Tutup
        </button>
      </div>
    </div>
  );
}

// ── Link Parent Form ─────────────────────────────────────────────
type ParentFormData = { parentEmail: string };

function LinkParentForm({
  user,
  onSubmit,
  onUnlink,
  onCancel,
  loading,
}: {
  user: User;
  onSubmit: (d: ParentFormData) => void;
  onUnlink: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<ParentFormData>({
    parentEmail: user.parentEmail ?? "",
  });
  const isLinked = !!user.parentEmail;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.parentEmail.trim()) return;
    onSubmit(form);
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: 14 }}
    >
      <div
        style={{
          display: "flex",
          gap: 10,
          padding: "12px 14px",
          borderRadius: 12,
          background: "rgba(139,92,246,0.07)",
          border: "1px solid rgba(139,92,246,0.2)",
          alignItems: "flex-start",
        }}
      >
        <UsersIcon
          size={17}
          strokeWidth={2}
          color="#7c3aed"
          style={{ flexShrink: 0, marginTop: 1 }}
        />
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#7c3aed" }}>
            Laporan Mingguan ke Orang Tua
          </p>
          <p
            style={{
              fontSize: 12,
              color: C.text2,
              marginTop: 4,
              lineHeight: 1.5,
            }}
          >
            Setelah disambungkan, sistem akan mengirim ringkasan aktivitas{" "}
            <strong>{user.name}</strong> ke email orang tua setiap minggu.
          </p>
        </div>
      </div>

      <div>
        <label style={mLabel}>
          Email Orang Tua <span style={{ color: "#ef4444" }}>*</span>
        </label>
        <input
          type="email"
          value={form.parentEmail}
          onChange={(e) =>
            setForm((p) => ({ ...p, parentEmail: e.target.value }))
          }
          placeholder="orangtua@email.com"
          required
          style={mInput}
        />
        <p style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>
          Laporan mingguan otomatis dikirim ke email ini.
        </p>
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          justifyContent: "space-between",
          paddingTop: 14,
          borderTop: "1px solid #e0f0ee",
          marginTop: 4,
          flexWrap: "wrap",
        }}
      >
        {isLinked ? (
          <button
            type="button"
            onClick={onUnlink}
            disabled={loading}
            style={{
              height: 44,
              padding: "0 18px",
              borderRadius: 10,
              border: "1.5px solid rgba(239,68,68,0.3)",
              background: "rgba(239,68,68,0.06)",
              color: C.danger,
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "inherit",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Trash2 size={13} strokeWidth={2} /> Putuskan Sambungan
          </button>
        ) : (
          <span />
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              height: 44,
              padding: "0 18px",
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
              padding: "0 22px",
              borderRadius: 10,
              background: loading ? "rgba(124,58,237,0.5)" : "#7c3aed",
              border: "none",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "inherit",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "0 4px 14px rgba(124,58,237,0.3)",
              display: "flex",
              alignItems: "center",
              gap: 7,
            }}
          >
            {loading ? (
              "Menyimpan…"
            ) : (
              <>
                <Check size={14} strokeWidth={2.5} />{" "}
                {isLinked ? "Update" : "Sambungkan"}
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}

// ── Delete Confirm ────────────────────────────────────────────────
function DeleteUserBody({
  user,
  onConfirm,
  onCancel,
  loading,
}: {
  user: User;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
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
            Akun beserta semua data quiz, streak, dan log akan dihapus permanen
            dari database.
          </p>
        </div>
      </div>

      <div
        style={{
          padding: "12px 16px",
          borderRadius: 13,
          background: "rgba(0,0,0,0.04)",
          border: "1px solid var(--tt-dashboard-card-border)",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Avatar name={user.name} size={42} />
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
            {user.name}
          </p>
          <p
            style={{
              fontSize: 12,
              color: C.text3,
              marginTop: 2,
              wordBreak: "break-all",
            }}
          >
            {user.email}
          </p>
        </div>
      </div>

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
              <Trash2 size={13} strokeWidth={2} /> Hapus User
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Mobile User Card ──────────────────────────────────────────────
function UserCard({ u, menuItems }: { u: User; menuItems: MenuItem[] }) {
  return (
    <div
      style={{
        ...C.card,
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        borderRadius: 14,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <Avatar name={u.name} size={42} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: C.text,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {u.name}
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              marginTop: 2,
              fontSize: 11,
              color: C.text3,
              minWidth: 0,
            }}
          >
            <Mail size={11} strokeWidth={2} style={{ flexShrink: 0 }} />
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {u.email}
            </span>
          </div>
        </div>
        <ActionMenu items={menuItems} />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        <Badge
          label={u.isPremium ? "Premium" : "Basic"}
          variant={u.isPremium ? "warning" : "muted"}
        />
        <Badge
          label={u.status}
          variant={u.status === "Aktif" ? "success" : "danger"}
        />
        {u.parentEmail && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "3px 10px",
              borderRadius: 100,
              background: "rgba(139,92,246,0.12)",
              color: "#7c3aed",
              whiteSpace: "nowrap",
            }}
          >
            Ortu Tersambung
          </span>
        )}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: 10,
          borderTop: "1px solid var(--tt-dashboard-card-border)",
        }}
      >
        <p
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: C.text3,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Bergabung
        </p>
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: C.text2,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Calendar size={10} strokeWidth={2} /> {fmt(u.createdAt)}
        </p>
      </div>
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────────
function Pagination({
  page,
  total,
  limit,
  currentSearch,
  currentFilter,
}: {
  page: number;
  total: number;
  limit: number;
  currentSearch: string;
  currentFilter: string;
}) {
  if (limit === 0) return null;

  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  function hrefFor(p: number) {
    const sp = new URLSearchParams();
    if (currentSearch) sp.set("search", currentSearch);
    if (currentFilter && currentFilter !== "all")
      sp.set("filter", currentFilter);
    if (limit !== 10) sp.set("limit", String(limit));
    sp.set("page", String(p));
    return `/admin/users?${sp.toString()}`;
  }

  const btnBase: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    height: 36,
    padding: "0 14px",
    borderRadius: 10,
    border: "1px solid var(--tt-dashboard-card-border)",
    background: "rgba(255,255,255,0.6)",
    color: C.text2,
    fontSize: 12,
    fontWeight: 600,
    fontFamily: "inherit",
    textDecoration: "none",
    cursor: "pointer",
    whiteSpace: "nowrap",
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: "14px 16px",
        borderTop: "1px solid var(--tt-dashboard-card-border)",
        flexWrap: "wrap",
      }}
    >
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <a
          key={p}
          href={hrefFor(p)}
          style={{
            ...btnBase,
            ...(p === page
              ? {
                  background: "#1a9688",
                  borderColor: "#1a9688",
                  color: "#fff",
                  fontWeight: 700,
                }
              : {}),
          }}
        >
          {p}
        </a>
      ))}
      <span style={{ fontSize: 12, color: C.text3, marginLeft: 8 }}>
        · {total.toLocaleString("id-ID")} user
      </span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// ── Main ──────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════
export function UsersPage({
  users: initialUsers,
  total,
  page,
  limit,
  currentSearch,
  currentFilter,
}: Props) {
  const isMobile = useIsMobile();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>(initialUsers);
  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  const [modal, setModal] = useState<
    "none" | "edit" | "detail" | "parent" | "delete"
  >("none");
  const [target, setTarget] = useState<User | null>(null);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // ── CRUD handlers ────────────────────────────────────────────────
  async function handleEdit(data: UserFormData) {
    if (!target) return;
    setSaving(true);
    setError(null);
    const result = await updateUserAction({
      id: target.id,
      name: data.name,
      isPremium: data.isPremium,
      status: data.status,
    });
    setSaving(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setUsers((prev) =>
      prev.map((u) =>
        u.id === target.id
          ? {
              ...u,
              name: data.name,
              isPremium: data.isPremium,
              status: data.status,
            }
          : u,
      ),
    );
    setModal("none");
    setTarget(null);
    setToast(result.message ?? "Perubahan disimpan");
  }

  async function handleDelete() {
    if (!target) return;
    setDeleting(true);
    setError(null);
    const result = await deleteUserAction(target.id);
    setDeleting(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setUsers((prev) => prev.filter((u) => u.id !== target.id));
    setModal("none");
    setTarget(null);
    setToast(result.message ?? "User dihapus");
    router.refresh();
  }

  async function handleToggleStatus(u: User) {
    const newStatus = u.status === "Aktif" ? "Nonaktif" : "Aktif";
    setUsers((prev) =>
      prev.map((x) => (x.id === u.id ? { ...x, status: newStatus } : x)),
    );
    const result = await toggleStatusAction(u.id);
    if (!result.success) {
      setUsers((prev) =>
        prev.map((x) => (x.id === u.id ? { ...x, status: u.status } : x)),
      );
      setError(result.error);
      return;
    }
    setToast(`${u.name} → ${newStatus}`);
  }

  async function handleTogglePremium(u: User) {
    const next = !u.isPremium;
    setUsers((prev) =>
      prev.map((x) => (x.id === u.id ? { ...x, isPremium: next } : x)),
    );
    const result = await togglePremiumAction(u.id);
    if (!result.success) {
      setUsers((prev) =>
        prev.map((x) => (x.id === u.id ? { ...x, isPremium: u.isPremium } : x)),
      );
      setError(result.error);
      return;
    }
    setToast(`${u.name} → ${next ? "Premium" : "Basic"}`);
  }

  async function handleLinkParent(data: ParentFormData) {
    if (!target) return;
    setSaving(true);
    setError(null);
    const result = await linkParentAction({
      userId: target.id,
      parentEmail: data.parentEmail,
    });
    setSaving(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setModal("none");
    setTarget(null);
    setToast(result.message ?? "Email persetujuan dikirim");
    router.refresh();
  }

  async function handleUnlinkParent() {
    if (!target) return;
    setSaving(true);
    setError(null);
    const result = await unlinkParentAction(target.id);
    setSaving(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setModal("none");
    setTarget(null);
    setToast(result.message ?? "Sambungan ortu dihapus");
    router.refresh();
  }

  function menuFor(u: User): MenuItem[] {
    return [
      {
        label: "Lihat Detail",
        icon: <Eye size={14} strokeWidth={2} />,
        onClick: () => {
          setTarget(u);
          setModal("detail");
        },
      },
      {
        label: "Edit User",
        icon: <Pencil size={14} strokeWidth={2} />,
        onClick: () => {
          setTarget(u);
          setModal("edit");
        },
      },
      {
        label: u.isPremium ? "Jadikan Basic" : "Jadikan Premium",
        icon: <Crown size={14} strokeWidth={2} />,
        onClick: () => handleTogglePremium(u),
      },
      {
        label: u.status === "Aktif" ? "Nonaktifkan" : "Aktifkan",
        icon: <Power size={14} strokeWidth={2} />,
        onClick: () => handleToggleStatus(u),
      },
      {
        label: u.parentEmail ? "Kelola Akun Ortu" : "Sambung Akun Ortu",
        icon: <UsersIcon size={14} strokeWidth={2} />,
        onClick: () => {
          setTarget(u);
          setModal("parent");
        },
      },
      {
        label: "Hapus User",
        icon: <Trash2 size={14} strokeWidth={2} />,
        onClick: () => {
          setTarget(u);
          setModal("delete");
        },
        danger: true,
        divider: true,
      },
    ];
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
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            padding: "12px 20px",
            borderRadius: 12,
            background: "#1a9688",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            boxShadow: "0 8px 24px rgba(26,150,136,0.35)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            maxWidth: "90vw",
          }}
        >
          <Check size={14} strokeWidth={2.5} /> {toast}
        </div>
      )}

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

      <FilterBar
        currentSearch={currentSearch}
        currentFilter={currentFilter}
        currentLimit={limit}
        isMobile={isMobile}
      />

      {/* Count info */}
      <p style={{ fontSize: 12, color: C.text3 }}>
        Menampilkan <strong style={{ color: C.text2 }}>{users.length}</strong>{" "}
        dari{" "}
        <strong style={{ color: C.text2 }}>
          {total.toLocaleString("id-ID")}
        </strong>{" "}
        pengguna
        {limit > 0 && (
          <>
            {" "}
            · <strong style={{ color: C.text2 }}>{limitLabel(limit)}</strong>
          </>
        )}
        {currentSearch && (
          <>
            {" "}
            untuk pencarian{" "}
            <strong style={{ color: C.brand }}>
              &ldquo;{currentSearch}&rdquo;
            </strong>
          </>
        )}
      </p>

      {/* ── Content ── */}
      {users.length === 0 ? (
        <div
          style={{
            ...C.card,
            padding: 48,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            color: C.text3,
            textAlign: "center",
          }}
        >
          <Search size={32} strokeWidth={1.3} />
          <p style={{ fontSize: 14, fontWeight: 600 }}>
            Tidak ada pengguna ditemukan
          </p>
          <p style={{ fontSize: 12 }}>Coba ubah pencarian atau filter.</p>
        </div>
      ) : isMobile ? (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {users.map((u) => (
              <UserCard key={u.id} u={u} menuItems={menuFor(u)} />
            ))}
          </div>
          {limit > 0 && (
            <div style={{ ...C.card, borderRadius: 14, overflow: "hidden" }}>
              <Pagination
                page={page}
                total={total}
                limit={limit}
                currentSearch={currentSearch}
                currentFilter={currentFilter}
              />
            </div>
          )}
        </>
      ) : (
        // KEY FIX: remove overflow:hidden/auto from this wrapper so dropdown isn't clipped.
        // overflow is now only on the inner scroll div, and the card wrapper has overflow:visible.
        <div style={{ ...C.card, overflow: "visible" }}>
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 820,
              }}
            >
              <thead>
                <tr style={{ background: "rgba(26,150,136,0.04)" }}>
                  {[
                    "Pengguna",
                    "Email",
                    "Premium",
                    "Status",
                    "Bergabung",
                    "Aksi",
                  ].map((h) => (
                    <th key={h} style={C.th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr
                    key={u.id}
                    style={{
                      background:
                        i % 2 === 0 ? "transparent" : "rgba(26,150,136,0.018)",
                    }}
                  >
                    <td style={C.td}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <Avatar name={u.name} />
                        <div style={{ minWidth: 0 }}>
                          <p
                            style={{
                              fontWeight: 600,
                              color: C.text,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {u.name}
                          </p>
                          {u.parentEmail && (
                            <p
                              style={{
                                fontSize: 10,
                                color: "#7c3aed",
                                marginTop: 1,
                                fontWeight: 600,
                              }}
                            >
                              Ortu tersambung
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td
                      style={{
                        ...C.td,
                        fontSize: 12,
                        maxWidth: 200,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {u.email}
                    </td>
                    <td style={C.td}>
                      <Badge
                        label={u.isPremium ? "Premium" : "Basic"}
                        variant={u.isPremium ? "warning" : "muted"}
                      />
                    </td>
                    <td style={C.td}>
                      <Badge
                        label={u.status}
                        variant={u.status === "Aktif" ? "success" : "danger"}
                      />
                    </td>
                    <td
                      style={{
                        ...C.td,
                        fontSize: 12,
                        color: C.text3,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {fmt(u.createdAt)}
                    </td>
                    <td style={{ ...C.td, whiteSpace: "nowrap" }}>
                      <ActionMenu items={menuFor(u)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            total={total}
            limit={limit}
            currentSearch={currentSearch}
            currentFilter={currentFilter}
          />
        </div>
      )}

      {/* ── Modals ── */}
      <Modal
        open={modal === "edit" && !!target}
        onClose={() => {
          setModal("none");
          setTarget(null);
        }}
        title="Edit User"
      >
        {target && (
          <UserForm
            initial={{
              name: target.name,
              email: target.email,
              isPremium: target.isPremium,
              status: target.status === "Aktif" ? "Aktif" : "Nonaktif",
            }}
            onSubmit={handleEdit}
            onCancel={() => {
              setModal("none");
              setTarget(null);
            }}
            loading={saving}
            isEdit={true}
          />
        )}
      </Modal>

      <Modal
        open={modal === "detail" && !!target}
        onClose={() => {
          setModal("none");
          setTarget(null);
        }}
        title="Detail User"
      >
        {target && (
          <UserDetailBody
            user={target}
            onClose={() => {
              setModal("none");
              setTarget(null);
            }}
          />
        )}
      </Modal>

      <Modal
        open={modal === "parent" && !!target}
        onClose={() => {
          setModal("none");
          setTarget(null);
        }}
        title={
          target?.parentEmail
            ? "Kelola Akun Orang Tua"
            : "Sambung Akun Orang Tua"
        }
      >
        {target && (
          <LinkParentForm
            user={target}
            onSubmit={handleLinkParent}
            onUnlink={handleUnlinkParent}
            onCancel={() => {
              setModal("none");
              setTarget(null);
            }}
            loading={saving}
          />
        )}
      </Modal>

      <Modal
        open={modal === "delete" && !!target}
        onClose={() => {
          setModal("none");
          setTarget(null);
        }}
        title="Hapus User"
      >
        {target && (
          <DeleteUserBody
            user={target}
            onConfirm={() => void handleDelete()}
            onCancel={() => {
              setModal("none");
              setTarget(null);
            }}
            loading={deleting}
          />
        )}
      </Modal>
    </div>
  );
}
