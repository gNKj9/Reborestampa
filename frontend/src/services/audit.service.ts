import { apiRequest } from "./api.client";

export type AuditEntry = {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
};

export type AuditListResponse = {
  items: AuditEntry[];
  total: number;
  page: number;
  limit: number;
};

export const auditService = {
  list(page = 1) {
    return apiRequest<AuditListResponse>(`/audit?page=${page}&limit=30`);
  },
};
