import { apiRequest } from "./api.client";
import type {
  ContactListResponse,
  ContactStatus,
} from "./api.types";

export type ContactInput = {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  message: string;
  /** Honeypot: tem de ir vazio. */
  website?: string;
};

export const contactService = {
  /** Formulário público. */
  async submit(input: ContactInput): Promise<void> {
    await apiRequest<{ ok: true }>(
      "/contact",
      { method: "POST", body: JSON.stringify(input) },
      { retryOnAuthError: false },
    );
  },

  list(params: { status?: ContactStatus; page?: number; limit?: number } = {}) {
    const query = new URLSearchParams();
    if (params.status) query.set("status", params.status);
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    const suffix = query.toString() ? `?${query}` : "";

    return apiRequest<ContactListResponse>(`/contact-requests${suffix}`);
  },

  async updateStatus(id: string, status: ContactStatus) {
    const response = await apiRequest<{ request: ContactListResponse["items"][number] }>(
      `/contact-requests/${id}`,
      { method: "PATCH", body: JSON.stringify({ status }) },
    );
    return response.request;
  },
};
