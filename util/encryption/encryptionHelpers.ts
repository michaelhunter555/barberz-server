import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "";
const IV_LENGTH = 16; // AES block size

// === Validation ===
if (!ENCRYPTION_KEY) {
  throw new Error("Please add an encryption key.");
}

const keyBuffer = Buffer.from(ENCRYPTION_KEY, "base64");

if (keyBuffer.length !== 32) {
  throw new Error("Encryption key must be 32 bytes when base64 decoded.");
}

// === Encrypt Data ===
export function encryptData(data: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", keyBuffer, iv);
  const encrypted = Buffer.concat([cipher.update(data, "utf8"), cipher.final()]);
  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
}

// === Decrypt Data ===
export function decryptData(data: string): string {
  const [ivHex, ...encryptedParts] = data.split(":");
  if (!ivHex || encryptedParts.length === 0) {
    throw new Error("Invalid encrypted data format.");
  }

  const iv = Buffer.from(ivHex, "hex");
  const encryptedText = Buffer.from(encryptedParts.join(":"), "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", keyBuffer, iv);
  const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
  return decrypted.toString("utf8");
}
