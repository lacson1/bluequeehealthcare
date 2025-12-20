import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    // Suppress console logging for expected 403 errors on notifications
    if (res.status === 403 && res.url.includes('/notifications')) {
      // Don't log this error - it's expected during app initialization
      throw new Error(`${res.status}: ${text}`);
    }
    
    // Try to parse as JSON for better error messages
    try {
      const errorData = JSON.parse(text);
      
      // Extract error message from nested structure: { success: false, error: { message: "...", code: "..." } }
      let errorMsg = '';
      
      if (errorData.error) {
        // Handle nested error structure
        const errorObj = errorData.error;
        errorMsg = errorObj.message || '';
        
        // Handle specific error codes with user-friendly messages
        if (errorObj.code === 'INTERNAL_ERROR' || errorObj.code === 'SERVICE_UNAVAILABLE') {
          // Check if it's a database connection error
          if (errorObj.stack?.includes('ECONNREFUSED') || errorMsg.includes('connection') || errorMsg.includes('ECONNREFUSED')) {
            errorMsg = 'Database connection failed. Please ensure the database server is running.';
          } else if (!errorMsg || errorMsg.trim() === '') {
            errorMsg = 'An internal server error occurred. Please try again later.';
          }
        } else if (errorObj.code === 'DATABASE_ERROR') {
          errorMsg = errorMsg || 'Database operation failed. Please try again.';
        }
      } else if (errorData.message) {
        // Fallback to top-level message
        errorMsg = errorData.message;
      } else {
        // Last resort: use status text or raw text
        errorMsg = res.statusText || text;
      }
      
      // Handle organization context errors with helpful message
      if (errorMsg && (errorMsg.includes('Organization context required') || 
                       errorMsg.includes('Organization access required') ||
                       errorMsg.includes('organization context'))) {
        errorMsg = 'Your account is not assigned to an organization. Please contact an administrator to assign you to an organization, or use the admin panel to assign yourself.';
      }
      
      // If we still don't have a message, provide a default based on status code
      if (!errorMsg || errorMsg.trim() === '') {
        switch (res.status) {
          case 500:
            errorMsg = 'An internal server error occurred. Please try again later.';
            break;
          case 503:
            errorMsg = 'Service temporarily unavailable. Please try again later.';
            break;
          case 502:
            errorMsg = 'Bad gateway. The server is temporarily unavailable.';
            break;
          default:
            errorMsg = `Request failed with status ${res.status}`;
        }
      }
      
      throw new Error(`${res.status}: ${errorMsg}`);
    } catch (e) {
      // If not JSON or parsing failed, throw a clean error message
      if (text.includes('ECONNREFUSED') || text.includes('connection')) {
        throw new Error(`${res.status}: Database connection failed. Please ensure the database server is running.`);
      }
      throw new Error(`${res.status}: ${text}`);
    }
  }
}

function getAuthHeaders(): Record<string, string> {
  // Session-based authentication - no need for Authorization headers
  // Cookies are automatically included with credentials: "include"
  return {};
}

export async function apiRequest(
  url: string,
  method: string = 'GET',
  data?: unknown | undefined,
): Promise<Response> {
  // Validate HTTP method
  const validMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
  const upperMethod = (method || 'GET').toUpperCase();
  
  if (!validMethods.includes(upperMethod)) {
    throw new Error(`Invalid HTTP method: ${method || 'undefined'}. Must be one of: ${validMethods.join(', ')}`);
  }

  const headers = {
    ...getAuthHeaders(),
    ...(data ? { "Content-Type": "application/json" } : {}),
  };

  // Production: Remove debug logging

  // Ensure fetch is available
  const fetchFn = globalThis.fetch || window.fetch;
  if (!fetchFn) {
    throw new Error('Fetch API is not available');
  }

  const res = await fetchFn(url, {
    method: upperMethod,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  // Production: Remove debug logging
  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const headers = {
      ...getAuthHeaders()
    };

    // Ensure fetch is available
    const fetchFn = globalThis.fetch || window.fetch;
    if (!fetchFn) {
      throw new Error('Fetch API is not available');
    }

    const url = queryKey[0] as string;
    
    try {
      const res = await fetchFn(url, {
        method: "GET",
        headers,
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      // Silently handle 403 errors for notifications endpoint during initialization
      if (res.status === 403 && url.includes('/notifications')) {
        return { notifications: [], totalCount: 0, unreadCount: 0 } as any;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error: any) {
      // Handle network errors (Failed to fetch, CORS, etc.)
      if (error.message?.includes('Failed to fetch') || 
          error.message?.includes('NetworkError') ||
          error.name === 'TypeError' ||
          error.name === 'NetworkError') {
        throw new Error(`Network error: Unable to connect to the server. Please check your internet connection and ensure the server is running.`);
      }
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false, // Disable automatic polling by default
      refetchOnWindowFocus: false, // Disable refetch on window focus
      refetchOnMount: false, // Don't refetch on mount if data is fresh
      refetchOnReconnect: false, // Don't refetch on reconnect if data is fresh
      staleTime: 5 * 60 * 1000, // Data stays fresh for 5 minutes (reduces unnecessary refetches)
      gcTime: 10 * 60 * 1000, // Keep unused data in cache for 10 minutes
      retry: 1, // Retry once on failure (was 0)
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      networkMode: 'online', // Only make requests when online (was 'always')
    },
    mutations: {
      retry: 1, // Retry mutations once
      retryDelay: 1000,
    },
  },
});

// Helper function for common query options to reduce API calls
export const getQueryOptions = {
  // For static/semi-static data (patients, lab tests, organizations)
  static: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  },
  // For frequently changing data (orders, appointments)
  dynamic: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  },
  // For real-time data that needs periodic updates
  realtime: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchInterval: 3 * 60 * 1000, // 3 minutes
  },
  // For user-specific data (profile, preferences)
  user: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  },
};

// Don't clear cache on module load - let staleTime handle freshness
// queryClient.clear();
