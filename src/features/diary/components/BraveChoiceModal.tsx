import {
  X,
  HelpCircle,
  Crown,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { useState, useEffect, type CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { colors as C, fonts } from "../constants/tokens";
import type { BraveChoiceQuiz, PlanType } from "../types";

// ─── animation variants ───────────────────────────────────────────────────────

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.22 } },
  exit: { opacity: 0, transition: { duration: 0.18 } },
};

const sheetVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const },
  },
  exit: {
    opacity: 0,
    y: 16,
    scale: 0.98,
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] as const },
  },
};

const fadeSlide = {
  hidden: { opacity: 0, y: 10 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.06,
      duration: 0.28,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  }),
  exit: { opacity: 0, y: -6, transition: { duration: 0.16 } },
};

// ─── types ────────────────────────────────────────────────────────────────────

type Props = {
  isOpen: boolean;
  onClose: () => void;
  quiz: BraveChoiceQuiz | null;
  isLoading: boolean;
  isResetting: boolean;
  isQuestionPoolExhausted: boolean;
  isQuotaReached: boolean;
  quizRemaining: number;
  quizPerDay: number;
  plan: PlanType;
  canLoadNext: boolean;
  onNextQuiz: () => void;
  onResetQuestions: () => void;
  onUpgrade: () => void;
  onAnswerSubmit: (quizId: string, label: string) => void | Promise<void>;
  onContinueWriting?: () => void;
};

// ─── main component ───────────────────────────────────────────────────────────

