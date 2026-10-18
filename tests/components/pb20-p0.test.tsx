// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthField } from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import {
  getMoodColor,
  getMoodLabel,
  MoodFaceIcon,
} from "@/components/mood/mood-face-icons";

afterEach(cleanup);

describe("FE-02 shared controls", () => {
  it("keeps the default touch target, radius and shared keyboard focus treatment", () => {
    render(
      <>
        <Button>Lanjut</Button>
        <Input aria-label="Nama" />
      </>,
    );
    const button = screen.getByRole("button", { name: "Lanjut" });
    const input = screen.getByRole("textbox", { name: "Nama" });
    for (const control of [button, input]) {
      expect(control.className).toContain("h-11");
      expect(control.className).toContain("rounded-tt-md");
      expect(control.className).toContain("tt-focus-ring");
      control.focus();
      expect(document.activeElement).toBe(control);
    }
  });

  it("does not activate a disabled button and provides explicit disabled colours", () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Simpan
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Simpan" });
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
    expect(button.className).toContain("disabled:bg-tt-gray-100");
    expect(button.className).toContain("disabled:text-tt-gray-400");
    expect(button.className).not.toContain("disabled:opacity-50");
  });

  it("retains asChild links and caller props", () => {
    render(
      <Button asChild variant="outline">
        <a href="/login">Kembali</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Kembali" });
    expect(link.getAttribute("href")).toBe("/login");
    expect(link.getAttribute("data-variant")).toBe("outline");
  });

  it("toggles password visibility without submitting and follows disabled state", () => {
    const submit = vi.fn((event) => event.preventDefault());
    const { rerender } = render(
      <form onSubmit={submit}>
        <PasswordInput aria-label="Sandi" defaultValue="contoh" />
      </form>,
    );
    const toggle = screen.getByRole("button", { name: "Tampilkan password" });
    expect(toggle.className).toContain("size-11");
    fireEvent.click(toggle);
    expect(screen.getByLabelText("Sandi").getAttribute("type")).toBe("text");
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    expect(submit).not.toHaveBeenCalled();
    rerender(
      <form onSubmit={submit}>
        <PasswordInput aria-label="Sandi" disabled />
      </form>,
    );
    expect(screen.getByLabelText("Sandi").hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button").hasAttribute("disabled")).toBe(true);
  });

  it("links a field error to its input and includes an icon and explanatory text", () => {
    render(
      <AuthField id="email" label="Email" error="Cek kembali alamat email.">
        <Input id="email" />
      </AuthField>,
    );
    const input = screen.getByRole("textbox", { name: "Email" });
    const error = screen.getByRole("alert");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBe(error.id);
    expect(error.textContent).toContain("Cek kembali alamat email.");
    expect(error.querySelector("svg")).not.toBeNull();
    expect(error.className).toContain("text-tt-attention-text");
  });
});

describe("FE-01 mood appearance preserves existing data and expressions", () => {
  it("retains all five labels and distinct face expressions with the blue-to-amber ramp", () => {
    const paths = new Set<string | null>();
    const labels = [
      "Sangat Sedih",
      "Sedih",
      "Biasa Aja",
      "Senang",
      "Sangat Senang",
    ];
    const colours = ["#2B6CB0", "#7C5CBF", "#2A7A74", "#3B8318", "#A86500"];
    for (let score = 1; score <= 5; score++) {
      expect(getMoodLabel(score)).toBe(labels[score - 1]);
      expect(getMoodColor(score)).toBe(colours[score - 1]);
      const { container, unmount } = render(<MoodFaceIcon score={score} />);
      paths.add(container.querySelector("path")!.getAttribute("d"));
      expect(container.querySelector("circle")!.getAttribute("stroke")).toBe(
        colours[score - 1],
      );
      unmount();
    }
    expect(paths.size).toBe(5);
    expect(getMoodLabel(null)).toBe("-");
  });
});
