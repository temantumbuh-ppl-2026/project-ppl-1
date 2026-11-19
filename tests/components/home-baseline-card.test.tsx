// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { HomeDashboardBaselineCard } from "@/features/home/components/HomeDashboardBaselineCard";
import type { BaselineResponse } from "@/features/home/types";

afterEach(cleanup);

function makeBaseline(isBeginner: boolean): BaselineResponse {
  return {
    id: "baseline-1",
    userId: "user-1",
    isBeginner,
    label: isBeginner ? "Beginner" : "Intermediate",
    confidenceScore: 0.8,
    analyzedAt: "2026-10-01T00:00:00.000Z",
  };
}

describe("HomeDashboardBaselineCard", () => {
  it("tetap tampil saat baseline belum dikerjakan dengan CTA mulai", () => {
    render(<HomeDashboardBaselineCard baseline={null} />);

    expect(screen.getByText("Refleksi Awal")).toBeTruthy();
    expect(screen.getByText("Baseline Assessment")).toBeTruthy();
    expect(screen.getByText("Belum diisi")).toBeTruthy();
    const cta = screen.getByRole("link", { name: /mulai refleksi/i });
    expect(cta.getAttribute("href")).toBe("/baseline");
  });

  it("memakai warna teal palet mood untuk level Beginner", () => {
    render(<HomeDashboardBaselineCard baseline={makeBaseline(true)} />);

    const level = screen.getByText("Beginner");
    expect(level.style.color).toBe("rgb(42, 122, 116)");
    expect(
      screen
        .getByRole("link", { name: /kerjakan kembali/i })
        .getAttribute("href"),
    ).toBe("/baseline");
  });

  it("memakai warna amber palet mood untuk level Intermediate", () => {
    render(<HomeDashboardBaselineCard baseline={makeBaseline(false)} />);

    expect(screen.getByText("Intermediate").style.color).toBe(
      "rgb(168, 101, 0)",
    );
  });
});
