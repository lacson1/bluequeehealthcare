import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Create a test query client with default options
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

// Mock user for testing
export const mockUser = {
  id: 1,
  username: 'testuser',
  firstName: 'Test',
  lastName: 'User',
  role: 'doctor',
  roleId: 2,
  organizationId: 1,
  email: 'test@example.com',
  isActive: true,
};

// Custom render function that includes providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  user?: typeof mockUser;
  initialRoute?: string;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    queryClient = createTestQueryClient(),
    user = mockUser,
    initialRoute = '/',
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  // Mock window.location
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'location', {
      value: {
        pathname: initialRoute,
        search: '',
        hash: '',
      },
      writable: true,
    });
  }

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider initialUser={user}>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}

// Re-export everything from testing-library
export * from '@testing-library/react';
export { renderWithProviders as render };

// Helper to wait for async operations
export const waitForAsync = () => new Promise((resolve) => setTimeout(resolve, 0));

// Mock API response helper
export const mockApiResponse = <T,>(data: T, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => data,
  text: async () => JSON.stringify(data),
  headers: new Headers(),
});

// Mock fetch helper
export const mockFetch = (response: any, status = 200) => {
  global.fetch = vi.fn(() =>
    Promise.resolve(mockApiResponse(response, status))
  ) as any;
};

