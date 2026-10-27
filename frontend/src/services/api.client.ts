import type {
  ApiErrorBody,
  PublicUser,
  SessionPayload,
} from "./api.types";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"
).replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: Array<{ field: string; message: string }>,
    readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * O access token vive apenas em memória (nunca em localStorage):
 * um XSS não consegue ler um token persistido. O refresh token está num
 * cookie HttpOnly gerido pelo browser, fora do alcance de JavaScript.
 */
let accessToken: string | null = null;
let refreshInFlight: Promise<SessionPayload | null> | null = null;
let sessionListener: ((session: SessionPayload | null) => void) | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

/** O AuthProvider subscreve para refletir renovações/expirações de sessão. */
export function setSessionListener(
  listener: ((session: SessionPayload | null) => void) | null,
): void {
  sessionListener = listener;
}

async function request(path: string, init: RequestInit): Promise<Response> {
  const headers = new Headers(init.headers);

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
    cache: "no-store",
  });
}

async function toApiError(response: Response): Promise<ApiError> {
  let body: ApiErrorBody | null = null;

  try {
    body = (await response.json()) as ApiErrorBody;
  } catch {
    body = null;
  }

  return new ApiError(
    response.status,
    body?.error.code ?? "UNKNOWN",
    body?.error.message ?? "Não foi possível concluir o pedido.",
    body?.error.details,
    body?.error.requestId,
  );
}

/**
 * Renovação de sessão com "single flight": várias chamadas em paralelo que
 * recebem 401 partilham o mesmo pedido de refresh (evita corridas e
 * revogação em cadeia de refresh tokens rotativos).
 */
export function refreshSession(): Promise<SessionPayload | null> {
  refreshInFlight ??= (async () => {
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });

      if (response.status === 204) {
        setAccessToken(null);
        return null;
      }

      if (!response.ok) {
        setAccessToken(null);
        sessionListener?.(null);
        return null;
      }

      const session = (await response.json()) as SessionPayload;
      setAccessToken(session.accessToken);
      sessionListener?.(session);
      return session;
    } catch {
      setAccessToken(null);
      sessionListener?.(null);
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

type RequestOptions = {
  /** false para endpoints de auth: evita loops de refresh. */
  retryOnAuthError?: boolean;
};

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  options: RequestOptions = {},
): Promise<T> {
  let response = await request(path, init);

  if (response.status === 401 && options.retryOnAuthError !== false) {
    const session = await refreshSession();
    if (session) {
      response = await request(path, init);
    }
  }

  if (!response.ok) {
    throw await toApiError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export { API_URL };
export type { PublicUser, SessionPayload };
