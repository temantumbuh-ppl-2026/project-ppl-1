"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  LogOut,
  Users,
  BookOpen,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { LogoutConfirmDialog } from "@/components/ui/manual/logout-confirm-dialog";

export type AdminPage = "overview" | "users" | "quiz";

const NAV: { id: AdminPage; label: string; href: string; icon: LucideIcon }[] =
  [
    {
      id: "overview",
      label: "Overview",
      href: "/admin",
      icon: LayoutDashboard,
    },
    { id: "users", label: "Manajemen User", href: "/admin/users", icon: Users },
    {
      id: "quiz",
      label: "BraveChoice CMS",
      href: "/admin/quiz",
      icon: BookOpen,
    },
  ];

const PAGE_META: Record<AdminPage, { title: string; sub: string }> = {
  overview: {
    title: "Admin Overview",
    sub: "Ringkasan platform TemanTumbuh hari ini",
  },
  users: { title: "Manajemen User", sub: "Data pengguna terdaftar" },
  quiz: {
    title: "BraveChoice CMS",
    sub: "Kelola soal Brave Choice per segmen usia",
  },
};

const MOBILE_BREAKPOINT = 1024;

function getActivePage(pathname: string): AdminPage {
  if (pathname.startsWith("/admin/users")) return "users";
  if (pathname.startsWith("/admin/quiz")) return "quiz";
  return "overview";
}

function useIsMobile(breakpoint = MOBILE_BREAKPOINT) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [breakpoint]);
  return isMobile;
}

function Initials({ name, size = 34 }: { name: string; size?: number }) {
  const letters = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        background: "linear-gradient(135deg, #1a9688 0%, #0f7a6e 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 800,
        fontSize: size * 0.37,
        color: "#fff",
        flexShrink: 0,
        letterSpacing: "-0.02em",
      }}
    >
      {letters || "A"}
    </div>
  );
}

