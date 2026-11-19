// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import SubscriptionClient from "@/app/(main)/subscription/SubscriptionClient";
import { getDurationPricing } from "@/lib/subscription/plans";

const router = { push: vi.fn(), replace: vi.fn(), refresh: vi.fn() };
let search = "";

vi.mock("next/navigation", () => ({
  useRouter: () => router,
  useSearchParams: () => new URLSearchParams(search),
}));
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
vi.mock("@/components/payment/SnapPayButton", () => ({
  default: (props: {
    durationMonths: number;
    pendingToken?: string;
    label?: string;
    className?: string;
  }) => (
    <button
      type="button"
      data-testid="snap"
      data-duration={props.durationMonths}
      data-pending-token={props.pendingToken ?? ""}
      className={props.className}
    >
      {props.label}
    </button>
  ),
}));

const DAY = 86_400_000;

function renderPage(
  overrides: Partial<React.ComponentProps<typeof SubscriptionClient>> = {},
) {
  return render(
    <SubscriptionClient
      isPremium={false}
      subscription={null}
      pendingPayment={null}
      midtransClientKey="key"
      midtransIsProduction={false}
      {...overrides}
    />,
  );
}

const pending = {
  id: "pay-1",
  orderId: "TT-1",
  token: "snap-pending",
  durationMonths: 3,
  grossAmount: "159000",
  status: "pending",
  createdAt: "2026-11-19T00:00:00.000Z",
};

beforeEach(() => {
  search = "";
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("SubscriptionClient: pengguna Basic", () => {
  it("menampilkan paket Basic dan ajakan upgrade", () => {
    renderPage();

    expect(
      screen.getByRole("heading", { level: 2, name: "Basic" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { level: 2, name: "Upgrade ke Premium" }),
    ).toBeTruthy();
    expect(screen.getByText("Mood check-in")).toBeTruthy();
    expect(screen.getByText("Insight lengkap")).toBeTruthy();
    expect(screen.queryByRole("progressbar")).toBeNull();
  });

  it("menampilkan harga tiap durasi dengan hemat yang dihitung otomatis", () => {
    renderPage();

    const group = screen.getByRole("group", { name: "Pilih Durasi" });
    const buttons = within(group).getAllByRole("button");
    expect(buttons).toHaveLength(4);

    for (const [index, months] of [1, 3, 6, 12].entries()) {
      const pricing = getDurationPricing(months);
      const text = buttons[index].textContent ?? "";
      expect(text).toContain(`${months} Bulan`);
      expect(text.replace(/\s/g, "")).toContain(
        `Rp${pricing.price.toLocaleString("id-ID")}`,
      );
      if (pricing.savings > 0) {
        expect(text.replace(/\s/g, "")).toContain(
          `HemathRp${pricing.savings.toLocaleString("id-ID")}`.replace(
            "Hemath",
            "Hemat",
          ),
        );
      } else {
        expect(text).not.toContain("Hemat");
      }
    }
  });

  it("memperbarui total dan tombol bayar saat durasi dipilih", () => {
    renderPage();

    expect(screen.getByTestId("snap").textContent).toBe(
      "Upgrade Premium 1 Bulan",
    );
    expect(screen.getByTestId("snap").getAttribute("data-duration")).toBe("1");

    const durationGroup = () =>
      within(screen.getByRole("group", { name: "Pilih Durasi" }));
    fireEvent.click(durationGroup().getByRole("button", { name: /^12 Bulan/ }));

    const pricing = getDurationPricing(12);
    const total = document.querySelector(".sub-total");
    expect(total?.textContent).toContain(
      `Rp ${pricing.price.toLocaleString("id-ID")}`,
    );
    expect(total?.textContent).toContain(
      `Rp ${pricing.normalPrice.toLocaleString("id-ID")}`,
    );
    expect(total?.textContent).toContain(
      `Hemat Rp ${pricing.savings.toLocaleString("id-ID")}`,
    );
    expect(screen.getByTestId("snap").textContent).toBe(
      "Upgrade Premium 12 Bulan",
    );
    expect(screen.getByTestId("snap").getAttribute("data-duration")).toBe("12");
    expect(
      durationGroup()
        .getByRole("button", { name: /^12 Bulan/ })
        .getAttribute("aria-pressed"),
    ).toBe("true");
  });
});

describe("SubscriptionClient: pengguna Premium", () => {
  it("menampilkan masa aktif, sisa hari, dan tombol perpanjang", async () => {
    renderPage({
      isPremium: true,
      subscription: {
        startedAt: new Date(Date.now() - 6 * DAY).toISOString(),
        expiresAt: new Date(Date.now() + 24 * DAY).toISOString(),
        isActive: true,
      },
    });

    expect(screen.getByText(/Aktif hingga:/)).toBeTruthy();
    expect(
      await screen.findByRole("progressbar", { name: "Masa aktif terpakai" }),
    ).toBeTruthy();
    expect(screen.getByText(/hari tersisa/)).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: /Lihat insight-mu/ })
        .getAttribute("href"),
    ).toBe("/insight");
    expect(screen.getByTestId("snap").textContent).toBe("Perpanjang 1 Bulan");
  });
});

describe("SubscriptionClient: pembayaran tertunda dan status", () => {
  it("mengunci pilihan durasi dan memakai nominal tagihan yang tertunda", () => {
    renderPage({ pendingPayment: pending });

    expect(screen.getByText(/masih\s+tertunda/)).toBeTruthy();
    for (const button of within(
      screen.getByRole("group", { name: "Pilih Durasi" }),
    ).getAllByRole("button")) {
      expect((button as HTMLButtonElement).disabled).toBe(true);
    }

    const snap = screen.getByTestId("snap");
    expect(snap.textContent).toBe("Lanjutkan Pembayaran Tertunda");
    expect(snap.getAttribute("data-pending-token")).toBe("snap-pending");
    expect(snap.getAttribute("data-duration")).toBe("3");
    expect(document.querySelector(".sub-total")?.textContent).toContain(
      "Rp 159.000",
    );
  });

  it("membatalkan pembayaran tertunda lewat API lalu menyegarkan halaman", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    vi.stubGlobal("fetch", fetchMock);
    renderPage({ pendingPayment: pending });

    fireEvent.click(
      screen.getByRole("button", { name: "Batalkan Pembayaran" }),
    );

    await waitFor(() => expect(router.refresh).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith("/api/payment/cancel", {
      method: "POST",
    });
    expect(router.push).toHaveBeenCalledWith("/subscription");
  });

  it("menampilkan pesan error saat pembatalan gagal", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Tidak bisa dibatalkan." }),
      }),
    );
    renderPage({ pendingPayment: pending });

    fireEvent.click(
      screen.getByRole("button", { name: "Batalkan Pembayaran" }),
    );

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Tidak bisa dibatalkan.",
    );
    expect(router.refresh).not.toHaveBeenCalled();
  });

  it("menampilkan pesan berhasil lalu kembali ke /subscription", () => {
    vi.useFakeTimers();
    search = "status=success";
    renderPage({ isPremium: true });

    expect(screen.getByText(/Pembayaran berhasil/)).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(2500);
    });
    expect(router.replace).toHaveBeenCalledWith("/subscription");
    expect(router.refresh).toHaveBeenCalled();
  });

  it("menampilkan pesan pembayaran sedang diproses", () => {
    search = "status=pending";
    renderPage();

    expect(screen.getByText(/Pembayaran sedang diproses/)).toBeTruthy();
  });
});
