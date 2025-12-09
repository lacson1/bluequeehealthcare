/**
 * Typed API request utilities
 * Provides type-safe wrappers around fetch/API calls
 */

import { apiRequest } from './apiRequest';

/**
 * Standard API response format from backend
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
 * Typed API request that parses JSON and returns typed data
 */
export async function apiRequestTyped<T = unknown>(
  url: string,
  method: string = 'GET',
  data?: unknown,
  options?: { suppressAuthErrors?: boolean }
): Promise<T> {
  const response = await apiRequest(url, method, data, options);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Request failed: ${response.statusText}`);
  }
  
  const json: ApiResponse<T> = await response.json();
  
  if (!json.success) {
    throw new Error(json.error.message || 'Request failed');
  }
  
  return json.data;
}

/**
 * Helper for useQuery hooks - fetches and parses typed data
 */
export async function fetchTyped<T = unknown>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    credentials: 'include',
    ...options,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Request failed: ${response.statusText}`);
  }
  
  const json: ApiResponse<T> = await response.json();
  
  if (!json.success) {
    throw new Error(json.error.message || 'Request failed');
  }
  
  return json.data;
}

/**
 * Helper to safely extract array data from API responses
 */
export function extractArrayData<T>(data: unknown, fallback: T[] = []): T[] {
  if (Array.isArray(data)) {
    return data;
  }
  if (data && typeof data === 'object' && 'data' in data) {
    const apiResponse = data as { data: unknown };
    if (Array.isArray(apiResponse.data)) {
      return apiResponse.data;
    }
  }
  return fallback;
}

/**
 * Helper to safely extract object data from API responses
 */
export function extractObjectData<T>(data: unknown, fallback: Partial<T> = {}): Partial<T> {
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    if ('data' in data) {
      const apiResponse = data as { data: unknown };
      if (apiResponse.data && typeof apiResponse.data === 'object' && !Array.isArray(apiResponse.data)) {
        return apiResponse.data as Partial<T>;
      }
    }
    return data as Partial<T>;
  }
  return fallback;
}