export function BraveChoiceModal({
  isOpen,
  onClose,
  quiz,
  isLoading,
  isResetting,
  isQuestionPoolExhausted,
  isQuotaReached,
  quizRemaining,
  quizPerDay,
  plan,
  canLoadNext,
  onNextQuiz,
  onResetQuestions,
  onUpgrade,
  onAnswerSubmit,
  onContinueWriting,
}: Props) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setSelectedIdx(null);
    setIsChecked(false);
    setIsSubmitting(false);
  }, [quiz?.id]);

  // Enter key handler for check answer / continue
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      e.preventDefault();

      if (isChecked) {
        // After checking, Enter = continue writing
        if (onContinueWriting) {
          onContinueWriting();
        } else {
          onClose();
        }
      } else if (selectedIdx !== null && quiz && !isSubmitting) {
        // Before checking, Enter = check answer
        const opt = quiz.options[selectedIdx];
        setIsSubmitting(true);
        void Promise.resolve(onAnswerSubmit(quiz.id, opt.label)).finally(() => {
          setTimeout(() => {
            setIsChecked(true);
            setIsSubmitting(false);
          }, 320);
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isOpen,
    isChecked,
    selectedIdx,
    quiz,
    isSubmitting,
    onAnswerSubmit,
    onContinueWriting,
    onClose,
  ]);

  if (!isOpen) return null;

  const handleCheck = async () => {
    if (selectedIdx === null || !quiz || isSubmitting) return;
    const opt = quiz.options[selectedIdx];
    setIsSubmitting(true);
    await Promise.resolve(onAnswerSubmit(quiz.id, opt.label));
    // small delay so animation feels intentional
    await new Promise((r) => setTimeout(r, 320));
    setIsChecked(true);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    setSelectedIdx(null);
    setIsChecked(false);
    setIsSubmitting(false);
    onClose();
  };

  const selectedOpt = quiz?.options[selectedIdx ?? -1];
  const selectedBrave = selectedOpt?.isBrave ?? false;
  const shouldShowQuotaState =
    plan === "free" && (isQuotaReached || quizRemaining <= 0) && !quiz;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="brave-overlay"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(10, 30, 40, 0.52)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: 20,
          }}
        >
          <motion.div
            key="brave-sheet"
            variants={sheetVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
              width: "100%",
              maxWidth: 492,
              borderRadius: 24,
              overflow: "hidden",
              background: "#f5faf9",
              border: "1px solid rgba(26, 150, 136, 0.14)",
              boxShadow: "0 32px 80px rgba(10, 40, 50, 0.22)",
            }}
          >
            {/* ── Header ── */}
            <div
              style={{
                padding: "14px 18px",
                background:
                  "linear-gradient(135deg, #144949 0%, #1b6b6b 55%, #1a9688 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.14)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <HelpCircle size={17} color="rgba(255,255,255,0.95)" />
                </div>
                <div>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: "#fff",
                      margin: 0,
                      letterSpacing: 0.1,
                    }}
                  >
                    Brave Choice Quiz
                  </p>
                  <p
                    style={{
                      fontSize: 10,
                      color: "rgba(255,255,255,0.65)",
                      margin: 0,
                    }}
                  >
                    Pilih keputusan paling bijak
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {plan === "free" ? (
                  <QuotaBadge remaining={quizRemaining} perDay={quizPerDay} />
                ) : (
                  <UnlimitedBadge />
                )}
                <button
                  onClick={handleClose}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 9,
                    border: "none",
                    background: "rgba(255,255,255,0.14)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background 0.15s",
                  }}
                >
                  <X size={13} color="rgba(255,255,255,0.9)" />
                </button>
              </div>
            </div>

            {/* ── Body ── */}
            <div style={{ padding: "18px 20px" }}>
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div
                    key="loading"
                    variants={fadeSlide}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <LoadingState />
                  </motion.div>
                ) : shouldShowQuotaState ? (
                  <motion.div
                    key="quota-reached"
                    variants={fadeSlide}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <QuotaReachedState
                      onClose={handleClose}
                      onUpgrade={onUpgrade}
                    />
                  </motion.div>
                ) : quiz ? (
                  <motion.div
                    key={`quiz-${quiz.id}`}
                    variants={fadeSlide}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <QuizBody
                      quiz={quiz}
                      selectedIdx={selectedIdx}
                      isChecked={isChecked}
                      isSubmitting={isSubmitting}
                      selectedBrave={selectedBrave}
                      plan={plan}
                      quizRemaining={quizRemaining}
                      canLoadNext={canLoadNext}
                      isQuotaReached={isQuotaReached}
                      onSelect={(i) => {
                        if (!isChecked && !isSubmitting) setSelectedIdx(i);
                      }}
                      onCheck={handleCheck}
                      onNext={onNextQuiz}
                      onClose={onContinueWriting ?? handleClose}
                      onUpgrade={onUpgrade}
                    />
                  </motion.div>
                ) : isQuotaReached ? (
                  <motion.div
                    key="quota-reached"
                    variants={fadeSlide}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <QuotaReachedState
                      onClose={handleClose}
                      onUpgrade={onUpgrade}
                    />
                  </motion.div>
                ) : isQuestionPoolExhausted ? (
                  <motion.div
                    key="exhausted"
                    variants={fadeSlide}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <ExhaustedState
                      isResetting={isResetting}
                      onResetQuestions={onResetQuestions}
                      onClose={handleClose}
                      onUpgrade={onUpgrade}
                      plan={plan}
                    />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── QuizBody ─────────────────────────────────────────────────────────────────

function QuizBody({
  quiz,
  selectedIdx,
  isChecked,
  isSubmitting,
  selectedBrave,
  plan,
  quizRemaining,
  canLoadNext,
  isQuotaReached,
  onSelect,
  onCheck,
  onNext,
  onClose,
  onUpgrade,
}: {
  quiz: BraveChoiceQuiz;
  selectedIdx: number | null;
  isChecked: boolean;
  isSubmitting: boolean;
  selectedBrave: boolean;
  plan: PlanType;
  quizRemaining: number;
  canLoadNext: boolean;
  isQuotaReached: boolean;
  onSelect: (i: number) => void;
  onCheck: () => void;
  onNext: () => void;
  onClose: () => void;
  onUpgrade: () => void;
}) {
  const selectedOpt = quiz.options[selectedIdx ?? -1];
  const shouldShowUpgradeAction =
    plan === "free" && (isQuotaReached || quizRemaining <= 0 || !canLoadNext);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Scenario card */}
      <motion.div
        custom={0}
        variants={fadeSlide}
        initial="hidden"
        animate="visible"
        style={{
          padding: "13px 15px",
          borderRadius: 14,
          background: "rgba(255, 255, 255, 0.75)",
          border: "1px solid rgba(26, 150, 136, 0.16)",
        }}
      >
        <p
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: "#1a9688",
            textTransform: "uppercase",
            letterSpacing: 1.2,
            margin: "0 0 7px",
          }}
        >
          Skenario
        </p>
        <p
          style={{
            fontSize: 13,
            color: C.text,
            lineHeight: 1.75,
            fontFamily: fonts.serif,
            margin: 0,
          }}
        >
          {quiz.scenario}
        </p>
      </motion.div>

      {/* Options */}
      <div style={{ display: "flex", gap: 10, alignItems: "stretch" }}>
        {quiz.options.map((opt, i) => (
          <motion.div
            key={opt.label}
            custom={i + 1}
            variants={fadeSlide}
            initial="hidden"
            animate="visible"
            style={{ flex: 1 }}
          >
            <OptionCard
              option={opt}
              isSelected={selectedIdx === i}
              isChecked={isChecked}
              onClick={() => onSelect(i)}
            />
          </motion.div>
        ))}
      </div>

      {/* Explanation — slides in after answer */}
      <AnimatePresence>
        {isChecked && selectedOpt && (
          <motion.div
            key="explanation"
            initial={{ opacity: 0, y: 8, height: 0 }}
            animate={{
              opacity: 1,
              y: 0,
              height: "auto",
              transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] },
            }}
            exit={{
              opacity: 0,
              y: -4,
              height: 0,
              transition: { duration: 0.18 },
            }}
          >
            <ExplanationCard
              isBrave={selectedBrave}
              text={
                selectedBrave ? quiz.explanationRight : quiz.explanationWrong
              }
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <motion.div
        custom={3}
        variants={fadeSlide}
        initial="hidden"
        animate="visible"
        style={{ display: "flex", gap: 8 }}
      >
        {!isChecked ? (
          <>
            <motion.button
              onClick={onCheck}
              disabled={selectedIdx === null || isSubmitting}
              whileHover={
                selectedIdx !== null && !isSubmitting
                  ? { y: -1, boxShadow: "0 10px 24px rgba(20,73,73,0.22)" }
                  : {}
              }
              whileTap={
                selectedIdx !== null && !isSubmitting ? { scale: 0.975 } : {}
              }
              style={{
                flex: 1,
                height: 44,
                borderRadius: 13,
                border: "none",
                background:
                  selectedIdx !== null
                    ? "linear-gradient(135deg, #144949 0%, #1a9688 100%)"
                    : "rgba(220, 230, 228, 0.8)",
                color: selectedIdx !== null ? "#fff" : C.muted,
                fontSize: 13,
                fontWeight: 700,
                fontFamily: fonts.sans,
                cursor:
                  selectedIdx !== null && !isSubmitting
                    ? "pointer"
                    : "not-allowed",
                transition: "background 0.2s, color 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {isSubmitting ? <MiniSpinner /> : "Cek Jawaban"}
            </motion.button>

            {shouldShowUpgradeAction ? (
              <motion.button
                onClick={onUpgrade}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.975 }}
                style={upgradeButtonStyle}
              >
                <Crown size={14} color={C.gold} />
                Upgrade
              </motion.button>
            ) : (
              <motion.button
                onClick={onNext}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.975 }}
                style={{
                  height: 44,
                  padding: "0 18px",
                  borderRadius: 13,
                  border: "1px solid rgba(26, 150, 136, 0.22)",
                  background: "rgba(255, 255, 255, 0.80)",
                  fontSize: 13,
                  fontWeight: 600,
                  color: C.ink,
                  cursor: "pointer",
                  fontFamily: fonts.sans,
                }}
              >
                Lewati
              </motion.button>
            )}
          </>
        ) : (
          <>
            <motion.button
              onClick={onClose}
              whileHover={{
                y: -1,
                boxShadow: "0 10px 24px rgba(20,73,73,0.22)",
              }}
              whileTap={{ scale: 0.975 }}
              style={{
                flex: 1,
                height: 44,
                borderRadius: 13,
                border: "none",
                background: "linear-gradient(135deg, #144949 0%, #1a9688 100%)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                fontFamily: fonts.sans,
                cursor: "pointer",
              }}
            >
              Lanjutkan Menulis
            </motion.button>

            {!shouldShowUpgradeAction ? (
              <motion.button
                onClick={onNext}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.975 }}
                style={{
                  height: 44,
                  padding: "0 16px",
                  borderRadius: 13,
                  border: "1px solid rgba(26, 150, 136, 0.22)",
                  background: "rgba(255, 255, 255, 0.80)",
                  fontSize: 12,
                  fontWeight: 600,
                  color: C.ink,
                  cursor: "pointer",
                  fontFamily: fonts.sans,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                Soal Lagi
                <ChevronRight size={13} color={C.ink} />
              </motion.button>
            ) : (
              <motion.button
                onClick={onUpgrade}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.975 }}
                style={upgradeButtonStyle}
              >
                <Crown size={14} color={C.gold} />
                Upgrade
              </motion.button>
            )}
          </>
        )}
      </motion.div>

      {/* Upgrade nudge */}
      <AnimatePresence>
        {plan === "free" && quizRemaining <= 1 && (
          <motion.div
            key="nudge"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.28 } }}
            exit={{ opacity: 0, y: -4 }}
          >
            <UpgradeNudge onUpgrade={onUpgrade} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function QuotaBadge({
  remaining,
  perDay,
}: {
  remaining: number;
  perDay: number;
}) {
  return (
    <div
      style={{
        height: 26,
        padding: "0 10px",
        borderRadius: 10,
        background: "rgba(255,255,255,0.16)",
        border: "1px solid rgba(255,255,255,0.18)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span
        style={{
          fontSize: 10,
          color: "rgba(255,255,255,0.90)",
          fontWeight: 600,
          lineHeight: 1,
        }}
      >
        {remaining}/{perDay} tersisa
      </span>
    </div>
  );
}

function UnlimitedBadge() {
  return (
    <div
      style={{
        height: 26,
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: "0 10px",
        borderRadius: 10,
        background: "rgba(255,255,255,0.16)",
        border: "1px solid rgba(255,255,255,0.18)",
      }}
    >
      <Crown size={11} color="#FCD34D" />
      <span
        style={{
          fontSize: 10,
          color: "#FCD34D",
          fontWeight: 600,
          lineHeight: 1,
        }}
      >
        Unlimited
      </span>
    </div>
  );
}

function MiniSpinner() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      style={{ animation: "ttSpin 0.72s linear infinite" }}
    >
      <style>{`@keyframes ttSpin { to { transform: rotate(360deg); } }`}</style>
      <circle
        cx="9"
        cy="9"
        r="7"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="2"
      />
      <path
        d="M9 2a7 7 0 0 1 7 7"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LoadingState() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
        padding: "40px 0",
      }}
    >
      {/* PageLoader-style teal spinner */}
      <svg
        width="36"
        height="36"
        viewBox="0 0 36 36"
        fill="none"
        style={{ animation: "ttSpin 0.8s linear infinite" }}
      >
        <style>{`@keyframes ttSpin { to { transform: rotate(360deg); } }`}</style>
        <circle
          cx="18"
          cy="18"
          r="15"
          stroke="rgba(26,150,136,0.18)"
          strokeWidth="3"
        />
        <path
          d="M18 3a15 15 0 0 1 15 15"
          stroke="#1a9688"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <p
        style={{
          margin: 0,
          fontSize: 12,
          color: C.muted,
          fontFamily: fonts.sans,
        }}
      >
        Memuat soal...
      </p>
    </div>
  );
}

