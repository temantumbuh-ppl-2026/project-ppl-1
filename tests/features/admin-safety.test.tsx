// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SafetyAlertDetailPage } from "@/components/admin/safety/SafetyAlertDetailPage";
import { SafetyAlertsPage } from "@/components/admin/safety/SafetyAlertsPage";
import {
  buildAlertListUrl,
  parseAlertFilters,
  type SafetyAlertDetail,
  type SafetyAlertFilters,
  type SafetyAlertListItem,
} from "@/components/admin/safety/safety-alert-api";

const baseFilters: SafetyAlertFilters = {
  status: "all",
  riskLevel: "all",
  category: "all",
  page: 1,
  limit: 10,
};

const listItem: SafetyAlertListItem = {
  id: "alert-1",
  riskLevel: "HIGH",
  category: "SELF_HARM",
  status: "OPEN",
  createdAt: "2026-11-04T03:00:00.000Z",
  reviewedAt: null,
};

const detail: SafetyAlertDetail = {
  ...listItem,
  updatedAt: "2026-11-04T03:00:00.000Z",
  reviewNote: null,
  reviewedByName: null,
};

afterEach(() => cleanup());

describe("SafetyAlertsPage", () => {
  it("menampilkan metadata alert dengan tautan ke detail", () => {
    render(
      <SafetyAlertsPage
        alerts={[listItem]}
        total={1}
        filters={baseFilters}
        onFilterChange={vi.fn()}
      />,
    );

    const row = screen.getByRole("row", { name: /Menyakiti diri sendiri/ });
    expect(within(row).getByText("Tinggi")).toBeTruthy();
    expect(within(row).getByText("Belum ditinjau")).toBeTruthy();
    expect(
      within(row).getByRole("link", { name: "Tinjau" }).getAttribute("href"),
    ).toBe("/admin/safety/alert-1");
  });

  it("tidak menampilkan kolom identitas pengguna atau isi percakapan", () => {
    render(
      <SafetyAlertsPage
        alerts={[listItem]}
        total={1}
        filters={baseFilters}
        onFilterChange={vi.fn()}
      />,
    );

    const headers = screen
      .getAllByRole("columnheader")
      .map((header) => header.textContent);
    expect(headers).toEqual(["Waktu", "Kategori", "Risiko", "Status", "Aksi"]);
    expect(screen.queryByText(/email/i)).toBeNull();
  });

  it("menampilkan empty state tanpa alert", () => {
    render(
      <SafetyAlertsPage
        alerts={[]}
        total={0}
        filters={baseFilters}
        onFilterChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("status").textContent).toContain(
      "Belum ada alert safety",
    );
  });

  it("membedakan empty state saat filter aktif dan bisa reset filter", () => {
    const onFilterChange = vi.fn();
    render(
      <SafetyAlertsPage
        alerts={[]}
        total={0}
        filters={{ ...baseFilters, status: "RESOLVED" }}
        onFilterChange={onFilterChange}
      />,
    );

    expect(screen.getByRole("status").textContent).toContain(
      "Tidak ada alert yang cocok",
    );

    fireEvent.click(screen.getByRole("button", { name: "Reset filter" }));
    expect(onFilterChange).toHaveBeenCalledWith({
      status: "all",
      riskLevel: "all",
      category: "all",
    });
  });

  it("memanggil onFilterChange saat filter dan halaman berubah", () => {
    const onFilterChange = vi.fn();
    render(
      <SafetyAlertsPage
        alerts={[listItem]}
        total={25}
        filters={baseFilters}
        onFilterChange={onFilterChange}
      />,
    );

    fireEvent.change(screen.getByLabelText("Status"), {
      target: { value: "REVIEWED" },
    });
    expect(onFilterChange).toHaveBeenCalledWith({ status: "REVIEWED" });

    fireEvent.change(screen.getByLabelText("Kategori"), {
      target: { value: "OTHER" },
    });
    expect(onFilterChange).toHaveBeenCalledWith({ category: "OTHER" });

    fireEvent.click(screen.getByRole("button", { name: "Berikutnya" }));
    expect(onFilterChange).toHaveBeenCalledWith({ page: 2 });
    expect(
      screen
        .getByRole("button", { name: "Sebelumnya" })
        .hasAttribute("disabled"),
    ).toBe(true);
  });
});

describe("SafetyAlertDetailPage", () => {
  function renderDetail(
    overrides: Partial<React.ComponentProps<typeof SafetyAlertDetailPage>> = {},
  ) {
    const onSubmit = vi.fn();
    render(
      <SafetyAlertDetailPage
        alert={detail}
        isSaving={false}
        isSaved={false}
        saveError={null}
        onSubmit={onSubmit}
        {...overrides}
      />,
    );
    return { onSubmit };
  }

  it("menonaktifkan tombol simpan sampai ada perubahan", () => {
    renderDetail();

    expect(
      screen
        .getByRole("button", { name: "Simpan perubahan" })
        .hasAttribute("disabled"),
    ).toBe(true);
  });

  it("mengirim status dan catatan review yang diperbarui", () => {
    const { onSubmit } = renderDetail();

    fireEvent.click(screen.getByLabelText("Sedang ditinjau"));
    fireEvent.change(screen.getByLabelText(/Catatan review/), {
      target: { value: "  Sudah dihubungi konselor.  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Simpan perubahan" }));

    expect(onSubmit).toHaveBeenCalledWith({
      status: "REVIEWED",
      reviewNote: "Sudah dihubungi konselor.",
    });
  });

  it("menampilkan error dan keberhasilan penyimpanan", () => {
    renderDetail({ saveError: "Status belum tersimpan." });
    expect(screen.getByRole("alert").textContent).toBe(
      "Status belum tersimpan.",
    );
    cleanup();

    renderDetail({ isSaved: true });
    expect(screen.getByRole("status").textContent).toContain("berhasil");
  });

  it("tidak menampilkan identitas pengguna", () => {
    renderDetail();

    expect(screen.getByText(/tidak ditampilkan/)).toBeTruthy();
    expect(screen.queryByText(/email/i)).toBeNull();
  });
});

describe("safety alert filters", () => {
  it("mem-parse query string dan menolak nilai tidak valid", () => {
    const filters = parseAlertFilters(
      new URLSearchParams(
        "status=RESOLVED&riskLevel=NONE&category=BOGUS&page=-2&limit=999",
      ),
    );

    expect(filters).toEqual({
      status: "RESOLVED",
      riskLevel: "all",
      category: "all",
      page: 1,
      limit: 10,
    });
  });

  it("membangun URL API hanya dengan filter aktif", () => {
    expect(buildAlertListUrl(baseFilters)).toBe(
      "/api/admin/safety-alerts?page=1&limit=10",
    );
    expect(
      buildAlertListUrl({ ...baseFilters, status: "OPEN", riskLevel: "HIGH" }),
    ).toBe(
      "/api/admin/safety-alerts?status=OPEN&riskLevel=HIGH&page=1&limit=10",
    );
  });
});
