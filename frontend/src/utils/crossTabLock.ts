/**
 * Cadeado entre separadores do mesmo site.
 *
 * O access token vive em memória, por isso cada separador tem o seu. O refresh
 * token é um cookie partilhado: se duas abas o tentarem rodar no mesmo instante,
 * uma delas apresenta um token já consumido e o servidor — corretamente — revoga
 * a família toda. O resultado para o utilizador é um logout sem motivo.
 *
 * Este cadeado serializa a renovação: quem não o consegue apanhar espera que o
 * outro acabe e renova depois, já com o cookie rodado. Não guarda nem partilha
 * tokens — só um sinal de "estou a renovar" com validade curta.
 */
const DEFAULT_TTL_MS = 5_000;
const DEFAULT_WAIT_MS = 2_500;
const POLL_MS = 100;

type LockRecord = {
  id: string;
  expiresAt: number;
};

function readLock(name: string): LockRecord | null {
  try {
    const raw = localStorage.getItem(name);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<LockRecord>;
    if (typeof parsed.id !== "string" || typeof parsed.expiresAt !== "number") {
      return null;
    }

    return { id: parsed.id, expiresAt: parsed.expiresAt };
  } catch {
    return null;
  }
}

/**
 * Tenta apanhar o cadeado. Devolve a função de libertação, ou `null` se o tempo
 * de espera esgotar — nesse caso quem chamou deve seguir em frente, porque ficar
 * bloqueado é pior do que uma renovação a mais.
 */
export async function acquireCrossTabLock(
  name: string,
  options: { ttlMs?: number; waitMs?: number } = {},
): Promise<(() => void) | null> {
  if (typeof window === "undefined") {
    return () => {};
  }

  const ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
  const waitMs = options.waitMs ?? DEFAULT_WAIT_MS;
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  const deadline = Date.now() + waitMs;

  while (Date.now() < deadline) {
    const current = readLock(name);

    if (!current || current.expiresAt <= Date.now()) {
      try {
        localStorage.setItem(
          name,
          JSON.stringify({ id, expiresAt: Date.now() + ttlMs } satisfies LockRecord),
        );
      } catch {
        // localStorage indisponível (modo privado antigo): não vale a pena travar.
        return () => {};
      }

      // Confirma a posse: dois separadores podem escrever no mesmo milissegundo.
      if (readLock(name)?.id === id) {
        return () => {
          if (readLock(name)?.id === id) {
            try {
              localStorage.removeItem(name);
            } catch {
              // sem consequência: o registo expira sozinho
            }
          }
        };
      }
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }

  return null;
}

export const REFRESH_LOCK_KEY = "rb:refresh-lock";
