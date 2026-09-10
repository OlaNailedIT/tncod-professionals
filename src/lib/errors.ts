export type AppErrorCode =
  | "UNAUTHENTICATED"
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "VALIDATION"
  | "CONFLICT"
  | "DATABASE"
  | "INTERNAL";

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly httpStatus: number;

  constructor(code: AppErrorCode, message: string, httpStatus?: number) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.httpStatus =
      httpStatus ??
      {
        UNAUTHENTICATED: 401,
        UNAUTHORIZED: 403,
        NOT_FOUND: 404,
        VALIDATION: 400,
        CONFLICT: 409,
        DATABASE: 503,
        INTERNAL: 500,
      }[code];
  }
}

export function publicErrorMessage(error: unknown): { code: AppErrorCode; message: string; httpStatus: number } {
  if (error instanceof AppError) {
    return { code: error.code, message: error.message, httpStatus: error.httpStatus };
  }
  return { code: "INTERNAL", message: "An unexpected error occurred", httpStatus: 500 };
}
