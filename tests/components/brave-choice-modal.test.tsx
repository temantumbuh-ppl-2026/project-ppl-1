// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { useState, type ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BraveChoiceModal } from "@/features/diary/components/BraveChoiceModal";
import {
  buildBraveChoiceFeedback,
  getCategoryOpener,
} from "@/features/diary/components/brave-choice-feedback";
import type { BraveChoiceQuiz } from "@/features/diary/types";

afterEach(cleanup);

const QUIZ: BraveChoiceQuiz = {
  id: "q1",
  category: "Eksploitasi Ekonomi",
  scenario:
    "Perekrut berkata kamu akan didenda besar kalau membatalkan keberangkatan, padahal belum ada kontrak yang jelas.",
  options: [
    { label: "A", text: "Bayar saja agar tidak bermasalah.", isBrave: false },
    {
      label: "B",
      text: "Minta dasar tertulis, jangan bayar, dan konsultasi ke kampus/keluarga/layanan hukum.",
      isBrave: true,
    },
  ],
  explanationRight:
    "Ancaman denda tanpa kontrak yang jelas perlu dicek. Bukti tertulis dan pendamping membantumu mengambil keputusan.",
  explanationWrong:
    "Membayar karena panik bisa memperkuat pola pemerasan dan tidak menjamin ancaman berhenti.",
};

type ModalProps = ComponentProps<typeof BraveChoiceModal>;

function renderModal(overrides: Partial<ModalProps> = {}) {
  const props: ModalProps = {
    isOpen: true,
    onClose: vi.fn(),
    quiz: QUIZ,
    isLoading: false,
    isResetting: false,
    isQuestionPoolExhausted: false,
    isQuotaReached: false,
    quizRemaining: 3,
    quizPerDay: 5,
    plan: "free",
    canLoadNext: true,
    onNextQuiz: vi.fn(),
    onResetQuestions: vi.fn(),
    onUpgrade: vi.fn(),
    onAnswerSubmit: vi.fn(async () => true),
    origin: "dashboard",
    ...overrides,
  };
  render(<BraveChoiceModal {...props} />);
  return props;
}

const JUDGING =
  /\bbenar\b|\bsalah\b|kurang tepat|pikirkan lagi|\bbijak\b|% tepat/i;

