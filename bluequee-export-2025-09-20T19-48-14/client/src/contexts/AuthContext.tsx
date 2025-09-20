import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'wouter';

interface User {
  id: number;
  username: string;
  role: string;
  organizationId?: number;
  organization?: {
    id: number;
    name: string;
    type: string;
    themeColor: string;
  };
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Check if user is already logged in via session
    refreshUser();
  }, []);

  // Disabled periodic session refresh to prevent stability issues
  // useEffect(() => {
  //   if (!user) return;
  //   const interval = setInterval(() => {
  //     refreshUser();
  //   }, 30000);
  //   return () => clearInterval(interval);
  // }, [user]);

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
        throw new Error('Invalid credentials');
      }

      const data = await response.json();
      
      // No token storage needed - session is managed by cookies
      setUser(data.user);
      
      // Automatically redirect to dashboard after successful login
      setLocation('/dashboard');
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const response = await fetch('/api/profile', {
        credentials: 'include', // Include session cookies
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else if (response.status === 401 || response.status === 404) {
        // Session is invalid or user not found, clear user state
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      // Don't clear user on network errors, only on auth failures
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}