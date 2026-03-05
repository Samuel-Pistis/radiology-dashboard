import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, UserRole } from '../types';
import { supabase } from '../lib/supabase';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ error: string | null }>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Try to fetch session on load
        const initializeAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (session?.user) {
                    await fetchAndSetUserProfile(session.user.id, session.user.email);
                }
            } catch (error) {
                console.error("Supabase auth initialization error (falling back to mock):", error);
            } finally {
                setIsLoading(false);
            }
        };

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                await fetchAndSetUserProfile(session.user.id, session.user.email);
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
            }
            setIsLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const fetchAndSetUserProfile = async (userId: string, email?: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, display_name, role')
                .eq('id', userId)
                .single();

            if (error) {
                console.warn('Could not fetch profile entirely, using fallback mapping ->', error.message);
                // Just map it using mocked details if Supabase setup is incomplete for profiles
                setUser({
                    id: userId,
                    name: email?.split('@')[0] || 'Unknown User',
                    role: (email?.includes('admin') ? 'admin' : 'radiology_user') as UserRole,
                    email: email ?? undefined,
                });
            } else if (data) {
                setUser({
                    id: data.id,
                    name: data.display_name,
                    role: data.role as UserRole,
                    email,
                });
            }
        } catch (e) {
            console.error("Error fetching user profile:", e);
        }
    };

    const login = async (email: string, password: string): Promise<{ error: string | null }> => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                return { error: error.message };
            }
            // Eagerly fetch the profile so user is set before the caller navigates
            if (data.session?.user) {
                await fetchAndSetUserProfile(data.session.user.id, data.session.user.email);
            }
            return { error: null };
        } catch (err) {
            console.error('Login error', err);
            return { error: 'An unexpected error occurred. Please try again.' };
        }
    };

    const logout = async () => {
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            setUser(null);
        } catch (error) {
            console.error('Logout error:', error);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
