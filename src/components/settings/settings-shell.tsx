"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { PageLoader } from "@/components/ui/manual/page-loader";
import { BrandPageBackground } from "@/components/layout/brand-page-background";
import { SettingsSidebar } from "@/components/settings/settings-sidebar";

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  birthYear: number | null;
  gender: "male" | "female" | "prefer_not" | null;
  profileFilled: boolean;
  createdAt?: string | null;
  isPremium?: boolean;
};

type SecurityStateResponse = {
  success: boolean;
  hasPassword: boolean;
  isGoogleLinked: boolean;
  providerIds: string[];
};

export type ProfileQueryData = {
  user: UserProfile;
  isGoogleLinked: boolean;
  hasPassword: boolean;
};

export async function fetchProfileData(): Promise<ProfileQueryData> {
  const { data } = await authClient.getSession();
  const user = data?.user as UserProfile | undefined;

  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  let hasPassword = false;
  let isGoogleLinked = false;

  const securityStateResponse = await fetch("/api/profile/security-state", {
    method: "GET",
    cache: "no-store",
  });

  if (securityStateResponse.ok) {
    const securityStatePayload =
      (await securityStateResponse.json()) as SecurityStateResponse;

    hasPassword = Boolean(securityStatePayload.hasPassword);
    isGoogleLinked = Boolean(securityStatePayload.isGoogleLinked);
  }

  return {
    user: {
      id: user.id,
      name: user.name || "",
      email: user.email,
      image: user.image || null,
      birthYear: user.birthYear ?? null,
      gender:
        user.gender === "male" ||
        user.gender === "female" ||
        user.gender === "prefer_not"
          ? user.gender
          : null,
      profileFilled: Boolean(user.profileFilled),
      createdAt: user.createdAt ?? null,
      isPremium: Boolean(user.isPremium),
    },
    isGoogleLinked,
    hasPassword,
  };
}

interface SettingsShellProps {
  children: (payload: {
    data: ProfileQueryData;
    refresh: () => Promise<void>;
    isRefreshing: boolean;
  }) => React.ReactNode;
}

export function SettingsShell({ children }: SettingsShellProps) {
  const router = useRouter();

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfileData,
    staleTime: 0,
    retry: false,
  });

  if (isLoading) {
    return <PageLoader message="Memuat pengaturan..." />;
  }

  if (!data?.user) {
    router.replace("/login");
    return null;
  }

  return (
    <BrandPageBackground>
      <section className="mx-auto w-full max-w-6xl px-4 pb-10 pt-6 sm:px-5 md:px-6 md:pt-8 lg:px-8">
        <button
          type="button"
          onClick={() => router.push("/home")}
          className="mb-4 inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-[var(--color-brand-teal)] transition hover:opacity-80"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </button>

        <div className="mb-5 sm:mb-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl md:text-[2.15rem]">
                Pengaturan
              </h1>
            </div>

            {isFetching ? (
              <span className="text-xs text-slate-400 sm:pt-1">
                Menyegarkan data...
              </span>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start">
          <div className="w-full self-start lg:max-w-[260px]">
            <SettingsSidebar
              profile={{
                name: data.user.name,
                email: data.user.email,
                image: data.user.image,
                isPremium: Boolean(data.user.isPremium),
              }}
            />
          </div>

          <div className="min-w-0 w-full">
            {children({
              data,
              refresh: async () => {
                await refetch();
              },
              isRefreshing: isFetching,
            })}
          </div>
        </div>
      </section>
    </BrandPageBackground>
  );
}
