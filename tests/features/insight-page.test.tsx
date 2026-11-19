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
import { cloneElement, type ReactElement } from "react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock as VitestMock,
} from "vitest";

import InsightPageContent from "@/features/insight/components/InsightPageContent";
import {
  getTodayDateString,
  getUserTimeZone,
} from "@/features/insight/lib/insight-data";

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

vi.mock("sonner", () => ({ toast }));
vi.mock("next/image", () => ({
  default: (props: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt} src={props.src} />
  ),
}));
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    getSession: async () => ({ data: { user: { name: "Cia Sari" } } }),
    signOut: vi.fn(),
  },
}));
vi.mock("recharts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("recharts")>();
  return {
    ...actual,
    // jsdom tidak punya ukuran layout, jadi beri ukuran tetap.
    ResponsiveContainer: ({ children }: { children: ReactElement }) => (
      <div style={{ width: 600, height: 300 }}>
        {cloneElement(children, { width: 600, height: 300 } as never)}
      </div>
    ),
  };
});

const tz = getUserTimeZone();
const today = getTodayDateString(tz);

function shift(base: string, days: number) {
  const d = new Date(`${base}T12:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const yesterday = shift(today, -1);

function insight(label: string, mood = 4) {
  return {
    mood,
    reflection: `Refleksi ${label}`,
    pattern: `Pola ${label}`,
    affirmation: `Pengingat ${label}`,
    actions: [
      { priority: "Low", label: `Aksi ringan ${label}`, desc: "desc ringan" },
      { priority: "High", label: `Aksi tinggi ${label}`, desc: "desc tinggi" },
      {
        priority: "Medium",
        label: `Aksi sedang ${label}`,
        desc: "desc sedang",
      },
    ],
  };
}

type MockState = {
  insights: Record<string, ReturnType<typeof insight>>;
  moods: Array<{ date: string; moodScore: number }>;
  generate: VitestMock<(body: unknown) => void>;
};

function setupFetch(state: MockState) {
  const fetchMock = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const json = (data: unknown, ok = true) => ({
        ok,
        json: async () => data,
      });

      if (url.startsWith("/api/insight/generate")) {
        state.generate(JSON.parse(String(init?.body)));
        state.insights[today] = insight("baru");
        return json({ success: true });
      }
      if (url.startsWith("/api/insight")) return json({ data: state.insights });
      if (url.startsWith("/api/mood")) {
        return json({
          data: state.moods.map((m) => ({
            createdAt: `${m.date}T12:00:00.000Z`,
            moodScore: m.moodScore,
          })),
        });
      }
      return json({}, false);
    },
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <InsightPageContent />
    </QueryClientProvider>,
  );
}

let state: MockState;

beforeEach(() => {
  vi.clearAllMocks();
  state = {
    insights: { [today]: insight("hari ini") },
    moods: [
      { date: shift(today, -2), moodScore: 2 },
      { date: yesterday, moodScore: 3 },
      { date: today, moodScore: 5 },
    ],
    generate: vi.fn(),
  };
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("InsightPageContent: konten", () => {
  it("menampilkan hero, statistik bulan ini, refleksi, dan rekomendasi dari data", async () => {
    setupFetch(state);
    renderPage();

    expect(
      await screen.findByRole("heading", { level: 1, name: /Pahami pola/ }),
    ).toBeTruthy();
    expect(screen.getByText(/Premium aktif/)).toBeTruthy();
    expect(
      screen.getByText("Ada banyak hal kecil yang sudah kamu lewati."),
    ).toBeTruthy();

    // Statistik dihitung dari data mood nyata: terbaik 5, terendah 2, rata-rata 3,3.
    expect(screen.getByText("5/5")).toBeTruthy();
    expect(screen.getByText("2/5")).toBeTruthy();
    expect(screen.getByText("3.3/5")).toBeTruthy();
    expect(screen.getByText("1 hari")).toBeTruthy();
    expect(screen.getByText("Keterangan skor mood")).toBeTruthy();

    // Refleksi, pola, dan pengingat memakai data insight.
    expect(screen.getByText("“Refleksi hari ini”")).toBeTruthy();
    expect(screen.getByText("Pola hari ini")).toBeTruthy();
    expect(screen.getByText("Pengingat hari ini")).toBeTruthy();
    expect(document.querySelector(".ins-score")?.textContent).toBe("4/5");
  });

  it("mengurutkan rekomendasi dari prioritas tertinggi dengan label teks", async () => {
    setupFetch(state);
    renderPage();
    await screen.findByRole("heading", { level: 1 });

    const items = Array.from(document.querySelectorAll(".ins-reco-item"));
    expect(items.map((el) => el.querySelector("strong")?.textContent)).toEqual([
      "Aksi tinggi hari ini",
      "Aksi sedang hari ini",
      "Aksi ringan hari ini",
    ]);
    expect(
      items.map((el) => el.querySelector(".ins-badge")?.textContent),
    ).toEqual(["Prioritas tinggi", "Prioritas sedang", "Prioritas ringan"]);
  });

  it("menampilkan placeholder saat belum ada data mood", async () => {
    state.moods = [];
    state.insights = {};
    setupFetch(state);
    renderPage();

    expect(
      await screen.findByText("Belum ada data mood untuk ditampilkan."),
    ).toBeTruthy();
    expect(screen.getByText(/Insight hari ini belum tersedia/)).toBeTruthy();
  });
});

describe("InsightPageContent: navigasi tanggal", () => {
  it("berpindah ke hari sebelumnya dan kembali", async () => {
    state.insights[yesterday] = insight("kemarin", 3);
    setupFetch(state);
    renderPage();
    await screen.findByText("“Refleksi hari ini”");

    const prev = screen.getByRole("button", { name: "Hari sebelumnya" });
    const next = screen.getByRole("button", { name: "Hari berikutnya" });
    expect((next as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(prev);
    expect(await screen.findByText("“Refleksi kemarin”")).toBeTruthy();
    expect(
      within(document.querySelector(".ins-date") as HTMLElement).getByText(
        "Kemarin",
      ),
    ).toBeTruthy();
    expect((next as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(next);
    expect(await screen.findByText("“Refleksi hari ini”")).toBeTruthy();
  });

  it("menonaktifkan tombol sebelumnya pada tanggal paling awal", async () => {
    state.moods = [{ date: today, moodScore: 3 }];
    setupFetch(state);
    renderPage();
    await screen.findByRole("heading", { level: 1 });

    expect(
      (
        screen.getByRole("button", {
          name: "Hari sebelumnya",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });
});

describe("InsightPageContent: generate insight hari ini", () => {
  beforeEach(() => {
    state.insights = {};
  });

  it("meminta konfirmasi lalu memanggil API generate dan memuat ulang", async () => {
    const fetchMock = setupFetch(state);
    renderPage();

    fireEvent.click(
      await screen.findByRole("button", { name: "Tampilkan Insight" }),
    );
    expect(
      screen.getByRole("dialog", { name: "Tampilkan Insight?" }),
    ).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalledWith(
      "/api/insight/generate",
      expect.anything(),
    );

    fireEvent.click(screen.getByRole("button", { name: "Ya, Tampilkan" }));

    await waitFor(() =>
      expect(state.generate).toHaveBeenCalledWith({
        date: today,
        timezone: tz,
      }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/insight/generate",
      expect.objectContaining({ method: "POST" }),
    );
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "Insight berhasil dihasilkan untuk hari ini!",
      ),
    );

    // Setelah dimuat ulang, insight muncul dan tombol menjadi "Tersedia".
    expect(await screen.findByText("“Refleksi baru”")).toBeTruthy();
    const done = screen.getByRole("button", { name: "Tersedia" });
    expect((done as HTMLButtonElement).disabled).toBe(true);
  });

  it("menutup dialog lewat overlay dan menawarkan kembali ke TemanCerita", async () => {
    setupFetch(state);
    renderPage();

    fireEvent.click(
      await screen.findByRole("button", { name: "Tampilkan Insight" }),
    );
    expect(
      screen
        .getByRole("link", { name: "Masih Mau Cerita" })
        .getAttribute("href"),
    ).toBe("/diary");

    fireEvent.click(document.querySelector(".ins-overlay") as HTMLElement);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(state.generate).not.toHaveBeenCalled();
  });

  it("menampilkan pesan error saat generate gagal", async () => {
    setupFetch(state);
    renderPage();
    const fetchMock = vi.mocked(fetch);
    fireEvent.click(
      await screen.findByRole("button", { name: "Tampilkan Insight" }),
    );

    fetchMock.mockImplementationOnce((async () => ({
      ok: false,
      json: async () => ({ error: "Belum ada cerita hari ini." }),
    })) as never);
    fireEvent.click(screen.getByRole("button", { name: "Ya, Tampilkan" }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Belum ada cerita hari ini."),
    );
  });

  it("tombol sekunder di bawah ringkasan membuka alur yang sama", async () => {
    setupFetch(state);
    renderPage();

    fireEvent.click(
      await screen.findByRole("button", { name: "Tampilkan Insight Hari Ini" }),
    );
    await waitFor(() =>
      expect(state.generate).toHaveBeenCalledWith({
        date: today,
        timezone: tz,
      }),
    );
  });
});

describe("InsightPageContent: kontrol header", () => {
  it("menampilkan penjelasan Insight lewat tombol info", async () => {
    setupFetch(state);
    renderPage();
    await screen.findByRole("heading", { level: 1 });

    expect(screen.queryByText("Tentang Insight")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Info" }));
    expect(screen.getByText("Tentang Insight")).toBeTruthy();
  });

  it("menaruh tombol insight dan info di luar hero, sebelum profil", async () => {
    setupFetch(state);
    renderPage();
    await screen.findByRole("heading", { level: 1 });
    await screen.findByText("Cia Sari");

    const topbar = document.querySelector(".ins-topbar") as HTMLElement;
    const hero = document.querySelector(".ins-hero") as HTMLElement;
    expect(hero.contains(topbar)).toBe(false);
    expect(hero.querySelector(".ins-generate")).toBeNull();

    const order = Array.from(topbar.children).map((el) => el.className);
    expect(order[0]).toContain("ins-actions");
    expect(order[1]).toContain("ins-profile");
  });

  it("membuka menu profil dengan tautan profil dan tombol keluar", async () => {
    setupFetch(state);
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: /Cia Sari/ }));

    expect(
      screen
        .getByRole("menuitem", { name: /Lihat Profil/ })
        .getAttribute("href"),
    ).toBe("/profile");
    expect(screen.getByRole("menuitem", { name: /Keluar/ })).toBeTruthy();
  });
});
