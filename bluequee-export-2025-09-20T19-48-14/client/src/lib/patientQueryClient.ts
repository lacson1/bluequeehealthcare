import { QueryClient } from '@tanstack/react-query';

export const createPatientQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        queryFn: async ({ queryKey }) => {
          const url = queryKey[0] as string;
          const token = localStorage.getItem('patientToken');
          
          const response = await fetch(url, {
            headers: {
              'Authorization': token ? `Bearer ${token}` : '',
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            if (response.status === 401) {
              // Clear invalid token
              localStorage.removeItem('patientToken');
              localStorage.removeItem('patientData');
              throw new Error('Session expired. Please log in again.');
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          return response.json();
        },
        retry: (failureCount, error) => {
          // Don't retry auth errors
          if (error?.message?.includes('401') || error?.message?.includes('Session expired')) {
            return false;
          }
          return failureCount < 3;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
      },
    },
  });
};

export const patientApiRequest = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('patientToken');
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('patientToken');
      localStorage.removeItem('patientData');
      throw new Error('Session expired. Please log in again.');
    }
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
};