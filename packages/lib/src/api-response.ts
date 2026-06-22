// Shape response API yang konsisten antara NestJS dan dikonsumsi FE (axios + react-query)
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  code: string;
  details?: unknown;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export function successResponse<T>(
  data: T,
  meta?: Record<string, unknown>
): ApiSuccessResponse<T> {
  return { success: true, data, ...(meta ? { meta } : {}) };
}

export function errorResponse(
  message: string,
  code: string,
  details?: unknown
): ApiErrorResponse {
  return { success: false, message, code, ...(details !== undefined ? { details } : {}) };
}
