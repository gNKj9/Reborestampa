"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { setAccessToken, setSessionListener } from "@/services/api.client";
import { authService, type LoginCredentials } from "@/services/auth.service";
import type { PublicUser, SessionPayload } from "@/services/api.types";

type AuthState = {
  user: PublicUser | null;
  status: "loading" | "authenticated" | "anonymous";
  accessTokenExpiresAt: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

/**
 * Estado de sessão do lado do cliente.
 * O access token fica só em memória; ao carregar a página a sessão é
 * recuperada através do refresh token em cookie HttpOnly.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [status, setStatus] = useState<AuthState["status"]>("loading");
  const [accessTokenExpiresAt, setAccessTokenExpiresAt] = useState<string | null>(
    null,
  );

  useEffect(() => {
    setSessionListener((session: SessionPayload | null) => {
      if (!session) {
        setUser(null);
        setAccessTokenExpiresAt(null);
        setStatus("anonymous");
        return;
      }

      setUser(session.user);
      setAccessTokenExpiresAt(session.accessTokenExpiresAt);
      setStatus("authenticated");
    });

    let cancelled = false;

    void authService.restore().then((session) => {
      if (cancelled) return;

      if (session) {
        setUser(session.user);
        setAccessTokenExpiresAt(session.accessTokenExpiresAt);
        setStatus("authenticated");
      } else {
        setStatus("anonymous");
      }
    });

    return () => {
      cancelled = true;
      setSessionListener(null);
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const session = await authService.login(credentials);
    setAccessToken(session.accessToken);
    setUser(session.user);
    setAccessTokenExpiresAt(session.accessTokenExpiresAt);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      // Mesmo que a API falhe, a sessão local é descartada.
      setAccessToken(null);
      setUser(null);
      setAccessTokenExpiresAt(null);
      setStatus("anonymous");
    }
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, status, accessTokenExpiresAt, login, logout }),
    [user, status, accessTokenExpiresAt, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth tem de ser usado dentro de <AuthProvider>");
  }

  return context;
}
