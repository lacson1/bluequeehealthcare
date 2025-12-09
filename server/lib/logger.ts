/**
 * Production-ready logging utility
 * 
 * In development: All logs are shown
 * In production: Only info, warn, and error logs are shown (no debug)
 * 
 * Usage:
 *   import { logger } from './lib/logger';
 *   logger.info('Server started');
 *   logger.debug('Debug info'); // Hidden in production
 *   logger.error('Error occurred', error);
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
  prefix?: string;
  timestamps?: boolean;
}

const isProduction = process.env.NODE_ENV === 'production';
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Minimum log level based on environment
const MIN_LOG_LEVEL = isProduction ? LOG_LEVELS.info : LOG_LEVELS.debug;

function formatTimestamp(): string {
  return new Date().toISOString();
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= MIN_LOG_LEVEL;
}

function formatMessage(level: LogLevel, message: string, prefix?: string): string {
  const timestamp = formatTimestamp();
  const levelUpper = level.toUpperCase().padEnd(5);
  const prefixStr = prefix ? `[${prefix}] ` : '';
  return `${timestamp} ${levelUpper} ${prefixStr}${message}`;
}

class Logger {
  private prefix?: string;
  private timestamps: boolean;

  constructor(options: LoggerOptions = {}) {
    this.prefix = options.prefix;
    this.timestamps = options.timestamps ?? true;
  }

  /**
   * Debug level - only shown in development
   */
  debug(message: string, ...args: unknown[]): void {
    if (shouldLog('debug')) {
      if (this.timestamps) {
        console.log(formatMessage('debug', message, this.prefix), ...args);
      } else {
        console.log(`[DEBUG]${this.prefix ? ` [${this.prefix}]` : ''} ${message}`, ...args);
      }
    }
  }

  /**
   * Info level - general information
   */
  info(message: string, ...args: unknown[]): void {
    if (shouldLog('info')) {
      if (this.timestamps) {
        console.log(formatMessage('info', message, this.prefix), ...args);
      } else {
        console.log(`[INFO]${this.prefix ? ` [${this.prefix}]` : ''} ${message}`, ...args);
      }
    }
  }

  /**
   * Warning level - potential issues
   */
  warn(message: string, ...args: unknown[]): void {
    if (shouldLog('warn')) {
      if (this.timestamps) {
        console.warn(formatMessage('warn', message, this.prefix), ...args);
      } else {
        console.warn(`[WARN]${this.prefix ? ` [${this.prefix}]` : ''} ${message}`, ...args);
      }
    }
  }

  /**
   * Error level - actual errors
   */
  error(message: string, ...args: unknown[]): void {
    if (shouldLog('error')) {
      if (this.timestamps) {
        console.error(formatMessage('error', message, this.prefix), ...args);
      } else {
        console.error(`[ERROR]${this.prefix ? ` [${this.prefix}]` : ''} ${message}`, ...args);
      }
    }
  }

  /**
   * Create a child logger with a specific prefix
   */
  child(prefix: string): Logger {
    const childPrefix = this.prefix ? `${this.prefix}:${prefix}` : prefix;
    return new Logger({ prefix: childPrefix, timestamps: this.timestamps });
  }
}

// Default logger instance
export const logger = new Logger();

// Create named loggers for different modules
export const createLogger = (prefix: string): Logger => new Logger({ prefix });

// Convenience exports for common modules
export const authLogger = createLogger('auth');
export const dbLogger = createLogger('db');
export const apiLogger = createLogger('api');
export const sessionLogger = createLogger('session');

export default logger;

