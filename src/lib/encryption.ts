import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

export class EncryptionError extends Error {
  constructor(message = "Data percakapan tidak dapat diproses dengan aman.") {
    super(message);
    this.name = "EncryptionError";
  }
}

function getEncryptionKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error("ENCRYPTION_KEY environment variable is missing.");
  }

  const keyBuffer = Buffer.from(keyHex, "hex");
  if (!/^[0-9a-fA-F]{64}$/.test(keyHex) || keyBuffer.length !== 32) {
    throw new Error(
      "ENCRYPTION_KEY must be a 32-byte hex string (64 characters).",
    );
  }

  return keyBuffer;
}

export function encrypt(text: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, "utf8", "base64");
    encrypted += cipher.final("base64");

    const authTag = cipher.getAuthTag();

    // Preserve the format used by existing encrypted diary messages.
    return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted}`;
  } catch {
    throw new EncryptionError();
  }
}

export function decrypt(hash: string): string {
  if (!hash || typeof hash !== "string") return hash;

  const parts = hash.split(":");
  if (parts.length !== 3) {
    // Return original if it's not encrypted (e.g. old unencrypted messages)
    return hash;
  }

  try {
    const [ivStr, authTagStr, encryptedStr] = parts;
    const iv = Buffer.from(ivStr, "base64");
    const authTag = Buffer.from(authTagStr, "base64");
    if (iv.length !== 12 || authTag.length !== 16) {
      throw new EncryptionError();
    }
    const key = getEncryptionKey();

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedStr, "base64", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch {
    throw new EncryptionError();
  }
}
