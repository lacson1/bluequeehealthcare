import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('clinic_token');
  const headers: Record<string, string> = {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('Auth token found and added to headers');
  } else {
    console.warn('No auth token found in localStorage');
  }
  
  return headers;
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

  console.log(`Making ${upperMethod} request to ${url} with headers:`, headers);

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

  console.log(`Response status for ${upperMethod} ${url}:`, res.status);
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
    const res = await fetchFn(url, {
      method: "GET",
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 0, // Allow immediate refetching
      gcTime: 0, // Don't cache data (replaces cacheTime in v5)
      retry: false,
      networkMode: 'always', // Always make requests regardless of network state
    },
    mutations: {
      retry: false,
    },
  },
});

// Force clear all cached data on module load
queryClient.clear();
