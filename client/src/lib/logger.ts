/**
 * Client-side production-ready logging utility
 * 
 * In development: All logs are shown
 * In production: Only warn and error logs are shown (no debug/info)
 * 
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.info('Component mounted');
 *   logger.debug('Debug info'); // Hidden in production
 *   logger.error('Error occurred', error);
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Detect production mode from Vite
const isProduction = import.meta.env.PROD;

// Minimum log level based on environment
// In production, only show warnings and errors
const MIN_LOG_LEVEL = isProduction ? LOG_LEVELS.warn : LOG_LEVELS.debug;

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= MIN_LOG_LEVEL;
}

class Logger {
  private prefix?: string;

  constructor(prefix?: string) {
    this.prefix = prefix;
  }

  /**
   * Debug level - only shown in development
   */
  debug(message: string, ...args: unknown[]): void {
    if (shouldLog('debug')) {
      const prefixStr = this.prefix ? `[${this.prefix}]` : '[DEBUG]';
      console.log(prefixStr, message, ...args);
    }
  }

  /**
   * Info level - only shown in development
   */
  info(message: string, ...args: unknown[]): void {
    if (shouldLog('info')) {
      const prefixStr = this.prefix ? `[${this.prefix}]` : '[INFO]';
      console.log(prefixStr, message, ...args);
    }
  }

  /**
   * Warning level - shown in production
   */
  warn(message: string, ...args: unknown[]): void {
    if (shouldLog('warn')) {
      const prefixStr = this.prefix ? `[${this.prefix}]` : '[WARN]';
      console.warn(prefixStr, message, ...args);
    }
  }

  /**
   * Error level - always shown
   */
  error(message: string, ...args: unknown[]): void {
    if (shouldLog('error')) {
      const prefixStr = this.prefix ? `[${this.prefix}]` : '[ERROR]';
      console.error(prefixStr, message, ...args);
    }
  }

  /**
   * Create a child logger with a specific prefix
   */
  child(prefix: string): Logger {
    const childPrefix = this.prefix ? `${this.prefix}:${prefix}` : prefix;
    return new Logger(childPrefix);
  }
}

// Default logger instance
export const logger = new Logger();

// Create named loggers for different modules
export const createLogger = (prefix: string): Logger => new Logger(prefix);

export default logger;

