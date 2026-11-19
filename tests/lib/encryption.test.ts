import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { encrypt, decrypt } from "@/lib/encryption";

// Key 32-byte hex yang valid (64 karakter)
const VALID_KEY = "a".repeat(64);

describe("lib/encryption", () => {
  beforeEach(() => {
    vi.stubEnv("ENCRYPTION_KEY", VALID_KEY);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // ─────────────────────────────────────
  // encrypt
  // ─────────────────────────────────────
  describe("encrypt", () => {
    it("Harus return string terenkripsi dengan format iv:authTag:encrypted", () => {
      const result = encrypt("pesan rahasia");
      const parts = result.split(":");
      expect(parts).toHaveLength(3);
      expect(parts[0]).toBeTruthy(); // iv
      expect(parts[1]).toBeTruthy(); // authTag
      expect(parts[2]).toBeTruthy(); // encrypted
    });

    it("Harus return hasil berbeda setiap kali (IV random)", () => {
      const result1 = encrypt("teks sama");
      const result2 = encrypt("teks sama");
      expect(result1).not.toBe(result2); // IV random = cipher berbeda
    });

    it("Harus return teks asli jika ENCRYPTION_KEY tidak ada (fallback)", () => {
      vi.stubEnv("ENCRYPTION_KEY", "");
      const result = encrypt("teks gagal dienkripsi");
      // Fallback: return teks aslinya
      expect(result).toBe("teks gagal dienkripsi");
    });

    it("Harus return teks asli jika ENCRYPTION_KEY panjangnya salah (bukan 32 byte)", () => {
      vi.stubEnv("ENCRYPTION_KEY", "abcd"); // terlalu pendek
      const result = encrypt("teks gagal");
      expect(result).toBe("teks gagal");
    });
  });

  // ─────────────────────────────────────
  // decrypt
  // ─────────────────────────────────────
  describe("decrypt", () => {
    it("Harus berhasil decrypt hasil dari encrypt", () => {
      const original = "pesan rahasia 123";
      const encrypted = encrypt(original);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(original);
    });

    it("Harus return string asli jika bukan format enkripsi (tidak ada tanda ':')", () => {
      const result = decrypt("ini bukan hash");
      expect(result).toBe("ini bukan hash");
    });

    it("Harus return string asli jika format salah (bukan 3 bagian)", () => {
      const result = decrypt("hanya:dua");
      expect(result).toBe("hanya:dua");
    });

    it("Harus return hash asli jika decryption gagal (authTag salah)", () => {
      // Buat hash dengan format benar tapi authTag palsu
      const fakeHash = "aXZiYXNlNjQ=:YXV0aFRhZ0Zha2U=:ZW5jcnlwdGVk";
      const result = decrypt(fakeHash);
      // Harus fallback ke hash asli, tidak throw
      expect(result).toBe(fakeHash);
    });

    it("Harus return hash asli jika decrypt tapi key beda (ENCRYPTION_KEY berubah)", () => {
      // Encrypt dengan key awal
      const encrypted = encrypt("data penting");

      // Ganti key — decryption harus gagal dan fallback ke hash
      vi.stubEnv("ENCRYPTION_KEY", "b".repeat(64));
      const result = decrypt(encrypted);
      expect(result).toBe(encrypted); // fallback
    });

    it("Harus return input langsung jika input falsy/kosong", () => {
      // @ts-expect-error testing edge case dengan null
      expect(decrypt(null)).toBeNull();
      // @ts-expect-error testing edge case dengan undefined
      expect(decrypt(undefined)).toBeUndefined();
    });

    it("Harus bisa decrypt teks dengan karakter khusus dan unicode", () => {
      const original = "Halo 🎉 こんにちは <script>alert(1)</script>";
      const encrypted = encrypt(original);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(original);
    });

    it("Harus bisa encrypt dan decrypt string kosong", () => {
      const encrypted = encrypt("");
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe("");
    });
  });
});
