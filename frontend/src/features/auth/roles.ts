import type { Role } from "@/services/api.types";

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrador",
  EDITOR: "Editor",
  VIEWER: "Leitura",
};
