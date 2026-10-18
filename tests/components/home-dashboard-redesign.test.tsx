// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HomeDashboardContent } from "@/features/home/components/HomeDashboardContent";

const loadQuiz = vi.fn();
const sessionUser = {
  id: "user-1",
  name: "Cia",
  email: "cia@example.com",
  currentStreak: 2,
  isPremium: false,
  parentEmail: null,
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));
vi.mock("next/image", () => ({
  default: (props: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt} src={props.src} />
  ),
}));
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    getSession: async () => ({ data: { user: sessionUser } }),
    signOut: vi.fn(),
  },
}));
vi.mock("@/features/diary/hooks/useBraveChoice", () => ({
  useBraveChoice: () => ({
    loadQuiz,
    closeModal: vi.fn(),
    planCfg: { quizPerDay: 3 },
    isLoading: false,
    showModal: false,
    quizRemaining: 3,
  }),
}));
vi.mock("@/features/diary/components/BraveChoiceModal", () => ({
  BraveChoiceModal: () => null,
}));

// 12:00 WIB pada tanggal lokal tertentu.
function moodLog(id: string, y: number, m: number, d: number, score: number) {
  return {
    id,
    moodScore: score,
    note: `Catatan ${id}`,
    createdAt: new Date(Date.UTC(y, m, d, 5)).toISOString(),
  };
}

const LOGS = [
  moodLog("today", 2026, 9, 18, 4),
  moodLog("lastweek", 2026, 9, 14, 2),
  moodLog("newyear", 2026, 0, 1, 5),
  moodLog("oldyear", 2025, 2, 12, 1),
];

type FetchPlan = { moodStatus?: number; logs?: unknown[] };

function stubFetch(plan: FetchPlan = {}) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    const json = (body: unknown, status = 200) => ({
      ok: status < 400,
      status,
      json: async () => body,
    });
    if (url.startsWith("/api/mood/streak")) return json({ success: true });
    if (url.startsWith("/api/mood"))
      return plan.moodStatus
        ? json({ error: "x" }, plan.moodStatus)
        : json({ success: true, data: plan.logs ?? LOGS });
    if (url.startsWith("/api/diary/count")) return json({ data: { count: 3 } });
    if (url.startsWith("/api/baseline"))
      return json({ success: true, baseline: null });
    if (url.startsWith("/api/parent/status"))
      return json({
        email: null,
        status: null,
        expiresAt: null,
        reason: null,
        lastSentAt: null,
        lastReportType: null,
        lastReportStatus: null,
      });
    if (url.startsWith("/api/diary/brave-choice/stats"))
      return json({ data: { pct: 0, correct: 0, total: 0 } });
    return json({}, 404);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function renderDashboard() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return render(<HomeDashboardContent />, { wrapper });
}

async function waitForDashboard() {
  await screen.findByRole("heading", { name: /selamat datang kembali/i });
}

function dayButton(name: RegExp) {
  return screen.getByRole("button", { name });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 9, 18, 10, 0, 0)); // Minggu, 18 Okt 2026
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  loadQuiz.mockReset();
});

