"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

import { BrandPageBackground } from "@/components/layout/brand-page-background";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/manual/page-loader";
import { BaselineOptionButton } from "@/components/baseline/baseline-option-button";
import { BaselineProgress } from "@/components/baseline/baseline-progress";

import { BASELINE_QUESTIONS } from "@/lib/baseline/questions";
import type { BaselineAnswersTuple } from "@/lib/baseline/validation";

type BaselineSavedResult = {
  analyzedAt: string;
  confidenceScore: number | null;
  id: string;
  isBeginner: boolean;
  label: "Beginner" | "Intermediate";
  userId: string;
};

type BaselineErrorResponse = {
  error?: string;
};

type BaselineSubmitResponse = {
  success: boolean;
  baseline: BaselineSavedResult;
  prediction: {
    labelIndex: number;
    label: "Beginner" | "Intermediate";
    isBeginner: boolean;
    confidenceScore: number;
    inputName: string;
  };
};

type AnswerValue = BaselineAnswersTuple[number];

type PresentedQuestion = {
  id: string;
  step: number;
  total: number;
  question: string;
  options: readonly AnswerValue[];
};

const OPTION_LABEL_MAP: Record<AnswerValue, string> = {
  Agree: "Setuju",
  Disagree: "Tidak Setuju",
  Yes: "Ya",
  No: "Tidak",
};

/**
 * Mapping teks pertanyaan untuk tampilan UI.
 * Jangan ubah urutan BASELINE_QUESTIONS karena itu dipakai model ONNX.
 * Yang diubah hanya teks yang ditampilkan ke user.
 */
const QUESTION_TEXT_MAP: Record<string, string> = {
  "Children are safe among family members such as grandparents, uncles, aunts, cousins":
    "Anak selalu aman berada di lingkungan keluarga, seperti kakek, nenek, paman, bibi, atau sepupu.",

  "Children are mainly abused by strangers in our society":
    "Kekerasan atau pelecehan pada anak biasanya dilakukan oleh orang yang tidak dikenal.",

  "Male children dont need sexual abuse prevention knowledge":
    "Anak laki-laki tidak perlu diajarkan cara melindungi diri dari pelecehan atau kekerasan seksual.",

  "Teaching sexual abuse prevention in school is not necessary. It will make children curious about sex":
    "Mengajarkan cara melindungi diri dari pelecehan atau kekerasan seksual di sekolah itu tidak perlu karena bisa membuat anak menjadi penasaran tentang seks.",

  "Do you know what child grooming is?":
    "Apakah kamu tahu apa itu child grooming?",

  "Do you know what signs to look for to identify if your child has been abused?":
    "Apakah kamu tahu tanda-tanda yang perlu diperhatikan jika seorang anak mungkin mengalami kekerasan atau pelecehan?",

  "Do you think children need post abuse counseling for recovering?":
    "Menurutmu, apakah anak perlu pendampingan atau konseling setelah mengalami kekerasan atau pelecehan agar bisa pulih?",

  "Do you think you should take legal action against the abuser of your child?":
    "Menurutmu, apakah pelaku kekerasan atau pelecehan pada anak perlu diproses secara hukum?",
};

function getPresentedQuestionText(question: string): string {
  return QUESTION_TEXT_MAP[question] ?? question;
}

const PRESENTED_QUESTIONS: PresentedQuestion[] = BASELINE_QUESTIONS.map(
  (item, index) => ({
    id: `baseline-${index + 1}`,
    step: index + 1,
    total: BASELINE_QUESTIONS.length,
    question: getPresentedQuestionText(item.question),
    options: item.options,
  }),
);

function buildAnswerTuple(
  answersMap: Record<number, AnswerValue>,
): BaselineAnswersTuple {
  const orderedAnswers = PRESENTED_QUESTIONS.map(
    (_, index) => answersMap[index],
  );

  if (orderedAnswers.some((value) => !value)) {
    throw new Error("Semua pertanyaan baseline harus dijawab.");
  }

  return orderedAnswers as BaselineAnswersTuple;
}

