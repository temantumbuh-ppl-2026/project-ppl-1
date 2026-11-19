import type { BraveChoiceQuiz, QuizOption } from "../types";

/**
 * Kalimat pembuka yang memahami perasaan/niat pengguna, per kategori bank soal.
 * Memvalidasi perasaan tanpa membenarkan tindakan berisiko.
 */
const CATEGORY_OPENERS: Record<string, string> = {
  "Grooming Online":
    "Wajar kalau kamu merasa senang mendapat perhatian dari teman baru.",
  "Manipulasi & Ancaman":
    "Wajar kalau kamu merasa takut atau tertekan saat diminta merahasiakan sesuatu.",
  "Batasan Diri & Consent":
    "Wajar kalau kamu tidak ingin diejek atau dianggap berbeda oleh orang lain.",
  "Keamanan Perjalanan & Mobilitas":
    "Wajar kalau kamu ingin cepat sampai atau merasa tidak enak untuk menolak.",
  "Keamanan Digital":
    "Wajar kalau permintaan atau tawaran online terasa menarik dan sulit ditolak.",
  "Minta Bantuan":
    "Wajar kalau kamu merasa ragu atau malu untuk meminta bantuan.",
  "Dokumen & Identitas":
    "Wajar kalau kamu ingin urusannya cepat beres dan percaya pada pihak yang terlihat resmi.",
  "Eksploitasi Ekonomi":
    "Wajar kalau kamu ingin masalahnya cepat selesai atau tergiur kesempatan mendapat uang.",
  "Kontrak & Hak Kerja":
    "Wajar kalau kamu ingin segera mendapatkan pekerjaan dan tidak ingin terlihat menyulitkan.",
  "Relasi Tidak Sehat":
    "Wajar kalau kamu ingin menjaga hubungan dengan orang yang kamu sayangi.",
  "Tawaran Kerja/Beasiswa":
    "Wajar kalau kesempatan seperti ini terasa berharga dan ingin segera kamu ambil.",
  "Tawaran Modeling/Influencer":
    "Wajar kalau tawaran seperti ini terasa menarik dan membanggakan.",
};

const DEFAULT_OPENER = "Wajar kalau kamu ingin situasinya cepat selesai.";

export type BraveChoiceFeedback =
  | {
      kind: "recommended";
      title: string;
      /** Manfaat spesifik pilihan, dari explanationRight. */
      benefit: string;
    }
  | {
      kind: "alternative";
      title: string;
      opener: string;
      /** Teks opsi yang direkomendasikan oleh bank soal. */
      suggestedStep: string;
      /** Alasan langkah yang disarankan dapat membantu (explanationRight). */
      reason: string;
      /** Risiko dari pilihan yang diambil (explanationWrong). */
      risk: string;
    };

export function getCategoryOpener(category?: string) {
  return (category && CATEGORY_OPENERS[category]) || DEFAULT_OPENER;
}

/**
 * Menyusun feedback suportif dari materi existing. Penilaian internal
 * (isBrave) hanya menentukan struktur, tidak ditampilkan sebagai benar/salah.
 */
export function buildBraveChoiceFeedback(
  quiz: BraveChoiceQuiz,
  chosen: QuizOption,
): BraveChoiceFeedback {
  if (chosen.isBrave) {
    return {
      kind: "recommended",
      title: "Langkah ini bisa membantumu",
      benefit: quiz.explanationRight,
    };
  }

  const recommended = quiz.options.find((option) => option.isBrave);

  return {
    kind: "alternative",
    title: "Ada langkah lain yang bisa kamu coba",
    opener: getCategoryOpener(quiz.category),
    suggestedStep: recommended?.text ?? "",
    reason: quiz.explanationRight,
    risk: quiz.explanationWrong,
  };
}
