"use client";

import { useQuery } from "@tanstack/react-query";
import { OverviewPage } from "@/components/admin/OverviewPage";
import AdminLoading from "@/app/(admin)/admin/loading";

export function AdminOverviewClient() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const res = await fetch("/api/admin/overview");
      if (!res.ok) throw new Error("Failed to fetch dashboard overview");
      const json = await res.json();
      return json.data;
    },
    staleTime: 60_000,
  });

  if (isLoading) {
    return <AdminLoading />;
  }

  if (error || !data) {
    return (
      <div className="flex h-[75vh] w-full items-center justify-center text-red-500">
        Gagal memuat data overview admin.
      </div>
    );
  }

  return <OverviewPage stats={data} />;
}
