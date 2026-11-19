"use client";

import {
  ArrowRight,
  Compass,
  Crown,
  Info,
  Lightbulb,
  MessagesSquare,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import "./brave-choice.css";

import type { BraveChoiceQuiz, PlanType } from "../types";
import { buildBraveChoiceFeedback } from "./brave-choice-feedback";

type Origin = "diary" | "dashboard";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  quiz: BraveChoiceQuiz | null;
  isLoading: boolean;
  isResetting: boolean;
  isQuestionPoolExhausted: boolean;
  isQuotaReached: boolean;
  /** Gagal memuat skenario (ditangani tanpa menutup modal). */
  loadError?: boolean;
  onRetryLoad?: () => void;
  quizRemaining: number;
  quizPerDay: number;
  plan: PlanType;
  canLoadNext: boolean;
  onNextQuiz: () => void;
  onResetQuestions: () => void;
  onUpgrade: () => void;
  /** Mengembalikan false jika jawaban gagal tersimpan. */
  onAnswerSubmit: (
    quizId: string,
    label: string,
  ) => void | boolean | Promise<void | boolean>;
  /** Asal pembukaan modal; menentukan CTA penutup. */
  origin?: Origin;
  onContinueWriting?: () => void;
};

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function BraveChoiceModal(props: Props) {
  const { isOpen } = props;
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  // Portal ke body agar overlay selalu menutupi seluruh layar, termasuk saat
  // dirender di dalam container query dashboard.
  return createPortal(
    <AnimatePresence>
      {isOpen ? <BraveChoiceDialog key="brave-choice" {...props} /> : null}
    </AnimatePresence>,
    document.body,
  );
}

