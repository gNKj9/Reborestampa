import { z } from "zod";

/** Papéis RBAC da aplicação (espelham o enum Role do schema Prisma). */
export const ROLES = ["ADMIN", "EDITOR", "VIEWER"] as const;

export type Role = (typeof ROLES)[number];

export const roleSchema = z.enum(ROLES);

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrador",
  EDITOR: "Editor",
  VIEWER: "Leitura",
};
