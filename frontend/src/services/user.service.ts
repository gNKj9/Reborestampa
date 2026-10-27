import { apiRequest } from "./api.client";
import type { PublicUser, Role } from "./api.types";

type UserListResponse = {
  items: PublicUser[];
  total: number;
  page: number;
  limit: number;
};

export const userService = {
  list() {
    return apiRequest<UserListResponse>("/users?limit=100");
  },

  async create(input: {
    name: string;
    email: string;
    password: string;
    role: Role;
  }): Promise<PublicUser> {
    const response = await apiRequest<{ user: PublicUser }>("/users", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return response.user;
  },

  async updateAccess(
    id: string,
    input: { role?: Role; isActive?: boolean },
  ): Promise<PublicUser> {
    const response = await apiRequest<{ user: PublicUser }>(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
    return response.user;
  },

  async resetPassword(id: string, newPassword: string): Promise<PublicUser> {
    const response = await apiRequest<{ user: PublicUser }>(
      `/users/${id}/reset-password`,
      { method: "POST", body: JSON.stringify({ newPassword }) },
    );
    return response.user;
  },
};
