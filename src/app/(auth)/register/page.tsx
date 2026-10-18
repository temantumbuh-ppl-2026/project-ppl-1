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
import {
  AlertCircle,
  ArrowRight,
  Loader2,
  LogIn,
  MailCheck,
  UsersRound,
} from "lucide-react";

import { authClient } from "@/lib/auth-client";
import {
  registerStep1Schema,
  registerStep2Schema,
  registerStep3Schema,
  type RegisterStep1Input,
  type RegisterStep2Input,
  type RegisterStep3Input,
} from "@/lib/validations";
import { slideInVariants, springSmooth } from "@/lib/animations";

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

import { AuthField } from "@/components/auth/auth-field";
import {
  AuthFormHeading,
  AuthSplitLayout,
} from "@/components/auth/redesign/auth-split-layout";
import { RegistrationStepper } from "@/components/auth/redesign/registration-stepper";

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
const VERIFICATION_CALLBACK_URL = "/register?completeProfile=1";
const RESEND_COOLDOWN_MS = 30_000;

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

function resolveResendError(error: RegisterAuthError): string {
  const message = (error.message ?? "").toLowerCase();
  const status = error.status ?? error.statusCode;

  if (
    status === 429 ||
    message.includes("too many") ||
    message.includes("rate")
  ) {
    return "Terlalu banyak permintaan. Tunggu sebentar sebelum mengirim ulang.";
  }

  if (message.includes("already verified")) {
    return "Email sudah terverifikasi. Silakan masuk untuk melanjutkan.";
  }

  if (message.includes("gagal mengirim email")) {
    return "Gagal mengirim ulang email verifikasi. Silakan daftar kembali.";
  }

  return "Gagal mengirim ulang email verifikasi. Silakan coba lagi.";
}

const alertMotion = {
  initial: { opacity: 0, y: -6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.2 },
};

const attentionAlertStyle = {
  background: "var(--tt-attention-bg)",
  borderColor: "var(--tt-attention-border)",
  color: "var(--tt-attention-text)",
};