describe("BraveChoiceModal", () => {
  it("menampilkan judul, situasi, petunjuk, dan kuota yang jelas", () => {
    renderModal();

    const dialog = screen.getByRole("dialog", { name: "Brave Choice" });
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(
      screen.getByText("Jelajahi pilihan, temukan langkah yang lebih baik."),
    ).toBeTruthy();
    expect(screen.getByText("Situasinya")).toBeTruthy();
    expect(screen.getByText("Apa yang mungkin kamu lakukan?")).toBeTruthy();
    expect(screen.getByText("3 kesempatan tersisa hari ini")).toBeTruthy();
  });

  it("pilihan dengan alternatif lebih aman: feedback suportif + langkah yang disarankan", async () => {
    const props = renderModal();

    fireEvent.click(screen.getByRole("button", { name: /Pilihan A/ }));

    await screen.findByText("Ada langkah lain yang bisa kamu coba");
    expect(props.onAnswerSubmit).toHaveBeenCalledWith("q1", "A");
    expect(
      screen.getByText(
        "Wajar kalau kamu ingin masalahnya cepat selesai atau tergiur kesempatan mendapat uang.",
      ),
    ).toBeTruthy();
    expect(screen.getByText("Langkah yang disarankan")).toBeTruthy();
    expect(
      screen.getAllByText(/Minta dasar tertulis, jangan bayar/).length,
    ).toBeGreaterThan(1);
    expect(screen.getByText(QUIZ.explanationRight)).toBeTruthy();
    expect(screen.getByText(QUIZ.explanationWrong)).toBeTruthy();

    const chosen = screen.getByRole("button", { name: /Pilihan A.*pilihanmu/ });
    expect(chosen.className).toContain("chosen");
    expect(screen.getByText("Pilihanmu")).toBeTruthy();
    // Tidak bisa menebak ulang setelah memilih.
    expect((chosen as HTMLButtonElement).disabled).toBe(true);
    expect(document.body.textContent).not.toMatch(JUDGING);
  });

  it("pilihan yang direkomendasikan: manfaat spesifik tanpa label menilai", async () => {
    renderModal();

    fireEvent.click(screen.getByRole("button", { name: /Pilihan B/ }));

    await screen.findByText("Langkah ini bisa membantumu");
    expect(screen.getByText(QUIZ.explanationRight)).toBeTruthy();
    expect(screen.queryByText("Langkah yang disarankan")).toBe(null);
    expect(screen.getByText("Pilihanmu")).toBeTruthy();
    expect(document.body.textContent).not.toMatch(JUDGING);
  });

  it("CTA penutup mengikuti asal pembukaan modal", async () => {
    const onClose = vi.fn();
    renderModal({ onClose, origin: "dashboard" });
    fireEvent.click(screen.getByRole("button", { name: /Pilihan B/ }));
    await screen.findByText("Langkah ini bisa membantumu");

    expect(
      screen.getByRole("button", { name: "Coba Skenario Lain" }),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Lanjutkan Menulis" })).toBe(
      null,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Kembali ke Dashboard" }),
    );
    expect(onClose).toHaveBeenCalled();

    cleanup();
    const onContinueWriting = vi.fn();
    renderModal({ origin: "diary", onContinueWriting });
    fireEvent.click(screen.getByRole("button", { name: /Pilihan A/ }));
    await screen.findByText("Ada langkah lain yang bisa kamu coba");
    fireEvent.click(screen.getByRole("button", { name: "Lanjutkan Menulis" }));
    expect(onContinueWriting).toHaveBeenCalled();
  });

  it("mencegah submit berulang dan menampilkan pesan bila jawaban gagal tersimpan", async () => {
    let resolveSubmit: (v: boolean) => void = () => undefined;
    const onAnswerSubmit = vi.fn(
      () => new Promise<boolean>((r) => (resolveSubmit = r)),
    );
    renderModal({ onAnswerSubmit });

    fireEvent.click(screen.getByRole("button", { name: /Pilihan A/ }));
    fireEvent.click(screen.getByRole("button", { name: /Pilihan B/ }));
    expect(onAnswerSubmit).toHaveBeenCalledTimes(1);

    await act(async () => resolveSubmit(false));
    expect(
      screen.getByText("Pilihanmu belum tersimpan. Coba pilih lagi."),
    ).toBeTruthy();
    expect(screen.queryByText(/langkah lain|bisa membantumu/)).toBe(null);
    // Bisa mencoba lagi.
    expect(
      (screen.getByRole("button", { name: /Pilihan A/ }) as HTMLButtonElement)
        .disabled,
    ).toBe(false);
  });

  it("kuota habis menampilkan pesan netral dan opsi premium tanpa skenario", () => {
    const props = renderModal({
      quiz: null,
      isQuotaReached: true,
      quizRemaining: 0,
      canLoadNext: false,
    });

    expect(
      screen.getByText("Kesempatan hari ini sudah habis", {
        selector: "strong",
      }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /lihat premium/i }));
    expect(props.onUpgrade).toHaveBeenCalled();
  });

  it("gagal memuat skenario menampilkan pesan dan tombol coba lagi", () => {
    const onRetryLoad = vi.fn();
    renderModal({ quiz: null, loadError: true, onRetryLoad });

    expect(screen.getByRole("alert").textContent).toContain(
      "Skenario belum berhasil dimuat. Coba lagi.",
    );
    fireEvent.click(screen.getByRole("button", { name: /coba lagi/i }));
    expect(onRetryLoad).toHaveBeenCalled();
  });

  it("fokus masuk ke dialog, Escape menutup, dan fokus kembali ke pemicu", async () => {
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Buka Brave Choice
          </button>
          <BraveChoiceModal
            isOpen={open}
            onClose={() => setOpen(false)}
            quiz={QUIZ}
            isLoading={false}
            isResetting={false}
            isQuestionPoolExhausted={false}
            isQuotaReached={false}
            quizRemaining={3}
            quizPerDay={5}
            plan="free"
            canLoadNext
            onNextQuiz={vi.fn()}
            onResetQuestions={vi.fn()}
            onUpgrade={vi.fn()}
            onAnswerSubmit={vi.fn(async () => true)}
            origin="dashboard"
          />
        </>
      );
    }

    render(<Harness />);
    const trigger = screen.getByRole("button", { name: "Buka Brave Choice" });
    trigger.focus();
    fireEvent.click(trigger);

    const close = await screen.findByRole("button", {
      name: "Tutup Brave Choice",
    });
    expect(document.activeElement).toBe(close);

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBe(null));
    expect(document.activeElement).toBe(trigger);
  });
});

describe("buildBraveChoiceFeedback", () => {
  it("memakai materi existing tanpa mengubah rekomendasi", () => {
    const alt = buildBraveChoiceFeedback(QUIZ, QUIZ.options[0]!);
    expect(alt.kind).toBe("alternative");
    if (alt.kind === "alternative") {
      expect(alt.suggestedStep).toBe(QUIZ.options[1]!.text);
      expect(alt.reason).toBe(QUIZ.explanationRight);
      expect(alt.risk).toBe(QUIZ.explanationWrong);
    }

    const rec = buildBraveChoiceFeedback(QUIZ, QUIZ.options[1]!);
    expect(rec).toEqual({
      kind: "recommended",
      title: "Langkah ini bisa membantumu",
      benefit: QUIZ.explanationRight,
    });
  });

  it("memakai pembuka umum untuk kategori yang tidak dikenal", () => {
    expect(getCategoryOpener(undefined)).toBe(
      "Wajar kalau kamu ingin situasinya cepat selesai.",
    );
    expect(getCategoryOpener("Kategori Baru")).toBe(
      "Wajar kalau kamu ingin situasinya cepat selesai.",
    );
  });
});
