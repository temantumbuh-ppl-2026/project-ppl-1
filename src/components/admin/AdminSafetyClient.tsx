"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import AdminLoading from "@/app/(admin)/admin/loading";
import { SafetyAlertsPage } from "@/components/admin/safety/SafetyAlertsPage";
import {
  fetchSafetyAlerts,
  parseAlertFilters,
  type SafetyAlertFilters,
} from "@/components/admin/safety/safety-alert-api";

export function AdminSafetyClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = parseAlertFilters(searchParams);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-safety-alerts", filters],
    queryFn: () => fetchSafetyAlerts(filters),
    staleTime: 10_000,
  });

  const handleFilterChange = (patch: Partial<SafetyAlertFilters>) => {
    const next = { ...filters, ...patch };
    // Ganti filter selalu kembali ke halaman pertama, kecuali pindah halaman.
    if (!("page" in patch)) next.page = 1;

    const params = new URLSearchParams();
    if (next.status !== "all") params.set("status", next.status);
    if (next.riskLevel !== "all") params.set("riskLevel", next.riskLevel);
    if (next.category !== "all") params.set("category", next.category);
    if (next.page > 1) params.set("page", String(next.page));

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
        className="flex h-[75vh] w-full items-center justify-center text-red-500"
      >
        Gagal memuat data safety alert.
      </div>
    );
  }

  return (
    <SafetyAlertsPage
      alerts={data.alerts}
      total={data.total}
      filters={filters}
      onFilterChange={handleFilterChange}
    />
  );
}
