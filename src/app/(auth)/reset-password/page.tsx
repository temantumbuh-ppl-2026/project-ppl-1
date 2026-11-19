"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import QueryProvider from "@/components/providers/query-providers";
import { BrandPageBackground } from "@/components/layout/brand-page-background";
import { AuthField } from "@/components/auth/auth-field";
import { AuthInfoCard } from "@/components/auth/auth-info-card";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PageLoaderFallback } from "@/components/ui/manual/page-loader";

import { authClient } from "@/lib/auth-client";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/lib/validations";

function resolveResetPasswordErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (
      message.includes("invalid token") ||
      message.includes("token") ||
      message.includes("expired")
    ) {
      return "Link reset tidak valid atau sudah kedaluwarsa.";
    }

    if (message.includes("too many") || message.includes("rate")) {
      return "Terlalu banyak percobaan. Coba lagi beberapa saat.";
    }

    return error.message;
  }

  return "Gagal mengatur ulang password.";
}

function InvalidTokenState() {
  return (
    <BrandPageBackground>
      <div className="mx-auto flex min-h-[calc(100vh-128px)] w-full max-w-md items-center px-4 py-12">
        <div className="w-full rounded-2xl border border-red-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Reset Password
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Kami tidak bisa memverifikasi link reset password ini.
              </p>
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-700">
              <AlertCircle className="h-5 w-5" />
            </div>
          </div>

          <Alert className="border-red-200 bg-red-50 text-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Link tidak valid</AlertTitle>
            <AlertDescription>
              Link reset tidak valid atau sudah kedaluwarsa.
            </AlertDescription>
          </Alert>

          <div className="mt-6">
            <Button
              asChild
              className="h-12 w-full rounded-xl text-white"
              style={{ background: "var(--gradient-brand-btn)" }}
            >
              <Link href="/forgot-password">Minta Link Reset Baru</Link>
            </Button>
          </div>

          <p className="mt-4 text-center text-sm text-slate-600">
            <Link
              href="/login"
              className="font-semibold text-teal-700 hover:underline"
            >
              Kembali ke Login
            </Link>
          </p>
        </div>
      </div>
    </BrandPageBackground>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [serverError, setServerError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    clearErrors,
    reset,
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordInput) => {
      if (!token) {
        throw new Error("Link reset tidak valid atau sudah kedaluwarsa.");
      }

      const response = await authClient.resetPassword({
        newPassword: data.newPassword,
        token,
      });

      if (response.error) {
        throw new Error(
          response.error.message || "Gagal mengatur ulang password.",
        );
      }

      return response;
    },
    onSuccess: () => {
      setServerError("");
      setIsSuccess(true);
      toast.success("Password berhasil diubah. Silakan login kembali.");
      reset();

      setTimeout(() => {
        router.replace("/login");
      }, 800);
    },
    onError: (error) => {
      const message = resolveResetPasswordErrorMessage(error);
      setServerError(message);
      toast.error(message);
    },
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    setServerError("");
    await resetPasswordMutation.mutateAsync(data);
  };

  if (!token) {
    return <InvalidTokenState />;
  }

  return (
    <BrandPageBackground>
      <div className="mx-auto flex min-h-[calc(100vh-128px)] w-full max-w-md items-center px-4 py-12">
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Atur Ulang Password
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Masukkan password baru untuk akunmu.
              </p>
            </div>
          </div>

          {!isSuccess ? (
            <>
              <div className="mb-6">
                <AuthInfoCard icon="info">
                  Gunakan password baru yang kuat dan berbeda dari password
                  sebelumnya.
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
                    <AlertTitle>Gagal mengatur ulang password</AlertTitle>
                    <AlertDescription>{serverError}</AlertDescription>
                  </Alert>
                ) : null}

                <AuthField
                  id="reset-new-password"
                  label="Password Baru"
                  error={errors.newPassword?.message}
                  hint="Minimal 8 karakter"
                >
                  <PasswordInput
                    id="reset-new-password"
                    autoComplete="new-password"
                    className="h-12 rounded-xl"
                    placeholder="Masukkan password baru"
                    hasError={!!errors.newPassword}
                    {...register("newPassword", {
                      onChange: () => {
                        if (serverError) {
                          setServerError("");
                        }
                        if (errors.newPassword) {
                          clearErrors("newPassword");
                        }
                      },
                    })}
                  />
                </AuthField>

                <AuthField
                  id="reset-confirm-password"
                  label="Konfirmasi Password Baru"
                  error={errors.confirmNewPassword?.message}
                >
                  <PasswordInput
                    id="reset-confirm-password"
                    autoComplete="new-password"
                    className="h-12 rounded-xl"
                    placeholder="Ulangi password baru"
                    hasError={!!errors.confirmNewPassword}
                    {...register("confirmNewPassword", {
                      onChange: () => {
                        if (serverError) {
                          setServerError("");
                        }
                        if (errors.confirmNewPassword) {
                          clearErrors("confirmNewPassword");
                        }
                      },
                    })}
                  />
                </AuthField>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={resetPasswordMutation.isPending}
                    className="h-12 w-full rounded-xl text-sm font-semibold text-white"
                    style={{
                      background: "var(--gradient-brand-btn)",
                    }}
                  >
                    {resetPasswordMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      "Simpan Password Baru"
                    )}
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-semibold">
                      Password berhasil diperbarui
                    </p>
                    <p className="mt-1">
                      Password akunmu sudah berhasil diubah. Kamu akan diarahkan
                      ke halaman login.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                asChild
                variant="outline"
                className="h-12 w-full rounded-xl"
              >
                <Link href="/login">Login Sekarang</Link>
              </Button>
            </div>
          )}

          <div className="mt-6 space-y-2 text-center text-sm text-slate-600">
            <p>
              Butuh link baru?{" "}
              <Link
                href="/forgot-password"
                className="font-semibold text-teal-700 hover:underline"
              >
                Minta reset password lagi
              </Link>
            </p>

            <p>
              <Link
                href="/login"
                className="font-semibold text-teal-700 hover:underline"
              >
                <span className="inline-flex items-center gap-1">
                  <ArrowLeft className="h-4 w-4" />
                  Kembali ke Login
                </span>
              </Link>
            </p>
          </div>
        </div>
      </div>
    </BrandPageBackground>
  );
}

function ResetPasswordPageInner() {
  return (
    <Suspense fallback={<PageLoaderFallback />}>
      <ResetPasswordContent />
    </Suspense>
  );
}

export default function ResetPasswordPage() {
  return (
    <QueryProvider>
      <ResetPasswordPageInner />
    </QueryProvider>
  );
}
