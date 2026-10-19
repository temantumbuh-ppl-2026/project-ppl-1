"use client";

import { useEffect, useRef, useState } from "react";
import { BookText } from "lucide-react";
import { useRouter } from "next/navigation";

import "./diary-redesign.css";

import { PageLoader } from "@/components/ui/manual/page-loader";
import { useDiary } from "@/features/diary/hooks/useDiary";
import { useBraveChoice } from "@/features/diary/hooks/useBraveChoice";
import { DiaryLeftPage } from "@/features/diary/components/DiaryLeftPage";
import { DiaryRightPage } from "@/features/diary/components/DiaryRightPage";
import { BraveChoiceModal } from "@/features/diary/components/BraveChoiceModal";
import { DiaryBookIntro } from "@/features/diary/components/DiaryBookIntro/DiaryBookIntro";

type DiaryPageClientProps = {
  entryId: string;
  initialUserMeta: {
    id: string;
    name: string;
    plan: "free" | "premium";
    streakDays: number;
    parentEmail?: string;
  };
};

// Breakpoint yang sama dengan CSS: di bawahnya riwayat menjadi drawer.
const DRAWER_BREAKPOINT_QUERY = "(max-width: 980px)";

export function DiaryPageClient({
  entryId,
  initialUserMeta,
}: DiaryPageClientProps) {
  const router = useRouter();
  const diary = useDiary(entryId, initialUserMeta);
  const quiz = useBraveChoice(diary.user);

  const [showBookIntro, setShowBookIntro] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [historyCollapsed, setHistoryCollapsed] = useState(false);

  const hasPlayedIntroRef = useRef(false);

  useEffect(() => {
    if (diary.isLoading || !diary.user) return;

    if (!hasPlayedIntroRef.current) {
      hasPlayedIntroRef.current = true;
      setShowBookIntro(true);
    }
  }, [diary.isLoading, diary.user]);

  if (diary.isLoading || !diary.user) {
    return <PageLoader message="Memuat diary..." />;
  }

  const isPremium = diary.user.plan === "premium";
  const canLoadNext = isPremium || quiz.quizRemaining > 0;

  // Perilaku existing: di desktop kembali ke halaman sebelumnya,
  // di tablet/mobile selalu ke dashboard.
  const handleBack = () => {
    if (window.matchMedia(DRAWER_BREAKPOINT_QUERY).matches) {
      window.location.href = "/home";
      return;
    }
    router.back();
  };

  // Tombol "Riwayat": membuka drawer (tablet/mobile) atau melebarkan sidebar
  // yang diciutkan (desktop).
  const openHistory = () => {
    if (window.matchMedia(DRAWER_BREAKPOINT_QUERY).matches) {
      setDrawerOpen(true);
      return;
    }
    setHistoryCollapsed(false);
  };

  return (
    <div className="tt-diary">
      <DiaryBookIntro
        show={showBookIntro}
        onFinish={() => setShowBookIntro(false)}
      />

      <div className={`dy-page ${historyCollapsed ? "is-collapsed" : ""}`}>
        <button
          type="button"
          className={`dy-overlay ${drawerOpen ? "is-open" : ""}`}
          aria-label="Tutup riwayat diary"
          tabIndex={drawerOpen ? 0 : -1}
          onClick={() => setDrawerOpen(false)}
        />

        <DiaryLeftPage
          isDrawerOpen={drawerOpen}
          onCloseDrawer={() => setDrawerOpen(false)}
          onToggleCollapse={() => setHistoryCollapsed((prev) => !prev)}
          onBack={handleBack}
          user={diary.user}
          entries={diary.entries}
          selectedEntry={diary.selectedEntry}
          activeMonth={diary.activeMonth}
          selectedDate={diary.selectedDate}
          planCfg={diary.planCfg}
          quizRemaining={
            quiz.quizRemaining === Infinity ? 999 : quiz.quizRemaining
          }
          canDoQuiz={quiz.canDoQuiz}
          isQuestionPoolExhausted={quiz.isQuestionPoolExhausted}
          onSelectEntry={diary.setSelectedEntry}
          onGoToToday={diary.goToToday}
          onOpenQuiz={quiz.loadQuiz}
          onPrevMonth={diary.goToPrevMonth}
          onNextMonth={diary.goToNextMonth}
          onSelectDate={diary.selectCalendarDate}
        />

        {diary.selectedEntry ? (
          <DiaryRightPage
            entry={diary.selectedEntry}
            messages={diary.messages}
            conversation={diary.conversation}
            starters={diary.starters}
            startersError={diary.startersError}
            inputValue={diary.inputValue}
            isAiTyping={diary.isAiTyping}
            isGreetingPending={diary.isGreetingPending}
            isMessagesLoading={diary.isMessagesLoading}
            sendError={diary.sendError}
            requiresReload={diary.isSendStatusUnknown}
            isReadOnly={diary.isReadOnly}
            canWriteDiary={diary.canWriteDiary}
            isPremium={isPremium}
            diaryPerMonth={
              diary.planCfg.diaryPerMonth === Infinity
                ? 999
                : diary.planCfg.diaryPerMonth
            }
            hasPrevEntry={diary.currentEntryIndex < diary.entries.length - 1}
            hasNextEntry={diary.currentEntryIndex > 0}
            onOpenHistory={openHistory}
            onPrevEntry={diary.goToPrevEntry}
            onNextEntry={diary.goToNextEntry}
            onInputChange={diary.setInputValue}
            onSend={diary.handleSendMessage}
            onKeyDown={diary.handleKeyDown}
          />
        ) : (
          <EmptyDiaryState
            activeMonth={diary.activeMonth}
            onOpenHistory={openHistory}
          />
        )}
      </div>

      <BraveChoiceModal
        isOpen={quiz.showModal}
        onClose={quiz.closeModal}
        quiz={quiz.currentQuiz}
        isLoading={quiz.isLoading}
        isResetting={quiz.isResetting}
        isQuestionPoolExhausted={quiz.isQuestionPoolExhausted}
        isQuotaReached={quiz.isQuotaReached}
        loadError={quiz.loadError}
        onRetryLoad={() => void quiz.loadNextQuiz()}
        quizRemaining={
          quiz.quizRemaining === Infinity ? 999 : quiz.quizRemaining
        }
        quizPerDay={
          diary.planCfg.quizPerDay === Infinity ? 999 : diary.planCfg.quizPerDay
        }
        plan={diary.user.plan}
        canLoadNext={canLoadNext}
        onNextQuiz={quiz.loadNextQuiz}
        onResetQuestions={quiz.handleResetQuestions}
        onUpgrade={() => router.push("/subscription")}
        onAnswerSubmit={quiz.handleAnswerSubmit}
        origin="diary"
      />
    </div>
  );
}

function EmptyDiaryState({
  activeMonth,
  onOpenHistory,
}: {
  activeMonth: string;
  onOpenHistory: () => void;
}) {
  return (
    <section className="dy-empty-page" aria-label="Diary kosong">
      <div className="dy-empty-page-top">
        <button
          type="button"
          className="dy-history-trigger"
          onClick={onOpenHistory}
          aria-controls="diary-history"
        >
          <BookText size={18} aria-hidden="true" /> Riwayat
        </button>
      </div>
      <div className="dy-empty-page-body">
        <div className="dy-empty-card">
          <h2>Belum ada diary di hari pada bulan {activeMonth}</h2>
          <p>
            Coba pilih tanggal lain dari kalender atau pindah bulan dari riwayat
            diary.
          </p>
        </div>
      </div>
    </section>
  );
}
