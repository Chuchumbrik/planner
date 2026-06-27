/**
 * HTTP API errors — map to { code, message } in errorHandler (see api-http-contracts skill).
 */

export type ApiErrorBody = {
  code: string;
  message: string;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }

  toJSON(): ApiErrorBody {
    return { code: this.code, message: this.message };
  }
}

export function apiError(status: number, code: string, message: string): ApiError {
  return new ApiError(status, code, message);
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}
