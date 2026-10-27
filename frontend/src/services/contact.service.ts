import { apiFetchBlob, apiRequest } from "./api.client";
import type { ContactListResponse, ContactRequest, ContactStatus } from "./api.types";

export type ContactInput = {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  message: string;
  /** Honeypot: tem de ir vazio. */
  website?: string;
};

type ListParams = {
  status?: ContactStatus;
  q?: string;
  page?: number;
  limit?: number;
};

function toQuery(params: ListParams): string {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.q) query.set("q", params.q);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  const suffix = query.toString();
  return suffix ? `?${suffix}` : "";
}

export const contactService = {
  /** Formulário público. */
  async submit(input: ContactInput): Promise<void> {
    await apiRequest<{ ok: true }>(
      "/contact",
      { method: "POST", body: JSON.stringify(input) },
      { retryOnAuthError: false },
    );
  },

  list(params: ListParams = {}) {
    return apiRequest<ContactListResponse>(
      `/contact-requests${toQuery(params)}`,
    );
  },

  async updateStatus(id: string, status: ContactStatus): Promise<ContactRequest> {
    const response = await apiRequest<{ request: ContactRequest }>(
      `/contact-requests/${id}`,
      { method: "PATCH", body: JSON.stringify({ status }) },
    );
    return response.request;
  },

  async updateNote(id: string, note: string): Promise<ContactRequest> {
    const response = await apiRequest<{ request: ContactRequest }>(
      `/contact-requests/${id}/note`,
      { method: "PATCH", body: JSON.stringify({ note }) },
    );
    return response.request;
  },

  /** Descarrega o CSV do filtro atual. */
  async downloadCsv(params: { status?: ContactStatus; q?: string }): Promise<void> {
    const blob = await apiFetchBlob(
      `/contact-requests/export.csv${toQuery(params)}`,
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pedidos-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  },
};
