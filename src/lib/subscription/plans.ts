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

/**
 * Potongan harga per durasi, dalam persen dari harga normal
 * (PRICE_PER_MONTH × jumlah bulan). Ubah angka di sini atau PRICE_PER_MONTH,
 * dan seluruh tampilan serta nominal tagihan ikut menyesuaikan.
 */
export const DURATION_DISCOUNT_PERCENT: Record<number, number> = {
  1: 0,
  3: 10,
  6: 15.5,
  12: 22.5,
};

/** Harga paket dibulatkan ke kelipatan ini (rupiah). */
export const PRICE_ROUNDING = 1000;

export type DurationPricing = {
  months: number;
  /** Harga tanpa potongan: harga per bulan × jumlah bulan. */
  normalPrice: number;
  /** Harga yang ditagihkan setelah potongan. */
  price: number;
  /** Selisih normalPrice dan price. 0 bila tidak ada potongan. */
  savings: number;
  discountPercent: number;
};

/**
 * Menghitung harga satu durasi. Dipakai oleh tampilan dan route pembayaran
 * agar harga yang terlihat selalu sama dengan yang ditagihkan.
 */
export function getDurationPricing(
  months: number,
  pricePerMonth: number = PRICE_PER_MONTH,
  discounts: Record<number, number> = DURATION_DISCOUNT_PERCENT,
): DurationPricing {
  const normalPrice = pricePerMonth * months;
  const discountPercent = discounts[months] ?? 0;

  if (discountPercent <= 0) {
    return {
      months,
      normalPrice,
      price: normalPrice,
      savings: 0,
      discountPercent: 0,
    };
  }

  const discounted =
    Math.round((normalPrice * (1 - discountPercent / 100)) / PRICE_ROUNDING) *
    PRICE_ROUNDING;
  const price = Math.min(normalPrice, discounted);

  return {
    months,
    normalPrice,
    price,
    savings: normalPrice - price,
    discountPercent,
  };
}

/** Batas paket Basic (gratis). Paket Single tidak dibatasi. */
export const FREE_DIARY_LIMIT_PER_MONTH = 15;
export const FREE_QUIZ_LIMIT_PER_DAY = 5;
