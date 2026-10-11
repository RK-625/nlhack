import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// AES-256-GCM for cfo.ai tokens at rest. Key: CFO_TOKEN_KEY, 32 bytes as base64 or hex
// (generate with `openssl rand -base64 32`). Ciphertext format: "v1:" + base64(iv | tag | data).
// The user id is bound as AAD, so a row copied to another user does not decrypt.

const VERSION = "v1";
const IV_BYTES = 12;
const TAG_BYTES = 16;

// Parse CFO_TOKEN_KEY; throws with a message that never includes the key itself.
export function loadTokenKey(raw = process.env.CFO_TOKEN_KEY): Buffer {
  const value = raw?.trim();
  if (!value) throw new Error("CFO_TOKEN_KEY is not set");
  const key = /^[0-9a-fA-F]{64}$/.test(value) ? Buffer.from(value, "hex") : Buffer.from(value, "base64");
  if (key.length !== 32) throw new Error("CFO_TOKEN_KEY must be 32 bytes (base64 or hex)");
  return key;
}

export function encryptToken(plain: string, aad: string, key = loadTokenKey()): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(aad, "utf8"));
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return `${VERSION}:${Buffer.concat([iv, cipher.getAuthTag(), data]).toString("base64")}`;
}

export function decryptToken(encoded: string, aad: string, key = loadTokenKey()): string {
  const [version, payload] = encoded.split(":", 2);
  if (version !== VERSION || !payload) throw new Error("Unsupported token ciphertext");
  const raw = Buffer.from(payload, "base64");
  if (raw.length < IV_BYTES + TAG_BYTES) throw new Error("Truncated token ciphertext");
  const decipher = createDecipheriv("aes-256-gcm", key, raw.subarray(0, IV_BYTES));
  decipher.setAAD(Buffer.from(aad, "utf8"));
  decipher.setAuthTag(raw.subarray(IV_BYTES, IV_BYTES + TAG_BYTES));
  return Buffer.concat([decipher.update(raw.subarray(IV_BYTES + TAG_BYTES)), decipher.final()]).toString("utf8");
}
