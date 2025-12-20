import { useState, useEffect, ReactNode, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { createLogger } from '@/lib/logger';
// Import shared types and context from the hook file to avoid circular dependencies
import { AuthContext, User, AuthContextType } from '@/hooks/useAuth';

const logger = createLogger('auth');

// Re-export types for backwards compatibility
export type { User, AuthContextType };
export { AuthContext };

interface AuthProviderProps {
  children: ReactNode;
  initialUser?: User | null; // Optional prop for testing
}

export function AuthProvider({ children, initialUser }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser ?? null);
  const [isLoading, setIsLoading] = useState(initialUser === undefined); // If initialUser is provided, we're not loading
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Define refreshUser before it's used in useEffect
  const refreshUser = useCallback(async () => {
    try {
      const response = await fetch('/api/profile', {
        credentials: 'include',
      });

      if (response.ok) {
        const responseData = await response.json();
        // Handle both wrapped (sendSuccess) and unwrapped response formats
        const userData = responseData.data || responseData;
        // Only update user state if data actually changed to prevent unnecessary re-renders
        setUser(prevUser => {
          // Compare user IDs to avoid unnecessary updates
          if (prevUser?.id === userData.id && 
              prevUser?.organizationId === userData.organizationId) {
            // Data hasn't changed, return previous state to prevent re-render
            return prevUser;
          }
          logger.debug('User data refreshed');
          return userData;
        });
      } else if (response.status === 401 || response.status === 404) {
        // Session is invalid or user not found, clear user state
        logger.debug('Session expired or invalid');
        setUser(null);
      }
    } catch (error) {
      logger.warn('Failed to refresh user data:', error);
      // Don't clear user on network errors, only on auth failures
    }
  }, []);

  // Check for existing session on mount (skip if initialUser is provided for testing)
  useEffect(() => {
    // If initialUser is provided, skip the session check (for testing)
    if (initialUser !== undefined) {
      setIsLoading(false);
      return;
    }

    const checkSession = async () => {
      try {
        logger.debug('Checking existing session...');
        const response = await fetch('/api/profile', {
          credentials: 'include',
        });

        if (response.ok) {
          const responseData = await response.json();
          // Handle both wrapped (sendSuccess) and unwrapped response formats
          const userData = responseData.data || responseData;
          setUser(userData);
          logger.debug('Session restored for user:', userData.username || userData.firstName || 'unknown');
        } else {
          // No valid session - user needs to login
          logger.debug('No valid session found');
          setUser(null);
        }
      } catch (error) {
        logger.warn('Session check failed:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, [initialUser]);

  // Periodic session refresh to keep session alive
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      refreshUser();
    }, 5 * 60 * 1000); // Refresh every 5 minutes
    
    return () => clearInterval(interval);
  }, [user, refreshUser]);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for session
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 503 || response.status === 0) {
          throw new Error(errorData.message || 'Backend server is not running. Please start it with: npm run dev');
        }
        if (response.status === 403) {
          throw new Error('Access forbidden. Please check if the backend server is running.');
        }
        if (response.status === 423) {
          throw new Error(errorData.message || 'Account is temporarily locked. Please try again later.');
        }
        if (response.status === 401) {
          throw new Error(errorData.message || 'Invalid username or password');
        }
        throw new Error(errorData.message || 'Login failed');
      }

      const response_data = await response.json();
      
      // Handle both wrapped (sendSuccess) and unwrapped response formats
      const data = response_data.data || response_data;

      // Validate that we received user data
      if (!data.user || !data.user.username) {
        throw new Error('Invalid response from server - no user data received');
      }

      // Set user from response
      setUser(data.user);

      // Show organization assignment message if present
      if (data.organizationMessage) {
        toast({
          title: "Organization Assignment",
          description: data.organizationMessage,
          duration: 6000,
        });
      }

      // Show success message
      toast({
        title: "Welcome back!",
        description: `Logged in as ${data.user?.username || 'User'}`,
        duration: 3000,
      });

      // Small delay to ensure session cookie is properly set before redirect
      await new Promise(resolve => setTimeout(resolve, 300));

      // Check if user needs to select organization
      if (data.requiresOrgSelection) {
        setLocation('/select-organization');
      } else {
        // Redirect to dashboard after successful login
        setLocation('/dashboard');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      
      // Handle network/fetch errors
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError') || errorMessage.includes('fetch')) {
        toast({
          title: "Cannot Connect to Server",
          description: "The backend server is not running. Please start it with: npm run dev",
          variant: "destructive",
          duration: 10000,
        });
      } else if (errorMessage.includes('Backend server') || errorMessage.includes('not running')) {
        toast({
          title: "Backend Server Unavailable",
          description: errorMessage + ". Make sure DATABASE_URL is set and the server is running.",
          variant: "destructive",
          duration: 10000,
        });
      } else {
        toast({
          title: "Login Failed",
          description: errorMessage,
          variant: "destructive",
          duration: 5000,
        });
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(async () => {
    logger.debug('Logging out user...');
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      logger.info('User logged out successfully');
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
        duration: 3000,
      });
    } catch (error) {
      logger.warn('Logout request failed:', error);
      // Still clear user state even if server request fails
    }
    
    setUser(null);
    setLocation('/login');
  }, [setLocation, toast]);

  // Ensure we always provide a valid context value
  const contextValue: AuthContextType = {
    user,
    login,
    logout,
    refreshUser,
    isLoading,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Re-export hooks from the dedicated hook file for backwards compatibility
// This allows existing imports to continue working while fixing HMR issues
export { useAuth, useAuthSafe } from '@/hooks/useAuth';
