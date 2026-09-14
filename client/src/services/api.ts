import { config } from "../config";
import type { ApiResponse } from "../types/api";

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

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown; // will be JSON.stringified unless it's already a string/FormData
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;
  const url = `${config.apiBaseUrl}${path}`;

  // Only set Content-Type when we actually send a JSON body.
  const finalHeaders: Record<string, string> = { ...(headers as Record<string, string>) };
  let finalBody: BodyInit | undefined;
  if (body !== undefined && body !== null) {
    if (typeof body === "string" || body instanceof FormData) {
      finalBody = body;
    } else {
      finalHeaders["Content-Type"] = "application/json";
      finalBody = JSON.stringify(body);
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      credentials: "include",
      ...rest,
      headers: finalHeaders,
      body: finalBody,
    });
  } catch (err) {
    throw new ApiClientError(
      0,
      "NETWORK_ERROR",
      err instanceof Error ? err.message : "Network error",
    );
  }

  // Read body once, then decide.
  const text = await response.text();
  let parsed: ApiResponse<T> | null = null;
  if (text) {
    try {
      parsed = JSON.parse(text) as ApiResponse<T>;
    } catch {
      // Non-JSON response.
      if (response.ok) {
        throw new ApiClientError(
          response.status,
          "INVALID_RESPONSE",
          "Server returned a non-JSON success response.",
        );
      }
      throw new ApiClientError(
        response.status,
        "INVALID_RESPONSE",
        `Server returned a non-JSON response: ${text.slice(0, 200)}`,
      );
    }
  }

  if (response.ok && parsed && parsed.success === true) {
    return parsed.data;
  }

  if (parsed && parsed.success === false) {
    throw new ApiClientError(
      response.status,
      parsed.error.code,
      parsed.error.message,
      parsed.error.details,
    );
  }

  throw new ApiClientError(
    response.status,
    "UNKNOWN_ERROR",
    `Request failed with status ${response.status}`,
  );
}

export const api = {
  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>(path, { ...options, method: "GET" });
  },
  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>(path, { ...options, method: "POST", body });
  },
  patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>(path, { ...options, method: "PATCH", body });
  },
  put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>(path, { ...options, method: "PUT", body });
  },
  delete<T = void>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>(path, { ...options, method: "DELETE" });
  },
};
