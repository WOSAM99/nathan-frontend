import { api } from "@/lib/api";
import { AuthContextType, LoginRequest, RegisterRequest } from "@/types";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { useLocation } from "wouter";

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const savedUserId = localStorage.getItem("user_id");
    if (savedUserId) {
      setUserId(savedUserId);
      setIsAuthenticated(true);
    }

    setIsLoading(false);
  }, []);

  const login = useCallback(
    async (data: LoginRequest) => {
      const res = await api.login(data);
      setUserId(res.user_id);
      localStorage.setItem("user_id", res.user_id);

      setIsAuthenticated(true);
      setLocation("/dashboard");
    },
    [setLocation],
  );

  const register = useCallback(
    async (data: RegisterRequest) => {
      await api.register(data);
      setIsAuthenticated(true);
      setLocation("/dashboard");
    },
    [setLocation],
  );

  const logout = useCallback(async () => {
    await api.logout();
    setIsAuthenticated(false);
    setUserId(null);
    localStorage.removeItem("user_id");
    setLocation("/");
  }, [setLocation]);

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
