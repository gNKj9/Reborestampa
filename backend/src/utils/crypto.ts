import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";

/** Hash SHA-256 (hex) para guardar refresh tokens sem os expor na DB. */
export function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

/** Comparação em tempo constante para hashes/segredos do mesmo tamanho. */
export function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

export function newId(): string {
  return randomUUID();
}

/**
 * Token opaco para links de email. 32 bytes em base64url: URL-safe, sem
 * ambiguidade de caracteres, 256 bits de entropia.
 */
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}
