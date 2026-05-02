/**
 * Standardized Error Codes for the API
 */
export const ErrorCode = {
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
};

/**
 * AppError — Custom error class for API responses
 */
export class AppError extends Error {
  constructor(message, status = 400, code = ErrorCode.BAD_REQUEST, details = null) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.name = 'AppError';
  }

  toJSON() {
    return {
      error: this.message,
      code: this.code,
      details: this.details,
    };
  }
}

/**
 * Factory functions for common errors
 */
export const Errors = {
  notFound: (msg = 'Resource not found') => new AppError(msg, 404, ErrorCode.NOT_FOUND),
  unauthorized: (msg = 'Authentication required') => new AppError(msg, 401, ErrorCode.UNAUTHORIZED),
  forbidden: (msg = 'Access denied') => new AppError(msg, 403, ErrorCode.FORBIDDEN),
  badRequest: (msg = 'Invalid request', details = null) => new AppError(msg, 400, ErrorCode.BAD_REQUEST, details),
  validation: (details) => new AppError('Validation failed', 400, ErrorCode.VALIDATION_ERROR, details),
  conflict: (msg = 'Resource already exists') => new AppError(msg, 409, ErrorCode.CONFLICT),
  internal: (msg = 'An unexpected error occurred') => new AppError(msg, 500, ErrorCode.INTERNAL_ERROR),
};
