"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { createClient } from "@/utils/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { User, mapSupabaseUser } from "@/types/users";

interface AuthContextType {
  user: SupabaseUser | null;
  mappedUser: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{
    error: string | null;
    success: boolean;
  }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [mappedUser, setMappedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Check for existing session
    const checkUser = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
        setMappedUser(mapSupabaseUser(session?.user || null));
      } catch (error) {
        console.error("Error checking authentication:", error);
        setUser(null);
        setMappedUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();

    // Set up auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
        setMappedUser(mapSupabaseUser(session?.user || null));
        router.refresh();
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message, success: false };
      }

      router.push("/");
      return { error: null, success: true };
    } catch (error: any) {
      return { error: error.message || "Sign-in failed", success: false };
    }
  };

  // Sign out function
  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, mappedUser, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
} 