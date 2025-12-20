import { useContext, createContext } from 'react';

// Define types here to avoid circular dependency
export interface User {
  id: number;
  username: string;
  role: string;
  roleId?: number;
  title?: string;
  firstName?: string;
  lastName?: string;
  organizationId?: number;
  organization?: {
    id: number;
    name: string;
    type: string;
    themeColor: string;
  };
}

export interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

// Create a shared context reference - this will be set by AuthProvider
// Using a module-level variable to share the context between this file and AuthContext
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Hook to access authentication context
 * Must be used within an AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // In development, log helpful debugging info
    if (process.env.NODE_ENV === 'development') {
      console.error('useAuth hook called outside AuthProvider context');
      console.error('Stack trace:', new Error().stack);
      console.error('Make sure the component using useAuth is wrapped in <AuthProvider>');
      console.error('The AuthProvider should be at the root of your app, wrapping the Router component');
    }
    
    // Provide a helpful error message with component stack info
    const error = new Error(
      'useAuth must be used within an AuthProvider. ' +
      'Make sure your component is rendered inside the <AuthProvider> component. ' +
      'Check the component tree to ensure AuthProvider wraps all components that use useAuth.'
    );
    
    throw error;
  }
  return context;
}

/**
 * Safe version of useAuth that returns null instead of throwing
 * Use this only for components that might be rendered outside the auth tree
 */
export function useAuthSafe(): AuthContextType | null {
  return useContext(AuthContext) ?? null;
}

export default useAuth;

