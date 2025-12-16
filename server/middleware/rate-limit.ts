import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  firstRequest: number;
}

interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Maximum requests per window
  message?: string;      // Custom error message
  keyGenerator?: (req: Request) => string; // Custom key generator
}

/**
 * Simple in-memory rate limiter
 * For production, consider using Redis-backed rate limiting
 */
class RateLimiter {
  private records: Map<string, RateLimitRecord> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup old records every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, record] of this.records.entries()) {
      if (now - record.firstRequest > 60 * 60 * 1000) { // 1 hour
        this.records.delete(key);
      }
    }
  }

  check(key: string, windowMs: number, maxRequests: number): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const record = this.records.get(key);

    if (!record || now - record.firstRequest > windowMs) {
      // New window or expired window
      this.records.set(key, { count: 1, firstRequest: now });
      return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs };
    }

    // Within window
    record.count++;
    const remaining = Math.max(0, maxRequests - record.count);
    const resetTime = record.firstRequest + windowMs;

    return { allowed: record.count <= maxRequests, remaining, resetTime };
  }

  // Clear rate limit for a specific key (development only)
  clear(key?: string): void {
    if (key) {
      this.records.delete(key);
    } else {
      this.records.clear();
    }
  }

  destroy() {
    clearInterval(this.cleanupInterval);
  }
}

const limiter = new RateLimiter();

// Export limiter for development use (clearing rate limits)
export { limiter };

/**
 * Creates a rate limiting middleware
 */
export function rateLimit(config: RateLimitConfig) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes default
    maxRequests = 100,
    message = 'Too many requests, please try again later.',
    keyGenerator = (req: Request) => req.ip || 'unknown',
  } = config;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const result = limiter.check(key, windowMs, maxRequests);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
    res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());

    if (!result.allowed) {
      res.setHeader('Retry-After', Math.ceil((result.resetTime - Date.now()) / 1000).toString());
      return res.status(429).json({
        error: 'Too Many Requests',
        message,
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
      });
    }

    next();
  };
}

/**
 * Stricter rate limit for authentication endpoints
 * In development, allow more attempts to avoid blocking during setup
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: process.env.NODE_ENV === 'production' ? 10 : 50, // More lenient in development
  message: 'Too many authentication attempts. Please try again in 15 minutes.',
  keyGenerator: (req: Request) => `auth:${req.ip || 'unknown'}`,
});

/**
 * Standard API rate limit
 */
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 500, // 500 requests per 15 minutes
  message: 'API rate limit exceeded. Please slow down your requests.',
  keyGenerator: (req: Request) => `api:${req.ip || 'unknown'}`,
});

/**
 * Stricter rate limit for sensitive operations
 */
export const sensitiveRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 20, // 20 requests per hour
  message: 'Rate limit for sensitive operations exceeded.',
  keyGenerator: (req: Request) => `sensitive:${req.ip || 'unknown'}`,
});

export default rateLimit;

