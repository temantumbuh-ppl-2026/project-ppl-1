"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";

import QueryProvider from "@/components/providers/query-providers";
import { AuthField } from "@/components/auth/auth-field";
import {
  AuthFormHeading,
  AuthSplitLayout,
} from "@/components/auth/redesign/auth-split-layout";
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
    <AuthSplitLayout>
      <AuthFormHeading
        eyebrow="satu kendala kecil"
        title="Reset password"
        description="Kami tidak bisa memverifikasi link reset password ini."
      />

      <Alert
        role="alert"
        className="rounded-tt-md border"
        style={{
          background: "var(--tt-attention-bg)",
          borderColor: "var(--tt-attention-border)",
          color: "var(--tt-attention-text)",
        }}
      >
        <AlertCircle className="h-4 w-4" aria-hidden="true" />
        <AlertTitle>Link tidak valid</AlertTitle>
        <AlertDescription>
          Link reset tidak valid atau sudah kedaluwarsa.
        </AlertDescription>
      </Alert>

      <div className="auth-form">
        <Button asChild className="auth-submit">
          <Link href="/forgot-password">Minta Link Reset Baru</Link>
        </Button>
      </div>

      <p className="auth-switch">
        <Link href="/login">← Kembali ke Login</Link>
      </p>
    </AuthSplitLayout>
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
    <AuthSplitLayout>
      <AuthFormHeading
        eyebrow="hampir selesai"
        title="Atur ulang password."
        description="Masukkan password baru untuk akunmu."
      />

      {!isSuccess ? (
        <>
          <div className="auth-note">
            <Info aria-hidden="true" />
            <span>
              Gunakan password baru yang kuat dan berbeda dari password
              sebelumnya.
            </span>
          </div>

          {serverError ? (
            <Alert
              role="alert"
              className="rounded-tt-md border"
              style={{
                background: "var(--tt-attention-bg)",
                borderColor: "var(--tt-attention-border)",
                color: "var(--tt-attention-text)",
              }}
            >
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <AlertTitle>Gagal mengatur ulang password</AlertTitle>
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          ) : null}

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="auth-form"
            noValidate
            aria-busy={resetPasswordMutation.isPending}
          >
            <AuthField
              id="reset-new-password"
              label="Password Baru"
              error={errors.newPassword?.message}
              hint="Minimal 8 karakter"
            >
              <PasswordInput
                id="reset-new-password"
                autoComplete="new-password"
                autoFocus
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

            <Button
              type="submit"
              disabled={resetPasswordMutation.isPending}
              aria-busy={resetPasswordMutation.isPending}
              className="auth-submit"
            >
              {resetPasswordMutation.isPending ? (
                <>
                  <Loader2
                    className="mr-2 h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                  Menyimpan...
                </>
              ) : (
                "Simpan Password Baru"
              )}
            </Button>
          </form>
        </>
      ) : (
        <div className="auth-form">
          <Alert
            role="status"
            className="rounded-tt-md border"
            style={{
              background: "var(--tt-success-bg)",
              borderColor: "var(--tt-success-text)",
              color: "var(--tt-success-text)",
            }}
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            <AlertTitle>Password berhasil diperbarui</AlertTitle>
            <AlertDescription>
              Password akunmu sudah berhasil diubah. Kamu akan diarahkan ke
              halaman login.
            </AlertDescription>
          </Alert>

          <Button asChild variant="outline" className="auth-secondary">
            <Link href="/login">Login Sekarang</Link>
          </Button>
        </div>
      )}

      <p className="auth-switch">
        Butuh link baru?{" "}
        <Link href="/forgot-password">Minta reset password lagi</Link>
      </p>
      <p className="auth-switch">
        <Link href="/login">← Kembali ke Login</Link>
      </p>
    </AuthSplitLayout>
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
