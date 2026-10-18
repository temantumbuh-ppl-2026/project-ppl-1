// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PlanActions } from "@/components/landing/pricing/pricing-actions";
import {
  basicPlan,
  pricingFaqs,
  singlePlan,
} from "@/components/landing/pricing/pricing-data";
import { PricingFaqList } from "@/components/landing/pricing/pricing-faq";
import {
  ALLOWED_DURATIONS,
  FREE_DIARY_LIMIT_PER_MONTH,
  FREE_QUIZ_LIMIT_PER_DAY,
  PRICE_PER_MONTH,
} from "@/lib/subscription/plans";

function mockStatus(status: number, body: unknown = {}) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      status,
      ok: status >= 200 && status < 300,
      json: async () => body,
    }),
  );
}

beforeEach(() => {
  mockStatus(401);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("pricing content comes from the shared subscription rules", () => {
  it("derives price, durations and free limits from plans.ts", () => {
    expect(PRICE_PER_MONTH).toBe(59000);
    expect(ALLOWED_DURATIONS).toEqual([1, 3, 6, 12]);
    expect(singlePlan.price).toBe("Rp59.000");
    expect(singlePlan.period).toContain("1, 3, 6, atau 12 bulan");
    expect(basicPlan.features[0]).toContain(`${FREE_DIARY_LIMIT_PER_MONTH}`);
    expect(basicPlan.features.join(" ")).toContain(
      `${FREE_QUIZ_LIMIT_PER_DAY} soal per hari`,
    );
  });

  it("keeps all four existing FAQ questions", () => {
    expect(pricingFaqs.map((faq) => faq.question)).toEqual([
      "Bagaimana sistem pembayarannya?",
      "Apakah isi diary saya aman dan privat?",
      "Bisakah saya upgrade atau downgrade kapan saja?",
      "Metode pembayaran apa yang tersedia?",
    ]);
  });
});

describe("plan actions follow the user's subscription status", () => {
  it("offers safe default destinations before the status is known", () => {
    mockStatus(500);
    render(<PlanActions plan="single" />);
    expect(
      screen.getByRole("link", { name: /Pilih Paket Single/ }),
    ).toHaveProperty("pathname", "/subscription");
  });

  it("sends guests to register and offers login", async () => {
    render(<PlanActions plan="single" />);
    const link = await screen.findByRole("link", {
      name: /Pilih Paket Single/,
    });
    await waitFor(() =>
      expect((link as HTMLAnchorElement).pathname).toBe("/register"),
    );
    expect(screen.getByRole("link", { name: "Masuk" })).toHaveProperty(
      "pathname",
      "/login",
    );
  });

  it("sends free users to the existing checkout page", async () => {
    mockStatus(200, {
      isPremium: false,
      subscription: null,
      pendingPayment: null,
    });
    render(<PlanActions plan="single" />);
    const link = await screen.findByRole("link", { name: /Upgrade ke Single/ });
    expect((link as HTMLAnchorElement).pathname).toBe("/subscription");
  });

  it("marks the free plan as current for logged-in users", async () => {
    mockStatus(200, {
      isPremium: false,
      subscription: null,
      pendingPayment: null,
    });
    render(<PlanActions plan="basic" />);
    const current = await screen.findByText("Paket kamu saat ini");
    expect(current.getAttribute("aria-disabled")).toBe("true");
  });

  it("shows renewal and the expiry date for active subscribers", async () => {
    mockStatus(200, {
      isPremium: true,
      subscription: { expiresAt: "2030-01-15T00:00:00.000Z" },
      pendingPayment: null,
    });
    render(<PlanActions plan="single" />);
    expect(
      await screen.findByRole("link", { name: /Perpanjang Langganan/ }),
    ).toBeTruthy();
    expect(screen.getByText(/Paket Single aktif hingga/)).toBeTruthy();
  });

  it("lets users resume an unfinished payment", async () => {
    mockStatus(200, {
      isPremium: false,
      subscription: null,
      pendingPayment: { durationMonths: 3 },
    });
    render(<PlanActions plan="single" />);
    expect(
      await screen.findByRole("link", { name: /Lanjutkan Pembayaran/ }),
    ).toBeTruthy();
    expect(
      screen.getByText("Ada pembayaran 3 bulan yang belum selesai"),
    ).toBeTruthy();
  });
});

describe("FAQ accordion", () => {
  it("opens one answer at a time and works with the keyboard-accessible button", () => {
    render(<PricingFaqList faqs={pricingFaqs} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons[0].getAttribute("aria-expanded")).toBe("true");
    expect(buttons[1].getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(buttons[1]);
    expect(buttons[0].getAttribute("aria-expanded")).toBe("false");
    expect(buttons[1].getAttribute("aria-expanded")).toBe("true");

    fireEvent.click(buttons[1]);
    expect(buttons[1].getAttribute("aria-expanded")).toBe("false");
  });

  it("keeps the link inside the payment answer pointing to the subscription page", () => {
    render(<PricingFaqList faqs={pricingFaqs} />);
    expect(
      screen.getByRole("link", { name: /Buka halaman langganan/ }),
    ).toHaveProperty("pathname", "/subscription");
  });
});
