"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";

import QueryProvider from "@/components/providers/query-providers";
import { AuthField } from "@/components/auth/auth-field";
import {
  AuthFormHeading,
  AuthSplitLayout,
} from "@/components/auth/redesign/auth-split-layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
    <AuthSplitLayout>
      <AuthFormHeading
        eyebrow="tenang, kita bantu"
        title="Lupa password?"
        description="Masukkan email akunmu. Kami akan kirim link untuk mengatur ulang password."
      />

      {!isSubmitted ? (
        <>
          <div className="auth-note">
            <Info aria-hidden="true" />
            <span>
              Pastikan email yang kamu masukkan sama dengan email yang terdaftar
              di akun TemanTumbuh.
            </span>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="auth-form"
            noValidate
            aria-busy={forgotPasswordMutation.isPending}
          >
            <AuthField
              id="forgot-email"
              label="Email"
              error={errors.email?.message}
            >
              <Input
                id="forgot-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoFocus
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

            <Button
              type="submit"
              disabled={forgotPasswordMutation.isPending}
              aria-busy={forgotPasswordMutation.isPending}
              className="auth-submit"
            >
              {forgotPasswordMutation.isPending ? (
                <>
                  <Loader2
                    className="mr-2 h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                  Mengirim...
                </>
              ) : (
                "Kirim Link Reset"
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
            <AlertTitle>Link reset berhasil dikirim</AlertTitle>
            <AlertDescription>
              Kami sudah memproses permintaan reset password untuk{" "}
              <span className="font-medium">{submittedEmail}</span>. Silakan cek
              inbox atau folder spam email kamu.
            </AlertDescription>
          </Alert>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setIsSubmitted(false);
              setSubmittedEmail("");
              clearErrors();
            }}
            className="auth-secondary"
          >
            Kirim ke Email Lain
          </Button>
        </div>
      )}

      <p className="auth-switch">
        Sudah ingat password? <Link href="/login">Kembali ke Login</Link>
      </p>
      <p className="auth-switch">
        <Link href="/">← Kembali ke Beranda</Link>
      </p>
    </AuthSplitLayout>
  );
}
export default function ForgotPasswordPage() {
  return (
    <QueryProvider>
      <ForgotPasswordPageContent />
    </QueryProvider>
  );
}
