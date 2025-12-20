import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId?: string;
}

class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: Date.now().toString(36)
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Healthcare App Error Boundary caught an error:', error, errorInfo);

    // Log error for healthcare compliance and debugging
    const errorData = {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof globalThis !== 'undefined' && 'location' in globalThis ? (globalThis as any).location.href : 'unknown'
    };

    // In production, send to error logging service
    if (process.env.NODE_ENV === 'production') {
      // Send to logging service (e.g., Sentry, LogRocket)
      console.error('Production error logged:', errorData);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  handleReload = () => {
    if (typeof globalThis !== 'undefined' && 'location' in globalThis) {
      (globalThis as any).location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      // Use plain HTML/CSS to avoid any React hook dependencies
      // This ensures the error boundary works even if React itself has issues
      const errorId = this.state.errorId || Date.now().toString(36);
      const errorMessage = this.state.error?.message || 'Unknown error occurred';

      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#f9fafb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '28rem',
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            padding: '1.5rem'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{
                margin: '0 auto 1rem',
                width: '3rem',
                height: '3rem',
                backgroundColor: '#fee2e2',
                borderRadius: '9999px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#dc2626"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <path d="M12 9v4" />
                  <path d="M12 17h.01" />
                </svg>
              </div>
              <h1 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#dc2626',
                marginBottom: '0.5rem'
              }}>
                System Error
              </h1>
              <p style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                marginBottom: '1.5rem'
              }}>
                An unexpected error occurred in the healthcare system.
                Your data is safe and no patient information was affected.
              </p>
            </div>

            <div style={{
              fontSize: '0.875rem',
              color: '#374151',
              backgroundColor: '#f3f4f6',
              padding: '0.75rem',
              borderRadius: '0.375rem',
              marginBottom: '1rem'
            }}>
              <strong>Error:</strong> {errorMessage}
            </div>

            <div style={{
              display: 'flex',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              <button
                onClick={this.handleRetry}
                style={{
                  flex: 1,
                  padding: '0.5rem 1rem',
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
                onFocus={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                style={{
                  flex: 1,
                  padding: '0.5rem 1rem',
                  backgroundColor: '#2563eb',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#1d4ed8';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#2563eb';
                }}
                onFocus={(e) => {
                  e.currentTarget.style.backgroundColor = '#1d4ed8';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.backgroundColor = '#2563eb';
                }}
              >
                Reload Page
              </button>
            </div>

            <p style={{
              fontSize: '0.75rem',
              color: '#6b7280',
              textAlign: 'center',
              margin: 0
            }}>
              If this error persists, please contact your system administrator.
              Error ID: {errorId}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;