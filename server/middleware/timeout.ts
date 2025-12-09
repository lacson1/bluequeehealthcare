/**
 * Request Timeout Middleware
 * 
 * Handles slow requests by returning a 503 Service Unavailable after a timeout.
 * This prevents requests from hanging indefinitely.
 */

import { Request, Response, NextFunction } from 'express';
import { apiLogger as logger } from '../lib/logger';

interface TimeoutOptions {
  timeout: number;      // Timeout in milliseconds
  message?: string;     // Custom error message
}

const DEFAULT_TIMEOUT = 30000; // 30 seconds default

/**
 * Creates a timeout middleware for requests
 */
export function requestTimeout(options: TimeoutOptions | number = DEFAULT_TIMEOUT) {
  const config = typeof options === 'number' 
    ? { timeout: options, message: 'Request timeout - please try again' }
    : { timeout: options.timeout, message: options.message || 'Request timeout - please try again' };

  return (req: Request, res: Response, next: NextFunction) => {
    // Skip timeout for streaming responses or long-polling endpoints
    if (req.path.includes('/stream') || req.path.includes('/events') || req.path.includes('/ws')) {
      return next();
    }

    // Skip timeout for file upload endpoints (they need more time)
    if (req.path.includes('/upload') || req.headers['content-type']?.includes('multipart/form-data')) {
      return next();
    }

    let timedOut = false;

    const timeoutId = setTimeout(() => {
      timedOut = true;
      logger.warn(`Request timeout after ${config.timeout}ms: ${req.method} ${req.path}`);
      
      if (!res.headersSent) {
        res.status(503).json({
          success: false,
          error: {
            code: 'REQUEST_TIMEOUT',
            message: config.message,
          },
        });
      }
    }, config.timeout);

    // Clear timeout when response is finished
    res.on('finish', () => {
      clearTimeout(timeoutId);
    });

    // Clear timeout when response is closed (client disconnects)
    res.on('close', () => {
      clearTimeout(timeoutId);
    });

    // Patch res.json to prevent sending response after timeout
    const originalJson = res.json.bind(res);
    res.json = function(body: any) {
      if (timedOut) {
        logger.debug('Suppressing response after timeout');
        return res;
      }
      return originalJson(body);
    };

    next();
  };
}

/**
 * Longer timeout for complex operations
 */
export const longTimeout = requestTimeout({
  timeout: 60000, // 60 seconds
  message: 'Complex operation timed out - please try again',
});

/**
 * Standard API timeout
 */
export const apiTimeout = requestTimeout({
  timeout: 30000, // 30 seconds
  message: 'API request timed out - please try again',
});

/**
 * Short timeout for quick lookups
 */
export const quickTimeout = requestTimeout({
  timeout: 10000, // 10 seconds
  message: 'Request timed out - please try again',
});

export default requestTimeout;

