"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  BookText,
  ChevronDown,
  FileText,
  Home,
  List,
  LogOut,
  Menu,
  Shield,
  Sparkles,
  UserCircle,
  Users,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { authClient } from "@/lib/auth-client";

type Role = "guest" | "user" | "admin";
type UserPlan = "free" | "premium";

type Session = {
  role: Role;
  name: string;
  email: string;
  image?: string | null;
  plan: UserPlan;
  isPremium: boolean;
};

type HomeSection = {
  label: string;
  sectionId: string | null;
  href: string;
  desc: string;
};

type MenuItem = {
  label: string;
  href: string;
  icon: ReactNode;
};

const guestSession: Session = {
  role: "guest",
  name: "Guest",
  email: "",
  image: null,
  plan: "free",
  isPremium: false,
};

const homeSections: HomeSection[] = [
  {
    label: "Beranda",
    sectionId: null,
    href: "/",
    desc: "Halaman utama pengguna",
  },
  {
    label: "Fitur",
    sectionId: "features",
    href: "/#features",
    desc: "Semua fitur platform",
  },
  {
    label: "Tentang Kami",
    sectionId: "purpose",
    href: "/#purpose",
    desc: "Tujuan & segmentasi usia",
  },
  {
    label: "Cara Kerja",
    sectionId: "how",
    href: "/#how",
    desc: "Bagaimana platform bekerja",
  },
  {
    label: "Testimoni",
    sectionId: "testi",
    href: "/#testi",
    desc: "Kata pengguna kami",
  },
];

const userMenuItems: MenuItem[] = [
  { label: "Profile", href: "/profile", icon: <UserCircle size={15} /> },
  { label: "Diary", href: "/diary", icon: <BookText size={15} /> },
  {
    label: "Recommendation",
    href: "/recommendation",
    icon: <Sparkles size={15} />,
  },
  { label: "Insight", href: "/insight", icon: <BarChart3 size={15} /> },
];

const adminMenuItems: MenuItem[] = [
  { label: "Admins", href: "/admin", icon: <Shield size={15} /> },
  {
    label: "Analytics",
    href: "/admin/analytics",
    icon: <BarChart3 size={15} />,
  },
  { label: "Audit Log", href: "/admin/audit-log", icon: <List size={15} /> },
  { label: "Reports", href: "/admin/reports", icon: <FileText size={15} /> },
  { label: "Users", href: "/admin/users", icon: <Users size={15} /> },
  { label: "Simulator", href: "/admin/simulator", icon: <Zap size={15} /> },
];

const C = {
  teal: "#1A9688",
  tealMid: "#28B0A4",
  tealLight: "#4ECFC3",
  tealPale: "#A8E0DA",
  tealGhost: "#DDF5F2",
  textPrimary: "#1A2840",
  textSecondary: "#3A5068",
  textMuted: "#7090A8",
  border: "#C8DCED",
  bg0: "#FAFBFF",
  white: "#FFFFFF",
  goldBg: "#FEF3C7",
  goldText: "#D97706",
};

function useOutsideClick(cb: () => void) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cb();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [cb]);

  return ref;
}

function useSmoothScroll() {
  const router = useRouter();
  const pathname = usePathname();

  return useCallback(
    (sectionId: string | null, href: string) => {
      if (sectionId === null) {
        if (pathname === "/") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          router.push(href);
        }
        return;
      }

      if (pathname === "/") {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          window.history.pushState(null, "", `/#${sectionId}`);
          return;
        }
      }

      router.push(href);
    },
    [pathname, router],
  );
}

function Avatar({
  name,
  image,
  size = 32,
}: {
  name: string;
  image?: string | null;
  size?: number;
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-bold"
      style={{
        width: size,
        height: size,
        fontSize: size < 30 ? 11 : 12,
        background: `linear-gradient(135deg, ${C.teal}, ${C.tealMid})`,
        color: "#fff",
      }}
    >
      {image ? (
        <Image
          src={image}
          alt={name}
          width={size}
          height={size}
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        initials
      )}
    </div>
  );
}

