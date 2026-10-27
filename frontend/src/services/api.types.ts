/**
 * Contratos partilhados com a API.
 * Mantidos à parte do cliente HTTP para evitar dependências circulares.
 */

export const ROLES = ["ADMIN", "EDITOR", "VIEWER"] as const;
export type Role = (typeof ROLES)[number];

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

export type SessionPayload = {
  user: PublicUser;
  accessToken: string;
  accessTokenExpiresAt: string;
  tokenType: "Bearer";
  expiresIn: number;
};

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
    requestId?: string;
  };
};

export type HealthStatus = {
  status: string;
  service?: string;
  uptime?: number;
  timestamp?: string;
};

export type ReadinessStatus = {
  status: "ready" | "unavailable";
  database: "up" | "down";
};
