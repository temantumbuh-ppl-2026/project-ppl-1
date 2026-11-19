"use client";

import { ShieldCheck, Unlink2, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { UserProfile } from "@/components/settings/settings-shell";

type ParentStatus = "pending" | "verified" | "expired" | null;
type ParentStatusReason = "rejected" | "expired" | null;

type ParentReportContentProps = {
  profile: UserProfile;
  parentStatus: ParentStatus;
  parentStatusReason: ParentStatusReason;
  pendingParentEmail: string | null;
  onRefresh: () => Promise<void>;
};

type FormValues = {
  parentEmail: string;
};

function getStatusBadge(status: ParentStatus, reason: ParentStatusReason) {
  if (status === "verified") {
    return {
      label: "Terverifikasi",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  if (status === "pending") {
    return {
      label: "Menunggu",
      className: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  if (status === "expired") {
    if (reason === "rejected") {
      return {
        label: "Ditolak",
        className: "border-rose-200 bg-rose-50 text-rose-700",
      };
    }

    return {
      label: "Kedaluwarsa",
      className: "border-red-200 bg-red-50 text-red-700",
    };
  }

  return {
    label: "Belum Terhubung",
    className: "border-slate-200 bg-slate-50 text-slate-600",
  };
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function ParentReportContent({
  profile,
  parentStatus,
  parentStatusReason,
  pendingParentEmail,
  onRefresh,
}: ParentReportContentProps) {
  const queryClient = useQueryClient();
  const [isEditingEmail, setIsEditingEmail] = useState(false);

  const { control, setValue, reset } = useForm<FormValues>({
    defaultValues: {
      parentEmail: "",
    },
  });

  const watchedParentEmail = useWatch({
    control,
    name: "parentEmail",
  });

  const currentStoredEmail = useMemo(() => {
    if (profile.parentEmail) {
      return profile.parentEmail.trim();
    }

    if (parentStatus === "pending") {
      return (pendingParentEmail || "").trim();
    }

    if (parentStatus === "expired" && parentStatusReason === "expired") {
      return (pendingParentEmail || "").trim();
    }

    return "";
  }, [
    profile.parentEmail,
    parentStatus,
    parentStatusReason,
    pendingParentEmail,
  ]);

  useEffect(() => {
    reset({
      parentEmail: currentStoredEmail,
    });
  }, [currentStoredEmail, reset]);

  const normalizedCurrentInput = useMemo(
    () => (watchedParentEmail || "").trim().toLowerCase(),
    [watchedParentEmail],
  );

  const normalizedStoredEmail = useMemo(
    () => (currentStoredEmail || "").trim().toLowerCase(),
    [currentStoredEmail],
  );

  const statusBadge = getStatusBadge(parentStatus, parentStatusReason);

  const canDisconnect = Boolean(profile.parentEmail);
  const isInputChanged = normalizedCurrentInput !== normalizedStoredEmail;

  const saveParentEmailMutation = useMutation({
    mutationFn: async (parentEmailValue: string) => {
      const normalizedParentEmail = parentEmailValue.trim().toLowerCase();

      const response = await authClient.updateUser({
        parentEmail: normalizedParentEmail,
        profileFilled: true,
      });

      if (response.error) {
        throw new Error(
          response.error.message || "Gagal menyimpan email orang tua.",
        );
      }

      return normalizedParentEmail;
    },
    onSuccess: async (normalizedParentEmail) => {
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      await onRefresh();
      setIsEditingEmail(false);
      toast.success(
        `Email orang tua berhasil diperbarui ke ${normalizedParentEmail}.`,
      );
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menyimpan email orang tua.",
      );
    },
  });

  const disconnectParentEmailMutation = useMutation({
    mutationFn: async () => {
      const response = await authClient.updateUser({
        parentEmail: null,
        profileFilled: true,
      });

      if (response.error) {
        throw new Error(
          response.error.message || "Gagal memutuskan hubungan orang tua.",
        );
      }

      return true;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      await onRefresh();
      setIsEditingEmail(false);
      reset({ parentEmail: "" });
      toast.success("Hubungan orang tua berhasil diputuskan.");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat memutuskan hubungan.",
      );
    },
  });

  const handleStartEdit = () => {
    setValue("parentEmail", currentStoredEmail, { shouldDirty: false });
    setIsEditingEmail(true);
  };

  const handleCancelEdit = () => {
    reset({ parentEmail: currentStoredEmail });
    setIsEditingEmail(false);
  };

  const handleSaveParentEmail = async () => {
    if (!normalizedCurrentInput) {
      toast.error("Email orang tua tidak boleh kosong.");
      return;
    }

    if (!isValidEmail(normalizedCurrentInput)) {
      toast.error("Format email orang tua tidak valid.");
      return;
    }

    await saveParentEmailMutation.mutateAsync(normalizedCurrentInput);
  };

  const handleDisconnectParent = async () => {
    await disconnectParentEmailMutation.mutateAsync();
  };

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-4 sm:px-5 md:px-6">
          <Users className="h-4.5 w-4.5 text-[var(--color-brand-teal)]" />
          <div>
            <h2 className="text-[15px] font-extrabold text-slate-900 sm:text-base">
              Konfigurasi Laporan
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Atur pengiriman laporan kepada orang tua atau wali.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 border-b border-slate-200 px-4 py-4 sm:px-5 md:grid-cols-[190px_minmax(0,1fr)] md:gap-5 md:px-6">
          <div className="md:pt-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold text-slate-900">
                Email Orang Tua
              </p>
              <span
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusBadge.className}`}
              >
                {statusBadge.label}
              </span>
            </div>

            <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
              Laporan mingguan akan dikirimkan ke email ini.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex w-full flex-col gap-2.5 md:max-w-[520px] sm:flex-row">
              <Input
                type="email"
                value={watchedParentEmail || ""}
                onChange={(event) =>
                  setValue("parentEmail", event.target.value, {
                    shouldDirty: true,
                  })
                }
                placeholder="ortu@email.com"
                className={`h-10 flex-1 rounded-xl text-sm 
                ${!isEditingEmail ? "cursor-not-allowed bg-slate-50 text-slate-500" : ""}`}
                disabled={
                  !isEditingEmail ||
                  saveParentEmailMutation.isPending ||
                  disconnectParentEmailMutation.isPending
                }
              />

              {!isEditingEmail ? (
                <Button
                  type="button"
                  onClick={handleStartEdit}
                  className="h-10 rounded-xl text-white"
                  style={{ background: "var(--gradient-brand-btn)" }}
                >
                  Edit Email
                </Button>
              ) : (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={
                      saveParentEmailMutation.isPending ||
                      disconnectParentEmailMutation.isPending
                    }
                    className="h-10 rounded-xl"
                  >
                    Batal
                  </Button>

                  <Button
                    type="button"
                    onClick={() => void handleSaveParentEmail()}
                    disabled={
                      saveParentEmailMutation.isPending ||
                      !normalizedCurrentInput ||
                      !isInputChanged
                    }
                    className="h-10 rounded-xl text-white"
                    style={{ background: "var(--gradient-brand-btn)" }}
                  >
                    {saveParentEmailMutation.isPending
                      ? "Menyimpan..."
                      : "Simpan"}
                  </Button>
                </div>
              )}
            </div>

            {canDisconnect ? (
              <div className="flex justify-start">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void handleDisconnectParent()}
                  disabled={
                    saveParentEmailMutation.isPending ||
                    disconnectParentEmailMutation.isPending
                  }
                  className="h-10 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <Unlink2 className="mr-2 h-4 w-4" />
                  {disconnectParentEmailMutation.isPending
                    ? "Memutuskan..."
                    : "Putuskan Hubungan"}
                </Button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="px-4 py-4 sm:px-5 md:px-6">
          {parentStatus === "pending" ? (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
              <p className="text-xs leading-relaxed">
                Permintaan persetujuan telah dikirim ke{" "}
                <strong>{currentStoredEmail}</strong>.
              </p>
            </div>
          ) : null}

          {parentStatus === "expired" && parentStatusReason === "rejected" ? (
            <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800">
              <p className="text-xs leading-relaxed">
                Permintaan konfirmasi ditolak oleh orang tua atau wali. Silakan
                isi ulang email lalu simpan untuk mengirim permintaan baru.
              </p>
            </div>
          ) : null}

          {parentStatus === "expired" && parentStatusReason !== "rejected" ? (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800">
              <p className="text-xs leading-relaxed">
                Tautan konfirmasi untuk <strong>{currentStoredEmail}</strong>{" "}
                telah kedaluwarsa. Silakan edit lalu simpan ulang untuk mengirim
                permintaan baru.
              </p>
            </div>
          ) : null}

          {!currentStoredEmail && parentStatus === null ? (
            <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-600">
              <p className="text-xs leading-relaxed">
                Belum ada email orang tua yang terhubung.
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-4 sm:px-5 md:px-6">
          <ShieldCheck className="h-4.5 w-4.5 text-[var(--color-brand-teal)]" />
          <div>
            <h2 className="text-[15px] font-extrabold text-slate-900 sm:text-base">
              Yang Tidak Dikirim ke Orang Tua
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Privasi diary kamu tetap terlindungi sepenuhnya.
            </p>
          </div>
        </div>

        <div className="space-y-2.5 p-4 sm:p-5 md:p-6">
          {[
            "Isi diary atau jurnal pribadi",
            "Hasil refleksi AI yang personal",
            "Pesan atau catatan yang kamu tulis",
            "Detail skor per sesi Brave Choice",
          ].map((item) => (
            <div
              key={item}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
            >
              <span className="text-[13px] font-medium text-slate-600">
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
