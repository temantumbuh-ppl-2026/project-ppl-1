"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, KeyRound, Mail } from "lucide-react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { SettingsShell } from "@/components/settings/settings-shell";
import { Button } from "@/components/ui/button";

export default function CreatePasswordPage() {
  return (
    <SettingsShell>
      {({ data }) => <CreatePasswordContent email={data.user.email} />}
    </SettingsShell>
  );
}

function CreatePasswordContent({ email }: { email: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSendCreatePasswordLink = async () => {
    try {
      setIsSubmitting(true);

      const result = await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (result?.error) {
        throw new Error(
          result.error.message || "Gagal mengirim link buat password.",
        );
      }

      setIsSent(true);
      toast.success("Link buat password berhasil dikirim ke email kamu.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat mengirim email.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-4 sm:px-5 md:px-6">
          <Link
            href="/profile"
            className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-brand-teal)] transition hover:opacity-80"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Profil
          </Link>

          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-[var(--color-brand-teal)]">
              <KeyRound className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                Buat Password
              </h1>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">
                Akun kamu saat ini login dengan Google dan belum memiliki
                password. Buat password agar nanti kamu juga bisa login
                menggunakan email dan password.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5 px-4 py-5 sm:px-5 md:px-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
              Email akun
            </p>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-[var(--color-brand-teal)]">
                <Mail className="h-4 w-4" />
              </div>

              <div className="min-w-0">
                <p className="break-all text-sm font-semibold text-slate-900">
                  {email}
                </p>
                <p className="text-xs text-slate-500">
                  Link pembuatan password akan dikirim ke email ini
                </p>
              </div>
            </div>
          </div>

          {isSent ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-sm font-bold text-emerald-800">
                    Link sudah dikirim
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-emerald-700">
                    Setelah selesai membuat password dari email, kembali ke
                    halaman profil lalu refresh sekali bila perlu.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Link href="/profile">
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full rounded-2xl sm:w-auto"
              >
                Kembali ke Profil
              </Button>
            </Link>

            <Button
              type="button"
              onClick={() => void handleSendCreatePasswordLink()}
              disabled={isSubmitting}
              className="h-11 rounded-2xl px-5 text-white"
              style={{ background: "var(--gradient-brand-btn)" }}
            >
              {isSubmitting
                ? "Mengirim Link..."
                : isSent
                  ? "Kirim Ulang Link"
                  : "Kirim Link Buat Password"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
