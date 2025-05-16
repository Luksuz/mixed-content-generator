import { createClient } from '@/utils/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';
import { mapSupabaseUser } from '@/types/users';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ 
        error: 'Not authenticated' 
      }, { status: 401 });
    }
    
    const user = mapSupabaseUser(session.user);
    
    // Return user data with video records count
    return NextResponse.json({
      user,
      success: true
    });
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch user profile',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic'; 