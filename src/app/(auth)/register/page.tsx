"use client";

import QueryProvider from "@/components/providers/query-providers";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, Loader2, LogIn } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import {
  registerStep1Schema,
  registerStep2Schema,
  registerStep3Schema,
  type RegisterStep1Input,
  type RegisterStep2Input,
  type RegisterStep3Input,
} from "@/lib/validations";
import {
  scalePopVariants,
  slideInVariants,
  springBouncy,
  springSmooth,
} from "@/lib/animations";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PageLoader,
  PageLoaderFallback,
} from "@/components/ui/manual/page-loader";
import { GoogleIcon } from "@/components/ui/manual/google-icon";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { AuthShell } from "@/components/auth/auth-shell";
import { AuthStepIndicator } from "@/components/auth/auth-step-indicator";
import { AuthField } from "@/components/auth/auth-field";
import { AuthInfoCard } from "@/components/auth/auth-info-card";
import { BrandPageBackground } from "@/components/layout/brand-page-background";

type Step1 = RegisterStep1Input;
type Step2 = RegisterStep2Input;
type Step3 = RegisterStep3Input;

type SessionUser = {
  name?: string | null;
  profileFilled?: boolean | null;
};

type ProfileStatus = {
  isAuthenticated: boolean;
  isComplete: boolean;
  userName: string;
};

type RegisterAuthError = {
  status?: number;
  statusCode?: number;
  message?: string;
  code?: string;
};

type RegisterError =
  | { kind: "email_exists"; email: string }
  | { kind: "generic"; message: string }
  | null;

const SESSION_QUERY_KEY = ["register", "session"] as const;

async function fetchProfileStatus(): Promise<ProfileStatus> {
  const { data } = await authClient.getSession();
  const user = data?.user as SessionUser | undefined;

  return {
    isAuthenticated: Boolean(user),
    isComplete: Boolean(user?.profileFilled),
    userName: user?.name ?? "",
  };
}

async function checkEmailExists(email: string): Promise<boolean> {
  const res = await fetch("/api/auth/check-email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  const json = (await res.json()) as {
    exists?: boolean;
    error?: string;
  };

  if (!res.ok) {
    throw {
      status: res.status,
      message: json.error ?? "Gagal memeriksa email",
    } satisfies RegisterAuthError;
  }

  return Boolean(json.exists);
}

function resolveRegisterError(
  error: RegisterAuthError,
  email?: string,
): RegisterError {
  const message = (error.message ?? "").toLowerCase();
  const code = (error.code ?? "").toLowerCase();
  const status = error.status ?? error.statusCode;

  const isEmailExists =
    message.includes("exist") ||
    message.includes("already") ||
    message.includes("registered") ||
    message.includes("terdaftar") ||
    message.includes("user already exists") ||
    message.includes("email already exists") ||
    code.includes("already_exists") ||
    code.includes("user_already_exists") ||
    code.includes("email_already_exists") ||
    code.includes("email_exists");

  if (isEmailExists) {
    return {
      kind: "email_exists",
      email: email ?? "",
    };
  }

  if (message.includes("gagal mengirim email")) {
    return {
      kind: "generic",
      message:
        "Gagal mengirim email verifikasi. Akun gagal dibuat. Silakan coba lagi.",
    };
  }

  if (
    status === 429 ||
    message.includes("too many") ||
    message.includes("rate")
  ) {
    return {
      kind: "generic",
      message: "Terlalu banyak percobaan. Coba lagi beberapa saat.",
    };
  }

  if (message.includes("password") && message.includes("8")) {
    return {
      kind: "generic",
      message: "Password minimal 8 karakter.",
    };
  }

  if (message.includes("email") && message.includes("invalid")) {
    return {
      kind: "generic",
      message: "Format email tidak valid.",
    };
  }

  return {
    kind: "generic",
    message: error.message ?? "Gagal mendaftar. Silakan coba lagi.",
  };
}

