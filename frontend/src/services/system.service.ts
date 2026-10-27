import { apiRequest } from "./api.client";
import type { HealthStatus, ReadinessStatus } from "./api.types";

export const systemService = {
  health(): Promise<HealthStatus> {
    return apiRequest<HealthStatus>("/health", {}, { retryOnAuthError: false });
  },

  readiness(): Promise<ReadinessStatus> {
    return apiRequest<ReadinessStatus>("/health/ready", {}, { retryOnAuthError: false });
  },
};