function NavLink({
  label,
  isActive,
  href,
  onClick,
}: {
  label: string;
  isActive: boolean;
  href?: string;
  onClick?: () => void;
}) {
  const style: CSSProperties = { color: isActive ? C.teal : C.textSecondary };
  const underline: CSSProperties = {
    background: C.teal,
    transform: `scaleX(${isActive ? 1 : 0})`,
    opacity: isActive ? 1 : 0,
  };

  const content = (
    <>
      <span
        className="text-sm font-medium transition-colors duration-150 group-hover:text-[#1A9688]"
        style={style}
      >
        {label}
      </span>
      <span
        className="absolute -bottom-0.5 left-0 right-0 h-0.5 origin-center rounded-full transition-all duration-200 group-hover:scale-x-100 group-hover:opacity-100"
        style={underline}
      />
    </>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="group relative flex cursor-pointer flex-col items-center pb-0.5 outline-none"
        type="button"
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={href ?? "#"}
      className="group relative flex cursor-pointer flex-col items-center pb-0.5"
    >
      {content}
    </Link>
  );
}

function HomeDropdown({
  isActive,
  isUserHomepage = false,
}: {
  isActive: boolean;
  isUserHomepage?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const smoothScroll = useSmoothScroll();
  const ref = useOutsideClick(() => setOpen(false));

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const handleHomeClick = () => {
    setOpen(false);

    if (isUserHomepage) {
      smoothScroll(null, "/home");
      return;
    }

    smoothScroll(null, "/");
  };

  if (isUserHomepage) {
    return (
      <div className="relative">
        <button
          onClick={handleHomeClick}
          className="group relative flex cursor-pointer items-center gap-0.5 pb-0.5 text-sm font-medium outline-none transition-colors duration-150 hover:text-[#1A9688]"
          style={{ color: isActive ? C.teal : C.textSecondary }}
          type="button"
        >
          Home
          <span
            className="absolute -bottom-0.5 left-0 right-0 h-0.5 origin-center rounded-full transition-all duration-200"
            style={{
              background: C.teal,
              transform: `scaleX(${isActive ? 1 : 0})`,
              opacity: isActive ? 1 : 0,
            }}
          />
        </button>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div className="group relative flex cursor-pointer items-center gap-0.5 pb-0.5">
        <button
          onClick={handleHomeClick}
          className="text-sm font-medium outline-none transition-colors duration-150 group-hover:text-[#1A9688]"
          style={{ color: isActive || open ? C.teal : C.textSecondary }}
          type="button"
        >
          Home
        </button>

        <button
          onClick={() => setOpen((v) => !v)}
          className="ml-0.5 flex items-center outline-none transition-colors duration-150"
          style={{ color: isActive || open ? C.teal : C.textMuted }}
          aria-expanded={open}
          aria-haspopup="menu"
          type="button"
        >
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${
              open ? "rotate-180" : "rotate-0"
            }`}
          />
        </button>

        <span
          className="absolute -bottom-0.5 left-0 right-0 h-0.5 origin-center rounded-full transition-all duration-200 group-hover:scale-x-100 group-hover:opacity-100"
          style={{
            background: C.teal,
            transform: `scaleX(${isActive || open ? 1 : 0})`,
            opacity: isActive || open ? 1 : 0,
          }}
        />
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-1/2 z-50 mt-3 w-64 -translate-x-1/2 overflow-hidden rounded-2xl"
            style={{
              background: "rgba(255,255,255,0.99)",
              border: `1.5px solid ${C.border}`,
              boxShadow:
                "0 20px 64px rgba(26,40,64,0.16), 0 4px 16px rgba(26,40,64,0.08)",
            }}
          >
            <div className="p-2.5">
              {homeSections.map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    setOpen(false);
                    smoothScroll(item.sectionId, item.href);
                  }}
                  className="group flex w-full cursor-pointer items-center rounded-xl px-3 py-2.5 text-left transition-colors duration-150 hover:bg-[#DDF5F2]"
                  type="button"
                >
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-[13px] font-semibold"
                      style={{ color: C.textPrimary }}
                    >
                      {item.label}
                    </p>
                    <p
                      className="truncate text-[11px]"
                      style={{ color: C.textMuted }}
                    >
                      {item.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function getPlanLabel(session: Session) {
  if (session.role === "admin") return "Administrator";
  return session.plan === "premium" ? "Premium Plan" : "Free Plan";
}

function getPlanBadgeStyle(session: Session): CSSProperties | undefined {
  if (session.role === "admin") return undefined;

  if (session.plan === "premium") {
    return {
      background: C.tealPale,
      color: C.textPrimary,
      borderRadius: 999,
      padding: "2px 8px",
      fontWeight: 800,
      display: "inline-flex",
      alignItems: "center",
      width: "fit-content",
    };
  }

  return {
    color: C.textMuted,
  };
}

function ProfileDropdown({ session }: { session: Session }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const ref = useOutsideClick(() => setOpen(false));
  const items = session.role === "admin" ? adminMenuItems : userMenuItems;

  useEffect(() => setOpen(false), [pathname]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex cursor-pointer items-center gap-2 rounded-full px-3 py-1 outline-none transition-all duration-150 active:scale-[0.98]"
        style={{
          background: open ? "rgba(26,150,136,0.08)" : "rgba(26,150,136,0.04)",
          border: `1.5px solid ${open ? C.tealPale : "rgba(26,150,136,0.12)"}`,
        }}
        aria-expanded={open}
        type="button"
      >
        <Avatar name={session.name} image={session.image} size={30} />

        <div className="hidden text-left sm:block">
          <p
            className="max-w-[120px] truncate text-sm font-bold"
            style={{ color: C.textPrimary }}
          >
            {session.name}
          </p>
          <p
            className="text-[11px] font-medium"
            style={getPlanBadgeStyle(session)}
          >
            {getPlanLabel(session)}
          </p>
        </div>

        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${
            open ? "rotate-180" : "rotate-0"
          }`}
          style={{ color: C.textMuted }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 z-50 mt-3 w-72 overflow-hidden rounded-[1.6rem]"
            style={{
              background: "rgba(255,255,255,0.98)",
              border: `1px solid ${C.border}`,
              boxShadow:
                "0 24px 64px rgba(26,40,64,0.16), 0 6px 18px rgba(26,40,64,0.08)",
            }}
          >
            <div
              className="flex items-center gap-3 px-4 py-4"
              style={{ borderBottom: `1px solid ${C.border}` }}
            >
              <Avatar name={session.name} image={session.image} size={42} />
              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-sm font-bold"
                  style={{ color: C.textPrimary }}
                >
                  {session.name}
                </p>
                <p
                  className="truncate text-xs font-medium"
                  style={{ color: C.textMuted }}
                >
                  {session.email || "Pengguna TemanTumbuh"}
                </p>
                <p
                  className="mt-1 text-[11px] font-semibold"
                  style={getPlanBadgeStyle(session)}
                >
                  {getPlanLabel(session)}
                </p>
              </div>
            </div>

            <div className="p-2.5">
              {items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition-colors duration-150"
                    style={{
                      color: isActive ? C.teal : C.textSecondary,
                      background: isActive ? C.tealGhost : "transparent",
                    }}
                  >
                    <span
                      style={{
                        color: isActive ? C.teal : C.textMuted,
                      }}
                    >
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div
              className="p-2.5"
              style={{ borderTop: `1px solid ${C.border}` }}
            >
              <button
                onClick={async () => {
                  setOpen(false);
                  await authClient.signOut({
                    fetchOptions: {
                      onSuccess: () => {
                        window.location.href = "/login";
                      },
                    },
                  });
                }}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition"
                style={{ color: "#DC2626" }}
                type="button"
              >
                <LogOut size={16} />
                Keluar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MobileMenu({
  open,
  session,
  loading,
  onClose,
}: {
  open: boolean;
  session: Session;
  loading: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const smoothScroll = useSmoothScroll();
  const isLoggedIn = session.role !== "guest";
  const isUserHomepage = isLoggedIn;
  const items = session.role === "admin" ? adminMenuItems : userMenuItems;
  const [berandaOpen, setBerandaOpen] = useState(false);

  const handleSection = (sectionId: string | null, href: string) => {
    onClose();
    setTimeout(() => smoothScroll(sectionId, href), 140);
  };

  const handleHomeMobile = () => {
    onClose();
    setTimeout(() => {
      if (isUserHomepage) {
        smoothScroll(null, "/home");
      } else {
        smoothScroll(null, "/");
      }
    }, 140);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden border-t md:hidden"
          style={{ borderColor: C.border }}
        >
          <div className="flex flex-col gap-1 px-5 py-4">
            <p
              className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: C.textMuted }}
            >
              Halaman
            </p>

            {isUserHomepage ? (
              <button
                onClick={handleHomeMobile}
                className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors duration-150 hover:bg-[#DDF5F2]"
                style={{
                  color: pathname === "/home" ? C.teal : C.textSecondary,
                  background:
                    pathname === "/home" ? C.tealGhost : "transparent",
                }}
                type="button"
              >
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: C.tealGhost, color: C.teal }}
                >
                  <Home size={12} />
                </span>
                Home
              </button>
            ) : (
              <>
                <button
                  onClick={() => setBerandaOpen((v) => !v)}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors duration-150 hover:bg-[#DDF5F2]"
                  style={{
                    color: pathname === "/" ? C.teal : C.textSecondary,
                    background: pathname === "/" ? C.tealGhost : "transparent",
                  }}
                  type="button"
                >
                  <span className="flex-1">Beranda</span>
                  <ChevronDown
                    size={14}
                    style={{
                      color: C.textMuted,
                      transform: berandaOpen
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                      transition: "transform 0.2s",
                    }}
                  />
                </button>

                <AnimatePresence>
                  {berandaOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden pl-4"
                    >
                      {homeSections.slice(1).map((item) => (
                        <button
                          key={item.label}
                          onClick={() =>
                            handleSection(item.sectionId, item.href)
                          }
                          className="flex w-full cursor-pointer items-center rounded-xl px-3 py-2 text-left text-[13px] font-medium transition-colors duration-150 hover:bg-[#DDF5F2]"
                          style={{ color: C.textSecondary }}
                          type="button"
                        >
                          {item.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}

            <div className="my-2 h-px" style={{ background: C.border }} />

            <Link
              href="/about"
              onClick={onClose}
              className="flex items-center rounded-xl px-3 py-2.5 text-sm font-medium"
              style={{
                color: pathname.startsWith("/about") ? C.teal : C.textSecondary,
                background: pathname.startsWith("/about")
                  ? C.tealGhost
                  : "transparent",
              }}
            >
              Tentang Kami
            </Link>

            <Link
              href="/features"
              onClick={onClose}
              className="flex items-center rounded-xl px-3 py-2.5 text-sm font-medium"
              style={{
                color: pathname.startsWith("/features")
                  ? C.teal
                  : C.textSecondary,
                background: pathname.startsWith("/features")
                  ? C.tealGhost
                  : "transparent",
              }}
            >
              Fitur
            </Link>

            <Link
              href="/pricing"
              onClick={onClose}
              className="flex items-center rounded-xl px-3 py-2.5 text-sm font-medium"
              style={{
                color: pathname.startsWith("/pricing")
                  ? C.teal
                  : C.textSecondary,
                background: pathname.startsWith("/pricing")
                  ? C.tealGhost
                  : "transparent",
              }}
            >
              Langganan
            </Link>

            <div className="my-2 h-px" style={{ background: C.border }} />

            {loading ? (
              <div className="px-3 py-2 text-sm" style={{ color: C.textMuted }}>
                Memuat sesi...
              </div>
            ) : !isLoggedIn ? (
              <>
                <Link
                  href="/login"
                  onClick={onClose}
                  className="flex h-11 items-center justify-center rounded-xl text-sm font-semibold"
                  style={{
                    border: `1.5px solid ${C.border}`,
                    color: C.teal,
                    background: "transparent",
                  }}
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  onClick={onClose}
                  className="flex h-11 items-center justify-center rounded-xl text-sm font-semibold text-white"
                  style={{
                    background: `linear-gradient(135deg, ${C.teal} 0%, ${C.tealMid} 100%)`,
                    boxShadow: "0 2px 12px rgba(26,150,136,0.28)",
                  }}
                >
                  Daftar Gratis
                </Link>
              </>
            ) : (
              <>
                <div className="mb-1 flex items-center gap-3 px-3 py-2">
                  <Avatar name={session.name} image={session.image} size={32} />
                  <div>
                    <p
                      className="text-[13px] font-semibold"
                      style={{ color: C.textPrimary }}
                    >
                      {session.name}
                    </p>
                    <p
                      className="text-[11px]"
                      style={
                        session.plan === "premium" && session.role !== "admin"
                          ? {
                              color: C.goldText,
                              fontWeight: 800,
                            }
                          : { color: C.textMuted }
                      }
                    >
                      {getPlanLabel(session)}
                    </p>
                  </div>
                </div>

                {items.map((item) => {
                  const active =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={onClose}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium"
                      style={{
                        color: active ? C.teal : C.textSecondary,
                        background: active ? C.tealGhost : "transparent",
                      }}
                    >
                      <span style={{ color: active ? C.teal : C.textMuted }}>
                        {item.icon}
                      </span>
                      {item.label}
                    </Link>
                  );
                })}

                <button
                  onClick={async () => {
                    onClose();
                    await authClient.signOut({
                      fetchOptions: {
                        onSuccess: () => {
                          window.location.href = "/login";
                        },
                      },
                    });
                  }}
                  className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium"
                  style={{ color: "#EF4444" }}
                  type="button"
                >
                  <LogOut size={15} /> Keluar
                </button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DesktopAuthActions({
  loading,
  isLoggedIn,
  session,
}: {
  loading: boolean;
  isLoggedIn: boolean;
  session: Session;
  pathname: string;
}) {
  if (loading) {
    return (
      <div
        className="h-10 w-24 animate-pulse rounded-xl"
        style={{ background: "#E4EEFA" }}
      />
    );
  }

  if (!isLoggedIn) {
    return (
      <>
        <Link
          href="/login"
          className="relative inline-flex overflow-hidden rounded-xl px-4 py-2 text-sm font-semibold transition-colors duration-150 hover:bg-[#DDF5F2]"
          style={{
            color: C.teal,
            background: "transparent",
          }}
        >
          Masuk
        </Link>
        <Link
          href="/register"
          className="relative inline-flex rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.97]"
          style={{
            background: `linear-gradient(135deg, ${C.teal} 0%, ${C.tealMid} 100%)`,
            boxShadow: "0 2px 14px rgba(26,150,136,0.32)",
          }}
        >
          Daftar Gratis
        </Link>
      </>
    );
  }

  return <ProfileDropdown session={session} />;
}

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [session, setSession] = useState<Session>(guestSession);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  const isLoggedIn = session.role !== "guest";
  const isUserHomepage = isLoggedIn;
  const homeIsActive = pathname === "/" || pathname === "/home";

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let mounted = true;

    const sync = async () => {
      setLoading(true);
      try {
        const { data } = await authClient.getSession();

        if (!mounted) return;

        if (!data?.user) {
          setSession(guestSession);
          return;
        }

        const user = data.user as {
          role?: string;
          name?: string | null;
          email?: string | null;
          image?: string | null;
          isPremium?: boolean;
          plan?: string | null;
        };

        const normalizedPlan: UserPlan =
          user.plan === "premium" || user.isPremium ? "premium" : "free";

        setSession({
          role: user.role === "admin" ? "admin" : "user",
          name: user.name ?? "User",
          email: user.email ?? "",
          image: user.image ?? null,
          plan: normalizedPlan,
          isPremium: normalizedPlan === "premium",
        });
      } catch {
        if (mounted) setSession(guestSession);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void sync();

    return () => {
      mounted = false;
    };
  }, [pathname]);

  return (
    <header
      className="sticky top-0 z-50 transition-shadow duration-300"
      style={{
        background: scrolled
          ? "rgba(250,251,255,0.97)"
          : "rgba(250,251,255,0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: `1px solid ${scrolled ? C.border : "transparent"}`,
        boxShadow: scrolled ? "0 2px 20px rgba(26,40,64,0.08)" : "none",
        fontFamily: "var(--font-plus-jakarta)",
      }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-6">
        <Link
          href={isLoggedIn ? "/home" : "/"}
          className="flex items-center gap-2.5"
        >
          <Image
            src="/img/LOGO_TEMANTUMBUH.svg"
            alt="TemanTumbuh"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="text-sm font-bold text-(--brand-text-primary)">
            TemanTumbuh
          </span>
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-7 md:flex">
          <HomeDropdown
            isActive={homeIsActive}
            isUserHomepage={isUserHomepage}
          />
          <NavLink
            label="Tentang Kami"
            isActive={pathname.startsWith("/about")}
            href="/about"
          />
          <NavLink
            label="Fitur"
            isActive={pathname.startsWith("/features")}
            href="/features"
          />
          <NavLink
            label="Langganan"
            isActive={pathname.startsWith("/pricing")}
            href="/pricing"
          />
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <DesktopAuthActions
            loading={loading}
            isLoggedIn={isLoggedIn}
            session={session}
            pathname={pathname}
          />
        </div>

        <button
          className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors duration-150 hover:bg-[#DDF5F2] md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
          type="button"
        >
          {mobileOpen ? (
            <X size={20} style={{ color: C.textPrimary }} />
          ) : (
            <Menu size={20} style={{ color: C.textPrimary }} />
          )}
        </button>
      </div>

      <MobileMenu
        open={mobileOpen}
        session={session}
        loading={loading}
        onClose={() => setMobileOpen(false)}
      />
    </header>
  );
}

export default Navbar;