function Sidebar({
  activePage,
  collapsed,
  onToggleCollapse,
  isMobile,
  mobileOpen,
  onCloseMobile,
}: {
  activePage: AdminPage;
  collapsed: boolean;
  onToggleCollapse: () => void;
  isMobile: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  // Width logic
  const desktopW = collapsed ? 64 : 228;
  const mobileW = 260;
  const w = isMobile ? mobileW : desktopW;

  // Position logic for mobile drawer
  const mobileTransform = mobileOpen ? "translateX(0)" : "translateX(-100%)";

  return (
    <>
      {/* Backdrop on mobile */}
      {isMobile && mobileOpen && (
        <div
          onClick={onCloseMobile}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 40,
            background: "rgba(15,23,30,0.55)",
            backdropFilter: "blur(4px)",
            transition: "opacity 0.2s",
          }}
        />
      )}

      <aside
        style={{
          width: w,
          flexShrink: 0,
          background: "var(--tt-dashboard-sidebar-bg)",
          backdropFilter: "blur(18px) saturate(160%)",
          borderRight: "1px solid var(--tt-dashboard-card-border)",
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          // Desktop: sticky in flex layout. Mobile: fixed drawer.
          position: isMobile ? "fixed" : "sticky",
          top: 0,
          left: 0,
          transform: isMobile ? mobileTransform : "none",
          transition: isMobile
            ? "transform 0.25s cubic-bezier(0.4,0,0.2,1)"
            : "width 0.25s cubic-bezier(0.4,0,0.2,1)",
          overflow: "hidden",
          zIndex: 50,
          boxShadow:
            isMobile && mobileOpen ? "8px 0 32px rgba(0,0,0,0.25)" : "none",
        }}
      >
        {/* Header row */}
        <div
          style={{
            padding: collapsed && !isMobile ? "0 12px" : "0 14px",
            borderBottom: "1px solid var(--tt-dashboard-card-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 64,
            gap: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              overflow: "hidden",
            }}
          >
            {(!collapsed || isMobile) && (
              <div style={{ overflow: "hidden" }}>
                <p
                  style={{
                    fontWeight: 800,
                    fontSize: 15,
                    color: "var(--tt-dashboard-text)",
                    whiteSpace: "nowrap",
                    lineHeight: 1.2,
                  }}
                >
                  TemanTumbuh
                </p>
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--tt-dashboard-text-3)",
                    marginTop: 2,
                    whiteSpace: "nowrap",
                  }}
                >
                  Admin Panel
                </p>
              </div>
            )}
          </div>

          {/* Toggle: collapse on desktop, close on mobile */}
          <button
            type="button"
            onClick={isMobile ? onCloseMobile : onToggleCollapse}
            title={isMobile ? "Tutup" : collapsed ? "Expand" : "Collapse"}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "none",
              background: "transparent",
              color: "var(--tt-dashboard-text-3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            {isMobile ? (
              <X size={16} strokeWidth={2} />
            ) : collapsed ? (
              <PanelLeftOpen size={16} strokeWidth={2} />
            ) : (
              <PanelLeftClose size={16} strokeWidth={2} />
            )}
          </button>
        </div>

        {/* Nav */}
        <nav
          style={{
            flex: 1,
            padding: collapsed && !isMobile ? "14px 8px" : "14px 10px",
            display: "flex",
            flexDirection: "column",
            gap: 3,
            overflowY: "auto",
          }}
        >
          {(!collapsed || isMobile) && (
            <p
              style={{
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: "0.12em",
                color: "var(--tt-dashboard-text-3)",
                padding: "0 10px",
                marginBottom: 6,
                textTransform: "uppercase",
              }}
            >
              Menu
            </p>
          )}

          {NAV.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            const showLabel = !collapsed || isMobile;
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => isMobile && onCloseMobile()}
                title={!showLabel ? item.label : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: showLabel ? "10px 12px" : "10px 0",
                  borderRadius: 12,
                  textDecoration: "none",
                  background: isActive
                    ? "var(--tt-dashboard-active-bg)"
                    : "transparent",
                  color: isActive
                    ? "var(--tt-dashboard-active-text)"
                    : "var(--tt-dashboard-text-2)",
                  boxShadow: isActive
                    ? "0 4px 14px rgba(26,150,136,0.22)"
                    : "none",
                  transition: "all 0.15s ease",
                  justifyContent: showLabel ? "flex-start" : "center",
                }}
              >
                <Icon
                  size={16}
                  strokeWidth={isActive ? 2.2 : 1.8}
                  style={{ flexShrink: 0 }}
                />
                {showLabel && (
                  <>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        flex: 1,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.label}
                    </span>
                    {isActive && (
                      <ChevronRight
                        size={13}
                        strokeWidth={2}
                        style={{ opacity: 0.5 }}
                      />
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

function Topbar({
  activePage,
  adminName,
  adminEmail,
  isMobile,
  onOpenMenu,
  isLoggingOut,
  onLogout,
}: {
  activePage: AdminPage;
  adminName: string;
  adminEmail: string;
  isMobile: boolean;
  onOpenMenu: () => void;
  isLoggingOut: boolean;
  onLogout: () => void;
}) {
  const { title, sub } = PAGE_META[activePage];

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        background: "var(--tt-dashboard-card-bg)",
        backdropFilter: "blur(20px) saturate(160%)",
        borderBottom: "1px solid var(--tt-dashboard-card-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: isMobile ? "0 14px" : "0 24px",
        height: isMobile ? 56 : 64,
        gap: isMobile ? 8 : 16,
      }}
    >
      {/* Left: hamburger + title */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          minWidth: 0,
          flex: 1,
        }}
      >
        {isMobile && (
          <button
            type="button"
            onClick={onOpenMenu}
            title="Menu"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: "1px solid var(--tt-dashboard-card-border)",
              background: "rgba(255,255,255,0.65)",
              color: "var(--tt-dashboard-text)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <Menu size={18} strokeWidth={2} />
          </button>
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <p
            style={{
              fontWeight: 900,
              fontSize: isMobile ? 18 : 24,
              color: "var(--tt-dashboard-text)",
              lineHeight: 1.15,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {title}
          </p>
          {!isMobile && (
            <p
              style={{
                fontSize: 11,
                color: "var(--tt-dashboard-text-3)",
                marginTop: 2,
              }}
            >
              {sub}
            </p>
          )}
        </div>
      </div>

      {/* Right: profile */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: isMobile ? 6 : 10,
          flexShrink: 0,
        }}
      >
        {!isMobile && (
          <div style={{ textAlign: "right" }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--tt-dashboard-text)",
                whiteSpace: "nowrap",
              }}
            >
              {adminName}
            </p>
            <p
              style={{
                fontSize: 11,
                color: "var(--tt-dashboard-text-3)",
                whiteSpace: "nowrap",
              }}
            >
              {adminEmail}
            </p>
          </div>
        )}
        <Initials name={adminName} size={isMobile ? 32 : 34} />
        <button
          type="button"
          onClick={onLogout}
          disabled={isLoggingOut}
          title={isLoggingOut ? "Keluar…" : "Keluar"}
          style={{
            width: isMobile ? 32 : 34,
            height: isMobile ? 32 : 34,
            borderRadius: 10,
            border: "none",
            background: "transparent",
            color: "#DC2626",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: isLoggingOut ? "not-allowed" : "pointer",
            opacity: isLoggingOut ? 0.6 : 1,
            transition: "opacity 0.15s",
          }}
        >
          <LogOut size={isMobile ? 14 : 15} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

export function AdminShell({
  children,
  adminName,
  adminEmail,
  activePage,
}: {
  children: ReactNode;
  adminName: string;
  adminEmail: string;
  activePage?: AdminPage;
}) {
  const pathname = usePathname();
  const resolvedPage = activePage ?? getActivePage(pathname);
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    try {
      setIsLoggingOut(true);
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            window.location.href = "/login";
          },
        },
      });
    } catch (e) {
      console.error(e);
      setIsLoggingOut(false);
    }
  };

  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll when drawer open
  useEffect(() => {
    if (isMobile && mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobile, mobileOpen]);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        fontFamily: "var(--font-plus-jakarta), system-ui, sans-serif",
      }}
    >
      <Sidebar
        activePage={resolvedPage}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        isMobile={isMobile}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minWidth: 0,
          // On mobile, sidebar is fixed-positioned overlay → main content takes full width
          width: isMobile ? "100%" : undefined,
        }}
      >
        <Topbar
          activePage={resolvedPage}
          adminName={adminName}
          adminEmail={adminEmail}
          isMobile={isMobile}
          onOpenMenu={() => setMobileOpen(true)}
          isLoggingOut={isLoggingOut}
          onLogout={() => setShowLogoutConfirm(true)}
        />
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(167,210,205,0.5) transparent",
          }}
        >
          {children}
        </div>
      </div>

      <LogoutConfirmDialog
        open={showLogoutConfirm}
        onConfirm={() => void handleLogout()}
        onCancel={() => setShowLogoutConfirm(false)}
        loading={isLoggingOut}
      />
    </div>
  );
}
