"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  type User,
  type TokenPair,
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  refreshToken as apiRefresh,
  getProfile,
} from "@/lib/api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  setTokens: (tokens: TokenPair, user?: User) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      getProfile()
        .then((data) => setUser(data.user))
        .catch(() => {
          // Try refresh
          const refresh = localStorage.getItem("refreshToken");
          if (refresh) {
            apiRefresh(refresh)
              .then((data) => {
                localStorage.setItem("accessToken", data.tokens.accessToken);
                localStorage.setItem("refreshToken", data.tokens.refreshToken);
                setUser(data.user);
              })
              .catch(() => {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
              });
          }
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const setTokens = useCallback((tokens: TokenPair, userData?: User) => {
    localStorage.setItem("accessToken", tokens.accessToken);
    localStorage.setItem("refreshToken", tokens.refreshToken);
    if (userData) {
      setUser(userData);
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await apiLogin(email, password);
      setTokens(data.tokens, data.user);
    },
    [setTokens],
  );

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      const data = await apiRegister(email, password, name);
      setTokens(data.tokens, data.user);
    },
    [setTokens],
  );

  const logout = useCallback(async () => {
    await apiLogout();
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        setTokens,
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