function BaselinePageContent() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, AnswerValue>>({});
  const [isRedirecting, setIsRedirecting] = useState(false);

  const saveBaselineMutation = useMutation({
    mutationFn: async (orderedAnswers: BaselineAnswersTuple) => {
      const response = await fetch("/api/baseline", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answers: orderedAnswers,
        }),
      });

      if (response.status === 401) {
        throw new Error("UNAUTHORIZED");
      }

      const payload = (await response.json().catch(() => null)) as
        | BaselineSubmitResponse
        | BaselineErrorResponse
        | null;

      if (!response.ok) {
        throw new Error(
          (payload as BaselineErrorResponse | null)?.error ||
            "Gagal memproses baseline.",
        );
      }

      return payload as BaselineSubmitResponse;
    },
    onSuccess: (payload) => {
      toast.success(
        payload.prediction?.label
          ? `Baseline berhasil disimpan. Hasil awalmu: ${payload.prediction.label}.`
          : "Baseline berhasil disimpan.",
      );

      void queryClient.invalidateQueries({ queryKey: ["baseline"] });
      setIsRedirecting(true);
      window.location.href = "/home";
    },
    onError: (error) => {
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        toast.error("Sesi kamu habis. Silakan login lagi.");
        router.replace("/login");
        return;
      }

      toast.error(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menyimpan baseline.",
      );
    },
  });

  const currentQuestion = PRESENTED_QUESTIONS[currentIndex];
  const selectedOption = answers[currentIndex];

  const allQuestionsAnswered = useMemo(() => {
    return PRESENTED_QUESTIONS.every((_, index) => Boolean(answers[index]));
  }, [answers]);

  const handleSelectOption = (value: AnswerValue) => {
    setAnswers((prev) => ({
      ...prev,
      [currentIndex]: value,
    }));
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleNext = useCallback(async () => {
    if (!selectedOption) {
      toast.error("Pilih salah satu jawaban terlebih dahulu.");
      return;
    }

    if (currentIndex < PRESENTED_QUESTIONS.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      return;
    }

    if (!allQuestionsAnswered) {
      toast.error("Semua pertanyaan harus dijawab terlebih dahulu.");
      return;
    }

    try {
      const answerTuple = buildAnswerTuple(answers);
      await saveBaselineMutation.mutateAsync(answerTuple);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menyiapkan jawaban baseline.",
      );
    }
  }, [
    selectedOption,
    currentIndex,
    allQuestionsAnswered,
    answers,
    saveBaselineMutation,
  ]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "Enter" &&
        selectedOption &&
        !saveBaselineMutation.isPending
      ) {
        e.preventDefault();
        void handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, selectedOption, saveBaselineMutation.isPending]);

  if (isRedirecting || saveBaselineMutation.isPending) {
    return (
      <PageLoader
        message={
          isRedirecting
            ? "Mengarahkan ke halaman utama..."
            : "Menyimpan baseline kamu..."
        }
        fullscreen
      />
    );
  }

  if (!currentQuestion) {
    return null;
  }

  return (
    <BrandPageBackground>
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-6xl items-center justify-center px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="hidden lg:block">
            <div className="max-w-xl">
              <h1 className="text-4xl font-bold leading-tight text-slate-900">
                Sebelum mulai, yuk isi pertanyaan awal dulu.
              </h1>

              <p className="mt-5 text-base leading-8 text-slate-600">
                Jawabanmu membantu TemanTumbuh menyesuaikan pengalaman awal yang
                lebih relevan, aman, dan personal untukmu.
              </p>
            </div>
          </div>

          <div className="w-full max-w-[420px] justify-self-center lg:max-w-[560px]">
            <div className="rounded-[30px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="rounded-t-[30px] border-b border-slate-100 px-6 pb-5 pt-6 sm:px-7">
                <BaselineProgress
                  currentStep={currentQuestion.step}
                  totalSteps={currentQuestion.total}
                />

                <div className="mb-6">
                  <p className="mb-3 text-sm font-medium text-teal-700">
                    Pertanyaan {currentQuestion.step}
                  </p>

                  <h2 className="text-[22px] font-bold leading-tight text-slate-900 sm:text-[26px]">
                    {currentQuestion.question}
                  </h2>

                  <p className="mt-4 text-sm leading-7 text-slate-500">
                    Jawab sesuai pemahamanmu saat ini. Tidak ada jawaban benar
                    atau salah.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {currentQuestion.options.map((option) => (
                    <BaselineOptionButton
                      key={option}
                      label={OPTION_LABEL_MAP[option]}
                      selected={selectedOption === option}
                      onClick={() => handleSelectOption(option)}
                      disabled={saveBaselineMutation.isPending}
                    />
                  ))}
                </div>

                <div className="mt-6">
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={!selectedOption || saveBaselineMutation.isPending}
                    className="h-12 w-full rounded-[18px] text-sm font-semibold text-white"
                    style={{ background: "var(--gradient-brand-btn)" }}
                  >
                    {currentIndex === PRESENTED_QUESTIONS.length - 1
                      ? "Simpan Jawaban"
                      : "Lanjut"}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-start px-6 py-4 text-sm sm:px-7">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={
                    currentIndex === 0 || saveBaselineMutation.isPending
                  }
                  aria-label="Kembali ke pertanyaan sebelumnya"
                  title="Kembali"
                  className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                >
                  <ArrowLeft className="h-5 w-5" strokeWidth={2.2} />
                  <span className="sr-only">Kembali</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BrandPageBackground>
  );
}

export default function BaselinePageClient() {
  return <BaselinePageContent />;
}