function QuotaReachedState({
  onClose,
  onUpgrade,
}: {
  onClose: () => void;
  onUpgrade: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        style={{
          padding: "14px 16px",
          borderRadius: 14,
          background: "rgba(253, 240, 204, 0.72)",
          border: "1px solid rgba(214, 161, 27, 0.28)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
        }}
      >
        <Crown
          size={18}
          color={C.gold}
          style={{ flexShrink: 0, marginTop: 2 }}
        />
        <div>
          <p
            style={{
              margin: "0 0 5px",
              fontSize: 13,
              fontWeight: 800,
              color: C.amber,
              fontFamily: fonts.sans,
            }}
          >
            Upgrade ke Premium
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              lineHeight: 1.65,
              color: C.text,
              fontFamily: fonts.serif,
            }}
          >
            Brave Choice gratis hari ini sudah habis. Premium membuka akses
            unlimited, jadi kamu bisa lanjut latihan keputusan bijak tanpa
            menunggu besok.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <motion.button
          onClick={onUpgrade}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.975 }}
          style={upgradeButtonStyle}
        >
          <Crown size={14} color={C.gold} />
          Upgrade Premium
        </motion.button>

        <motion.button
          onClick={onClose}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.975 }}
          style={{
            height: 44,
            padding: "0 18px",
            borderRadius: 13,
            border: "1px solid rgba(26, 150, 136, 0.22)",
            background: "rgba(237, 249, 247, 0.60)",
            fontSize: 13,
            fontWeight: 600,
            color: C.ink,
            cursor: "pointer",
            fontFamily: fonts.sans,
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}
        >
          Tutup
        </motion.button>
      </div>
    </div>
  );
}

