"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, PanelLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { PageLoader } from "@/components/ui/manual/page-loader";
import { colors as C } from "@/features/diary/constants/tokens";
import { useDiary } from "@/features/diary/hooks/useDiary";
import { useBraveChoice } from "@/features/diary/hooks/useBraveChoice";
import { DiaryLeftPage } from "@/features/diary/components/DiaryLeftPage";
import { BookSpine } from "@/features/diary/components/BookSpine";
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

export function DiaryPageClient({
  entryId,
  initialUserMeta,
}: DiaryPageClientProps) {
  const router = useRouter();
  const diary = useDiary(entryId, initialUserMeta);
  const quiz = useBraveChoice(diary.user);

  const [showBookIntro, setShowBookIntro] = useState(false);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const [desktopHistoryOpen, setDesktopHistoryOpen] = useState(true);

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

  return (
    <div
      style={{
        fontFamily: "var(--font-plus-jakarta), 'Plus Jakarta Sans'",
        height: "100dvh",
        width: "100%",
        background: `linear-gradient(180deg, ${C.inkS} 0%, ${C.bg} 48%, ${C.paperL} 100%)`,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <DiaryBookIntro
        show={showBookIntro}
        onFinish={() => setShowBookIntro(false)}
      />

      {/* DESKTOP */}
      <div
        className="hidden md:flex"
        style={{
          height: "100%",
          width: "100%",
          minHeight: 0,
          minWidth: 0,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            height: "100%",
            width: "100%",
            minHeight: 0,
            minWidth: 0,
            overflow: "hidden",
            background: desktopHistoryOpen ? C.spine : C.paper,
            boxShadow: desktopHistoryOpen
              ? "inset 0 1px 0 rgba(255,255,255,0.22)"
              : "none",
          }}
        >
          {/* LEFT CLOSED RAIL — single toggle button */}
          {!desktopHistoryOpen ? (
            <div
              style={{
                position: "absolute",
                top: 18,
                left: 18,
                zIndex: 10,
              }}
            >
              <button
                type="button"
                onClick={() => setDesktopHistoryOpen(true)}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  border: "none",
                  background: "transparent",
                  color: C.inkD,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
                aria-label="Buka Riwayat Diary"
                title="Buka Riwayat Diary"
              >
                <PanelLeft size={18} />
              </button>
            </div>
          ) : null}

          {/* LEFT PAGE */}
          {desktopHistoryOpen ? (
            <div
              style={{
                width: 360,
                minWidth: 360,
                maxWidth: 360,
                overflow: "hidden",
                background: C.paper,
                borderRight: `1px solid ${C.bdL}`,
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
                position: "relative",
                zIndex: 2,
              }}
            >
              <div
                style={{
                  flexShrink: 0,
                  padding: "14px 14px 8px",
                  background: C.paper,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  borderBottom: `1px solid ${C.bdL}`,
                }}
              >
                <button
                  type="button"
                  onClick={() => router.back()}
                  style={floatingButtonStyle()}
                >
                  <ArrowLeft size={15} />
                  <span>Kembali</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDesktopHistoryOpen(false)}
                  style={iconButtonStyle()}
                  aria-label="Tutup riwayat diary"
                  title="Tutup riwayat diary"
                >
                  <PanelLeft size={15} />
                </button>
              </div>

              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  overflow: "hidden",
                }}
              >
                <DiaryLeftPage
                  mode="desktop"
                  isOpen={desktopHistoryOpen}
                  onClose={() => setDesktopHistoryOpen(false)}
                  onOpen={() => setDesktopHistoryOpen(true)}
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
              </div>
            </div>
          ) : null}

          {/* SPINE */}
          {desktopHistoryOpen ? (
            <div
              style={{
                width: 24,
                flexShrink: 0,
                background: C.spine,
                marginLeft: -6,
                position: "relative",
                zIndex: 3,
                borderLeft: `1px solid ${C.bdL}`,
                borderRight: `1px solid rgba(95, 73, 38, 0.08)`,
              }}
            >
              <BookSpine />
            </div>
          ) : null}

          {/* RIGHT PAGE */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              minHeight: 0,
              display: "flex",
              background: C.paper,
              position: "relative",
              zIndex: 1,
              overflow: "hidden",
            }}
          >
            {diary.selectedEntry ? (
              <DiaryRightPage
                entry={diary.selectedEntry}
                messages={diary.messages}
                inputValue={diary.inputValue}
                isAiTyping={diary.isAiTyping}
                sendError={diary.sendError}
                isReadOnly={diary.isReadOnly}
                canWriteDiary={diary.canWriteDiary}
                isPremium={isPremium}
                diaryPerMonth={
                  diary.planCfg.diaryPerMonth === Infinity
                    ? 999
                    : diary.planCfg.diaryPerMonth
                }
                onPrevEntry={diary.goToPrevEntry}
                onNextEntry={diary.goToNextEntry}
                onInputChange={diary.setInputValue}
                onSend={diary.handleSendMessage}
                onKeyDown={diary.handleKeyDown}
                isMobile={false}
              />
            ) : (
              <EmptyDiaryState activeMonth={diary.activeMonth} />
            )}
          </div>
        </div>
      </div>

      {/* MOBILE */}
      <div
        className="md:hidden"
        style={{
          height: "100%",
          width: "100%",
          position: "relative",
          minHeight: 0,
          overflow: "hidden",
          background: C.paper,
        }}
      >
        {/* Floating sidebar toggle — always visible */}
        {!mobileHistoryOpen && (
          <div
            style={{
              position: "absolute",
              top: 10,
              left: 8,
              zIndex: 20,
            }}
          >
            <button
              type="button"
              onClick={() => setMobileHistoryOpen(true)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                border: "none",
                background: "transparent",
                color: C.inkD,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
              aria-label="Buka Riwayat Diary"
              title="Buka Riwayat Diary"
            >
              <PanelLeft size={18} />
            </button>
          </div>
        )}

        <div
          style={{
            height: "100%",
            width: "100%",
            background: C.paper,
            overflow: "hidden",
            boxSizing: "border-box",
          }}
        >
          {diary.selectedEntry ? (
            <DiaryRightPage
              entry={diary.selectedEntry}
              messages={diary.messages}
              inputValue={diary.inputValue}
              isAiTyping={diary.isAiTyping}
              sendError={diary.sendError}
              isReadOnly={diary.isReadOnly}
              canWriteDiary={diary.canWriteDiary}
              isPremium={isPremium}
              diaryPerMonth={
                diary.planCfg.diaryPerMonth === Infinity
                  ? 999
                  : diary.planCfg.diaryPerMonth
              }
              onPrevEntry={diary.goToPrevEntry}
              onNextEntry={diary.goToNextEntry}
              onInputChange={diary.setInputValue}
              onSend={diary.handleSendMessage}
              onKeyDown={diary.handleKeyDown}
              isMobile
            />
          ) : (
            <EmptyDiaryState activeMonth={diary.activeMonth} />
          )}
        </div>

        <DiaryLeftPage
          mode="mobile"
          isOpen={mobileHistoryOpen}
          onClose={() => setMobileHistoryOpen(false)}
          onOpen={() => setMobileHistoryOpen(true)}
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
          onSelectEntry={(entry) => {
            diary.setSelectedEntry(entry);
            setMobileHistoryOpen(false);
          }}
          onGoToToday={() => {
            diary.goToToday();
            setMobileHistoryOpen(false);
          }}
          onOpenQuiz={() => {
            quiz.loadQuiz();
            setMobileHistoryOpen(false);
          }}
          onPrevMonth={diary.goToPrevMonth}
          onNextMonth={diary.goToNextMonth}
          onSelectDate={(date) => {
            diary.selectCalendarDate(date);
            setMobileHistoryOpen(false);
          }}
        />
      </div>

      <BraveChoiceModal
        isOpen={quiz.showModal}
        onClose={quiz.closeModal}
        quiz={quiz.currentQuiz}
        isLoading={quiz.isLoading}
        isResetting={quiz.isResetting}
        isQuestionPoolExhausted={quiz.isQuestionPoolExhausted}
        isQuotaReached={quiz.isQuotaReached}
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
      />
    </div>
  );
}

