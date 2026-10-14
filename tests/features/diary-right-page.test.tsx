// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DiaryRightPage } from "@/features/diary/components/DiaryRightPage";

const starter = {
  id: "sekolah",
  label: "Soal sekolah",
  messageText: "Ada hal di sekolah yang ingin kuceritakan.",
};

function renderPage(
  overrides: Partial<ComponentProps<typeof DiaryRightPage>> = {},
) {
  const onInputChange = vi.fn();
  const props: ComponentProps<typeof DiaryRightPage> = {
    entry: {
      id: "today",
      date: "2026-10-14",
      dateLabel: "Rabu, 14 Oktober 2026",
      preview: "",
      mood: 3,
      isToday: true,
    },
    messages: [],
    starters: [starter],
    inputValue: "",
    isAiTyping: false,
    isMessagesLoading: false,
    isReadOnly: false,
    canWriteDiary: true,
    isPremium: false,
    diaryPerMonth: 15,
    onPrevEntry: vi.fn(),
    onNextEntry: vi.fn(),
    onInputChange,
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

  return { onInputChange };
}

describe("DiaryRightPage story starters", () => {
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

  it("mengisi input dari starter agar bisa diedit sebelum dikirim", () => {
    const { onInputChange } = renderPage();

    fireEvent.click(screen.getByRole("button", { name: starter.label }));

    expect(onInputChange).toHaveBeenCalledWith(starter.messageText);
    expect(document.activeElement).toBe(
      screen.getByPlaceholderText("Tulis ceritamu di sini..."),
    );
  });

  it("menyembunyikan starter setelah pengguna mulai bercerita", () => {
    renderPage({
      messages: [{ id: "user-1", role: "user", text: "Halo", time: "10.00" }],
    });

    expect(screen.queryByRole("button", { name: starter.label })).toBeNull();
  });

  it("tidak menawarkan starter untuk entri lama", () => {
    renderPage({
      entry: {
        id: "old-entry",
        date: "2026-10-13",
        dateLabel: "Selasa, 13 Oktober 2026",
        preview: "",
        mood: 3,
        isToday: false,
      },
      isReadOnly: true,
    });

    expect(screen.queryByRole("button", { name: starter.label })).toBeNull();
  });
});