function BraveChoiceDialog({
  onClose,
  quiz,
  isLoading,
  isResetting,
  isQuestionPoolExhausted,
  isQuotaReached,
  loadError = false,
  onRetryLoad,
  quizRemaining,
  plan,
  canLoadNext,
  onNextQuiz,
  onResetQuestions,
  onUpgrade,
  onAnswerSubmit,
  origin = "diary",
  onContinueWriting,
}: Props) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const descId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const [chosenIdx, setChosenIdx] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  useEffect(() => {
    setChosenIdx(null);
    setIsAnswered(false);
    setIsSubmitting(false);
    setSubmitError(false);
  }, [quiz?.id]);

  // Ref agar efek fokus hanya berjalan saat dialog dibuka/ditutup,
  // walaupun induk mengirim onClose baru di setiap render.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);
  const handleClose = useCallback(() => onCloseRef.current(), []);

  // Fokus masuk ke dialog, dijebak selama terbuka, lalu kembali ke pemicu.
  useEffect(() => {
    const trigger =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    closeRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
        return;
      }
      if (e.key !== "Tab" || !sheetRef.current) return;

      const focusables = Array.from(
        sheetRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      );
      if (!focusables.length) return;
      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      trigger?.focus();
    };
  }, [handleClose]);

  const handleChoose = async (idx: number) => {
    if (!quiz || isSubmitting || isAnswered) return;
    const option = quiz.options[idx];
    if (!option) return;

    setChosenIdx(idx);
    setIsSubmitting(true);
    setSubmitError(false);

    const result = await Promise.resolve(onAnswerSubmit(quiz.id, option.label));

    if (result === false) {
      setChosenIdx(null);
      setSubmitError(true);
    } else {
      setIsAnswered(true);
    }
    setIsSubmitting(false);
  };

  const exitLabel =
    origin === "dashboard" ? "Kembali ke Dashboard" : "Lanjutkan Menulis";
  const handleExit =
    origin === "diary" && onContinueWriting ? onContinueWriting : handleClose;

  const isFree = plan === "free";
  const showQuotaState =
    !quiz &&
    !isLoading &&
    !loadError &&
    isFree &&
    (isQuotaReached || quizRemaining <= 0);

  const quotaLabel = isFree
    ? quizRemaining > 0
      ? `${quizRemaining} kesempatan tersisa hari ini`
      : "Kesempatan hari ini sudah habis"
    : "Tanpa batas harian";

  return (
    <motion.div
      className="bc-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.2 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <motion.div
        ref={sheetRef}
        className="bc-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      >
        <header className="bc-header">
          <div className="bc-header-icon" aria-hidden="true">
            <Compass size={24} />
          </div>
          <div className="bc-header-copy">
            <h2 id={titleId}>Brave Choice</h2>
            <p id={descId}>
              Jelajahi pilihan, temukan langkah yang lebih baik.
            </p>
            <span className="bc-quota" aria-live="polite">
              {isFree ? (
                <Sparkles size={13} aria-hidden="true" />
              ) : (
                <Crown size={13} aria-hidden="true" />
              )}
              {quotaLabel}
            </span>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="bc-close"
            onClick={handleClose}
            aria-label="Tutup Brave Choice"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="bc-body">
          {isLoading ? (
            <div className="bc-state" role="status">
              <span className="bc-spinner large" aria-hidden="true" />
              <p>Menyiapkan situasi untukmu...</p>
            </div>
          ) : loadError ? (
            <>
              <div className="bc-state cream" role="alert">
                <span className="bc-state-icon" aria-hidden="true">
                  <Info size={22} />
                </span>
                <strong>Skenario belum berhasil dimuat</strong>
                <p>Skenario belum berhasil dimuat. Coba lagi.</p>
              </div>
              <div className="bc-actions">
                {onRetryLoad ? (
                  <button
                    type="button"
                    className="bc-btn"
                    onClick={onRetryLoad}
                  >
                    <RotateCcw size={16} aria-hidden="true" /> Coba lagi
                  </button>
                ) : null}
                <button
                  type="button"
                  className="bc-btn secondary"
                  onClick={handleExit}
                >
                  {exitLabel}
                </button>
              </div>
            </>
          ) : quiz ? (
            <QuizView
              quiz={quiz}
              chosenIdx={chosenIdx}
              isAnswered={isAnswered}
              isSubmitting={isSubmitting}
              submitError={submitError}
              isFree={isFree}
              quizRemaining={quizRemaining}
              canLoadNext={canLoadNext}
              exitLabel={exitLabel}
              onChoose={(i) => void handleChoose(i)}
              onNext={onNextQuiz}
              onExit={handleExit}
              onUpgrade={onUpgrade}
            />
          ) : showQuotaState || isQuotaReached ? (
            <>
              <div className="bc-state cream">
                <span className="bc-state-icon" aria-hidden="true">
                  <Lightbulb size={22} />
                </span>
                <strong>Kesempatan hari ini sudah habis</strong>
                <p>
                  Kamu bisa menjelajahi situasi baru lagi besok. Ingin lanjut
                  sekarang? Premium membuka Brave Choice tanpa batas harian.
                </p>
              </div>
              <div className="bc-actions">
                <button
                  type="button"
                  className="bc-btn premium"
                  onClick={onUpgrade}
                >
                  <Crown size={16} aria-hidden="true" /> Lihat Premium
                </button>
                <button
                  type="button"
                  className="bc-btn secondary"
                  onClick={handleExit}
                >
                  {exitLabel}
                </button>
              </div>
            </>
          ) : isQuestionPoolExhausted ? (
            <>
              <div className="bc-state lilac">
                <span className="bc-state-icon" aria-hidden="true">
                  <MessagesSquare size={22} />
                </span>
                <strong>Semua situasi sudah kamu jelajahi</strong>
                <p>
                  Kamu bisa mengulang dari awal untuk melatih kembali cara
                  menghadapi situasi-situasi ini.
                </p>
              </div>
              <div className="bc-actions">
                <button
                  type="button"
                  className="bc-btn"
                  onClick={onResetQuestions}
                  disabled={isResetting}
                  aria-busy={isResetting}
                >
                  {isResetting ? (
                    <span className="bc-spinner light" aria-hidden="true" />
                  ) : (
                    <RotateCcw size={16} aria-hidden="true" />
                  )}
                  Ulangi dari Awal
                </button>
                <button
                  type="button"
                  className="bc-btn secondary"
                  onClick={handleExit}
                >
                  {exitLabel}
                </button>
              </div>
            </>
          ) : null}
        </div>
      </motion.div>
    </motion.div>
  );
}

