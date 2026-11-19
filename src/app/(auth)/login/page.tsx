"use client";

import QueryProvider from "@/components/providers/query-providers";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertCircle, Loader2 } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { loginSchema, type LoginInput } from "@/lib/validations";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  PageLoader,
  PageLoaderFallback,
} from "@/components/ui/manual/page-loader";
import { GoogleIcon } from "@/components/ui/manual/google-icon";

import { AuthField } from "@/components/auth/auth-field";
import {
  AuthFormHeading,
  AuthSplitLayout,
} from "@/components/auth/redesign/auth-split-layout";

type SessionStatus = {
  isAuthenticated: boolean;
  nextRoute: string;
};

const SESSION_QUERY_KEY = ["login", "post-login-status"] as const;

async function fetchSessionStatus(): Promise<SessionStatus> {
  const response = await fetch("/api/auth/post-login-status", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Gagal memeriksa status sesi.");
  }

  return response.json();
}

function resolveLoginErrorMessage(error: {
  status?: number;
  message?: string;
  code?: string;
}) {
  const message = (error.message || "").toLowerCase();
  const code = (error.code || "").toLowerCase();

  if (
    error.status === 403 ||
    message.includes("verify") ||
    message.includes("verifikasi")
  ) {
    return "Email belum terverifikasi. Silakan cek inbox/spam untuk verifikasi.";
  }

  if (
    error.status === 429 ||
    message.includes("too many") ||
    message.includes("rate")
  ) {
    return "Terlalu banyak percobaan login. Coba lagi beberapa saat.";
  }

  if (
    error.status === 401 ||
    error.status === 400 ||
    message.includes("invalid") ||
    message.includes("credential") ||
    code.includes("invalid")
  ) {
    return "Email atau password tidak valid.";
  }

  if (message.includes("not found") || code.includes("not_found")) {
    return "Akun tidak ditemukan. Silakan daftar terlebih dahulu.";
  }

  return error.message ?? "Gagal login. Silakan coba lagi.";
}

function LoginPageContent() {
  const shouldReduce = useReducedMotion();

  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const {
    data: sessionData,
    isLoading: isSessionLoading,
    isError: isSessionError,
  } = useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: fetchSessionStatus,
    retry: 1,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (isSessionLoading || isSessionError || !sessionData?.isAuthenticated) {
      return;
    }

    window.location.href = sessionData.nextRoute;
  }, [isSessionLoading, isSessionError, sessionData]);

  const loginMutation = useMutation<
    unknown,
    { status?: number; message?: string; code?: string },
    LoginInput
  >({
    mutationFn: async (data) => {
      const response = await authClient.signIn.email({
        email: data.email,
        password: data.password,
        callbackURL: "/login",
      });

      if (response.error) {
        throw response.error;
      }

      return response;
    },
    onSuccess: () => {
      toast.success("Login berhasil.");
      reset();
      // auth library biasanya akan redirect otomatis ke callbackURL (/login),
      // lalu layout/login page akan meneruskan ke route berikutnya.
    },
    onError: (error) => {
      setServerError(resolveLoginErrorMessage(error));
    },
  });

  const googleMutation = useMutation({
    mutationFn: async () => {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/login",
      });
    },
    onError: (error) => {
      console.error("Google login error:", error);
      setServerError("Gagal memulai login Google. Silakan coba lagi.");
      toast.error("Google sign-in gagal dimulai.");
    },
  });

  const onSubmit = useCallback(
    async (data: LoginInput) => {
      setServerError("");
      await loginMutation.mutateAsync(data);
    },
    [loginMutation],
  );

  if (isSessionLoading) {
    return <PageLoader message="Memeriksa sesi..." fullscreen />;
  }

  if (sessionData?.isAuthenticated) {
    return <PageLoader message="Memuat dashboard..." fullscreen />;
    /*  */
  }

  const isEmailPending = isSubmitting || loginMutation.isPending;

  return (
    <AuthSplitLayout>
      <AuthFormHeading
        eyebrow="selamat datang lagi"
        title="Senang kamu kembali."
        description="Masuk ke akun TemanTumbuh-mu dan lanjutkan ceritamu."
      />

      <AnimatePresence mode="wait">
        {serverError ? (
          <motion.div
            key="error"
            initial={shouldReduce ? false : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="auth-alert"
          >
            <Alert
              className="rounded-tt-md border"
              style={{
                background: "var(--tt-attention-bg)",
                borderColor: "var(--tt-attention-border)",
                color: "var(--tt-attention-text)",
              }}
            >
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Login gagal</AlertTitle>
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <Button
        type="button"
        variant="outline"
        onClick={() => {
          setServerError("");
          googleMutation.mutate();
        }}
        disabled={googleMutation.isPending || isEmailPending}
        aria-busy={googleMutation.isPending}
        className="google-button"
      >
        {googleMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <GoogleIcon />
        )}
        {googleMutation.isPending ? "Menghubungkan..." : "Masuk dengan Google"}
      </Button>

      <div className="auth-divider">
        <span>atau masuk dengan email</span>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="auth-form"
        noValidate
        aria-busy={isEmailPending}
      >
        <AuthField id="login-email" label="Email" error={errors.email?.message}>
          <Input
            id="login-email"
            type="email"
            inputMode="email"
            placeholder="email@contoh.com"
            autoComplete="email"
            autoFocus
            {...register("email")}
          />
        </AuthField>

        <AuthField
          id="login-password"
          label="Password"
          error={errors.password?.message}
        >
          <PasswordInput
            id="login-password"
            placeholder="Masukkan password"
            autoComplete="current-password"
            hasError={!!errors.password}
            {...register("password")}
          />
        </AuthField>

        <Link href="/forgot-password" className="forgot-link">
          Lupa password?
        </Link>

        <Button
          type="submit"
          disabled={isEmailPending || googleMutation.isPending}
          aria-busy={isEmailPending}
          className="auth-submit"
        >
          {isEmailPending ? (
            <>
              <Loader2
                className="mr-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
              Masuk...
            </>
          ) : (
            <>Masuk</>
          )}
        </Button>
      </form>

      <p className="auth-switch">
        Belum punya akun? <Link href="/register">Daftar Gratis</Link>
      </p>
    </AuthSplitLayout>
  );
}

export default function LoginPage() {
  return (
    <QueryProvider>
      <Suspense fallback={<PageLoaderFallback />}>
        <LoginPageContent />
      </Suspense>
    </QueryProvider>
  );
}
