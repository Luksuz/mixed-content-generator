'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

interface Profile {
  user_id: string;
  is_admin: boolean | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string; success?: boolean } | void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getSession = async () => {
      setIsLoading(true);
      console.log("AuthContext: Fetching session...");
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Error getting session:", sessionError.message);
        setIsLoading(false);
        return;
      }

      console.log("AuthContext: Session data:", session ? "Session exists" : "No session");
      const currentUser = session?.user || null;
      console.log("AuthContext: User data:", currentUser ? `User found: ${currentUser.email}` : "No user");
      setUser(currentUser);

      if (currentUser) {
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('user_id, is_admin')
            .eq('user_id', currentUser.id)
            .single();

            console.log("profileData", profileData);

          if (profileError) {
            console.error("Error fetching profile:", profileError.message);
            // If profile doesn't exist, create one
            if (profileError.code === 'PGRST116') { // PGRST116: "Searched for one row, but found 0"
              const { data: newProfile, error: insertError } = await supabase
                .from('profiles')
                .insert({ user_id: currentUser.id, is_admin: false }) // Default new users to not be admins
                .select('user_id, is_admin')
                .single();

              if (insertError) {
                console.error("Error creating profile:", insertError.message);
              } else if (newProfile) {
                setProfile(newProfile as Profile);
                setIsAdmin(newProfile.is_admin || false);
              }
            }
          } else if (profileData) {
            setProfile(profileData as Profile);
            setIsAdmin(profileData.is_admin || false);
          }
        } catch (e) {
          console.error("An unexpected error occurred fetching profile:", e);
        }
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
      setIsLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setIsLoading(true);
      const currentUser = session?.user || null;
      setUser(currentUser);

      if (currentUser) {
         try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('user_id, is_admin')
            .eq('user_id', currentUser.id)
            .single();

          if (profileError) {
             console.error("Auth listener: Error fetching profile:", profileError.message);
             // Potentially create profile if not exists, similar to above
          } else if (profileData) {
            setProfile(profileData as Profile);
            setIsAdmin(profileData.is_admin || false);
          }
        } catch (e) {
          console.error("Auth listener: An unexpected error occurred fetching profile:", e);
        }
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
      setIsLoading(false);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase]);

  const signIn = async (email: string, password: string) => {
    console.log("Sign in function called with:", email);
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error("Error signing in:", error.message);
        return { error: error.message, success: false };
      }
      
      if (!data.user) {
        console.error("No user returned after successful login");
        return { error: "Login succeeded but no user data was returned", success: false };
      }
      
      // After successful login, fetch the profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, is_admin')
        .eq('user_id', data.user.id)
        .single();
      
      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist, create one
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({ user_id: data.user.id, is_admin: false })
          .select('user_id, is_admin')
          .single();
          
        if (!insertError && newProfile) {
          setProfile(newProfile as Profile);
          setIsAdmin(newProfile.is_admin || false);
        }
      } else if (!profileError && profileData) {
        setProfile(profileData as Profile);
        setIsAdmin(profileData.is_admin || false);
      }
      
      // Successfully signed in
      console.log("Successfully signed in user:", data.user.email);
      setUser(data.user);
      return { success: true };
    } catch (err: any) {
      console.error("Unexpected error during sign in:", err.message);
      return { error: err.message || "An unexpected error occurred", success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      console.log("Signing out user...");
      setIsLoading(true);
      await supabase.auth.signOut();
      
      // Clear auth state
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
      
      console.log("Redirecting to login page...");
      
      // Add a small delay to ensure state is cleared before redirect
      setTimeout(() => {
        router.push('/login');
        router.refresh();
      }, 100);
      
    } catch (error) {
      console.error("Error during sign out:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, isAdmin, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 