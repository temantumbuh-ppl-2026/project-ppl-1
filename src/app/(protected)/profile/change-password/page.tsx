"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import QueryProvider from "@/components/providers/query-providers";
import { BrandPageBackground } from "@/components/layout/brand-page-background";
import { AuthField } from "@/components/auth/auth-field";
import { AuthInfoCard } from "@/components/auth/auth-info-card";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { authClient } from "@/lib/auth-client";
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from "@/lib/validations";

function resolveChangePasswordErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (
      message.includes("invalid password") ||
      message.includes("wrong password") ||
      message.includes("incorrect password") ||
      message.includes("current password") ||
      message.includes("invalid credentials")
    ) {
      return "Password saat ini salah.";
    }

    if (message.includes("same password")) {
      return "Password baru tidak boleh sama dengan password lama.";
    }

    if (message.includes("too many") || message.includes("rate")) {
      return "Terlalu banyak percobaan. Coba lagi beberapa saat.";
    }

    return error.message;
  }

  return "Gagal mengganti password. Silakan coba lagi.";
}

function ChangePasswordPageContent() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
    clearErrors,
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePasswordInput) => {
      const response = await authClient.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        revokeOtherSessions: false,
      });

      if (response.error) {
        throw new Error(response.error.message || "Gagal mengganti password.");
      }

      return response;
    },
    onSuccess: () => {
      setServerError("");
      toast.success("Password berhasil diperbarui.");
      reset();

      setTimeout(() => {
        router.replace("/profile");
      }, 300);
    },
    onError: (error) => {
      const message = resolveChangePasswordErrorMessage(error);

      setServerError(message);

      if (message === "Password saat ini salah.") {
        setError("currentPassword", {
          type: "server",
          message: "Password saat ini salah.",
        });
      }

      toast.error(message);
    },
  });

  const onSubmit = async (data: ChangePasswordInput) => {
    setServerError("");
    await changePasswordMutation.mutateAsync(data);
  };

  return (
    <BrandPageBackground>
      <div className="mx-auto flex min-h-[calc(100vh-128px)] w-full max-w-lg items-center px-4 py-12">
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Ganti Password
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Demi keamanan, ubah password akunmu dengan password baru yang
                lebih kuat.
              </p>
            </div>
          </div>

          <div className="mb-6">
            <AuthInfoCard icon="info">
              Gunakan password yang kuat dan jangan memakai password yang sama
              dengan akun lain.
            </AuthInfoCard>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            {serverError ? (
              <Alert className="border-red-200 bg-red-50 text-red-800">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Gagal mengganti password</AlertTitle>
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            ) : null}

            <AuthField
              id="current-password"
              label="Password Saat Ini"
              error={errors.currentPassword?.message}
            >
              <PasswordInput
                id="current-password"
                autoComplete="current-password"
                className="h-12 rounded-xl"
                placeholder="Masukkan password saat ini"
                hasError={!!errors.currentPassword}
                {...register("currentPassword", {
                  onChange: () => {
                    if (errors.currentPassword) {
                      clearErrors("currentPassword");
                    }
                    if (serverError) {
                      setServerError("");
                    }
                  },
                })}
              />
            </AuthField>

            <AuthField
              id="new-password"
              label="Password Baru"
              error={errors.newPassword?.message}
              hint="Minimal 8 karakter"
            >
              <PasswordInput
                id="new-password"
                autoComplete="new-password"
                className="h-12 rounded-xl"
                placeholder="Masukkan password baru"
                hasError={!!errors.newPassword}
                {...register("newPassword", {
                  onChange: () => {
                    if (serverError) {
                      setServerError("");
                    }
                  },
                })}
              />
            </AuthField>

            <AuthField
              id="confirm-new-password"
              label="Konfirmasi Password Baru"
              error={errors.confirmNewPassword?.message}
            >
              <PasswordInput
                id="confirm-new-password"
                autoComplete="new-password"
                className="h-12 rounded-xl"
                placeholder="Ulangi password baru"
                hasError={!!errors.confirmNewPassword}
                {...register("confirmNewPassword", {
                  onChange: () => {
                    if (serverError) {
                      setServerError("");
                    }
                  },
                })}
              />
            </AuthField>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={changePasswordMutation.isPending}
                className="h-12 w-full rounded-xl text-sm font-semibold text-white"
                style={{
                  background: "var(--gradient-brand-btn)",
                }}
              >
                {changePasswordMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Perubahan Password"
                )}
              </Button>
            </div>
          </form>

          <div className="mt-6 space-y-2 text-center text-sm text-slate-600">
            <p>
              Lupa password saat ini?{" "}
              <Link
                href="/forgot-password"
                className="font-semibold text-teal-700 hover:underline"
              >
                Atur ulang lewat email
              </Link>
            </p>

            <p>
              <Link
                href="/profile"
                className="font-semibold text-teal-700 hover:underline"
              >
                <span className="inline-flex items-center gap-1">
                  <ArrowLeft className="h-4 w-4" />
                  Kembali ke Profil
                </span>
              </Link>
            </p>
          </div>
        </div>
      </div>
    </BrandPageBackground>
  );
}

export default function ChangePasswordPage() {
  return (
    <QueryProvider>
      <ChangePasswordPageContent />
    </QueryProvider>
  );
}
