import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: 'student' | 'faculty' | 'club' | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, role: 'student' | 'faculty' | 'club') => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<'student' | 'faculty' | 'club' | null>(null);
  const [loading, setLoading] = useState(true);

  // Emergency timeout to prevent infinite loading
  useEffect(() => {
    const emergencyTimeout = setTimeout(() => {
      console.warn('[Auth] Emergency timeout - forcing load complete');
      setLoading(false);
      if (!user) {
        setUserRole(null);
      }
    }, 5000); // 5 second emergency timeout

    return () => clearTimeout(emergencyTimeout);
  }, [user]);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    
    const initAuth = async () => {
      try {
        console.log('[Auth] Starting simple init...');
        
        // Simple session check with timeout
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((resolve) => 
          setTimeout(() => resolve({ data: { session: null }, error: null }), 3000)
        );
        
        const result = await Promise.race([sessionPromise, timeoutPromise]) as any;
        const { data: { session }, error } = result;
        
        if (mounted) {
          console.log('[Auth] Session result:', session ? 'Found' : 'None');
          setSession(session);
          setUser(session?.user ?? null);
          
          // Simple role assignment - no complex database queries
          if (session?.user) {
            const userMetadata = session.user.user_metadata || {};
            const role = userMetadata.role || 'student';
            console.log('[Auth] Setting role to:', role);
            setUserRole(role);
            
            // Check for pending club data and create club if needed
            if (role === 'club') {
              const pendingClubData = localStorage.getItem('pendingClubData');
              if (pendingClubData) {
                try {
                  const clubData = JSON.parse(pendingClubData);
                  console.log('[Auth] Creating club with pending data:', clubData);
                  
                  // Create club profile
                  supabase
                    .from('clubs')
                    .insert({
                      profile_id: session.user.id,
                      name: clubData.name,
                      description: clubData.description,
                      performance_score: 50
                    })
                    .then(({ error }) => {
                      if (error) {
                        console.error('Club creation error:', error);
                      } else {
                        console.log('Club created successfully');
                        localStorage.removeItem('pendingClubData');
                      }
                    });
                } catch (error) {
                  console.error('Error parsing pending club data:', error);
                  localStorage.removeItem('pendingClubData');
                }
              }
            }
          } else {
            setUserRole(null);
          }
          
          setLoading(false);
        }
      } catch (err) {
        console.error('[Auth] Simple init error:', err);
        if (mounted) {
          setSession(null);
          setUser(null);
          setUserRole('student'); // Default fallback
          setLoading(false);
        }
      }
    };

    // Simple auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        console.log('[Auth] Auth state changed:', event);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const userMetadata = session.user.user_metadata || {};
          setUserRole(userMetadata.role || 'student');
        } else {
          setUserRole(null);
        }
      }
    );

    // Initialize with timeout
    setTimeout(initAuth, 100);

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string, role: 'student' | 'faculty' | 'club') => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          role: role
        }
      }
    });

    if (error) {
      if (error.message.includes('User already registered')) {
        toast.error('This email is already registered. Please sign in instead.');
      } else {
        toast.error(error.message);
      }
      throw error;
    }

    if (data.user && !data.user.email_confirmed_at) {
      toast.success('Account created! Please check your email for confirmation link.');
    } else {
      toast.success('Account created successfully!');
      navigate('/');
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      if (error.message.includes('Email not confirmed')) {
        toast.error('Please check your email and click the confirmation link, or contact admin to disable email confirmation for development.');
      } else {
        toast.error(error.message);
      }
      throw error;
    }

    toast.success('Signed in successfully!');
    navigate('/');
  };

  const signOut = async () => {
    try {
      console.log('[Auth] Signing out...');
      
      // Try to sign out from Supabase, but don't fail if session is missing
      const { error } = await supabase.auth.signOut();
      
      if (error && !error.message.includes('Auth session missing')) {
        // Only throw if it's not a session missing error
        console.error('[Auth] Sign out error:', error);
        toast.error(error.message);
        throw error;
      }

      // Always clear local state regardless of Supabase response
      setUser(null);
      setSession(null);
      setUserRole(null);
      
      // Clear any pending data
      localStorage.removeItem('pendingClubData');
      
      // Clear all local storage items related to Supabase auth
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      console.log('[Auth] Signed out successfully');
      toast.success('Signed out successfully!');
      navigate('/auth');
    } catch (error: any) {
      console.error('[Auth] Sign out failed:', error);
      
      // Even if sign out fails, clear local state and redirect
      setUser(null);
      setSession(null);
      setUserRole(null);
      localStorage.clear();
      
      toast.success('Signed out successfully!');
      navigate('/auth');
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, userRole, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
