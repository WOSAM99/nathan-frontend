import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, LoginRequest, RegisterRequest } from '@/lib/api';
import { useLocation } from 'wouter';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    setIsAuthenticated(api.isAuthenticated());
    setIsLoading(false);
  }, []);

  const login = async (data: LoginRequest) => {
    await api.login(data);
    setIsAuthenticated(true);
    setLocation('/dashboard');
  };

  const register = async (data: RegisterRequest) => {
    await api.register(data);
    setIsAuthenticated(true);
    setLocation('/dashboard');
  };

  const logout = async () => {
    await api.logout();
    setIsAuthenticated(false);
    setLocation('/');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
