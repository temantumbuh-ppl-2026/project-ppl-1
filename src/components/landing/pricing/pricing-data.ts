import {
  ALLOWED_DURATIONS,
  DURATION_DISCOUNT_PERCENT,
  FREE_DIARY_LIMIT_PER_MONTH,
  FREE_QUIZ_LIMIT_PER_DAY,
  PRICE_PER_MONTH,
} from "@/lib/subscription/plans";

// Harga, durasi, dan batas paket diambil dari @/lib/subscription/plans, sumber
// yang sama dengan backend pembayaran dan halaman /subscription.

export function formatRupiah(amount: number) {
  return `Rp${String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

const durationText = ALLOWED_DURATIONS.slice(0, -1).join(", ");
const lastDuration = ALLOWED_DURATIONS[ALLOWED_DURATIONS.length - 1];
export const durationSummary = `${durationText}, atau ${lastDuration} bulan`;

// Ringkasan potongan per durasi, mis. "3 bulan hemat 10%, 6 bulan hemat 15,5%".
const discountSummary = ALLOWED_DURATIONS.filter(
  (months) => (DURATION_DISCOUNT_PERCENT[months] ?? 0) > 0,
)
  .map(
    (months) =>
      `${months} bulan hemat ${String(DURATION_DISCOUNT_PERCENT[months]).replace(".", ",")}%`,
  )
  .join(", ");

export const basicPlan = {
  name: "Basic",
  badge: "Starter",
  price: formatRupiah(0),
  priceUnit: "selamanya",
  period: "Gratis selamanya",
  description:
    "Untuk mulai mencatat cerita dan mengenali perasaan sehari-hari.",
  features: [
    `${FREE_DIARY_LIMIT_PER_MONTH} sesi diary per bulan`,
    "Mood check-in harian",
    `Brave Choice: ${FREE_QUIZ_LIMIT_PER_DAY} latihan per hari`,
  ],
  singleOnly: ["Insight Dashboard", "Rekomendasi dukungan"],
};

export const singlePlan = {
  name: "Single",
  badge: "Paling direkomendasikan",
  price: formatRupiah(PRICE_PER_MONTH),
  priceUnit: "per bulan",
  period: `Dibayar di awal · pilih ${durationSummary}`,
  description:
    "Untuk kamu yang ingin bercerita lebih leluasa dan melihat ringkasan pola emosimu.",
  features: [
    "Sesi diary tanpa batas",
    "Brave Choice tanpa batas",
    "Insight Dashboard",
    "Tren Mood bulanan dan Ringkasan Mood",
    "Refleksi AI harian dan rekomendasi dukungan",
  ],
};

export type PricingFaq = {
  question: string;
  answer: string;
  link?: { href: string; label: string };
};

// Pertanyaan dan urutan FAQ mengikuti halaman pricing sebelumnya. Jawaban yang
// bertentangan dengan implementasi (pembatalan langganan aktif, enkripsi
// end-to-end) disesuaikan dengan perilaku aplikasi.
export const pricingFaqs: PricingFaq[] = [
  {
    question: "Bagaimana sistem pembayarannya?",
    answer: `Pembayaran dilakukan di awal lewat Midtrans untuk durasi yang kamu pilih (${durationSummary}). Harga dasarnya ${formatRupiah(PRICE_PER_MONTH)} per bulan${discountSummary ? `, dan durasi yang lebih panjang lebih hemat: ${discountSummary}` : ""}. Semua fitur Single langsung terbuka setelah pembayaran berhasil. Pembayaran yang belum selesai bisa dilanjutkan atau dibatalkan dari halaman langganan.`,
    link: { href: "/subscription", label: "Buka halaman langganan" },
  },
  {
    question: "Apakah isi diary saya aman dan privat?",
    answer:
      "Isi diary disimpan dalam bentuk terenkripsi dan tidak ditampilkan ke pengguna lain.",
  },
  {
    question: "Bisakah saya upgrade atau downgrade kapan saja?",
    answer:
      "Kamu bisa upgrade ke Single kapan saja. Jika langgananmu masih aktif, perpanjangan ditambahkan setelah masa aktif berakhir sehingga sisa waktumu tetap terhitung. Saat masa langganan berakhir, akunmu otomatis kembali ke Basic tanpa penalti.",
  },
  {
    question: "Metode pembayaran apa yang tersedia?",
    answer:
      "Kami menerima GoPay, OVO, QRIS, VISA, Mastercard, dan transfer bank BCA melalui Midtrans — gateway pembayaran terpercaya di Indonesia.",
  },
];