function ExhaustedState({
  isResetting,
  onResetQuestions,
  onClose,
  onUpgrade,
  plan,
}: {
  isResetting: boolean;
  onResetQuestions: () => void;
  onClose: () => void;
  onUpgrade: () => void;
  plan: PlanType;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        style={{
          padding: "14px 16px",
          borderRadius: 14,
          background: "rgba(237, 249, 247, 0.65)",
          border: "1px solid rgba(26, 150, 136, 0.18)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 13,
            lineHeight: 1.7,
            color: C.text,
            fontFamily: fonts.serif,
          }}
        >
          Semua soal di segmenmu sudah selesai. Tekan reset untuk membuka semua
          soal lagi dari awal.
        </p>
      </div>

      {plan === "free" && (
        <motion.button
          onClick={onUpgrade}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.975 }}
          style={upgradeButtonStyle}
        >
          <Crown size={14} color={C.gold} />
          Upgrade Premium
        </motion.button>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <motion.button
          onClick={onResetQuestions}
          disabled={isResetting}
          whileHover={
            !isResetting
              ? { y: -1, boxShadow: "0 10px 24px rgba(20,73,73,0.22)" }
              : {}
          }
          whileTap={!isResetting ? { scale: 0.975 } : {}}
          style={{
            flex: 1,
            height: 44,
            borderRadius: 13,
            border: "none",
            background: "linear-gradient(135deg, #144949 0%, #1a9688 100%)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            fontFamily: fonts.sans,
            cursor: isResetting ? "wait" : "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {isResetting ? <MiniSpinner /> : <RotateCcw size={14} />}
          Reset Soal
        </motion.button>

        <motion.button
          onClick={onClose}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.975 }}
          style={{
            height: 44,
            padding: "0 18px",
            borderRadius: 13,
            border: "1px solid rgba(26, 150, 136, 0.22)",
            background: "rgba(237, 249, 247, 0.60)",
            fontSize: 13,
            fontWeight: 600,
            color: C.ink,
            cursor: "pointer",
            fontFamily: fonts.sans,
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}
        >
          Tutup
        </motion.button>
      </div>
    </div>
  );
}

function OptionCard({
  option,
  isSelected,
  isChecked,
  onClick,
}: {
  option: { label: string; text: string; isBrave: boolean };
  isSelected: boolean;
  isChecked: boolean;
  onClick: () => void;
}) {
  const resultCorrect = isSelected && isChecked && option.isBrave;
  const resultWrong = isSelected && isChecked && !option.isBrave;

  const borderColor = resultCorrect
    ? "#1a9688"
    : resultWrong
      ? "#ef4444"
      : isSelected
        ? "#1a9688"
        : "rgba(26, 150, 136, 0.20)";

  const bgColor = resultCorrect
    ? "rgba(26, 150, 136, 0.09)"
    : resultWrong
      ? "rgba(239, 68, 68, 0.07)"
      : isSelected
        ? "rgba(26, 150, 136, 0.07)"
        : "rgba(255, 255, 255, 0.80)";

  const labelBg = resultCorrect
    ? "#1a9688"
    : resultWrong
      ? "#ef4444"
      : isSelected
        ? "#1a9688"
        : "rgba(26, 150, 136, 0.14)";

  const labelColor = isSelected ? "#fff" : "#1a9688";

  return (
    <motion.div
      onClick={onClick}
      animate={{
        borderColor,
        backgroundColor: bgColor,
        scale: isSelected ? 1.01 : 1,
      }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      whileHover={
        !isChecked
          ? { y: -2, boxShadow: "0 8px 20px rgba(26,150,136,0.10)" }
          : {}
      }
      whileTap={!isChecked ? { scale: 0.98 } : {}}
      style={{
        padding: "12px",
        borderRadius: 14,
        cursor: isChecked ? "default" : "pointer",
        border: `1.5px solid ${borderColor}`,
        background: bgColor,
        height: "100%",
        boxSizing: "border-box",
      }}
    >
      <motion.div
        animate={{ background: labelBg }}
        transition={{ duration: 0.22 }}
        style={{
          width: 24,
          height: 24,
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 9,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: labelColor,
            fontFamily: fonts.sans,
          }}
        >
          {option.label}
        </span>
      </motion.div>

      <AnimatePresence>
        {isSelected && isChecked && (
          <motion.p
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{
              opacity: 1,
              height: "auto",
              marginBottom: 4,
              transition: { duration: 0.24 },
            }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              fontSize: 9,
              fontWeight: 800,
              color: option.isBrave ? "#1a9688" : "#ef4444",
              textTransform: "uppercase",
              letterSpacing: 0.6,
              margin: 0,
            }}
          >
            {option.isBrave ? "Bijak" : "Kurang Tepat"}
          </motion.p>
        )}
      </AnimatePresence>

      <p
        style={{
          fontSize: 12,
          color: C.text,
          lineHeight: 1.6,
          fontFamily: fonts.serif,
          margin: 0,
        }}
      >
        {option.text}
      </p>
    </motion.div>
  );
}

