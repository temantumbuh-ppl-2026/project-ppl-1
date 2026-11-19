// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ConversationState,
  DiaryTopic,
  RiskLevel,
} from "@/app/generated/prisma/enums";
import { DiaryRightPage } from "@/features/diary/components/DiaryRightPage";
import { SAFETY_CONTACTS } from "@/features/diary/components/SafetyNotice";

function renderPage(
  conversation: ComponentProps<typeof DiaryRightPage>["conversation"],
  overrides: Partial<ComponentProps<typeof DiaryRightPage>> = {},
) {
  const props: ComponentProps<typeof DiaryRightPage> = {
    entry: {
      id: "today",
      date: "2026-10-14",
      dateLabel: "Rabu, 14 Oktober 2026",
      preview: "",
      mood: 2,
      isToday: true,
    },
    messages: [
      { id: "user-1", role: "user", text: "Aku lelah sekali", time: "10.00" },
      { id: "ai-1", role: "ai", text: "Aku di sini bersamamu.", time: "10.01" },
    ],
    conversation,
    starters: [],
    inputValue: "",
    isAiTyping: false,
    isMessagesLoading: false,
    isReadOnly: false,
    canWriteDiary: true,
    isPremium: false,
    diaryPerMonth: 15,
    onPrevEntry: vi.fn(),
    onNextEntry: vi.fn(),
    onInputChange: vi.fn(),
    onSend: vi.fn(),
    onKeyDown: vi.fn(),
    ...overrides,
  };

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <DiaryRightPage {...props} />
    </QueryClientProvider>,
  );
}

function buildConversation(riskLevel: RiskLevel, withActions = true) {
  return {
    topics: [DiaryTopic.AKADEMIK_SEKOLAH],
    conversationState: ConversationState.ACTION,
    proactiveSuggestion: null,
    actionOptions: withActions ? ["Tarik napas pelan", "Tulis perasaanmu"] : [],
    safetyFlag: riskLevel !== RiskLevel.NONE,
    riskLevel,
  };
}

describe("DiaryRightPage safety guidance", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      }),
    );
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn(() => 1),
    );
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("menampilkan arahan keselamatan dengan kontak bantuan saat risiko HIGH", () => {
    renderPage(buildConversation(RiskLevel.HIGH));

    expect(
      screen.getByRole("region", { name: "Kamu tidak sendirian" }),
    ).toBeTruthy();

    for (const contact of SAFETY_CONTACTS) {
      const link = screen.getByRole("link", {
        name: new RegExp(contact.label.replace(/[()]/g, "\\$&")),
      });
      expect(link.getAttribute("href")).toBe(contact.href);
    }
  });

  it("tidak menampilkan saran tindakan saat risiko HIGH", () => {
    renderPage(buildConversation(RiskLevel.HIGH));

    expect(screen.queryByLabelText("Pilihan tindakan")).toBeNull();
    expect(screen.queryByText("Tarik napas pelan")).toBeNull();
  });

  it("tetap membiarkan pengguna menulis saat risiko HIGH", () => {
    renderPage(buildConversation(RiskLevel.HIGH));

    expect(
      screen
        .getByPlaceholderText("Tulis ceritamu di sini...")
        .hasAttribute("disabled"),
    ).toBe(false);
  });

  it("tidak menampilkan arahan keselamatan saat risiko NONE atau ATTENTION", () => {
    renderPage(buildConversation(RiskLevel.NONE));
    expect(screen.queryByText("Kamu tidak sendirian")).toBeNull();
    expect(screen.getByLabelText("Pilihan tindakan")).toBeTruthy();
    cleanup();

    renderPage(buildConversation(RiskLevel.ATTENTION));
    expect(screen.queryByText("Kamu tidak sendirian")).toBeNull();
  });

  it("tidak menampilkan arahan keselamatan tanpa percakapan", () => {
    renderPage(null, { messages: [] });

    expect(screen.queryByText("Kamu tidak sendirian")).toBeNull();
  });
});
