"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";
import { BrandPageBackground } from "@/components/layout/brand-page-background";
import { PageLoader } from "@/components/ui/manual/page-loader";
import {
  FaceHappy,
  FaceNeutral,
  FaceSad,
  FaceVeryHappy,
  FaceVerySad,
} from "@/components/mood/mood-face-icons";

type FaceItem = {
  id: number;
  label: string;
  color: string;
  softBg: string;
  Component: ({ active }: { active: boolean }) => ReactElement;
};

type SubmitMoodResponse = {
  success: boolean;
  message: string;
  data?: {
    mood?: {
      id: string;
      moodScore: number;
      note?: string | null;
      createdAt: string;
    };
    currentStreak?: number;
  };
  error?: string;
};

const FACES: FaceItem[] = [
  {
    id: 1,
    label: "Sangat Sedih",
    color: "#EF4444",
    softBg: "rgba(239, 68, 68, 0.10)",
    Component: FaceVerySad,
  },
  {
    id: 2,
    label: "Sedih",
    color: "#F97316",
    softBg: "rgba(249, 115, 22, 0.10)",
    Component: FaceSad,
  },
  {
    id: 3,
    label: "Biasa Aja",
    color: "#EAB308",
    softBg: "rgba(234, 179, 8, 0.10)",
    Component: FaceNeutral,
  },
  {
    id: 4,
    label: "Senang",
    color: "#22C55E",
    softBg: "rgba(34, 197, 94, 0.10)",
    Component: FaceHappy,
  },
  {
    id: 5,
    label: "Sangat Senang",
    color: "#10B981",
    softBg: "rgba(16, 185, 129, 0.10)",
    Component: FaceVeryHappy,
  },
];