function ExplanationCard({
  isBrave,
  text,
}: {
  isBrave: boolean;
  text: string;
}) {
  const teal = "#1a9688";
  const red = "#ef4444";

  return (
    <div
      style={{
        padding: "12px 14px",
        borderRadius: 14,
        background: isBrave
          ? "rgba(26, 150, 136, 0.08)"
          : "rgba(239, 68, 68, 0.07)",
        border: `1px solid ${isBrave ? "rgba(26,150,136,0.22)" : "rgba(239,68,68,0.22)"}`,
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
      }}
    >
      {isBrave ? (
        <CheckCircle2
          size={17}
          color={teal}
          style={{ flexShrink: 0, marginTop: 1 }}
        />
      ) : (
        <AlertCircle
          size={17}
          color={red}
          style={{ flexShrink: 0, marginTop: 1 }}
        />
      )}
      <div>
        <p
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: isBrave ? teal : red,
            margin: "0 0 5px",
            letterSpacing: 0.1,
          }}
        >
          {isBrave ? "Pilihan Berani!" : "Coba Pikirkan Lagi"}
        </p>
        <p
          style={{
            fontSize: 12,
            color: C.text,
            lineHeight: 1.65,
            fontFamily: fonts.serif,
            margin: 0,
          }}
        >
          {text}
        </p>
      </div>
    </div>
  );
}