function EmptyDiaryState({ activeMonth }: { activeMonth: string }) {
  return (
    <div
      style={{
        flex: 1,
        background: C.paper,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        minHeight: 0,
        width: "100%",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 460,
          borderRadius: 18,
          background: C.white,
          border: `1px solid ${C.bdL}`,
          padding: "28px 24px",
          textAlign: "center",
          boxShadow: "0 10px 26px rgba(14, 60, 64, 0.08)",
        }}
      >
        <p
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: C.inkD,
            margin: "0 0 8px",
          }}
        >
          Belum ada diary di hari pada bulan {activeMonth}
        </p>

        <p
          style={{
            fontSize: 13,
            color: C.sub,
            lineHeight: 1.7,
            margin: 0,
            fontStyle: "italic",
          }}
        >
          Coba pilih tanggal lain dari kalender atau pindah bulan dari riwayat
          diary.
        </p>
      </div>
    </div>
  );
}

function floatingButtonStyle(): React.CSSProperties {
  return {
    height: 40,
    padding: "0 14px",
    borderRadius: 999,
    border: "none",
    background: "transparent",
    color: C.inkD,
    fontSize: 12,
    fontWeight: 800,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
    flexShrink: 0,
  };
}

function iconButtonStyle(): React.CSSProperties {
  return {
    width: 40,
    height: 40,
    borderRadius: 12,
    border: "none",
    background: "transparent",
    color: C.inkD,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
  };
}
