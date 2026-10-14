// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MoodCheckin } from "@/components/mood/MoodCheckin";
import { getMoodColor, getMoodLabel } from "@/components/mood/mood-face-icons";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    getSession: async () => ({ data: { user: { name: "Teman" } } }),
  },
}));
vi.mock("sonner", () => ({
  toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() },
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function renderCheckin() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    })),
  );
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <MoodCheckin />
    </QueryClientProvider>,
  );
  await screen.findByRole("button", { name: "Sangat Sedih" });
}

describe("mood check-in palette integration", () => {
  it.each([1, 2, 3, 4, 5])(
    "keeps icon, label and selection banner consistent for mood %i",
    async (score) => {
      await renderCheckin();
      const label = getMoodLabel(score);
      const button = screen.getByRole("button", { name: label });
      fireEvent.click(button);
      const banner = screen.getByText(`Mood dipilih: ${label}`);
      const iconStroke = button
        .querySelector("svg circle")!
        .getAttribute("stroke");
      expect(iconStroke).toBe(getMoodColor(score));
      const expected = document.createElement("span");
      expected.style.color = getMoodColor(score);
      expect(banner.style.color).toBe(expected.style.color);
      expect(button.querySelector("span")!.style.color).toBe(
        expected.style.color,
      );
    },
  );

  it("explains over-limit notes with an icon, linked error and disabled submission", async () => {
    await renderCheckin();
    fireEvent.click(screen.getByRole("button", { name: "Senang" }));
    const note = screen.getByRole("textbox", {
      name: "Catatan singkat (opsional)",
    });
    fireEvent.change(note, {
      target: { value: Array(101).fill("kata").join(" ") },
    });
    const error = screen.getByRole("alert");
    expect(error.textContent).toBe("Melebihi batas 100 kata");
    expect(error.querySelector("svg")).not.toBeNull();
    expect(note.getAttribute("aria-describedby")).toBe(error.id);
    expect(note.getAttribute("aria-invalid")).toBe("true");
    expect(
      screen
        .getByRole("button", { name: "Kurangi jumlah kata" })
        .hasAttribute("disabled"),
    ).toBe(true);
  });
});