function EmailExistsAlert({ email }: { email: string }) {
  return (
    <motion.div key="email-exists" {...alertMotion} className="auth-alert">
      <Alert className="rounded-tt-md border" style={attentionAlertStyle}>
        <AlertCircle
          className="h-4 w-4"
          style={{ color: "var(--tt-attention-text)" }}
        />

        <AlertTitle
          style={{ color: "var(--tt-attention-text)", fontWeight: 700 }}
        >
          Email sudah terdaftar
        </AlertTitle>

        <AlertDescription style={{ color: "var(--tt-attention-text)" }}>
          <span className="mb-2 block">
            Akun dengan email <strong className="break-all">{email}</strong>{" "}
            sudah ada. Silakan login atau gunakan email lain.
          </span>

          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center gap-2 rounded-tt-md px-3 py-2 tt-text-caption font-bold transition-opacity hover:opacity-80"
              style={{
                background: "var(--tt-attention-text)",
                color: "var(--tt-surface)",
              }}
            >
              <LogIn size={12} />
              Masuk ke akun
            </Link>

            <Link
              href="/forgot-password"
              className="inline-flex min-h-11 items-center gap-2 rounded-tt-md px-3 py-2 tt-text-caption font-semibold transition-opacity hover:opacity-80"
              style={{
                background: "var(--tt-attention-bg)",
                color: "var(--tt-attention-text)",
                border: "1px solid var(--tt-attention-border)",
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
    <motion.div key="generic-error" {...alertMotion} className="auth-alert">
      <Alert className="rounded-tt-md border" style={attentionAlertStyle}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Pendaftaran gagal</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    </motion.div>
  );
}

function StepMotion({
  stepKey,
  children,
}: {
  stepKey: string;
  children: React.ReactNode;
}) {
  const shouldReduce = useReducedMotion();

  return (
    <motion.div
      key={stepKey}
      initial={shouldReduce ? false : "hidden"}
      animate="visible"
      exit={shouldReduce ? undefined : "exit"}
      variants={slideInVariants}
      transition={springSmooth}
    >
      {children}
    </motion.div>
  );
}

function VerificationPending({
  email,
  onResend,
  isResending,
  resendCooldown,
  resendMessage,
  onChangeEmail,
}: {
  email: string;
  onResend: () => void;
  isResending: boolean;
  resendCooldown: boolean;
  resendMessage: string;
  onChangeEmail: () => void;
}) {
  return (
    <div className="verify-panel">
      <div className="verify-icon" aria-hidden="true">
        <MailCheck />
      </div>

      <AuthFormHeading
        eyebrow="satu langkah lagi"
        title="Cek email kamu."
        description="Verifikasi email dulu sebelum lanjut mengisi data diri."
      />

      <div className="auth-note" role="status">
        <MailCheck aria-hidden="true" />
        <span>
          Link verifikasi sudah dikirim ke <strong>{email}</strong>. Cek
          inbox/spam, klik link verifikasi, lalu kamu akan diarahkan untuk
          melengkapi data diri. Jika diminta, login terlebih dahulu.
        </span>
      </div>

      <div className="verify-actions">
        <Button
          type="button"
          onClick={onResend}
          disabled={isResending || resendCooldown}
          aria-busy={isResending}
          className="auth-submit"
        >
          {isResending ? (
            <>
              <Loader2
                className="mr-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
              Mengirim ulang...
            </>
          ) : (
            "Kirim Ulang Verifikasi"
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onChangeEmail}
          disabled={isResending}
          className="auth-secondary"
        >
          Ganti email
        </Button>
      </div>

      {resendMessage ? (
        <p className="verify-status" role="status" aria-live="polite">
          {resendMessage}
        </p>
      ) : null}
    </div>
  );
}

function Step1Form({
  onNext,
  onGoogle,
  isGoogleLoading,
  isEmailLoading,
  isCompleteProfileFlow,
  defaultValues,
  registerError,
  onClearError,
}: {
  onNext: (data: Step1) => Promise<void> | void;
  onGoogle: () => void;
  isGoogleLoading: boolean;
  isEmailLoading: boolean;
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

  const isEmailPending = isSubmitting || isEmailLoading;

  return (
    <>
      <AuthFormHeading
        eyebrow="langkah pertama"
        title="Mulai ruang ceritamu."
        description="Buat akun dengan email atau Google untuk memulai bersama TemanTumbuh."
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
        disabled={isGoogleLoading || isEmailPending}
        aria-busy={isGoogleLoading}
        className="google-button"
      >
        {isGoogleLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <GoogleIcon />
        )}
        {isGoogleLoading ? "Menghubungkan..." : "Daftar dengan Google"}
      </Button>

      <div className="auth-divider">
        <span>atau daftar dengan email</span>
      </div>

      <form
        onSubmit={handleSubmit(async (data) => {
          onClearError();
          await onNext(data);
        })}
        className="auth-form"
        noValidate
        aria-busy={isEmailPending}
      >
        <AuthField id="reg-email" label="Email" error={errors.email?.message}>
          <Input
            id="reg-email"
            type="email"
            inputMode="email"
            placeholder="email@contoh.com"
            autoComplete="email"
            autoFocus
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
            hasError={!!errors.confirm}
            {...register("confirm")}
          />
        </AuthField>

        <Button
          type="submit"
          disabled={isEmailPending || isGoogleLoading}
          aria-busy={isEmailPending}
          className="auth-submit"
        >
          {isEmailPending ? (
            <>
              <Loader2
                className="mr-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
              Memproses...
            </>
          ) : (
            <>{isCompleteProfileFlow ? "Lanjut" : "Daftar & Verifikasi"}</>
          )}
        </Button>
      </form>
    </>
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
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Step2>({
    resolver: zodResolver(registerStep2Schema),
    defaultValues,
  });

  // Nama dari sesi (Google/verifikasi) bisa tiba setelah form ter-mount.
  const sessionName = defaultValues.name;
  useEffect(() => {
    if (sessionName && !getValues("name")) {
      setValue("name", sessionName);
    }
  }, [sessionName, getValues, setValue]);

  return (
    <>
      <AuthFormHeading
        eyebrow="tentang kamu"
        title="Kenalan dulu, yuk."
        description="Lengkapi data dirimu supaya pengalaman TemanTumbuh sesuai untukmu."
      />

      <form onSubmit={handleSubmit(onNext)} className="auth-form" noValidate>
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
                  className="tt-focus-ring h-11 w-full rounded-tt-md border-tt-gray-200 bg-tt-surface text-tt-gray-900"
                  aria-invalid={!!errors.birthYear}
                  aria-describedby={
                    errors.birthYear ? "reg-birthYear-error" : undefined
                  }
                  onBlur={field.onBlur}
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
                  className="tt-focus-ring h-11 w-full rounded-tt-md border-tt-gray-200 bg-tt-surface text-tt-gray-900"
                  aria-invalid={!!errors.gender}
                  aria-describedby={
                    errors.gender ? "reg-gender-error" : undefined
                  }
                  onBlur={field.onBlur}
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

        <Button type="submit" disabled={isSubmitting} className="auth-submit">
          {isSubmitting ? (
            <>
              <Loader2
                className="mr-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
              Memproses...
            </>
          ) : (
            <>
              Lanjut <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
            </>
          )}
        </Button>
      </form>

      {canGoBack ? (
        <button type="button" onClick={onBack} className="step-back-link">
          ← Kembali ke akun
        </button>
      ) : null}
    </>
  );
}

function Step3Form({
  onSubmit: onFinalSubmit,
  onBack,
  defaultValues,
  isLoading,
}: {
  onSubmit: (data: Step3) => void;
  onBack: (data: Partial<Step3>) => void;
  defaultValues: Partial<Step3>;
  isLoading: boolean;
}) {
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<Step3>({
    resolver: zodResolver(registerStep3Schema),
    defaultValues,
  });

  return (
    <>
      <AuthFormHeading
        eyebrow="sesuai pilihanmu"
        title="Atur laporan mingguan."
        description="Ringkasan emosi mingguan dapat dikirim ke orang tua atau wali."
      />

      <div className="auth-note report-info">
        <UsersRound aria-hidden="true" />
        <span>
          Orang tua akan menerima ringkasan emosi mingguan tanpa isi diary.
        </span>
      </div>

      <form
        onSubmit={handleSubmit(onFinalSubmit)}
        className="auth-form"
        noValidate
        aria-busy={isLoading}
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
            inputMode="email"
            placeholder="email-orangtua@contoh.com"
            autoComplete="off"
            autoFocus
            {...register("parentEmail")}
          />
        </AuthField>

        <div className="auth-form-actions">
          <Button
            type="button"
            variant="outline"
            onClick={() => onBack(getValues())}
            disabled={isLoading}
            className="auth-secondary"
          >
            Kembali
          </Button>

          <Button
            type="submit"
            disabled={isLoading}
            aria-busy={isLoading}
            className="auth-submit"
          >
            {isLoading ? (
              <>
                <Loader2
                  className="mr-2 h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
                Mendaftar...
              </>
            ) : (
              <>Selesai</>
            )}
          </Button>
        </div>
      </form>

      <p className="later-note">
        Email orang tua bisa ditambahkan nanti melalui pengaturan akun.
      </p>
    </>
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
  const [step3Data, setStep3Data] = useState<Partial<Step3>>({});
  const [verificationEmail, setVerificationEmail] = useState<string | null>(
    null,
  );
  const [registerError, setRegisterError] = useState<RegisterError>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

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
      window.location.href = "/home";
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

  useEffect(() => {
    if (!resendCooldown) return;

    const timer = window.setTimeout(
      () => setResendCooldown(false),
      RESEND_COOLDOWN_MS,
    );

    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

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
        callbackURL: VERIFICATION_CALLBACK_URL,
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
      setResendMessage("");
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

  // Mengirim ulang link verifikasi lewat endpoint bawaan Better Auth.
  const resendVerificationMutation = useMutation<
    unknown,
    RegisterAuthError,
    string
  >({
    mutationFn: async (email) => {
      const response = await authClient.sendVerificationEmail({
        email,
        callbackURL: VERIFICATION_CALLBACK_URL,
      });

      if (response.error) {
        throw response.error;
      }

      return response;
    },

    onSuccess: () => {
      setResendCooldown(true);
      setResendMessage(
        "Email verifikasi sudah dikirim ulang. Kamu bisa meminta lagi dalam 30 detik.",
      );
      toast.success("Email verifikasi dikirim ulang.");
    },

    onError: (error) => {
      const message = resolveResendError(error);
      setResendMessage(message);
      toast.error(message);
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

      window.location.href = "/home";
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

      await signUpMutation.mutateAsync(normalizedData).catch(() => {
        // Error sudah ditangani onError mutation.
      });
    },
    [isCompleteProfileFlow, signUpMutation],
  );

  const handleStep2 = useCallback((data: Step2) => {
    setStep2Data(data);
    setStep(2);
  }, []);

  const handleStep3Back = useCallback((data: Partial<Step3>) => {
    setStep3Data(data);
    setStep(1);
  }, []);

  const handleFinalSubmit = useCallback(
    (data: Step3) => {
      if (updateProfileMutation.isPending) return;
      setStep3Data(data);
      updateProfileMutation.mutate(data);
    },
    [updateProfileMutation],
  );

  const handleGoogle = useCallback(async () => {
    setRegisterError(null);
    setIsGoogleLoading(true);

    try {
      const response = await authClient.signIn.social({
        provider: "google",
        callbackURL: VERIFICATION_CALLBACK_URL,
      });

      if (response?.error) {
        throw response.error;
      }
    } catch {
      setIsGoogleLoading(false);
      toast.error("Google sign-in gagal dimulai.");
    }
  }, []);

  const handleResend = useCallback(() => {
    if (!verificationEmail || resendVerificationMutation.isPending) return;
    setResendMessage("");
    resendVerificationMutation.mutate(verificationEmail);
  }, [verificationEmail, resendVerificationMutation]);

  const handleChangeEmail = useCallback(() => {
    setVerificationEmail(null);
    setResendMessage("");
    setRegisterError(null);
  }, []);

  if (isCompleteProfileFlow && isSessionLoading) {
    return <PageLoader message="Memeriksa sesi..." fullscreen />;
  }

  if (done) {
    return <PageLoader message="Memuat mood..." fullscreen />;
  }

  const isAwaitingVerification =
    step === 0 && !isCompleteProfileFlow && Boolean(verificationEmail);

  return (
    <AuthSplitLayout>
      <RegistrationStepper current={step} />

      <AnimatePresence mode="wait" initial={false}>
        {step === 0 ? (
          <StepMotion
            key={isAwaitingVerification ? "s1-verify" : "s1"}
            stepKey={isAwaitingVerification ? "s1-verify" : "s1"}
          >
            {isAwaitingVerification && verificationEmail ? (
              <VerificationPending
                email={verificationEmail}
                onResend={handleResend}
                isResending={resendVerificationMutation.isPending}
                resendCooldown={resendCooldown}
                resendMessage={resendMessage}
                onChangeEmail={handleChangeEmail}
              />
            ) : (
              <Step1Form
                onNext={handleStep1}
                onGoogle={handleGoogle}
                isGoogleLoading={isGoogleLoading}
                isEmailLoading={signUpMutation.isPending}
                isCompleteProfileFlow={isCompleteProfileFlow}
                defaultValues={step1Data}
                registerError={registerError}
                onClearError={() => setRegisterError(null)}
              />
            )}
          </StepMotion>
        ) : step === 1 ? (
          <StepMotion key="s2" stepKey="s2">
            <Step2Form
              onNext={handleStep2}
              onBack={() => setStep(0)}
              canGoBack={!isCompleteProfileFlow}
              defaultValues={step2Data}
            />
          </StepMotion>
        ) : (
          <StepMotion key="s3" stepKey="s3">
            <Step3Form
              onSubmit={handleFinalSubmit}
              onBack={handleStep3Back}
              defaultValues={step3Data}
              isLoading={updateProfileMutation.isPending}
            />
          </StepMotion>
        )}
      </AnimatePresence>

      {!isCompleteProfileFlow ? (
        <p className="auth-switch">
          Sudah punya akun? <Link href="/login">Masuk</Link>
        </p>
      ) : null}

      {!isCompleteProfileFlow && step === 0 ? (
        <p className="auth-legal">
          Dengan mendaftar, kamu menyetujui{" "}
          <Link href="/terms">Syarat &amp; Ketentuan</Link> dan{" "}
          <Link href="/privacy">Kebijakan Privasi</Link>.
        </p>
      ) : null}
    </AuthSplitLayout>
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
