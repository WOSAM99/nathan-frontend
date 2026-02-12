import { LoginRequest, RegisterRequest, api } from "@/lib/api";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useLocation } from "wouter";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
  setUserId: (id: string | null) => void;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const savedUserId = localStorage.getItem("user_id");
    if (savedUserId) {
      setUserId(savedUserId);
      setIsAuthenticated(true);
    }

    setIsLoading(false);
  }, []);

  const login = async (data: LoginRequest) => {
    const res = await api.login(data);
    setUserId(res.user_id);
    localStorage.setItem("user_id", res.user_id);

    setIsAuthenticated(true);
    setLocation("/dashboard");
  };

  const register = async (data: RegisterRequest) => {
    await api.register(data);
    setIsAuthenticated(true);
    setLocation("/dashboard");
  };

  const logout = async () => {
    await api.logout();
    setIsAuthenticated(false);
    setUserId(null);
    localStorage.removeItem("user_id");
    setLocation("/");
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        userId,
        setUserId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
