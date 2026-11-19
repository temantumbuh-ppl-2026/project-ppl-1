"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import {
  profileEditFormSchema,
  type ProfileEditFormInput,
} from "@/lib/validations";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AuthField } from "@/components/auth/auth-field";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { UserProfile } from "@/components/settings/settings-shell";

type ParentStatus = "pending" | "verified" | "expired" | null;

type ProfileContentProps = {
  profile: UserProfile;
  parentStatus: ParentStatus;
  pendingParentEmail: string | null;
  isGoogleLinked: boolean;
  hasPassword: boolean;
  onRefresh: () => Promise<void>;
};

type UpdateUserData =
  | Partial<UserProfile>
  | {
      user?: Partial<UserProfile>;
    };

const profileSettingsSchema = profileEditFormSchema.pick({
  name: true,
  birthYear: true,
  gender: true,
  parentEmail: true,
});

function getGenderLabel(gender: string | null) {
  if (gender === "male") return "Laki-laki";
  if (gender === "female") return "Perempuan";
  return "Tidak ingin menyebutkan";
}

export function ProfileContent({
  profile,
  parentStatus,
  pendingParentEmail,
  isGoogleLinked,
  hasPassword,
  onRefresh,
}: ProfileContentProps) {
  const queryClient = useQueryClient();
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const {
    register,
    reset,
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<
    Pick<ProfileEditFormInput, "name" | "birthYear" | "gender" | "parentEmail">
  >({
    resolver: zodResolver(profileSettingsSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      birthYear: "",
      gender: "prefer_not",
      parentEmail: "",
    },
  });

  useEffect(() => {
    reset({
      name: profile.name || "",
      birthYear: profile.birthYear ? String(profile.birthYear) : "",
      gender:
        profile.gender === "male" ||
        profile.gender === "female" ||
        profile.gender === "prefer_not"
          ? profile.gender
          : "prefer_not",
      parentEmail: profile.parentEmail || "",
    });
  }, [profile, reset]);

  const years = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) =>
        String(new Date().getFullYear() - 10 - i),
      ),
    [],
  );

  const currentAge = profile.birthYear
    ? new Date().getFullYear() - profile.birthYear
    : null;

  const planLabel = profile?.isPremium ? "Premium Plan" : "Free Plan";

  const updateProfileMutation = useMutation({
    mutationFn: async (
      formData: Pick<
        ProfileEditFormInput,
        "name" | "birthYear" | "gender" | "parentEmail"
      >,
    ) => {
      const response = await authClient.updateUser({
        name: formData.name.trim(),
        birthYear: Number(formData.birthYear),
        gender: formData.gender,
        profileFilled: true,
      });

      if (response.error) {
        throw new Error(response.error.message || "Gagal memperbarui profil.");
      }

      return response.data as UpdateUserData | undefined;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      await onRefresh();
      setIsEditingProfile(false);
      toast.success("Profil berhasil diperbarui.");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Terjadi kesalahan sistem.",
      );
    },
  });

  const handleSaveProfile = handleSubmit(async (formValues) => {
    await updateProfileMutation.mutateAsync(formValues);
  });

  const handleCancelEdit = () => {
    reset({
      name: profile.name || "",
      birthYear: profile.birthYear ? String(profile.birthYear) : "",
      gender:
        profile.gender === "male" ||
        profile.gender === "female" ||
        profile.gender === "prefer_not"
          ? profile.gender
          : "prefer_not",
      parentEmail: profile.parentEmail || "",
    });
    setIsEditingProfile(false);
  };

  const rowBaseClass =
    "grid grid-cols-1 gap-3 border-b border-slate-200 px-4 py-4 sm:px-5 md:grid-cols-[320px_minmax(0,1fr)] md:gap-8 md:px-6 md:py-5 lg:grid-cols-[340px_minmax(0,1fr)]";

  const leftColClass = "md:max-w-[300px] lg:max-w-[320px]";
  const fieldClass =
    "h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 shadow-none";
  const readonlyFieldClass =
    "flex min-h-12 w-full items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900";

  const passwordActionHref = hasPassword
    ? "/profile/change-password"
    : "/profile/create-password";

  const passwordActionLabel = hasPassword ? "Ganti Password" : "Buat Password";

  const passwordActionDescription = hasPassword
    ? "Password sudah tersedia untuk akun ini."
    : isGoogleLinked
      ? "Akun Google ini belum punya password. Buat password agar nanti bisa login juga dengan email."
      : "Akun ini belum punya password. Buat password terlebih dahulu.";

  return (
    <div className="space-y-4">
      {pendingParentEmail && parentStatus === "pending" ? (
        <Alert className="border-amber-200 bg-amber-50 text-amber-800">
          <AlertTitle>Menunggu Persetujuan Orang Tua</AlertTitle>
          <AlertDescription>
            Permintaan verifikasi email orang tua sudah dikirim ke{" "}
            <strong>{pendingParentEmail}</strong>. Email akan terhubung setelah
            orang tua atau wali menyetujui.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2.5 border-b border-slate-200 px-4 py-4 sm:px-5 md:px-6">
          <User className="h-[18px] w-[18px] text-[var(--color-brand-teal)]" />
          <h2 className="text-[15px] font-extrabold text-slate-900 sm:text-base">
            Informasi Profil
          </h2>
        </div>

        <div className="p-0">
          <div className={rowBaseClass}>
            <div className={leftColClass}>
              <p className="text-sm font-bold text-slate-900">Nama Lengkap</p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500 sm:text-xs">
                Nama yang akan ditampilkan pada profil kamu.
              </p>
            </div>

            <div className="min-w-0 w-full">
              {isEditingProfile ? (
                <AuthField
                  id="profile-name"
                  label=""
                  error={errors.name?.message}
                >
                  <Input
                    id="profile-name"
                    className={fieldClass}
                    {...register("name")}
                  />
                </AuthField>
              ) : (
                <div className={readonlyFieldClass}>{profile.name || "-"}</div>
              )}
            </div>
          </div>

          <div className={rowBaseClass}>
            <div className={leftColClass}>
              <p className="text-sm font-bold text-slate-900">Email</p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500 sm:text-xs">
                {isGoogleLinked
                  ? "Terhubung melalui Google"
                  : hasPassword
                    ? "Email & kata sandi"
                    : "Email akun aktif"}
              </p>
            </div>

            <div className="min-w-0 w-full">
              <div className="flex min-h-12 w-full items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900">
                <span className="min-w-0 flex-1 break-all">
                  {profile.email}
                </span>

                {isGoogleLinked ? (
                  <span className="shrink-0 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
                    Google
                  </span>
                ) : null}

                {hasPassword ? (
                  <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    Password
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className={rowBaseClass}>
            <div className={leftColClass}>
              <p className="text-sm font-bold text-slate-900">Tahun Lahir</p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500 sm:text-xs">
                Pilih tahun lahir Anda.
              </p>
            </div>

            <div className="min-w-0 w-full">
              {isEditingProfile ? (
                <AuthField
                  id="profile-birthYear"
                  label=""
                  error={errors.birthYear?.message}
                >
                  <Controller
                    control={control}
                    name="birthYear"
                    render={({ field }) => (
                      <Select
                        value={field.value ?? ""}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          id="profile-birthYear"
                          className={fieldClass}
                        >
                          <SelectValue placeholder="Pilih tahun lahir" />
                        </SelectTrigger>
                        <SelectContent>
                          {years.map((year) => (
                            <SelectItem key={year} value={year}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </AuthField>
              ) : (
                <div className="flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900">
                  <span>{profile.birthYear || "Belum diatur"}</span>
                  {currentAge !== null ? (
                    <span className="shrink-0 rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-semibold text-teal-600">
                      {currentAge} Tahun
                    </span>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          <div className={rowBaseClass}>
            <div className={leftColClass}>
              <p className="text-sm font-bold text-slate-900">Jenis Kelamin</p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500 sm:text-xs">
                Data ini tersimpan dari proses registrasi.
              </p>
            </div>

            <div className="min-w-0 w-full">
              {isEditingProfile ? (
                <AuthField
                  id="profile-gender"
                  label=""
                  error={errors.gender?.message}
                >
                  <Controller
                    control={control}
                    name="gender"
                    render={({ field }) => (
                      <Select
                        value={field.value ?? ""}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          id="profile-gender"
                          className={fieldClass}
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
              ) : (
                <div className={readonlyFieldClass}>
                  {getGenderLabel(profile.gender)}
                </div>
              )}
            </div>
          </div>

          <div className={rowBaseClass}>
            <div className={leftColClass}>
              <p className="text-sm font-bold text-slate-900">Keamanan Akun</p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500 sm:text-xs">
                {passwordActionDescription}
              </p>
            </div>

            <div className="min-w-0 w-full">
              <div className="flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900">
                <div className="flex items-center gap-2">
                  <span>
                    {hasPassword
                      ? "Password sudah dibuat"
                      : "Belum ada password"}
                  </span>
                </div>

                <Link
                  href={passwordActionHref}
                  className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  {passwordActionLabel}
                </Link>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 bg-slate-50/60 px-4 py-4 sm:px-5 md:px-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap md:justify-end">
              {isEditingProfile ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={updateProfileMutation.isPending}
                    className="h-11 rounded-2xl"
                  >
                    Batal
                  </Button>

                  <Button
                    type="button"
                    onClick={() => void handleSaveProfile()}
                    disabled={updateProfileMutation.isPending || !isValid}
                    className="h-11 rounded-2xl text-white"
                    style={{ background: "var(--gradient-brand-btn)" }}
                  >
                    {updateProfileMutation.isPending
                      ? "Menyimpan..."
                      : "Simpan Perubahan"}
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  onClick={() => setIsEditingProfile(true)}
                  className="h-11 rounded-2xl text-white"
                  style={{ background: "var(--gradient-brand-btn)" }}
                >
                  Edit Profil
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-4 sm:px-5 md:px-6">
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <p className="text-sm font-extrabold text-slate-900 sm:text-[15px]">
                Akun Aktif
              </p>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                Aktif
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Bergabung sejak{" "}
              <strong className="text-slate-900">
                {profile.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString("id-ID", {
                      month: "long",
                      year: "numeric",
                    })
                  : "Tidak tersedia"}
              </strong>{" "}
              · {planLabel}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
