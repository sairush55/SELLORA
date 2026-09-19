"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "@/types/auth";
import { authService } from "@/services/authService";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  loginDemo: (tenantId?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    const { user, error } = await authService.signIn(email, password);
    setIsLoading(false);
    if (error) {
      return { success: false, error: error.message };
    }
    setUser(user);
    return { success: true };
  };

  const signup = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    const { user, error } = await authService.signUp(email, password, name);
    setIsLoading(false);
    if (error) {
      return { success: false, error: error.message };
    }
    setUser(user);
    return { success: true };
  };

  const loginDemo = async (tenantId?: string) => {
    setIsLoading(true);
    const demoUser = await authService.signInDemo(tenantId);
    setUser(demoUser);
    setIsLoading(false);
    router.push("/dashboard");
  };

  const logout = async () => {
    await authService.signOut();
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        loginDemo,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