describe("Dashboard redesign — riwayat mood", () => {
  it("menandai hari ini, hari mendatang, dan detail catatan", async () => {
    stubFetch();
    renderDashboard();
    await waitForDashboard();

    expect(screen.getByText("18–24 Oktober 2026")).toBeTruthy();

    const todayBtn = dayButton(/Minggu, 18 Oktober 2026: Senang \(hari ini\)/);
    expect(todayBtn.className).toContain("today");
    expect(todayBtn.className).toContain("recorded");
    expect(todayBtn.getAttribute("aria-pressed")).toBe("true");

    const future = dayButton(/Senin, 19 Oktober 2026: Belum tiba/);
    expect((future as HTMLButtonElement).disabled).toBe(true);
    expect(future.className).toContain("future");

    expect(screen.getByText(/Catatan: “Catatan today”/)).toBeTruthy();
    // Minggu ini: tombol berikutnya nonaktif, tidak ada "kembali ke hari ini".
    expect(
      (
        screen.getByRole("button", {
          name: "Minggu berikutnya",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(screen.queryByRole("button", { name: /kembali ke hari ini/i })).toBe(
      null,
    );
  });

  it("navigasi minggu sebelumnya/berikutnya menyinkronkan rentang, pilihan, dan data", async () => {
    stubFetch();
    renderDashboard();
    await waitForDashboard();

    fireEvent.click(screen.getByRole("button", { name: "Minggu sebelumnya" }));
    expect(screen.getByText("11–17 Oktober 2026")).toBeTruthy();
    const selected = dayButton(/Minggu, 11 Oktober 2026: Belum dicatat/);
    expect(selected.getAttribute("aria-pressed")).toBe("true");
    expect(selected.className).toContain("empty");
    expect(screen.getByText(/Tidak ada check-in mood/)).toBeTruthy();

    const sedih = dayButton(/Rabu, 14 Oktober 2026: Sedih/);
    fireEvent.click(sedih);
    expect(sedih.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText(/Catatan: “Catatan lastweek”/)).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", { name: /kembali ke hari ini/i }),
    );
    expect(screen.getByText("18–24 Oktober 2026")).toBeTruthy();
  });

  it("melewati batas bulan dan tahun dengan tombol periode", async () => {
    stubFetch();
    renderDashboard();
    await waitForDashboard();

    const prev = screen.getByRole("button", { name: "Minggu sebelumnya" });
    for (let i = 0; i < 3; i++) fireEvent.click(prev);
    // 18 Okt − 21 hari = 27 Sep → minggu 27 Sep – 3 Okt.
    expect(screen.getByText("27 Sep – 3 Okt 2026")).toBeTruthy();
  });

  it("datepicker dapat memilih tanggal di bulan dan tahun lain", async () => {
    stubFetch();
    renderDashboard();
    await waitForDashboard();

    fireEvent.click(
      screen.getByRole("button", { name: /pilih tanggal riwayat mood/i }),
    );
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Pilih tahun"), {
      target: { value: "2025" },
    });
    fireEvent.change(within(dialog).getByLabelText("Pilih bulan"), {
      target: { value: "2" },
    }); // Maret
    fireEvent.click(
      within(dialog).getByRole("button", { name: /12 Maret 2025/i }),
    );

    await waitFor(() =>
      expect(screen.getByText("9–15 Maret 2025")).toBeTruthy(),
    );
    const picked = dayButton(/Rabu, 12 Maret 2025: Sangat Sedih/);
    expect(picked.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText(/Catatan: “Catatan oldyear”/)).toBeTruthy();
    expect(
      screen.getByRole("button", {
        name: /pilih tanggal riwayat mood, saat ini Maret 2025/i,
      }),
    ).toBeTruthy();
  });

  it("minggu yang melintasi tahun menampilkan data dari kedua tahun", async () => {
    stubFetch();
    renderDashboard();
    await waitForDashboard();

    fireEvent.click(
      screen.getByRole("button", { name: /pilih tanggal riwayat mood/i }),
    );
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Pilih tahun"), {
      target: { value: "2025" },
    });
    fireEvent.change(within(dialog).getByLabelText("Pilih bulan"), {
      target: { value: "11" },
    }); // Desember
    fireEvent.click(
      within(dialog).getByRole("button", { name: /30 Desember 2025/i }),
    );

    await waitFor(() =>
      expect(screen.getByText("28 Des 2025 – 3 Jan 2026")).toBeTruthy(),
    );
    expect(dayButton(/Kamis, 1 Januari 2026: Sangat Senang/)).toBeTruthy();
  });

  it("menampilkan state gagal dimuat tanpa menganggap hari kosong", async () => {
    stubFetch({ moodStatus: 500 });
    renderDashboard();
    await waitForDashboard();

    expect(await screen.findByText(/Riwayat mood gagal dimuat/)).toBeTruthy();
    expect(screen.queryByText("Belum dicatat")).toBe(null);
    expect(screen.getByRole("button", { name: /coba lagi/i })).toBeTruthy();
  });
});

describe("Dashboard redesign — kartu & CTA", () => {
  it("menghubungkan CTA ke route dan flow existing untuk pengguna gratis", async () => {
    stubFetch();
    renderDashboard();
    await waitForDashboard();

    expect(
      screen
        .getByRole("link", { name: /mulai bercerita/i })
        .getAttribute("href"),
    ).toBe("/diary");
    expect(
      screen
        .getByRole("link", { name: /buka dengan premium/i })
        .getAttribute("href"),
    ).toBe("/subscription");
    expect(
      screen
        .getByRole("link", { name: /mulai refleksi/i })
        .getAttribute("href"),
    ).toBe("/baseline");
    // Kartu laporan orang tua tidak lagi tampil di dashboard.
    expect(screen.queryByText("Laporan Orang Tua")).toBe(null);
    expect(screen.queryByText(/tulis diary/i)).toBe(null);
    expect(screen.getByText("TemanCerita")).toBeTruthy();

    expect(screen.getByText("Belum ada aktivitas")).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: /mulai brave choice/i }),
    );
    expect(loadQuiz).toHaveBeenCalledTimes(1);

    // Ringkasan aktivitas memakai streak sesi & total diary dari API.
    expect(screen.getByText("Streak check-in mood")).toBeTruthy();
    expect(screen.getByText("1 hari tercatat")).toBeTruthy();
  });

  it("dropdown profil berisi profil, langganan, dan logout dengan konfirmasi", async () => {
    stubFetch();
    renderDashboard();
    await waitForDashboard();

    fireEvent.click(screen.getByRole("button", { name: /menu profil cia/i }));
    const menu = screen.getByRole("menu");
    expect(
      within(menu)
        .getByRole("menuitem", { name: /lihat profil/i })
        .getAttribute("href"),
    ).toBe("/profile");
    expect(
      within(menu)
        .getByRole("menuitem", { name: /kelola langganan/i })
        .getAttribute("href"),
    ).toBe("/subscription");

    fireEvent.click(within(menu).getByRole("menuitem", { name: /keluar/i }));
    expect(await screen.findByText("Keluar dari akun?")).toBeTruthy();
  });
});
