"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import AdminLoading from "@/app/(admin)/admin/loading";
import { SafetyAlertsPage } from "@/components/admin/safety/SafetyAlertsPage";
import {
  fetchSafetyAlerts,
  parseAlertFilters,
  safetyErrorMessage,
  type SafetyAlertFilters,
} from "@/components/admin/safety/safety-alert-api";

export function AdminSafetyClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = parseAlertFilters(searchParams);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["admin-safety-alerts", filters],
    queryFn: ({ signal }) => fetchSafetyAlerts(filters, signal),
    staleTime: 10_000,
    gcTime: 0,
    retry: false,
  });

  const handleFilterChange = (patch: Partial<SafetyAlertFilters>) => {
    const next = { ...filters, ...patch };
    // Ganti filter selalu kembali ke halaman pertama, kecuali pindah halaman.
    if (!("page" in patch)) next.page = 1;

    const params = new URLSearchParams();
    params.set("status", next.status);
    params.set("riskLevel", next.riskLevel);
    if (next.category !== "all") params.set("category", next.category);
    if (next.page > 1) params.set("page", String(next.page));
    params.set("limit", String(next.limit));

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  if (isLoading) {
    return <AdminLoading />;
  }

  if (error || !data) {
    return (
      <div
        role="alert"
        className="flex h-[75vh] w-full flex-col items-center justify-center gap-4 text-red-500"
      >
        <p>{safetyErrorMessage(error)}</p>
        <button
          type="button"
          disabled={isFetching}
          onClick={() => void refetch()}
        >
          {isFetching ? "Memuat..." : "Coba lagi"}
        </button>
      </div>
    );
  }

  return (
    <SafetyAlertsPage
      alerts={data.alerts}
      total={data.total}
      filters={filters}
      onFilterChange={handleFilterChange}
      isRefreshing={isFetching}
      onRefresh={() => void refetch()}
    />
  );
}
