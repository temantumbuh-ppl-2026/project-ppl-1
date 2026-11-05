"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import AdminLoading from "@/app/(admin)/admin/loading";
import { SafetyAlertDetailPage } from "@/components/admin/safety/SafetyAlertDetailPage";
import {
  fetchSafetyAlert,
  updateSafetyAlert,
  SafetyAlertApiError,
  safetyErrorMessage,
} from "@/components/admin/safety/safety-alert-api";

export function AdminSafetyDetailClient({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const queryKey = ["admin-safety-alert", id];

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey,
    queryFn: ({ signal }) => fetchSafetyAlert(id, signal),
    // Keep the form's version stable until save or an explicit reload.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    gcTime: 0,
    retry: false,
  });

  const mutation = useMutation({
    retry: false,
    mutationFn: (input: Parameters<typeof updateSafetyAlert>[1]) =>
      updateSafetyAlert(id, input),
    onSuccess: (alert) => {
      queryClient.setQueryData(["admin-safety-alert", alert.id], alert);
      void queryClient.invalidateQueries({ queryKey: ["admin-safety-alerts"] });
    },
  });

  const hasConflict =
    mutation.error instanceof SafetyAlertApiError &&
    mutation.error.status === 409;

  const reloadAlert = async () => {
    const result = await refetch();
    if (result.isSuccess) mutation.reset();
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
          onClick={() => void reloadAlert()}
        >
          {isFetching ? "Memuat..." : "Coba lagi"}
        </button>
      </div>
    );
  }

  return (
    <SafetyAlertDetailPage
      key={`${data.id}:${data.updatedAt}`}
      alert={data}
      isSaving={mutation.isPending}
      isSaved={mutation.isSuccess}
      saveError={mutation.isError ? safetyErrorMessage(mutation.error) : null}
      hasConflict={hasConflict}
      isReloading={isFetching}
      onReload={() => void reloadAlert()}
      onEdit={() => mutation.reset()}
      onSubmit={(input) =>
        mutation.mutate({
          status: input.status,
          reviewNote: input.reviewNote || null,
          expectedUpdatedAt: data.updatedAt,
        })
      }
    />
  );
}
