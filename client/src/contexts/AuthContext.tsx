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
    // Check if user is already logged in on app start
    const token = localStorage.getItem('clinic_token');
    const userData = localStorage.getItem('clinic_user');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
        // Refresh user data to get latest information
        refreshUser();
      } catch (error) {
        localStorage.removeItem('clinic_token');
        localStorage.removeItem('clinic_user');
      }
    }
    setIsLoading(false);
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
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await response.json();
      
      localStorage.setItem('clinic_token', data.token);
      localStorage.setItem('clinic_user', JSON.stringify(data.user));
      setUser(data.user);
      
      // Automatically redirect to dashboard after successful login
      setLocation('/dashboard');
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('clinic_token');
    localStorage.removeItem('clinic_user');
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('clinic_token');
      if (!token) {
        logout(); // Clear user data if no token
        return;
      }

      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        localStorage.setItem('clinic_user', JSON.stringify(userData));
      } else if (response.status === 401 || response.status === 404) {
        // Token is invalid or user not found, log out
        logout();
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      // Don't logout on network errors, only on auth failures
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