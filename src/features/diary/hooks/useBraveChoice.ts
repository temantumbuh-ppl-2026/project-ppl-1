// ============================================================
//  src/features/diary/hooks/useBraveChoice.ts
//  Custom hook untuk state Brave Choice Quiz
// ============================================================

"use client";

import { useCallback, useEffect, useState } from "react";

import { PLAN_CONFIG } from "../constants/planConfig";
import {
  getBraveChoiceQuiz,
  getBraveChoiceStatus,
  resetBraveChoiceProgress,
  submitQuizAnswer,
} from "../services/diaryServices";
import type { BraveChoiceQuiz, UserProfile } from "../types";

export function useBraveChoice(user: UserProfile | null) {
  const [showModal, setShowModal] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState<BraveChoiceQuiz | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isQuestionPoolExhausted, setIsQuestionPoolExhausted] = useState(false);
  const [isQuotaReached, setIsQuotaReached] = useState(false);
  const [quizUsedToday, setQuizUsedToday] = useState(user?.quizUsedToday ?? 0);

  const planCfg = user ? PLAN_CONFIG[user.plan] : PLAN_CONFIG.free;
  const quizRemaining =
    planCfg.quizPerDay === Infinity
      ? Infinity
      : Math.max(0, planCfg.quizPerDay - quizUsedToday);
  const canDoQuiz =
    user?.plan === "premium" || (!isQuotaReached && quizRemaining > 0);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    let ignore = false;

    const syncQuizStatus = async () => {
      try {
        const status = await getBraveChoiceStatus();

        if (ignore) {
          return;
        }

        setQuizUsedToday(status.quizUsedToday);
        setIsQuotaReached(status.isQuotaReached);
        setIsQuestionPoolExhausted(
          !status.isQuotaReached && !status.hasAvailableQuestion,
        );
      } catch {
        if (!ignore) {
          setIsQuotaReached(false);
        }
      }
    };

    void syncQuizStatus();

    return () => {
      ignore = true;
    };
  }, [user?.id]);

  const loadQuiz = useCallback(async () => {
    setShowModal(true);

    if (user?.plan === "free" && (isQuotaReached || quizRemaining <= 0)) {
      setCurrentQuiz(null);
      setIsLoading(false);
      setIsQuotaReached(true);
      setIsQuestionPoolExhausted(false);
      return;
    }

    // Jika kuota habis atau soal habis, kita tetap buka modal
    // tapi tidak perlu fetch quiz baru jika sudah ada statusnya.
    if (!canDoQuiz && (isQuotaReached || isQuestionPoolExhausted)) {
      setCurrentQuiz(null);
      return;
    }
    setIsLoading(true);
    setCurrentQuiz(null);

    try {
      const result = await getBraveChoiceQuiz();
      setQuizUsedToday(result.quizUsedToday);
      setIsQuotaReached(result.isQuotaReached);

      if (!result.quiz) {
        setCurrentQuiz(null);

        if (result.isQuotaReached) {
          setIsQuestionPoolExhausted(false);
          return;
        }

        setIsQuestionPoolExhausted(true);
        return;
      }

      setIsQuestionPoolExhausted(false);
      setCurrentQuiz(result.quiz);
    } catch {
      setShowModal(false);
      setCurrentQuiz(null);
    } finally {
      setIsLoading(false);
    }
  }, [
    canDoQuiz,
    isQuotaReached,
    isQuestionPoolExhausted,
    quizRemaining,
    user?.plan,
  ]);

  const loadNextQuiz = useCallback(async () => {
    if (user?.plan === "free" && (isQuotaReached || quizRemaining <= 0)) {
      setCurrentQuiz(null);
      setIsLoading(false);
      setIsQuotaReached(true);
      setIsQuestionPoolExhausted(false);
      return;
    }

    setIsLoading(true);
    setCurrentQuiz(null);

    try {
      const result = await getBraveChoiceQuiz();
      setQuizUsedToday(result.quizUsedToday);
      setIsQuotaReached(result.isQuotaReached);

      if (!result.quiz) {
        setCurrentQuiz(null);

        if (result.isQuotaReached) {
          setIsQuestionPoolExhausted(false);
          return;
        }

        setIsQuestionPoolExhausted(true);
        return;
      }

      setIsQuestionPoolExhausted(false);
      setCurrentQuiz(result.quiz);
    } catch {
      setShowModal(false);
      setCurrentQuiz(null);
    } finally {
      setIsLoading(false);
    }
  }, [isQuotaReached, quizRemaining, user?.plan]);

  const handleAnswerSubmit = useCallback(
    async (quizId: string, selectedLabel: string) => {
      try {
        const result = await submitQuizAnswer(quizId, selectedLabel);
        setQuizUsedToday(result.quizUsedToday);
        setIsQuotaReached(
          user?.plan === "free" &&
            result.quizUsedToday >= PLAN_CONFIG.free.quizPerDay,
        );
      } catch {
        return;
      }
    },
    [user?.plan],
  );

  const handleResetQuestions = useCallback(async () => {
    setIsResetting(true);

    try {
      await resetBraveChoiceProgress();
      await loadNextQuiz();
    } catch {
      setIsQuestionPoolExhausted(true);
    } finally {
      setIsResetting(false);
    }
  }, [loadNextQuiz]);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setCurrentQuiz(null);
  }, []);

  return {
    showModal,
    currentQuiz,
    isLoading,
    isResetting,
    isQuestionPoolExhausted,
    isQuotaReached,
    quizRemaining,
    quizUsedToday,
    canDoQuiz,
    planCfg,
    loadQuiz,
    loadNextQuiz,
    handleResetQuestions,
    handleAnswerSubmit,
    closeModal,
  };
}
