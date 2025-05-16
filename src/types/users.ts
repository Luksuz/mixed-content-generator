import { User as SupabaseUser } from '@supabase/supabase-js';

// Basic user interface, extends from Supabase if needed
export interface User {
  id: string;
  email?: string;
  name?: string;
}

// Convert Supabase user to our user interface
export function mapSupabaseUser(supabaseUser: SupabaseUser | null): User | null {
  if (!supabaseUser) return null;
  
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || undefined,
    name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User'
  };
}

// Empty array of predefined users - we'll use authenticated users instead
export const predefinedUsers: User[] = []; 