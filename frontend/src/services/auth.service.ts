import { apiRequest, refreshSession } from "./api.client";
import type { PublicUser, SessionPayload } from "./api.types";

export type LoginCredentials = {
  email: string;
  password: string;
};

export const authService = {
  login(credentials: LoginCredentials): Promise<SessionPayload> {
    return apiRequest<SessionPayload>(
      "/auth/login",
      { method: "POST", body: JSON.stringify(credentials) },
      { retryOnAuthError: false },
    );
  },

  /** Recupera a sessão a partir do cookie HttpOnly (após reload/nova aba). */
  restore(): Promise<SessionPayload | null> {
    return refreshSession();
  },

  async logout(): Promise<void> {
    await apiRequest<void>("/auth/logout", { method: "POST" }, { retryOnAuthError: false });
  },

  async me(): Promise<PublicUser> {
    const response = await apiRequest<{ user: PublicUser }>("/auth/me");
    return response.user;
  },

  /** Pede o link de recuperação. Resposta uniforme, exista ou não a conta. */
  requestPasswordReset(email: string): Promise<{ ok: true; devToken?: string }> {
    return apiRequest<{ ok: true; devToken?: string }>(
      "/auth/forgot-password",
      { method: "POST", body: JSON.stringify({ email }) },
      { retryOnAuthError: false },
    );
  },

  /** Consome o link do email e define a nova palavra-passe. */
  async resetPasswordWithToken(input: {
    token: string;
    newPassword: string;
  }): Promise<void> {
    await apiRequest<void>(
      "/auth/reset-password",
      { method: "POST", body: JSON.stringify(input) },
      { retryOnAuthError: false },
    );
  },

  async changePassword(input: {
    currentPassword: string;
    newPassword: string;
  }): Promise<PublicUser> {
    const response = await apiRequest<{ user: PublicUser }>("/auth/password", {
      method: "PATCH",
      body: JSON.stringify(input),
    });
    return response.user;
  },
};
