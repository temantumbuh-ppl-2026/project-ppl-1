// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DiaryPageClient } from "@/features/diary/components/DiaryPageClient";
import type { ChatMessage, DiaryEntry } from "@/features/diary/types";

const services = vi.hoisted(() => ({
  getDiaryEntries: vi.fn(),
  getDiaryMessages: vi.fn(),
  getDiaryConversationStarters: vi.fn(),
  sendChatMessageStream: vi.fn(),
  getBraveChoiceStatus: vi.fn(),
  getBraveChoiceQuiz: vi.fn(),
  submitQuizAnswer: vi.fn(),
  resetBraveChoiceProgress: vi.fn(),
}));

vi.mock("@/features/diary/services/diaryServices", () => services);
vi.mock("@/features/diary/components/DiaryBookIntro/DiaryBookIntro", () => ({
  DiaryBookIntro: () => null,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));
vi.mock("next/image", () => ({
  default: (props: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt} src={props.src} />
  ),
}));

const TODAY: DiaryEntry = {
  id: "e-today",
  date: "2026-10-14",
  dateLabel: "Rabu, 14 Oktober 2026",
  preview: "Halo, aku siap cerita",
  mood: 4,
  isToday: true,
};
const PAST: DiaryEntry = {
  id: "e-13",
  date: "2026-10-13",
  dateLabel: "Selasa, 13 Oktober 2026",
  preview: "Cerita lama tentang sekolah",
  mood: 2,
  isToday: false,
};

const greeting: ChatMessage = {
  id: "m1",
  role: "ai",
  text: "Hai, mau cerita apa hari ini?",
  time: "08.00",
};

function renderPage(
  opts: { entryId?: string; plan?: "free" | "premium" } = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <DiaryPageClient
        entryId={opts.entryId ?? "e-today"}
        initialUserMeta={{
          id: "u1",
          name: "Cia",
          plan: opts.plan ?? "premium",
          streakDays: 3,
        }}
      />
    </QueryClientProvider>,
  );
}

function setupServices(
  overrides: {
    entries?: DiaryEntry[];
    used?: number;
    starters?: { id: string; label: string; messageText: string }[];
  } = {},
) {
  services.getDiaryEntries.mockImplementation(async (month: string) => ({
    entries: month === "2026-10" ? (overrides.entries ?? [TODAY, PAST]) : [],
    diarySessionsUsedThisMonth: overrides.used ?? 2,
  }));
  services.getDiaryMessages.mockImplementation(async (id: string) => ({
    messages:
      id === "e-13"
        ? [
            { id: "p1", role: "user", text: "Cerita lama", time: "19.00" },
            {
              id: "p2",
              role: "ai",
              text: "Terima kasih sudah cerita.",
              time: "19.01",
            },
          ]
        : id === "today"
          ? []
          : [greeting],
    conversation: null,
  }));
  services.getDiaryConversationStarters.mockResolvedValue(
    overrides.starters ?? [],
  );
  services.getBraveChoiceStatus.mockResolvedValue({
    quizUsedToday: 0,
    isQuotaReached: false,
    hasAvailableQuestion: true,
  });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 9, 14, 10, 0, 0));
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    })),
  );
  window.history.replaceState({}, "", "/diary/e-today");
  Object.values(services).forEach((fn) => fn.mockReset());
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

async function waitForPage() {
  return screen.findByRole("heading", { level: 1, name: TODAY.dateLabel });
}

