/**
 * Gera uma palavra-passe legível e forte (para reposições administrativas).
 * Usa `crypto` do browser; nunca é enviada para logs.
 */
const LOWER = "abcdefghijkmnopqrstuvwxyz";
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const DIGITS = "23456789";
const EXTRA = "-_.!@#";

function pick(source: string, length: number): string {
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += source[values[i] % source.length];
  }
  return out;
}

export function generatePassword(length = 18): string {
  const base = pick(LOWER, 6) + pick(UPPER, 5) + pick(DIGITS, 4) + pick(EXTRA, 2);
  const shuffled = base
    .split("")
    .map((char) => ({ char, order: crypto.getRandomValues(new Uint32Array(1))[0] }))
    .sort((a, b) => a.order - b.order)
    .map((entry) => entry.char)
    .join("");

  return lengthen(shuffled, length);
}

function lengthen(value: string, length: number): string {
  if (value.length >= length) return value.slice(0, length);
  return value + pick(LOWER + UPPER + DIGITS, length - value.length);
}
