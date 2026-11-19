import { describe, expect, it } from "vitest";

import {
  ALLOWED_DURATIONS,
  DURATION_DISCOUNT_PERCENT,
  PRICE_PER_MONTH,
  getDurationPricing,
} from "@/lib/subscription/plans";

describe("getDurationPricing", () => {
  it("memakai harga normal tanpa potongan untuk 1 bulan", () => {
    expect(getDurationPricing(1)).toEqual({
      months: 1,
      normalPrice: PRICE_PER_MONTH,
      price: PRICE_PER_MONTH,
      savings: 0,
      discountPercent: 0,
    });
  });

  it("menghasilkan harga paket yang sama dengan desain saat harga dasar Rp59.000", () => {
    expect(PRICE_PER_MONTH).toBe(59000);

    expect(getDurationPricing(3)).toMatchObject({
      normalPrice: 177000,
      price: 159000,
      savings: 18000,
    });
    expect(getDurationPricing(6)).toMatchObject({
      normalPrice: 354000,
      price: 299000,
      savings: 55000,
    });
    expect(getDurationPricing(12)).toMatchObject({
      normalPrice: 708000,
      price: 549000,
      savings: 159000,
    });
  });

  it("selalu konsisten: hemat = harga normal - harga tagihan", () => {
    for (const months of ALLOWED_DURATIONS) {
      const pricing = getDurationPricing(months);
      expect(pricing.savings).toBe(pricing.normalPrice - pricing.price);
      expect(pricing.price).toBeLessThanOrEqual(pricing.normalPrice);
    }
  });

  it("durasi lebih panjang tidak pernah lebih mahal per bulan", () => {
    const perMonth = ALLOWED_DURATIONS.map(
      (months) => getDurationPricing(months).price / months,
    );
    for (let i = 1; i < perMonth.length; i += 1) {
      expect(perMonth[i]).toBeLessThanOrEqual(perMonth[i - 1]);
    }
  });

  it("ikut berubah otomatis saat harga dasar diubah", () => {
    const cheaper = getDurationPricing(12, 40000);
    expect(cheaper.normalPrice).toBe(480000);
    // 22,5% dari 480.000 = 108.000 → 372.000
    expect(cheaper.price).toBe(372000);
    expect(cheaper.savings).toBe(108000);

    const pricier = getDurationPricing(3, 100000);
    expect(pricier.normalPrice).toBe(300000);
    expect(pricier.price).toBe(270000);
  });

  it("ikut berubah otomatis saat persentase potongan diubah", () => {
    const custom = getDurationPricing(3, 59000, { 3: 20 });
    // 177.000 × 0,8 = 141.600 → dibulatkan ke 142.000
    expect(custom.price).toBe(142000);
    expect(custom.savings).toBe(35000);
  });

  it("tanpa konfigurasi potongan, durasi tidak mendapat hemat", () => {
    expect(getDurationPricing(3, 59000, {})).toMatchObject({
      price: 177000,
      savings: 0,
      discountPercent: 0,
    });
  });

  it("setiap durasi yang diizinkan punya konfigurasi potongan", () => {
    for (const months of ALLOWED_DURATIONS) {
      expect(DURATION_DISCOUNT_PERCENT[months]).toBeGreaterThanOrEqual(0);
    }
  });
});
