import { argon2id, hash, verify, type HashOptions } from "argon2";

/**
 * Hash de passwords com Argon2id.
 * Parâmetros alinhados com a recomendação OWASP (19 MiB, 2 iterações, 1 thread).
 */
const HASH_OPTIONS: HashOptions = {
  type: argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
};

export function hashPassword(plain: string): Promise<string> {
  return hash(plain, HASH_OPTIONS);
}

export async function verifyPassword(
  digest: string,
  plain: string,
): Promise<boolean> {
  try {
    return await verify(digest, plain);
  } catch {
    return false;
  }
}

/**
 * Hash descartável usado quando o email não existe.
 * Iguala o custo de CPU de um login válido e evita enumeração de contas
 * por diferença de tempo de resposta.
 */
let dummyHashPromise: Promise<string> | undefined;

export function getDummyHash(): Promise<string> {
  dummyHashPromise ??= hashPassword(
    "dummy-password-para-igualar-o-tempo-de-resposta",
  );
  return dummyHashPromise;
}