function getLocalDateString(timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    return new Date().toISOString().split("T")[0];
  }

  return `${year}-${month}-${day}`;
}
export function MoodCheckin({
  userName: initialUserName = "",
}: {
  userName?: string;
}) {
  const router = useRouter();
  const hasCheckedToday = useRef(false);

  const [userName, setUserName] = useState(initialUserName);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [moodScore, setMoodScore] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [lastSubmittedStreak, setLastSubmittedStreak] = useState<number | null>(
    null,
  );

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await authClient.getSession();
        if (data?.user?.name) {
          setUserName(data.user.name);
        }
      } catch (error) {
        console.error("Failed to fetch session:", error);
      } finally {
        setIsLoadingUser(false);
      }
    };

    void fetchUser();
  }, []);

  useEffect(() => {
    if (hasCheckedToday.current) return;
    hasCheckedToday.current = true;

    const ensureNoDuplicateCheckin = async () => {
      try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const localDate = getLocalDateString(timezone);

        const response = await fetch(
          `/api/mood?date=${encodeURIComponent(localDate)}&timezone=${encodeURIComponent(timezone)}`,
          {
            method: "GET",
            cache: "no-store",
          },
        );

        if (!response.ok) return;

        const payload = (await response.json()) as {
          success?: boolean;
          data?: unknown[];
        };

        if (
          payload.success &&
          Array.isArray(payload.data) &&
          payload.data.length > 0
        ) {
          toast.info("Kamu sudah mengisi mood hari ini.");
          router.replace("/home");
        }
      } catch (error) {
        console.error("Failed to validate today's mood check-in:", error);
      }
    };

    void ensureNoDuplicateCheckin();
  }, [router]);

  useEffect(() => {
    const evaluateStreak = async () => {
      try {
        await fetch("/api/mood/streak", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          }),
        });
      } catch (error) {
        console.error("Failed to evaluate streak:", error);
      }
    };

    void evaluateStreak();
  }, []);

  const wordCount = useMemo(() => {
    const words = note.trim().match(/\S+/g);
    return words ? words.length : 0;
  }, [note]);

  const isOverWords = wordCount > 100;
  const selectedFace = FACES.find((f) => f.id === moodScore);

  const submitMutation = useMutation<
    SubmitMoodResponse,
    { status?: number; message?: string },
    void
  >({
    mutationFn: async () => {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const response = await fetch("/api/mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moodScore,
          note: note.trim() || undefined,
          timezone,
        }),
      });

      const result = (await response.json()) as SubmitMoodResponse;

      if (!response.ok) {
        throw {
          status: response.status,
          message: result.error || "Something went wrong",
        };
      }

      return result;
    },

    onSuccess: (data) => {
      const streak = data.data?.currentStreak ?? null;
      setLastSubmittedStreak(streak);

      toast.success(
        streak
          ? `Mood berhasil disubmit! Streak kamu sekarang ${streak} hari.`
          : "Mood berhasil disubmit!",
      );

      setMoodScore(null);
      setNote("");
      setIsRedirecting(true);

      setTimeout(() => {
        window.location.href = "/home";
      }, 800);
    },

    onError: (error) => {
      if (error?.status === 409) {
        router.replace("/home");
      } else {
        toast.error(
          error?.message || "Gagal mengirim mood. Silakan coba lagi.",
        );
      }
    },
  });

  const handleSave = useCallback(() => {
    if (moodScore !== null && !isOverWords && !submitMutation.isPending) {
      submitMutation.mutate();
    }
  }, [moodScore, isOverWords, submitMutation]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "Enter" &&
        moodScore !== null &&
        !isOverWords &&
        !submitMutation.isPending &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave, moodScore, isOverWords, submitMutation.isPending]);

  if (isLoadingUser) {
    return <PageLoader message="Memuat..." fullscreen />;
  }

  if (isRedirecting) {
    return <PageLoader message="Menuju dashboard..." fullscreen />;
  }

  return (
    <BrandPageBackground fillViewport>
      <section className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-14 sm:px-6 lg:px-8">
        <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center">
          <div className="mb-10 text-center">
            <p
              className="mb-3 text-xs font-bold uppercase tracking-[0.2em]"
              style={{ color: "var(--brand-text-muted)" }}
            >
              Check-in Harian
            </p>

            <h1
              className="text-3xl font-extrabold leading-tight sm:text-4xl"
              style={{ color: "var(--about-dark-teal)" }}
            >
              Bagaimana perasaanmu
              <br />
              hari ini,{" "}
              <span style={{ color: "var(--brand-primary)" }}>{userName}</span>?
            </h1>

            <p
              className="mt-4 text-base font-medium"
              style={{ color: "var(--brand-text-muted)" }}
            >
              {new Date().toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          <div
            className="w-full max-w-[540px] rounded-[2rem] px-7 py-8 sm:px-8 sm:py-9"
            style={{
              background: "rgba(255,255,255,0.96)",
              border: "1px solid rgba(255,255,255,0.85)",
              boxShadow: "0 24px 60px rgba(26,40,64,0.10)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
            }}
          >
            <p
              className="mb-8 text-center text-xs font-bold uppercase tracking-[0.16em]"
              style={{ color: "var(--brand-text-muted)" }}
            >
              Pilih Ekspresi Emosimu
            </p>

            <div className="flex items-start justify-between gap-2 sm:gap-3">
              {FACES.map(({ id, label, color, softBg, Component }) => (
                <button
                  key={id}
                  onClick={() => setMoodScore(id)}
                  className="group flex min-w-0 flex-1 flex-col items-center gap-2 rounded-2xl px-1 py-2 transition-all duration-200"
                  style={{
                    background: moodScore === id ? softBg : "transparent",
                    transform: moodScore === id ? "translateY(-2px)" : "none",
                  }}
                  type="button"
                >
                  <div
                    className="transition-transform duration-200 group-hover:scale-105"
                    style={{
                      filter:
                        moodScore === id
                          ? `drop-shadow(0 6px 12px ${color}22)`
                          : "none",
                    }}
                  >
                    <Component active={moodScore === id} />
                  </div>

                  <span
                    className="text-center text-[10px] font-semibold leading-tight sm:text-[11px]"
                    style={{
                      color:
                        moodScore === id ? color : "var(--brand-text-muted)",
                    }}
                  >
                    {label}
                  </span>
                </button>
              ))}
            </div>

            {selectedFace && (
              <div
                className="mt-5 rounded-2xl px-4 py-3 text-sm font-semibold"
                style={{
                  background: selectedFace.softBg,
                  color: selectedFace.color,
                  border: `1px solid ${selectedFace.color}30`,
                }}
              >
                Mood dipilih: {selectedFace.label}
              </div>
            )}

            {lastSubmittedStreak !== null && (
              <div
                className="mt-4 rounded-2xl px-4 py-3 text-sm font-semibold"
                style={{
                  background: "rgba(26,150,136,0.10)",
                  color: "var(--brand-primary)",
                  border: "1px solid rgba(26,150,136,0.22)",
                }}
              >
                Streak aktif kamu saat ini: {lastSubmittedStreak} hari
              </div>
            )}

            <div
              className="my-7 h-px w-full"
              style={{ background: "rgba(26,150,136,0.15)" }}
            />

            <div className="mb-3 flex items-center justify-between gap-3">
              <p
                className="text-base font-bold"
                style={{ color: "var(--about-dark-teal)" }}
              >
                Catatan singkat (opsional)
              </p>

              <span
                className="text-sm font-medium"
                style={{
                  color: isOverWords ? "#EF4444" : "var(--brand-text-muted)",
                }}
              >
                {wordCount} / 100 kata
              </span>
            </div>

            <div className="relative">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={5}
                placeholder="Ceritakan sedikit tentang harimu... Ada hal yang membuatmu merasa seperti ini?"
                className="w-full resize-none rounded-[1.25rem] px-5 py-4 text-sm outline-none transition-all placeholder:text-[var(--brand-text-muted)] sm:text-base"
                style={{
                  background: "#F4FBFA",
                  color: "var(--about-dark-teal)",
                  border: `1.5px solid ${
                    isOverWords ? "#EF4444" : "rgba(26,150,136,0.16)"
                  }`,
                  lineHeight: 1.7,
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = isOverWords
                    ? "#EF4444"
                    : "rgba(26,150,136,0.45)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = isOverWords
                    ? "#EF4444"
                    : "rgba(26,150,136,0.16)";
                }}
              />

              {isOverWords && (
                <p className="mt-2 text-xs text-[#EF4444]">
                  Melebihi batas 100 kata
                </p>
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={
                moodScore === null || isOverWords || submitMutation.isPending
              }
              className="mt-7 flex h-14 w-full items-center justify-center gap-2 rounded-[1.1rem] text-base font-bold transition-all duration-300"
              style={{
                background:
                  moodScore !== null &&
                  !isOverWords &&
                  !submitMutation.isPending
                    ? "var(--gradient-brand-btn)"
                    : "#CFE8E6",
                color:
                  moodScore !== null &&
                  !isOverWords &&
                  !submitMutation.isPending
                    ? "#FFFFFF"
                    : "#6F9D9A",
                boxShadow:
                  moodScore !== null &&
                  !isOverWords &&
                  !submitMutation.isPending
                    ? "0 14px 28px rgba(26,150,136,0.22)"
                    : "none",
                cursor:
                  moodScore !== null &&
                  !isOverWords &&
                  !submitMutation.isPending
                    ? "pointer"
                    : "not-allowed",
              }}
              type="button"
            >
              {moodScore === null
                ? "Pilih emosimu terlebih dahulu"
                : isOverWords
                  ? "Kurangi jumlah kata"
                  : submitMutation.isPending
                    ? "Mengirim..."
                    : "Kirim"}
            </button>
          </div>

          <div className="mt-6 flex items-center gap-2">
            <div
              className="h-2 w-2 rounded-full"
              style={{ background: "var(--brand-primary)" }}
            />
            <p
              className="text-[13px] font-medium"
              style={{ color: "var(--brand-text-muted)" }}
            >
              Mood check-in membantumu membangun self-awareness dari hari ke
              hari
            </p>
          </div>
        </div>
      </section>
    </BrandPageBackground>
  );
}
