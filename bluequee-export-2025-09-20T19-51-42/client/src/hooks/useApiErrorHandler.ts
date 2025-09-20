import { useCallback } from 'react';
import { useLocation } from 'wouter';
import { toast } from '@/hooks/use-toast';

export interface ApiError {
  status?: number;
  message: string;
  field?: string;
}

export const useApiErrorHandler = () => {
  const [, setLocation] = useLocation();

  const handleError = useCallback((error: any, customMessage?: string) => {
    console.error('API Error:', error);

    // Extract error information
    let status = 500;
    let message = 'An unexpected error occurred. Please try again.';

    if (error.message?.includes('401:')) {
      status = 401;
      message = 'Your session has expired. Please log in again.';
    } else if (error.message?.includes('403:')) {
      status = 403;
      message = 'You do not have permission to perform this action.';
    } else if (error.message?.includes('404:')) {
      status = 404;
      message = 'The requested resource was not found.';
    } else if (error.message?.includes('422:') || error.message?.includes('400:')) {
      status = 400;
      message = 'Invalid data provided. Please check your input.';
    } else if (error.message?.includes('500:')) {
      status = 500;
      message = 'Server error occurred. Please try again later.';
    } else if (error.message?.includes('Failed to fetch') || error.message?.includes('Network')) {
      message = 'Network error. Please check your internet connection.';
    } else if (customMessage) {
      message = customMessage;
    } else if (error.message) {
      // Clean up error message from API response format
      const cleanMessage = error.message.replace(/^\d+:\s*/, '');
      if (cleanMessage && cleanMessage !== error.message) {
        message = cleanMessage;
      }
    }

    // Show user-friendly toast notification
    toast({
      title: status === 401 ? 'Authentication Required' : 
             status === 403 ? 'Access Denied' :
             status === 404 ? 'Not Found' :
             status >= 500 ? 'Server Error' : 'Error',
      description: message,
      variant: 'destructive',
    });

    // Handle authentication errors
    if (status === 401) {
      // Clear local storage and redirect to login
      localStorage.removeItem('clinic_token');
      localStorage.removeItem('clinic_user');
      setTimeout(() => {
        setLocation('/login');
      }, 1500);
    }

    return { status, message };
  }, [setLocation]);

  return { handleError };
};

export default useApiErrorHandler;