function UpgradeNudge({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div
      style={{
        padding: "10px 12px",
        borderRadius: 12,
        background: "rgba(253, 240, 204, 0.72)",
        border: `1px solid rgba(214, 161, 27, 0.28)`,
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <Crown size={14} color={C.gold} style={{ flexShrink: 0 }} />
      <p
        style={{
          fontSize: 11,
          color: C.gold,
          fontWeight: 600,
          margin: 0,
          flex: 1,
        }}
      >
        Ini soal terakhirmu hari ini. Upgrade ke Premium untuk akses unlimited!
      </p>
      <button
        onClick={onUpgrade}
        style={{
          height: 26,
          padding: "0 10px",
          borderRadius: 999,
          border: `1px solid rgba(214, 161, 27, 0.35)`,
          background: "rgba(253, 240, 204, 0.90)",
          color: C.amber,
          fontSize: 10,
          fontWeight: 800,
          cursor: "pointer",
          fontFamily: fonts.sans,
          flexShrink: 0,
        }}
      >
        Upgrade
      </button>
    </div>
  );
}

const upgradeButtonStyle: CSSProperties = {
  flex: 1,
  height: 44,
  borderRadius: 13,
  border: "1px solid rgba(214, 161, 27, 0.30)",
  background: "rgba(253, 240, 204, 0.72)",
  color: C.amber,
  fontSize: 13,
  fontWeight: 800,
  fontFamily: fonts.sans,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  backdropFilter: "blur(6px)",
  WebkitBackdropFilter: "blur(6px)",
};
