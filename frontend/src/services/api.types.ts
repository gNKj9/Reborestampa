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
  passwordChangedAt: string | null;
  createdAt: string;
};

export const CONTACT_STATUSES = ["NEW", "READ", "REPLIED", "ARCHIVED"] as const;
export const NOTIFY_STATUSES = ["PENDING", "SENT", "FAILED", "DISABLED"] as const;
export type NotifyStatus = (typeof NOTIFY_STATUSES)[number];
export type ContactStatus = (typeof CONTACT_STATUSES)[number];

export type ContactRequest = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  message: string;
  status: ContactStatus;
  handledAt: string | null;
  internalNote: string | null;
  noteUpdatedAt: string | null;
  notifyStatus: NotifyStatus;
  notifyError: string | null;
  notifiedAt: string | null;
  createdAt: string;
};

export type ContactListResponse = {
  items: ContactRequest[];
  total: number;
  page: number;
  limit: number;
  counts: Record<ContactStatus, number>;
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