function EmailExistsAlert({ email }: { email: string }) {
  return (
    <motion.div
      key="email-exists"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2 }}
      className="mb-4"
    >
      <Alert
        className="rounded-xl border"
        style={{
          background: "#FFF7ED",
          borderColor: "#FED7AA",
          color: "#9A3412",
        }}
      >
        <AlertCircle className="h-4 w-4" style={{ color: "#EA580C" }} />

        <AlertTitle style={{ color: "#9A3412", fontWeight: 700 }}>
          Email sudah terdaftar
        </AlertTitle>

        <AlertDescription style={{ color: "#7C2D12" }}>
          <span className="mb-2 block">
            Akun dengan email <strong className="break-all">{email}</strong>{" "}
            sudah ada. Silakan login atau gunakan email lain.
          </span>

          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-opacity hover:opacity-80"
              style={{
                background: "#EA580C",
                color: "#fff",
              }}
            >
              <LogIn size={12} />
              Masuk ke akun
            </Link>

            <Link
              href="/forgot-password"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-80"
              style={{
                background: "rgba(234,88,12,0.1)",
                color: "#C2410C",
                border: "1px solid rgba(234,88,12,0.25)",
              }}
            >
              Lupa password?
            </Link>
          </div>
        </AlertDescription>
      </Alert>
    </motion.div>
  );
}

function GenericErrorAlert({ message }: { message: string }) {
  return (
    <motion.div
      key="generic-error"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2 }}
      className="mb-4"
    >
      <Alert
        className="rounded-xl border"
        style={{
          background: "#FEF2F2",
          borderColor: "#FECACA",
          color: "#B91C1C",
        }}
      >
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Pendaftaran gagal</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    </motion.div>
  );
}

function StepHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-4 text-center">
      <h2
        className="mb-2 text-xl font-bold"
        style={{ color: "var(--color-text-brand-primary)" }}
      >
        {title}
      </h2>

      <p className="text-sm" style={{ color: "var(--color-text-brand-muted)" }}>
        {description}
      </p>
    </div>
  );
}

