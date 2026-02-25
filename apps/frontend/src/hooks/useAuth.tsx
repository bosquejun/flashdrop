import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { login as loginApi } from "../lib/api";
import { getAuthCookie, removeAuthCookie } from "../utils/auth";

interface AuthContextType {
  user: string | null;
  login: (identifier: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load user from cookie on mount; if signed in, sync API session (replace anonymous with logged-in cookie).
  useEffect(() => {
    const loadUserFromCookie = async () => {
      const savedIdentifier = await getAuthCookie();
      setUser(savedIdentifier);
      setIsInitialized(true);
    };

    loadUserFromCookie();
  }, []);

  const login = async (identifier: string) => {
    const trimmed = identifier.trim();
    if (!trimmed) {
      throw new Error("Username or email is required");
    }

    await loginApi(trimmed);

    setUser(identifier);
    // setAuthCookie(trimmed);
  };

  const logout = () => {
    setUser(null);
    removeAuthCookie();
  };

  // Show loading state while checking for saved auth
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-400">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span className="text-sm font-bold uppercase tracking-widest">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
