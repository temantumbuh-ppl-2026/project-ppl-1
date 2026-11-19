"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BraveChoicePage } from "@/components/admin/BraveChoicePage";
import AdminLoading from "@/app/(admin)/admin/loading";

export function AdminQuizClient() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-quiz"],
    queryFn: async () => {
      const res = await fetch("/api/admin/quiz");
      if (!res.ok) throw new Error("Failed to fetch quiz questions");
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
        Gagal memuat data kuis.
      </div>
    );
  }

  return (
    <BraveChoicePage
      initialQuestions={data}
      onMutationSuccess={() => {
        void queryClient.invalidateQueries({ queryKey: ["admin-quiz"] });
      }}
    />
  );
}
