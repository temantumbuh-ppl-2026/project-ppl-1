import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { encrypt, decrypt, EncryptionError } from "@/lib/encryption";

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

    it("Harus gagal jika ENCRYPTION_KEY tidak ada", () => {
      vi.stubEnv("ENCRYPTION_KEY", "");
      expect(() => encrypt("teks gagal dienkripsi")).toThrow(EncryptionError);
    });

    it("Harus gagal jika ENCRYPTION_KEY tidak valid", () => {
      vi.stubEnv("ENCRYPTION_KEY", "abcd");
      expect(() => encrypt("teks gagal")).toThrow(EncryptionError);
      vi.stubEnv("ENCRYPTION_KEY", "z".repeat(64));
      expect(() => encrypt("teks gagal")).toThrow(EncryptionError);
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

    it("Harus gagal jika ciphertext rusak (authTag salah)", () => {
      // Buat hash dengan format benar tapi authTag palsu
      const fakeHash = "aXZiYXNlNjQ=:YXV0aFRhZ0Zha2U=:ZW5jcnlwdGVk";
      expect(() => decrypt(fakeHash)).toThrow(EncryptionError);
    });

    it("Harus gagal jika key dekripsi berbeda", () => {
      // Encrypt dengan key awal
      const encrypted = encrypt("data penting");

      // Ganti key — decryption harus gagal dan fallback ke hash
      vi.stubEnv("ENCRYPTION_KEY", "b".repeat(64));
      expect(() => decrypt(encrypted)).toThrow(EncryptionError);
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