function Step1Form({
  onNext,
  onGoogle,
  isGoogleLoading,
  isEmailLoading,
  verificationEmail,
  isCompleteProfileFlow,
  defaultValues,
  registerError,
  onClearError,
}: {
  onNext: (data: Step1) => Promise<void> | void;
  onGoogle: () => void;
  isGoogleLoading: boolean;
  isEmailLoading: boolean;
  verificationEmail?: string | null;
  isCompleteProfileFlow?: boolean;
  defaultValues: Partial<Step1>;
  registerError: RegisterError;
  onClearError: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Step1>({
    resolver: zodResolver(registerStep1Schema),
    defaultValues,
  });

  return (
    <motion.div
      key="step1"
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={slideInVariants}
      transition={springSmooth}
    >
      <StepHeading
        title="Buat Akun"
        description="Mulai dengan email atau Google"
      />

      <AnimatePresence mode="wait">
        {registerError?.kind === "email_exists" ? (
          <EmailExistsAlert key="exists" email={registerError.email} />
        ) : registerError?.kind === "generic" ? (
          <GenericErrorAlert key="generic" message={registerError.message} />
        ) : null}
      </AnimatePresence>

      <Button
        type="button"
        variant="outline"
        onClick={onGoogle}
        disabled={isGoogleLoading}
        className="mb-4 h-11 w-full gap-4 rounded-lg border-[1.5px] bg-white font-semibold"
        style={{
          borderColor: "var(--color-brand-border)",
          color: "var(--color-text-brand-primary)",
        }}
      >
        {isGoogleLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        {isGoogleLoading ? "Menghubungkan..." : "Daftar dengan Google"}
      </Button>

      <div className="mb-4 flex items-center gap-4">
        <div
          className="h-px flex-1"
          style={{ background: "var(--color-brand-border)" }}
        />

        <span
          className="text-sm"
          style={{ color: "var(--color-text-brand-muted)" }}
        >
          atau dengan email
        </span>

        <div
          className="h-px flex-1"
          style={{ background: "var(--color-brand-border)" }}
        />
      </div>

      <form
        onSubmit={handleSubmit(async (data) => {
          onClearError();
          await onNext(data);
        })}
        className="space-y-4"
        noValidate
      >
        <AuthField id="reg-email" label="Email" error={errors.email?.message}>
          <Input
            id="reg-email"
            type="email"
            placeholder="email@contoh.com"
            autoComplete="email"
            autoFocus
            className="h-11 rounded-lg"
            {...register("email")}
          />
        </AuthField>

        <AuthField
          id="reg-password"
          label="Password"
          error={errors.password?.message}
          hint="Minimal 8 karakter"
        >
          <PasswordInput
            id="reg-password"
            placeholder="Buat password"
            autoComplete="new-password"
            className="h-11 rounded-lg"
            hasError={!!errors.password}
            {...register("password")}
          />
        </AuthField>

        <AuthField
          id="reg-confirm"
          label="Konfirmasi Password"
          error={errors.confirm?.message}
        >
          <PasswordInput
            id="reg-confirm"
            placeholder="Ulangi password"
            autoComplete="new-password"
            className="h-11 rounded-lg"
            hasError={!!errors.confirm}
            {...register("confirm")}
          />
        </AuthField>

        <Button
          type="submit"
          disabled={isSubmitting || isEmailLoading}
          className="mt-1 h-11 w-full rounded-lg font-semibold text-white"
          style={{
            background: "var(--gradient-brand-btn)",
            boxShadow: "0 4px 18px rgba(26,150,136,0.18)",
          }}
        >
          {isSubmitting || isEmailLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Memproses...
            </>
          ) : (
            <>
              {verificationEmail
                ? "Kirim Ulang Verifikasi"
                : isCompleteProfileFlow
                  ? "Lanjut"
                  : "Daftar & Verifikasi"}
            </>
          )}
        </Button>
      </form>

      {verificationEmail && !isCompleteProfileFlow ? (
        <div className="mt-4">
          <AuthInfoCard>
            Link verifikasi sudah dikirim ke{" "}
            <strong>{verificationEmail}</strong>. Cek inbox/spam, verifikasi
            dulu, lalu login untuk lanjut isi data diri.
          </AuthInfoCard>
        </div>
      ) : null}
    </motion.div>
  );
}

function Step2Form({
  onNext,
  onBack,
  canGoBack,
  defaultValues,
}: {
  onNext: (data: Step2) => void;
  onBack: () => void;
  canGoBack: boolean;
  defaultValues: Partial<Step2>;
}) {
  const currentYear = new Date().getFullYear();

  const years = useMemo(
    () =>
      Array.from({ length: currentYear - 1950 + 1 }, (_, i) => currentYear - i),
    [currentYear],
  );

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<Step2>({
    resolver: zodResolver(registerStep2Schema),
    defaultValues,
  });

  return (
    <motion.div
      key="step2"
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={slideInVariants}
      transition={springSmooth}
    >
      <StepHeading
        title="Data Diri"
        description="Kami sesuaikan pengalaman untukmu"
      />

      <form onSubmit={handleSubmit(onNext)} className="space-y-4" noValidate>
        <AuthField
          id="reg-name"
          label="Nama Lengkap"
          error={errors.name?.message}
        >
          <Input
            id="reg-name"
            type="text"
            placeholder="Nama kamu"
            autoComplete="name"
            autoFocus
            className="h-11 rounded-lg"
            {...register("name")}
          />
        </AuthField>

        <AuthField
          id="reg-birthYear"
          label="Tahun Lahir"
          error={errors.birthYear?.message}
        >
          <Controller
            control={control}
            name="birthYear"
            render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <SelectTrigger
                  id="reg-birthYear"
                  className="h-11 w-full rounded-lg"
                >
                  <SelectValue placeholder="Pilih tahun lahir" />
                </SelectTrigger>

                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </AuthField>

        <AuthField
          id="reg-gender"
          label="Jenis Kelamin"
          error={errors.gender?.message}
        >
          <Controller
            control={control}
            name="gender"
            render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <SelectTrigger
                  id="reg-gender"
                  className="h-11 w-full rounded-lg"
                >
                  <SelectValue placeholder="Pilih jenis kelamin" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="male">Laki-laki</SelectItem>
                  <SelectItem value="female">Perempuan</SelectItem>
                  <SelectItem value="prefer_not">
                    Tidak ingin menyebutkan
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </AuthField>

        <div className="mt-1 flex gap-4">
          {canGoBack ? (
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="h-11 flex-1 rounded-lg border-[1.5px] font-semibold"
              style={{
                borderColor: "var(--color-brand-border)",
                color: "var(--color-text-brand-secondary)",
              }}
            >
              Kembali
            </Button>
          ) : null}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-11 flex-1 rounded-lg font-semibold text-white"
            style={{
              background: "var(--gradient-brand-btn)",
              boxShadow: "0 4px 18px rgba(26,150,136,0.18)",
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              <>Lanjut</>
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}

function Step3Form({
  onSubmit: onFinalSubmit,
  onBack,
  defaultValues,
  isLoading,
}: {
  onSubmit: (data: Step3) => void;
  onBack: () => void;
  defaultValues: Partial<Step3>;
  isLoading: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Step3>({
    resolver: zodResolver(registerStep3Schema),
    defaultValues,
  });

  return (
    <motion.div
      key="step3"
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={slideInVariants}
      transition={springSmooth}
    >
      <StepHeading title="Laporan Mingguan" description="" />

      <div className="mb-4">
        <AuthInfoCard icon="parent">
          Orang tua akan menerima ringkasan emosi mingguan tanpa isi diary.
        </AuthInfoCard>
      </div>

      <form
        onSubmit={handleSubmit(onFinalSubmit)}
        className="space-y-4"
        noValidate
      >
        <AuthField
          id="reg-parentEmail"
          label="Email Orang Tua / Wali (Opsional)"
          error={errors.parentEmail?.message}
          hint="Kosongkan jika tidak ingin mengirim laporan"
        >
          <Input
            id="reg-parentEmail"
            type="email"
            placeholder="email-orangtua@contoh.com"
            autoComplete="off"
            className="h-11 rounded-lg"
            {...register("parentEmail")}
          />
        </AuthField>

        <div className="mt-1 flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="h-11 flex-1 rounded-lg border-[1.5px] font-semibold"
            style={{
              borderColor: "var(--color-brand-border)",
              color: "var(--color-text-brand-secondary)",
            }}
          >
            Kembali
          </Button>

          <Button
            type="submit"
            disabled={isLoading}
            className="h-11 flex-1 rounded-lg font-semibold text-white"
            style={{
              background: "var(--gradient-brand-btn)",
              boxShadow: "0 4px 18px rgba(26,150,136,0.18)",
            }}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mendaftar...
              </>
            ) : (
              <>Selesai</>
            )}
          </Button>
        </div>

        <p
          className="text-center text-xs"
          style={{ color: "var(--color-text-brand-muted)" }}
        >
          Email orang tua bisa ditambahkan nanti melalui pengaturan akun.
        </p>
      </form>
    </motion.div>
  );
}

function SuccessScreen({ name }: { name: string }) {
  const shouldReduce = useReducedMotion();

  return (
    <motion.div
      key="success"
      initial={shouldReduce ? false : "hidden"}
      animate="visible"
      variants={slideInVariants}
      transition={springSmooth}
      className="flex flex-col items-center py-1 text-center"
    >
      <motion.div
        initial={shouldReduce ? false : "hidden"}
        animate="visible"
        variants={scalePopVariants}
        transition={{ ...springBouncy, delay: 0.1 }}
        className="mb-4"
      >
        <CheckCircle2
          className="h-11 w-12"
          style={{ color: "var(--color-brand-teal)" }}
        />
      </motion.div>

      <h2
        className="mb-2 text-xl font-bold"
        style={{ color: "var(--color-text-brand-primary)" }}
      >
        Selamat Datang, {name || "Teman"}!
      </h2>

      <p
        className="mb-4 max-w-xs text-sm leading-relaxed"
        style={{ color: "var(--color-text-brand-muted)" }}
      >
        Akunmu berhasil dibuat. Kamu siap memulai perjalanan tumbuh bersama
        TemanTumbuh.
      </p>

      <Button
        asChild
        className="h-11 w-full rounded-lg font-semibold text-white"
        style={{
          background: "var(--gradient-brand-btn)",
          boxShadow: "0 4px 18px rgba(26,150,136,0.18)",
        }}
      >
        <Link href="/">Lanjut ke Beranda</Link>
      </Button>
    </motion.div>
  );
}

function RegisterPageContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

  const isCompleteProfileFlow = searchParams.get("completeProfile") === "1";

  const [step, setStep] = useState(isCompleteProfileFlow ? 1 : 0);
  const [done, setDone] = useState(false);

  const [step1Data, setStep1Data] = useState<Partial<Step1>>({});
  const [step2Data, setStep2Data] = useState<Partial<Step2>>({});
  const [verificationEmail, setVerificationEmail] = useState<string | null>(
    null,
  );
  const [registerError, setRegisterError] = useState<RegisterError>(null);

  const { data: sessionData, isLoading: isSessionLoading } = useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: fetchProfileStatus,
    enabled: isCompleteProfileFlow && !done,
    retry: 12,
    retryDelay: 700,
    staleTime: Infinity,
    gcTime: 0,
  });

  useEffect(() => {
    if (!isCompleteProfileFlow || isSessionLoading || !sessionData) return;

    if (sessionData.isAuthenticated && sessionData.isComplete) {
      window.location.href = "/baseline";
      return;
    }

    if (sessionData.isAuthenticated && !sessionData.isComplete) {
      setStep(1);

      if (sessionData.userName) {
        setStep2Data((prev) => ({
          ...prev,
          name: prev.name || sessionData.userName,
        }));
      }

      return;
    }

    if (!sessionData.isAuthenticated) {
      toast.error("Sesi verifikasi tidak tersedia. Silakan login kembali.");
      router.replace("/login");
    }
  }, [isCompleteProfileFlow, isSessionLoading, sessionData, router]);

  const signUpMutation = useMutation<unknown, RegisterAuthError, Step1>({
    mutationFn: async (data: Step1) => {
      const email = data.email.trim().toLowerCase();

      const exists = await checkEmailExists(email);

      if (exists) {
        throw {
          status: 400,
          code: "EMAIL_ALREADY_EXISTS",
          message: "Email sudah terdaftar",
        } satisfies RegisterAuthError;
      }

      const defaultName = email.split("@")[0] || "Pengguna";

      const response = await authClient.signUp.email({
        email,
        password: data.password,
        name: defaultName,
        callbackURL: "/register?completeProfile=1",
      });

      if (response.error) {
        throw response.error;
      }

      return response;
    },

    onSuccess: (_data, variables) => {
      const email = variables.email.trim().toLowerCase();

      setVerificationEmail(email);
      setRegisterError(null);
      toast.success("Silakan periksa email Anda untuk verifikasi.");
    },

    onError: (error, variables) => {
      const email = variables.email.trim().toLowerCase();

      setVerificationEmail(null);

      const parsed = resolveRegisterError(error, email);
      setRegisterError(parsed);

      if (parsed?.kind === "generic") {
        toast.error(parsed.message);
      }
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Step3) => {
      const response = await authClient.updateUser({
        name: step2Data.name,
        birthYear: step2Data.birthYear
          ? Number(step2Data.birthYear)
          : undefined,
        gender: step2Data.gender,
        parentEmail: data.parentEmail || null,
        profileFilled: true,
      });

      if (response.error) {
        throw response.error;
      }

      return {
        response,
        parentEmail: data.parentEmail,
      };
    },

    onSuccess: ({ parentEmail }: { parentEmail?: string }) => {
      void queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });

      setDone(true);

      toast.success(
        parentEmail
          ? "Data diri tersimpan. Jika email orang tua baru, permintaan persetujuan telah dikirim."
          : "Data diri berhasil dilengkapi.",
      );

      window.location.href = "/baseline";
    },

    onError: (error: { message?: string }) => {
      toast.error(error.message ?? "Gagal menyimpan data. Silakan coba lagi.");
    },
  });

  const handleStep1 = useCallback(
    async (data: Step1) => {
      const normalizedData = {
        ...data,
        email: data.email.trim().toLowerCase(),
      };

      setStep1Data(normalizedData);
      setVerificationEmail(null);
      setRegisterError(null);

      if (isCompleteProfileFlow) {
        setStep(1);
        return;
      }

      await signUpMutation.mutateAsync(normalizedData);
    },
    [isCompleteProfileFlow, signUpMutation],
  );

  const handleStep2 = useCallback((data: Step2) => {
    setStep2Data(data);
    setStep(2);
  }, []);

  const handleFinalSubmit = useCallback(
    (data: Step3) => {
      updateProfileMutation.mutate(data);
    },
    [updateProfileMutation],
  );

  const handleGoogle = useCallback(async () => {
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/register?completeProfile=1",
      });
    } catch {
      toast.error("Google sign-in gagal dimulai.");
    }
  }, []);

  if (isCompleteProfileFlow && isSessionLoading) {
    return <PageLoader message="Memeriksa sesi..." fullscreen />;
  }

  if (done) {
    return <PageLoader message="Memuat baseline..." fullscreen />;
  }

  return (
    <BrandPageBackground fillViewport>
      <AuthShell
        showLogo={!done}
        maxWidth={440}
        compact={false}
        footer={
          !done && !isCompleteProfileFlow ? (
            <>
              Dengan mendaftar, kamu menyetujui{" "}
              <Link
                href="/terms"
                className="underline-offset-2 hover:underline"
                style={{ color: "var(--color-text-brand-secondary)" }}
              >
                Syarat &amp; Ketentuan
              </Link>{" "}
              dan{" "}
              <Link
                href="/privacy"
                className="underline-offset-2 hover:underline"
                style={{ color: "var(--color-text-brand-secondary)" }}
              >
                Kebijakan Privasi
              </Link>
              .
            </>
          ) : null
        }
      >
        {!done ? <AuthStepIndicator current={step} total={3} /> : null}

        <AnimatePresence mode="wait">
          {done ? (
            <SuccessScreen key="done" name={step2Data.name ?? ""} />
          ) : step === 0 ? (
            <Step1Form
              key="s1"
              onNext={handleStep1}
              onGoogle={handleGoogle}
              isGoogleLoading={false}
              isEmailLoading={signUpMutation.isPending}
              verificationEmail={verificationEmail}
              isCompleteProfileFlow={isCompleteProfileFlow}
              defaultValues={step1Data}
              registerError={registerError}
              onClearError={() => setRegisterError(null)}
            />
          ) : step === 1 ? (
            <Step2Form
              key="s2"
              onNext={handleStep2}
              onBack={() => setStep(0)}
              canGoBack={!isCompleteProfileFlow}
              defaultValues={step2Data}
            />
          ) : (
            <Step3Form
              key="s3"
              onSubmit={handleFinalSubmit}
              onBack={() => setStep(1)}
              defaultValues={{}}
              isLoading={updateProfileMutation.isPending}
            />
          )}
        </AnimatePresence>

        {!done && !isCompleteProfileFlow ? (
          <p
            className="mt-4 text-center text-sm"
            style={{ color: "var(--color-text-brand-muted)" }}
          >
            Sudah punya akun?{" "}
            <Link
              href="/login"
              className="font-semibold underline-offset-2 hover:underline"
              style={{ color: "var(--color-brand-teal)" }}
            >
              Masuk
            </Link>
          </p>
        ) : null}
      </AuthShell>
    </BrandPageBackground>
  );
}

export default function RegisterPage() {
  return (
    <QueryProvider>
      <Suspense fallback={<PageLoaderFallback />}>
        <RegisterPageContent />
      </Suspense>
    </QueryProvider>
  );
}
