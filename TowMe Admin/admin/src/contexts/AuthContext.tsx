 import { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isDemoMode } from '../lib/supabase';
import { backendApi } from '../lib/backend-api';
import type { AdminUser, AdminRole } from '../types';

interface AuthContextType {
  user: User | null;
  adminUser: AdminUser | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isAuthorized: (allowedRoles?: AdminRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize token from localStorage
    const storedToken = localStorage.getItem('towme-admin-token');
    if (storedToken) {
      backendApi.setToken(storedToken);
    }

    // If in demo mode, skip Supabase auth check and show login page
    if (isDemoMode) {
      console.log('Demo mode: Skipping Supabase auth check');
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchAdminProfile(session.user.id);
        } else {
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error('Error getting session:', error);
        setLoading(false);
      });

    // Timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('Auth check timed out, showing login page');
        setLoading(false);
      }
    }, 5000);

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchAdminProfile(session.user.id);
        } else {
          setAdminUser(null);
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const fetchAdminProfile = async (userId: string) => {
    try {
      // Fetch admin profile from admin_users table
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching admin profile:', error);
        // If no admin profile, they're not authorized
        setAdminUser(null);
      } else {
        setAdminUser({
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role as AdminRole,
          avatar_url: data.avatar_url,
          created_at: data.created_at,
          last_login: data.last_login,
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setAdminUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Demo credentials for testing
  const DEMO_EMAIL = 'admin@towme.com';
  const DEMO_PASSWORD = 'admin123';

  const signIn = async (email: string, password: string) => {
    // Try backend API first
    try {
      const response = await backendApi.login(email, password);
      if (response.success && response.data) {
        const mockUser = {
          id: response.data.user.id,
          email: response.data.user.email,
          app_metadata: {},
          user_metadata: { name: 'Admin' },
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        } as User;

        const mockAdminUser: AdminUser = {
          id: response.data.user.id,
          email: response.data.user.email,
          name: 'Admin',
          role: 'super_admin',
          avatar_url: null,
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
        };

        // Store token in localStorage for subsequent API calls
        localStorage.setItem('towme-admin-token', response.data.token);
        backendApi.setToken(response.data.token);

        setUser(mockUser);
        setAdminUser(mockAdminUser);
        setSession({ user: mockUser } as Session);
        return { error: null };
      }
    } catch (error) {
      console.log('Backend API login failed, falling back to demo mode:', error);
    }

    // Try real Supabase authentication (only when credentials are configured)
    if (!isDemoMode) {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (!error) return { error: null };
        console.log('Supabase auth failed, trying demo credentials:', error.message);
      } catch (error) {
        console.log('Supabase auth error, trying demo credentials:', error);
      }
    }

    // Fallback to demo mode login with hardcoded credentials
    if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
      const mockUser = {
        id: 'demo-user-id',
        email: DEMO_EMAIL,
        app_metadata: {},
        user_metadata: { name: 'Demo Admin' },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as User;

      const mockAdminUser: AdminUser = {
        id: 'demo-admin-id',
        email: DEMO_EMAIL,
        name: 'Demo Admin',
        role: 'super_admin',
        avatar_url: null,
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
      };

      setUser(mockUser);
      setAdminUser(mockAdminUser);
      setSession({ user: mockUser } as Session);
      return { error: null };
    }

    return { error: new Error('Invalid credentials. Use admin@towme.com / admin123') };
  };

  const signOut = async () => {
    if (!isDemoMode) {
      await supabase.auth.signOut();
    }
    // Clear stored token
    localStorage.removeItem('towme-admin-token');
    backendApi.setToken(null);
    setUser(null);
    setAdminUser(null);
    setSession(null);
  };

  const isAuthorized = (allowedRoles?: AdminRole[]) => {
    if (!adminUser) return false;
    if (!allowedRoles) return true;
    return allowedRoles.includes(adminUser.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        adminUser,
        session,
        loading,
        signIn,
        signOut,
        isAuthorized,
      }}
    >
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