describe("Diary redesign — muat & navigasi", () => {
  it("memuat entri bulan ini, percakapan terpilih, dan streak", async () => {
    setupServices();
    renderPage();
    await waitForPage();

    expect(services.getDiaryEntries).toHaveBeenCalledWith("2026-10");
    expect(screen.getByRole("heading", { name: "Riwayat Diary" })).toBeTruthy();
    expect(
      await screen.findByText("Hai, mau cerita apa hari ini?"),
    ).toBeTruthy();
    expect(screen.getByText("Streak 3 hari")).toBeTruthy();

    const todayCard = screen.getByRole("button", {
      name: /Rabu, 14 Oktober 2026/,
    });
    expect(todayCard.getAttribute("aria-current")).toBe("true");
    expect(
      screen.getByRole("button", { name: /Selasa, 13 Oktober 2026/ }),
    ).toBeTruthy();
  });

  it("memilih entri lama menampilkan isinya sebagai read-only", async () => {
    setupServices();
    renderPage();
    await waitForPage();

    fireEvent.click(
      screen.getByRole("button", { name: /Selasa, 13 Oktober 2026/ }),
    );

    await screen.findByRole("heading", { level: 1, name: PAST.dateLabel });
    expect(await screen.findByText("Cerita lama")).toBeTruthy();
    expect(services.getDiaryMessages).toHaveBeenCalledWith("e-13");
    expect(screen.getByText(/entri lampau hanya bisa dibaca/i)).toBeTruthy();
    expect(
      screen.queryByRole("textbox", { name: "Tulis ceritamu" }),
    ).toBeNull();
    expect(screen.getByText(/Entri lampau tidak bisa diedit/)).toBeTruthy();
  });

  it("tombol entri sebelumnya/berikutnya berpindah dan dinonaktifkan di ujung", async () => {
    setupServices();
    renderPage();
    await waitForPage();

    const prev = screen.getByRole("button", { name: "Entry sebelumnya" });
    const next = screen.getByRole("button", { name: "Entry berikutnya" });
    expect((next as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(prev);
    await screen.findByRole("heading", { level: 1, name: PAST.dateLabel });
    expect(
      (
        screen.getByRole("button", {
          name: "Entry sebelumnya",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(
      (
        screen.getByRole("button", {
          name: "Entry berikutnya",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false);
  });

  it("navigasi bulan memuat bulan lain dan menampilkan state kosong yang benar", async () => {
    setupServices();
    renderPage();
    await waitForPage();

    fireEvent.click(screen.getByRole("button", { name: "Bulan sebelumnya" }));

    await waitFor(() =>
      expect(services.getDiaryEntries).toHaveBeenCalledWith("2026-09"),
    );
    expect(
      await screen.findByText(
        "Belum ada diary di hari pada bulan September 2026",
      ),
    ).toBeTruthy();
    expect(screen.getByText("Belum ada entri diary")).toBeTruthy();
  });
});

describe("Diary redesign — menulis", () => {
  it("mengirim pesan lewat tombol dan menampilkan balasan, input dikosongkan", async () => {
    setupServices();
    services.sendChatMessageStream.mockResolvedValue({
      aiMessage: {
        id: "m3",
        role: "ai",
        text: "Aku mendengarkan.",
        time: "10.01",
      },
      entry: TODAY,
      diarySessionsUsedThisMonth: 3,
    });
    renderPage();
    await waitForPage();
    await screen.findByText("Hai, mau cerita apa hari ini?");

    const box = screen.getByRole("textbox", { name: "Tulis ceritamu" });
    const send = screen.getByRole("button", { name: "Kirim pesan" });
    expect((send as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(box, { target: { value: "Hari ini cukup panjang." } });
    expect((send as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(send);

    expect(await screen.findByText("Aku mendengarkan.")).toBeTruthy();
    expect(services.sendChatMessageStream).toHaveBeenCalledWith(
      "e-today",
      "Hari ini cukup panjang.",
      expect.anything(),
    );
    expect(screen.getByText("Hari ini cukup panjang.")).toBeTruthy();
    expect((box as HTMLTextAreaElement).value).toBe("");
  });

  it("Enter mengirim, Shift+Enter tidak", async () => {
    setupServices();
    services.sendChatMessageStream.mockResolvedValue({
      aiMessage: { id: "m4", role: "ai", text: "Balasan.", time: "10.02" },
      entry: TODAY,
      diarySessionsUsedThisMonth: 3,
    });
    renderPage();
    await waitForPage();
    await screen.findByText("Hai, mau cerita apa hari ini?");

    const box = screen.getByRole("textbox", { name: "Tulis ceritamu" });
    fireEvent.change(box, { target: { value: "Satu baris" } });
    fireEvent.keyDown(box, { key: "Enter", shiftKey: true });
    expect(services.sendChatMessageStream).not.toHaveBeenCalled();

    fireEvent.keyDown(box, { key: "Enter" });
    await waitFor(() =>
      expect(services.sendChatMessageStream).toHaveBeenCalledTimes(1),
    );
  });

  it("gagal mengirim: menampilkan pesan error dan memulihkan isian", async () => {
    setupServices();
    services.sendChatMessageStream.mockRejectedValue(
      new Error("Jaringan putus"),
    );
    renderPage();
    await waitForPage();
    await screen.findByText("Hai, mau cerita apa hari ini?");

    const box = screen.getByRole("textbox", { name: "Tulis ceritamu" });
    fireEvent.change(box, { target: { value: "Cerita yang harus selamat" } });
    fireEvent.click(screen.getByRole("button", { name: "Kirim pesan" }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Jaringan putus");
    await waitFor(() =>
      expect((box as HTMLTextAreaElement).value).toBe(
        "Cerita yang harus selamat",
      ),
    );
  });

  it("entri hari ini yang kosong menampilkan hero dengan starter dari API", async () => {
    setupServices({
      entries: [{ ...TODAY, id: "today", preview: "" }],
      starters: [
        { id: "s1", label: "Soal sekolah", messageText: "Ada hal di sekolah." },
      ],
    });
    renderPage({ entryId: "today" });
    await screen.findByRole("heading", {
      level: 2,
      name: "Mau cerita tentang apa hari ini?",
    });

    fireEvent.click(screen.getByRole("button", { name: "Soal sekolah" }));
    expect(
      (
        screen.getByRole("textbox", {
          name: "Tulis ceritamu",
        }) as HTMLTextAreaElement
      ).value,
    ).toBe("Ada hal di sekolah.");
    expect(services.sendChatMessageStream).not.toHaveBeenCalled();
  });

  it("paket gratis yang melewati batas sesi: input terkunci dan ada tautan upgrade", async () => {
    setupServices({
      entries: [{ ...TODAY, id: "today", preview: "" }],
      used: 15,
    });
    renderPage({ entryId: "today", plan: "free" });
    await screen.findByText(/Batas 15 sesi diary bulan ini tercapai/);

    expect(
      screen.queryByRole("textbox", { name: "Tulis ceritamu" }),
    ).toBeNull();
    expect(
      screen.getByText(/Batas sesi bulan ini tercapai. Upgrade ke Premium/),
    ).toBeTruthy();
    const upgrade = screen.getByRole("link", { name: "Upgrade →" });
    expect(upgrade.getAttribute("href")).toBe("/subscription");
  });
});

describe("Diary redesign — sidebar", () => {
  it("menampilkan kuota Brave Choice untuk paket gratis dan membuka modal", async () => {
    setupServices();
    services.getBraveChoiceQuiz.mockResolvedValue({
      quiz: null,
      quizUsedToday: 0,
      isQuotaReached: false,
    });
    renderPage({ plan: "free" });
    await waitForPage();

    const sidebar = screen.getByRole("complementary", {
      name: "Riwayat diary",
    });
    const brave = await within(sidebar).findByRole("button", {
      name: /Brave Choice/,
    });
    expect(brave.textContent).toContain("Sisa 5");
    expect(brave.getAttribute("aria-disabled")).toBe("false");

    fireEvent.click(brave);
    await waitFor(() => expect(services.getBraveChoiceQuiz).toHaveBeenCalled());
    expect(
      await screen.findByRole("dialog", { name: "Brave Choice" }),
    ).toBeTruthy();
  });

  it("tombol Hari Ini dan penutup drawer tersedia", async () => {
    setupServices();
    renderPage();
    await waitForPage();

    expect(screen.getByRole("button", { name: "Hari Ini" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Ciutkan riwayat diary" }),
    ).toBeTruthy();
    expect(
      screen.getAllByRole("button", { name: "Tutup riwayat diary" }).length,
    ).toBeGreaterThan(0);
  });
});
