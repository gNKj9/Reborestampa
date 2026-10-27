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
