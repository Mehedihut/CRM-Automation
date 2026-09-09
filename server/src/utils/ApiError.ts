/**
 * Domain error type used across controllers/services.
 * Carries an HTTP status and a safe, user-facing message.
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    Error.captureStackTrace?.(this, this.constructor);
  }

  static badRequest(message: string, details?: unknown): ApiError {
    return new ApiError(400, "BAD_REQUEST", message, details);
  }
  static unauthorized(message = "Unauthorized"): ApiError {
    return new ApiError(401, "UNAUTHORIZED", message);
  }
  static forbidden(message = "Forbidden"): ApiError {
    return new ApiError(403, "FORBIDDEN", message);
  }
  static notFound(message = "Resource not found"): ApiError {
    return new ApiError(404, "NOT_FOUND", message);
  }
  static conflict(message: string): ApiError {
    return new ApiError(409, "CONFLICT", message);
  }
  static internal(message = "Internal server error"): ApiError {
    return new ApiError(500, "INTERNAL_ERROR", message);
  }
  static notImplemented(message: string): ApiError {
    return new ApiError(501, "NOT_IMPLEMENTED", message);
  }
  static tooManyRequests(message = "Too many requests"): ApiError {
    return new ApiError(429, "TOO_MANY_REQUESTS", message);
  }
}
