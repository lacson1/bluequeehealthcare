import { Response } from 'express';
import { apiLogger as logger } from './logger';

/**
 * Standardized API response types and utilities
 * Ensures consistent response format across all endpoints
 */

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]> | string[];
    stack?: string;
  };
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Standard HTTP error codes
 */
export const ErrorCodes = {
  // Client Errors (4xx)
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  
  // Server Errors (5xx)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

/**
 * Custom API Error class with additional context
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: Record<string, string[]> | string[];
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    code: ErrorCode,
    message: string,
    details?: Record<string, string[]> | string[],
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  // Factory methods for common errors
  static badRequest(message: string, details?: Record<string, string[]>) {
    return new ApiError(400, ErrorCodes.BAD_REQUEST, message, details);
  }

  static unauthorized(message = 'Authentication required') {
    return new ApiError(401, ErrorCodes.UNAUTHORIZED, message);
  }

  static forbidden(message = 'Access denied') {
    return new ApiError(403, ErrorCodes.FORBIDDEN, message);
  }

  static notFound(resource = 'Resource') {
    return new ApiError(404, ErrorCodes.NOT_FOUND, `${resource} not found`);
  }

  static conflict(message: string) {
    return new ApiError(409, ErrorCodes.CONFLICT, message);
  }

  static validationError(details: Record<string, string[]>) {
    return new ApiError(422, ErrorCodes.VALIDATION_ERROR, 'Validation failed', details);
  }

  static rateLimited(message = 'Too many requests') {
    return new ApiError(429, ErrorCodes.RATE_LIMITED, message);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(500, ErrorCodes.INTERNAL_ERROR, message, undefined, false);
  }

  static databaseError(message = 'Database operation failed') {
    return new ApiError(500, ErrorCodes.DATABASE_ERROR, message, undefined, false);
  }
}

/**
 * Send a successful API response
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  options: {
    statusCode?: number;
    message?: string;
    meta?: ApiSuccessResponse['meta'];
  } = {}
): Response {
  const { statusCode = 200, message, meta } = options;
  
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
    ...(meta && { meta }),
  };
  
  return res.status(statusCode).json(response);
}

/**
 * Send a paginated API response
 */
export function sendPaginated<T>(
  res: Response,
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
  },
  message?: string
): Response {
  const totalPages = Math.ceil(pagination.total / pagination.limit);
  
  return sendSuccess(res, data, {
    message,
    meta: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages,
    },
  });
}

/**
 * Send an error API response
 */
export function sendError(
  res: Response,
  error: ApiError | Error | unknown,
  includeStack = process.env.NODE_ENV === 'development'
): Response {
  // Handle ApiError instances
  if (error instanceof ApiError) {
    const response: ApiErrorResponse = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.details && { details: error.details }),
        ...(includeStack && error.stack && { stack: error.stack }),
      },
    };
    return res.status(error.statusCode).json(response);
  }

  // Handle standard Error instances
  if (error instanceof Error) {
    const response: ApiErrorResponse = {
      success: false,
      error: {
        code: ErrorCodes.INTERNAL_ERROR,
        message: process.env.NODE_ENV === 'production' 
          ? 'An unexpected error occurred' 
          : error.message,
        ...(includeStack && error.stack && { stack: error.stack }),
      },
    };
    return res.status(500).json(response);
  }

  // Handle unknown error types
  const response: ApiErrorResponse = {
    success: false,
    error: {
      code: ErrorCodes.INTERNAL_ERROR,
      message: 'An unexpected error occurred',
    },
  };
  return res.status(500).json(response);
}

/**
 * Async route handler wrapper that catches errors
 * Eliminates try-catch boilerplate in route handlers
 */
export function asyncHandler<T>(
  fn: (req: T, res: Response) => Promise<Response | void>
) {
  return (req: T, res: Response, next: Function) => {
    Promise.resolve(fn(req, res)).catch((error) => {
      // Log the error with appropriate level
      if (error instanceof ApiError && error.isOperational) {
        logger.warn('Route handler error:', error.message);
      } else {
        logger.error('Route handler error:', error);
      }
      
      // Send error response
      sendError(res, error);
    });
  };
}

export default {
  ApiError,
  ErrorCodes,
  sendSuccess,
  sendPaginated,
  sendError,
  asyncHandler,
};

