"use client";

import { useState } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, User, Users } from "lucide-react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { LogoutConfirmDialog } from "@/components/ui/manual/logout-confirm-dialog";

interface SettingsSidebarProps {
  profile: {
    name: string;
    email: string;
    image?: string | null;
    isPremium: boolean;
  } | null;
}

export function SettingsSidebar({ profile }: SettingsSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isProfileTab = pathname === "/profile";
  const isParentReportTab = pathname === "/profile/parent-report";

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            toast.success("Berhasil keluar.");
            window.location.href = "/login";
          },
        },
      });
    } catch {
      toast.error("Gagal keluar.");
      setIsLoggingOut(false);
    }
  };

  const planLabel = profile?.isPremium ? "Premium Plan" : "Free Plan";

  return (
    <>
      <aside className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm lg:sticky lg:top-24">
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-6 sm:px-6">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-[var(--color-brand-teal)] text-white shadow-md sm:h-[72px] sm:w-[72px]">
              {profile?.image ? (
                <Image
                  src={profile.image}
                  alt={profile.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <span className="text-xl font-black sm:text-2xl">
                  {profile?.name?.charAt(0).toUpperCase() || "?"}
                </span>
              )}
            </div>

            <p className="mb-1 line-clamp-2 text-base font-bold text-slate-900 sm:text-lg">
              {profile?.name || "Memuat..."}
            </p>

            <p className="mb-3 break-all text-xs text-slate-500 sm:text-[13px]">
              {profile?.email || "memuat@email.com"}
            </p>

            <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">
              <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              {planLabel}
            </div>
          </div>
        </div>

        <div className="py-2">
          <button
            type="button"
            onClick={() => router.push("/profile")}
            className={`flex w-full cursor-pointer items-center gap-3 border-l-[3px] px-5 py-3 text-left text-sm transition-all sm:px-6 ${
              isProfileTab
                ? "border-[var(--color-brand-teal)] bg-[var(--color-brand-teal-ghost)] font-bold text-[var(--color-brand-teal)]"
                : "border-transparent font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <User className="h-4 w-4 shrink-0" />
            Profil Pengguna
          </button>

          <button
            type="button"
            onClick={() => router.push("/profile/parent-report")}
            className={`flex w-full cursor-pointer items-center gap-3 border-l-[3px] px-5 py-3 text-left text-sm transition-all sm:px-6 ${
              isParentReportTab
                ? "border-[var(--color-brand-teal)] bg-[var(--color-brand-teal-ghost)] font-bold text-[var(--color-brand-teal)]"
                : "border-transparent font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Users className="h-4 w-4 shrink-0" />
            Laporan Orang Tua
          </button>
        </div>

        <div className="border-t border-slate-200 px-4 py-3 sm:px-5 sm:py-4">
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-500 transition-colors hover:bg-red-50"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Keluar
          </button>
        </div>
      </aside>

      <LogoutConfirmDialog
        open={showLogoutConfirm}
        onConfirm={() => void handleLogout()}
        onCancel={() => setShowLogoutConfirm(false)}
        loading={isLoggingOut}
      />
    </>
  );
}
