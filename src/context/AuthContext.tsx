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

    const fetchAndSetUserProfile = async (userId: string, email?: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, display_name, role')
                .eq('id', userId)
                .single();

            if (error) {
                console.warn('Could not fetch profile, using fallback ->', error.message);
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
            console.error('Error fetching user profile:', e);
        }
    };

    useEffect(() => {
        // onAuthStateChange is the single source of truth for all auth state.
        // INITIAL_SESSION fires immediately on listener attachment (handles page reload).
        // SIGNED_IN fires on every successful login (handles second+ logins).
        // SIGNED_OUT fires on logout.
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'INITIAL_SESSION') {
                if (session?.user) {
                    await fetchAndSetUserProfile(session.user.id, session.user.email);
                }
                // Always clear the loading flag after INITIAL_SESSION resolves,
                // whether or not a session was found.
                setIsLoading(false);
            } else if (event === 'SIGNED_IN') {
                if (session?.user) {
                    await fetchAndSetUserProfile(session.user.id, session.user.email);
                }
                // isLoading stays false (was cleared by INITIAL_SESSION).
                // Login.tsx navigates via useEffect([user]) once user is set here.
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setIsLoading(false);
            }
            // TOKEN_REFRESHED / USER_UPDATED → no action needed.
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // login() only handles signInWithPassword. Profile fetch and navigation
    // happen via onAuthStateChange(SIGNED_IN) and Login's useEffect([user]).
    const login = async (email: string, password: string): Promise<{ error: string | null }> => {
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) return { error: error.message };
            return { error: null };
        } catch (err) {
            console.error('Login error', err);
            return { error: 'An unexpected error occurred. Please try again.' };
        }
    };

    const logout = async () => {
        try {
            await supabase.auth.signOut();
            // SIGNED_OUT event handler clears user and isLoading.
        } catch (error) {
            console.error('Logout error:', error);
            // signOut failed (e.g. network down) — clear local state manually.
            setUser(null);
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