function QuizView({
  quiz,
  chosenIdx,
  isAnswered,
  isSubmitting,
  submitError,
  isFree,
  quizRemaining,
  canLoadNext,
  exitLabel,
  onChoose,
  onNext,
  onExit,
  onUpgrade,
}: {
  quiz: BraveChoiceQuiz;
  chosenIdx: number | null;
  isAnswered: boolean;
  isSubmitting: boolean;
  submitError: boolean;
  isFree: boolean;
  quizRemaining: number;
  canLoadNext: boolean;
  exitLabel: string;
  onChoose: (idx: number) => void;
  onNext: () => void;
  onExit: () => void;
  onUpgrade: () => void;
}) {
  const chosen = chosenIdx !== null ? quiz.options[chosenIdx] : undefined;
  const feedback =
    isAnswered && chosen ? buildBraveChoiceFeedback(quiz, chosen) : null;
  const outOfQuota = isFree && (!canLoadNext || quizRemaining <= 0);

  return (
    <>
      <section className="bc-scenario" aria-labelledby={`bc-sc-${quiz.id}`}>
        <span className="bc-kicker" id={`bc-sc-${quiz.id}`}>
          <MessagesSquare size={14} aria-hidden="true" /> Situasinya
        </span>
        <p>{quiz.scenario}</p>
      </section>

      <div role="group" aria-labelledby={`bc-pr-${quiz.id}`}>
        <p className="bc-prompt" id={`bc-pr-${quiz.id}`}>
          Apa yang mungkin kamu lakukan?
        </p>
        <div className="bc-options" style={{ marginTop: 10 }}>
          {quiz.options.map((option, i) => {
            const isChosen = chosenIdx === i;
            const locked = isAnswered || isSubmitting;
            return (
              <button
                key={option.label}
                type="button"
                className={`bc-option ${isChosen ? "chosen" : ""} ${
                  isAnswered && !isChosen ? "muted" : ""
                }`}
                onClick={() => onChoose(i)}
                disabled={locked}
                aria-pressed={isChosen}
                aria-label={`Pilihan ${option.label}: ${option.text}${
                  isChosen && isAnswered ? " (pilihanmu)" : ""
                }`}
              >
                <span className="bc-option-letter" aria-hidden="true">
                  {option.label}
                </span>
                <span className="bc-option-text" aria-hidden="true">
                  {option.text}
                </span>
                {isChosen && isAnswered ? (
                  <span className="bc-chosen-tag" aria-hidden="true">
                    Pilihanmu
                  </span>
                ) : null}
                {isChosen && isSubmitting ? (
                  <span className="bc-option-saving" aria-hidden="true">
                    <span className="bc-spinner" /> Menyimpan pilihanmu...
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {submitError ? (
        <div className="bc-inline-note" role="alert">
          <Info size={16} aria-hidden="true" />
          <span>Pilihanmu belum tersimpan. Coba pilih lagi.</span>
        </div>
      ) : null}

      <div aria-live="polite">
        {feedback ? (
          <section className="bc-feedback" aria-labelledby="bc-feedback-title">
            <div className="bc-feedback-head">
              <Lightbulb size={20} aria-hidden="true" />
              <h3 id="bc-feedback-title">{feedback.title}</h3>
            </div>

            {feedback.kind === "recommended" ? (
              <p>{feedback.benefit}</p>
            ) : (
              <>
                <p>{feedback.opener}</p>
                {feedback.suggestedStep ? (
                  <div className="bc-suggested">
                    <span>
                      <Compass size={13} aria-hidden="true" /> Langkah yang
                      disarankan
                    </span>
                    <strong>{feedback.suggestedStep}</strong>
                  </div>
                ) : null}
                <p>{feedback.reason}</p>
                <div className="bc-note">
                  <span>
                    <Info size={13} aria-hidden="true" /> Yang perlu
                    diperhatikan
                  </span>
                  <p>{feedback.risk}</p>
                </div>
              </>
            )}
          </section>
        ) : null}
      </div>

      {isFree && quizRemaining <= 1 && (isAnswered || quizRemaining === 1) ? (
        <div className="bc-inline-note">
          <Crown size={16} aria-hidden="true" />
          <span>
            {quizRemaining <= 0
              ? "Kesempatan hari ini sudah habis. Kamu bisa lanjut besok, atau buka akses tanpa batas dengan Premium."
              : "Ini kesempatan terakhirmu hari ini."}
          </span>
        </div>
      ) : null}

      <div className="bc-actions">
        {isAnswered ? (
          <>
            {outOfQuota ? (
              <button
                type="button"
                className="bc-btn premium"
                onClick={onUpgrade}
              >
                <Crown size={16} aria-hidden="true" /> Lihat Premium
              </button>
            ) : (
              <button type="button" className="bc-btn" onClick={onNext}>
                Coba Skenario Lain <ArrowRight size={16} aria-hidden="true" />
              </button>
            )}
            <button type="button" className="bc-btn secondary" onClick={onExit}>
              {exitLabel}
            </button>
          </>
        ) : (
          <>
            {!outOfQuota ? (
              <button
                type="button"
                className="bc-skip"
                onClick={onNext}
                disabled={isSubmitting}
              >
                Lewati situasi ini
              </button>
            ) : null}
          </>
        )}
      </div>
    </>
  );
}
