// Sumber tunggal aturan paket yang dipakai backend dan tampilan.
// Tanpa dependensi server agar aman diimpor dari komponen client.

/** Harga paket Single per bulan, dalam rupiah. */
export const PRICE_PER_MONTH = 59000;

/** Durasi langganan yang bisa dipilih saat pembayaran. */
export const SUBSCRIPTION_DURATIONS = [
  { months: 1, label: "1 Bulan" },
  { months: 3, label: "3 Bulan" },
  { months: 6, label: "6 Bulan" },
  { months: 12, label: "12 Bulan" },
] as const;

export const ALLOWED_DURATIONS: number[] = SUBSCRIPTION_DURATIONS.map(
  (option) => option.months,
);

/** Batas paket Basic (gratis). Paket Single tidak dibatasi. */
export const FREE_DIARY_LIMIT_PER_MONTH = 15;
export const FREE_QUIZ_LIMIT_PER_DAY = 5;
