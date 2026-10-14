import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_HEX_LENGTH = 64;
const IV_LENGTH_BYTES = 12;

export class EncryptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EncryptionError";
  }
}

function getEncryptionKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;

  if (!keyHex) {
    throw new EncryptionError(
      "ENCRYPTION_KEY environment variable is missing.",
    );
  }

  if (!/^[0-9a-fA-F]+$/.test(keyHex) || keyHex.length !== KEY_HEX_LENGTH) {
    throw new EncryptionError(
      "ENCRYPTION_KEY must be a 32-byte hex string (64 characters).",
    );
  }

  return Buffer.from(keyHex, "hex");
}

export function encrypt(text: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");

  const authTag = cipher.getAuthTag();

  return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted}`;
}

export function decrypt(hash: string): string {
  if (!hash || typeof hash !== "string") return hash;

  const parts = hash.split(":");
  if (parts.length !== 3) {
    return hash;
  }

  try {
    const [ivStr, authTagStr, encryptedStr] = parts;
    const iv = Buffer.from(ivStr, "base64");
    const authTag = Buffer.from(authTagStr, "base64");
    const key = getEncryptionKey();

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedStr, "base64", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    return hash;
  }
}
