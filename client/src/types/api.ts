// Shared API response envelope used by the backend.
// Kept in lock-step with server error/success shapes.

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiErrorBody;

export interface DatabaseStatus {
  configured: boolean;
  reachable: boolean;
  error?: string;
}

export interface HealthData {
  status: "ok" | "degraded";
  uptime: number;
  timestamp: string;
  environment: string;
  database: DatabaseStatus;
}
