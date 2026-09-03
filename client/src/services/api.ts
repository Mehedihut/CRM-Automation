import { config } from "../config";
import type { ApiResponse, HealthData } from "../types/api";

export class ApiClientError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${config.apiBaseUrl}${path}`;
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
      ...init,
    });
  } catch (err) {
    // Network / CORS / DNS failure.
    throw new ApiClientError(
      0,
      "NETWORK_ERROR",
      err instanceof Error ? err.message : "Network error",
    );
  }

  let body: ApiResponse<T> | null = null;
  try {
    body = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new ApiClientError(
      response.status,
      "INVALID_RESPONSE",
      "Server returned a non-JSON response.",
    );
  }

  if (!body || response.ok) {
    if (body && body.success) return body.data;
  }

  if (body && body.success === false) {
    throw new ApiClientError(
      response.status,
      body.error.code,
      body.error.message,
      body.error.details,
    );
  }

  throw new ApiClientError(
    response.status,
    "UNKNOWN_ERROR",
    `Request failed with status ${response.status}`,
  );
}

export const api = {
  getHealth(): Promise<HealthData> {
    return request<HealthData>("/api/health");
  },
};
