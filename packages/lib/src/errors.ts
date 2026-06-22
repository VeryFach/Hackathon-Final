import { ERROR_CODE, HTTP_STATUS, type ErrorCode } from "@repo/constants";

// Base error class. Lempar ini (atau turunannya) di NestJS service/controller,
// lalu tangkap di global exception filter buat di-mapping ke ApiResponse.
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number,
    code: ErrorCode,
    details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found", details?: unknown) {
    super(message, HTTP_STATUS.NOT_FOUND, ERROR_CODE.NOT_FOUND, details);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed", details?: unknown) {
    super(
      message,
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      ERROR_CODE.VALIDATION_ERROR,
      details,
    );
    this.name = "ValidationError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized", details?: unknown) {
    super(message, HTTP_STATUS.UNAUTHORIZED, ERROR_CODE.UNAUTHORIZED, details);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden", details?: unknown) {
    super(message, HTTP_STATUS.FORBIDDEN, ERROR_CODE.FORBIDDEN, details);
    this.name = "ForbiddenError";
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict", details?: unknown) {
    super(message, HTTP_STATUS.CONFLICT, ERROR_CODE.CONFLICT, details);
    this.name = "ConflictError";
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
