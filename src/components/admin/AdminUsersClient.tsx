"use client";

import { useQuery } from "@tanstack/react-query";
import { UsersPage } from "@/components/admin/UsersPage";
import AdminLoading from "@/app/(admin)/admin/loading";
import { useSearchParams } from "next/navigation";

export function AdminUsersClient() {
  const searchParams = useSearchParams();
  const search = searchParams.get("search") ?? "";
  const filter = searchParams.get("filter") ?? "all";
  const page = searchParams.get("page") ?? "1";
  const limit = searchParams.get("limit") ?? "10";

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-users", search, filter, page, limit],
    queryFn: async () => {
      const res = await fetch(
        `/api/admin/users?search=${encodeURIComponent(search)}&filter=${encodeURIComponent(filter)}&page=${page}&limit=${limit}`,
      );
      if (!res.ok) throw new Error("Failed to fetch users");
      const json = await res.json();
      return json.data;
    },
    staleTime: 10_000,
  });

  if (isLoading) {
    return <AdminLoading />;
  }

  if (error || !data) {
    return (
      <div className="flex h-[75vh] w-full items-center justify-center text-red-500">
        Gagal memuat data pengguna.
      </div>
    );
  }

  return (
    <UsersPage
      users={data.users}
      total={data.total}
      page={data.page}
      limit={data.limit}
      currentSearch={data.currentSearch}
      currentFilter={data.currentFilter}
    />
  );
}
