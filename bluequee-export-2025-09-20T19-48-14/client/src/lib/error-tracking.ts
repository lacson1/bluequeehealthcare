import { useToast } from "@/hooks/use-toast";

// Error types for better categorization
export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  UNKNOWN = 'UNKNOWN'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface ErrorContext {
  userId?: number;
  organizationId?: number;
  patientId?: number;
  url?: string;
  userAgent?: string;
  timestamp: Date;
  sessionId?: string;
  action?: string;
  component?: string;
}

export interface AppError {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  originalError?: Error;
  context: ErrorContext;
  stack?: string;
  resolved?: boolean;
  retryable?: boolean;
}

class ErrorTracker {
  private errors: AppError[] = [];
  private maxErrors = 100;
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupGlobalErrorHandlers();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupGlobalErrorHandlers() {
    // Handle uncaught JavaScript errors
    window.addEventListener('error', (event) => {
      this.trackError({
        type: ErrorType.CLIENT,
        severity: ErrorSeverity.HIGH,
        message: event.message || 'JavaScript error',
        originalError: event.error,
        context: {
          url: event.filename || window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date(),
          sessionId: this.sessionId,
          component: 'global-error-handler'
        },
        stack: event.error?.stack,
        retryable: false
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        type: ErrorType.CLIENT,
        severity: ErrorSeverity.HIGH,
        message: `Unhandled promise rejection: ${event.reason}`,
        originalError: event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        context: {
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date(),
          sessionId: this.sessionId,
          component: 'promise-rejection-handler'
        },
        stack: event.reason?.stack,
        retryable: false
      });
    });
  }

  trackError(error: Partial<AppError>): void {
    const appError: AppError = {
      id: error.id || `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: error.type || ErrorType.UNKNOWN,
      severity: error.severity || ErrorSeverity.MEDIUM,
      message: error.message || 'Unknown error',
      originalError: error.originalError,
      context: {
        ...error.context,
        timestamp: error.context?.timestamp || new Date(),
        sessionId: error.context?.sessionId || this.sessionId,
        url: error.context?.url || window.location.href,
        userAgent: error.context?.userAgent || navigator.userAgent
      },
      stack: error.stack || error.originalError?.stack,
      resolved: false,
      retryable: error.retryable || false
    };

    // Add to local storage
    this.errors.push(appError);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Send to server
    this.sendErrorToServer(appError);
  }

  private async sendErrorToServer(error: AppError): Promise<void> {
    try {
      await fetch('/api/errors/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders()
        },
        body: JSON.stringify({ error })
      });
    } catch (networkError) {
      console.error('Failed to send error to server:', networkError);
    }
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('clinic_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  getErrors(): AppError[] {
    return [...this.errors];
  }

  clearErrors(): void {
    this.errors = [];
  }
}

// Global error tracker instance
export const errorTracker = new ErrorTracker();

// Convenience functions for manual error tracking
export const trackError = (error: Partial<AppError>) => {
  errorTracker.trackError(error);
};

export const trackNetworkError = (error: Error, url: string) => {
  trackError({
    type: ErrorType.NETWORK,
    severity: ErrorSeverity.HIGH,
    message: `Network error: ${error.message}`,
    originalError: error,
    context: {
      url,
      timestamp: new Date(),
      component: 'network-request'
    }
  });
};

export const trackValidationError = (message: string, component: string) => {
  trackError({
    type: ErrorType.VALIDATION,
    severity: ErrorSeverity.MEDIUM,
    message: `Validation error: ${message}`,
    context: {
      timestamp: new Date(),
      component
    }
  });
};

export const trackAuthError = (message: string) => {
  trackError({
    type: ErrorType.AUTHENTICATION,
    severity: ErrorSeverity.HIGH,
    message: `Authentication error: ${message}`,
    context: {
      timestamp: new Date(),
      component: 'authentication'
    }
  });
};

// Initialize error tracking when module loads
if (typeof window !== 'undefined') {
  // Error tracker is automatically initialized above
  console.log('🔍 Error tracking system initialized');
}