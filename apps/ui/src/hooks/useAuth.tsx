import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { hashUserId } from '../utils/auth';
import { getAuthCookie, setAuthCookie, removeAuthCookie } from '../utils/auth';

interface User {
  id: string; // Hashed userId for backend
  identifier: string; // username or email (original input)
  name: string; // Display name
}

interface AuthContextType {
  user: User | null;
  login: (identifier: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load user from cookie on mount
  useEffect(() => {
    const loadUserFromCookie = async () => {
      const savedIdentifier = getAuthCookie();
      if (savedIdentifier) {
        try {
          const userId = await hashUserId(savedIdentifier);
          const displayName = savedIdentifier.includes('@') 
            ? savedIdentifier.split('@')[0] 
            : savedIdentifier;
          
          setUser({
            id: userId,
            identifier: savedIdentifier,
            name: displayName,
          });
        } catch (error) {
          console.error('Failed to load user from cookie:', error);
          removeAuthCookie();
        }
      }
      setIsInitialized(true);
    };

    loadUserFromCookie();
  }, []);

  const login = async (identifier: string) => {
    // Normalize and validate identifier (username or email)
    const trimmed = identifier.trim();
    if (!trimmed) {
      throw new Error('Username or email is required');
    }

    // Mock login delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    // Generate hashed userId
    const userId = await hashUserId(trimmed);
    
    // Extract display name
    const displayName = trimmed.includes('@') 
      ? trimmed.split('@')[0] 
      : trimmed;
    
    const newUser: User = {
      id: userId,
      identifier: trimmed,
      name: displayName,
    };
    
    setUser(newUser);
    
    // Persist to cookie
    setAuthCookie(trimmed);
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
