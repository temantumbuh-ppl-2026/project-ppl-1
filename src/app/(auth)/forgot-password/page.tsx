"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import QueryProvider from "@/components/providers/query-providers";
import { BrandPageBackground } from "@/components/layout/brand-page-background";
import { AuthField } from "@/components/auth/auth-field";
import { AuthInfoCard } from "@/components/auth/auth-info-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { authClient } from "@/lib/auth-client";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/validations";

function resolveForgotPasswordErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes("not found")) {
      return "Email belum terdaftar. Silakan daftar terlebih dahulu.";
    }

    if (message.includes("too many") || message.includes("rate")) {
      return "Terlalu banyak percobaan. Coba lagi beberapa saat.";
    }

    return error.message;
  }

  return "Gagal mengirim link reset password.";
}

function ForgotPasswordPageContent() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
    reset,
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordInput) => {
      // First check if email exists
      const checkRes = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });

      if (checkRes.ok) {
        const checkData = (await checkRes.json()) as { exists: boolean };
        if (!checkData.exists) {
          throw new Error(
            "Email belum terdaftar. Silakan daftar terlebih dahulu.",
          );
        }
      }

      const redirectTo = `${window.location.origin}/reset-password`;

      const response = await authClient.requestPasswordReset({
        email: data.email,
        redirectTo,
      });

      if (response.error) {
        const message = response.error.message || "";
        const code = response.error.code || "";

        if (
          message.toLowerCase().includes("not found") ||
          code.toLowerCase().includes("not_found")
        ) {
          throw new Error(
            "Email belum terdaftar. Silakan register terlebih dahulu.",
          );
        }

        throw new Error(message || "Gagal mengirim link reset password.");
      }

      return {
        email: data.email,
      };
    },
    onSuccess: ({ email }) => {
      setIsSubmitted(true);
      setSubmittedEmail(email);
      clearErrors();
      toast.success("Link reset password berhasil dikirim ke email tersebut.");
      reset({ email });
    },
    onError: (error) => {
      const message = resolveForgotPasswordErrorMessage(error);

      setError("email", {
        type: "server",
        message,
      });

      toast.error(message);
    },
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    clearErrors("email");
    await forgotPasswordMutation.mutateAsync(data);
  };

  return (
    <BrandPageBackground>
      <div className="mx-auto flex min-h-[calc(100vh-128px)] w-full max-w-md items-center px-4 py-12">
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Lupa Password
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Masukkan email akunmu. Kami akan kirim link untuk mengatur ulang
                password.
              </p>
            </div>
          </div>

          {!isSubmitted ? (
            <>
              <div className="mb-6">
                <AuthInfoCard icon="info">
                  Pastikan email yang kamu masukkan sama dengan email yang
                  terdaftar di akun TemanTumbuh.
                </AuthInfoCard>
              </div>

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4"
                noValidate
              >
                <AuthField
                  id="forgot-email"
                  label="Email"
                  error={errors.email?.message}
                >
                  <Input
                    id="forgot-email"
                    type="email"
                    autoComplete="email"
                    className="h-12 rounded-xl"
                    placeholder="email@contoh.com"
                    {...register("email", {
                      onChange: () => {
                        if (errors.email) {
                          clearErrors("email");
                        }
                      },
                    })}
                  />
                </AuthField>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={forgotPasswordMutation.isPending}
                    className="h-12 w-full rounded-xl text-sm font-semibold text-white"
                    style={{
                      background: "var(--gradient-brand-btn)",
                    }}
                  >
                    {forgotPasswordMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Mengirim...
                      </>
                    ) : (
                      "Kirim Link Reset"
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
                    <p className="font-semibold">Link reset berhasil dikirim</p>
                    <p className="mt-1">
                      Kami sudah memproses permintaan reset password untuk{" "}
                      <span className="font-medium">{submittedEmail}</span>.
                      Silakan cek inbox atau folder spam email kamu.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsSubmitted(false);
                  setSubmittedEmail("");
                  clearErrors();
                }}
                className="h-12 w-full rounded-xl"
              >
                Kirim ke Email Lain
              </Button>
            </div>
          )}

          <div className="mt-6 space-y-2 text-center text-sm text-slate-600">
            <p>
              Sudah ingat password?{" "}
              <Link
                href="/login"
                className="font-semibold text-teal-700 hover:underline"
              >
                Kembali ke Login
              </Link>
            </p>

            <p>
              <Link
                href="/"
                className="font-semibold text-teal-700 hover:underline"
              >
                <span className="inline-flex items-center gap-1">
                  <ArrowLeft className="h-4 w-4" />
                  Kembali ke Beranda
                </span>
              </Link>
            </p>
          </div>
        </div>
      </div>
    </BrandPageBackground>
  );
}

export default function ForgotPasswordPage() {
  return (
    <QueryProvider>
      <ForgotPasswordPageContent />
    </QueryProvider>
  );
}
