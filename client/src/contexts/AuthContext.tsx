import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { AuthContextType, LoginRequest, RegisterRequest } from "@/types";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const savedUserId = localStorage.getItem("user_id");

    const validUser =
      savedUserId &&
      savedUserId !== "undefined" &&
      savedUserId !== "null" &&
      savedUserId.trim() !== "";

    if (token && validUser) {
      setUserId(savedUserId);
      setIsAuthenticated(true);
    } else {
      setUserId(null);
      setIsAuthenticated(false);
      localStorage.removeItem("user_id");
    }

    setIsLoading(false);
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    const res = await api.login(data);
    setUserId(res.user_id);
    localStorage.setItem("user_id", res.user_id);
    setIsAuthenticated(true);
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    await api.register(data);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    api.clearTokens();
    queryClient.clear();
    localStorage.removeItem("user_id");

    setIsAuthenticated(false);
    setUserId(null);
  }, []);

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
