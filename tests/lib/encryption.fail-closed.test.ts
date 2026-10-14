import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  decrypt,
  encrypt,
  EncryptionError,
} from "@/lib/encryption.fail-closed";

const VALID_KEY = "a".repeat(64);

describe("lib/encryption.fail-closed", () => {
  beforeEach(() => {
    vi.stubEnv("ENCRYPTION_KEY", VALID_KEY);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("encrypts data with iv:authTag:ciphertext format", () => {
    const encrypted = encrypt("pesan rahasia");

    expect(encrypted).not.toBe("pesan rahasia");
    expect(encrypted.split(":")).toHaveLength(3);
  });

  it("decrypts encrypted data back to the original text", () => {
    const original = "data diary yang sensitif";
    const encrypted = encrypt(original);

    expect(decrypt(encrypted)).toBe(original);
  });

  it("uses a random IV for each encryption call", () => {
    const first = encrypt("teks sama");
    const second = encrypt("teks sama");

    expect(first).not.toBe(second);
  });

  it("throws instead of returning plaintext when ENCRYPTION_KEY is missing", () => {
    vi.stubEnv("ENCRYPTION_KEY", "");

    expect(() => encrypt("jangan simpan plaintext")).toThrow(EncryptionError);
  });

  it("throws instead of returning plaintext when ENCRYPTION_KEY is invalid", () => {
    vi.stubEnv("ENCRYPTION_KEY", "abcd");

    expect(() => encrypt("jangan simpan plaintext")).toThrow(
      "ENCRYPTION_KEY must be a 32-byte hex string",
    );
  });

  it("keeps decrypt backward-compatible for old plaintext values", () => {
    expect(decrypt("ini data lama yang belum terenkripsi")).toBe(
      "ini data lama yang belum terenkripsi",
    );
  });

  it("returns the original hash when decryption fails", () => {
    const encrypted = encrypt("data penting");

    vi.stubEnv("ENCRYPTION_KEY", "b".repeat(64));

    expect(decrypt(encrypted)).toBe(encrypted);
  });
});
