"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import AdminLoading from "@/app/(admin)/admin/loading";
import { SafetyAlertDetailPage } from "@/components/admin/safety/SafetyAlertDetailPage";
import {
  fetchSafetyAlert,
  updateSafetyAlert,
} from "@/components/admin/safety/safety-alert-api";

export function AdminSafetyDetailClient({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const queryKey = ["admin-safety-alert", id];

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => fetchSafetyAlert(id),
    staleTime: 10_000,
  });

  const mutation = useMutation({
    mutationFn: (input: Parameters<typeof updateSafetyAlert>[1]) =>
      updateSafetyAlert(id, input),
    onSuccess: (alert) => {
      queryClient.setQueryData(queryKey, alert);
      void queryClient.invalidateQueries({ queryKey: ["admin-safety-alerts"] });
    },
  });

  if (isLoading) {
    return <AdminLoading />;
  }

  if (error || !data) {
    return (
      <div
        role="alert"
        className="flex h-[75vh] w-full items-center justify-center text-red-500"
      >
        Alert tidak ditemukan atau gagal dimuat.
      </div>
    );
  }

  return (
    <SafetyAlertDetailPage
      alert={data}
      isSaving={mutation.isPending}
      isSaved={mutation.isSuccess}
      saveError={
        mutation.isError
          ? "Status belum tersimpan. Coba lagi beberapa saat."
          : null
      }
      onSubmit={(input) =>
        mutation.mutate({
          status: input.status,
          reviewNote: input.reviewNote || undefined,
        })
      }
    />
  );
}
