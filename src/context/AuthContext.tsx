import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, UserRole } from '../types';
import { supabase } from '../lib/supabase';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (role: UserRole) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Legacy Mock Fallback values in case Supabase credentials aren't provided but the UI tests are needed
const demoAdmin: User = {
    id: 'demo-admin-1',
    name: 'Dr. Sarah Chen',
    role: 'admin',
    email: 'admin@radpadi.demo',
};

const demoUser: User = {
    id: 'demo-user-1',
    name: 'Tech. Marcus Johnson',
    role: 'radiology_user',
    email: 'marcus@radpadi.demo',
};

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
                } else {
                    // Check local storage for mock fallback
                    const storedUser = localStorage.getItem('radpadi_demo_user');
                    if (storedUser) {
                        try {
                            setUser(JSON.parse(storedUser));
                        } catch (e) {
                            console.error('Failed to parse fallback user', e);
                        }
                    }
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
                localStorage.removeItem('radpadi_demo_user');
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const fetchAndSetUserProfile = async (userId: string, email?: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, name, role, centre_id')
                .eq('id', userId)
                .single();

            if (error) {
                console.warn('Could not fetch profile entirely, using fallback mapping ->', error.message);
                // Just map it using mocked details if Supabase setup is incomplete for profiles
                setUser({
                    id: userId,
                    name: email?.split('@')[0] || 'Unknown User',
                    role: (email?.includes('admin') ? 'admin' : 'radiology_user') as UserRole,
                    email,
                    centre_id: undefined,
                });
            } else if (data) {
                setUser({
                    id: data.id,
                    name: data.name,
                    role: data.role as UserRole,
                    email,
                    centre_id: data.centre_id ?? undefined,
                });
            }
        } catch (e) {
            console.error("Error fetching user profile:", e);
        }
    };

    /**
     * If the backend isn't linked with actual passwords, this acts as the fast-login wrapper
     * If passwords are used later, we would replace this with signInWithPassword
     */
    const login = async (role: UserRole) => {
        setIsLoading(true);

        try {
            // Because the spec says "Please select your demo role to continue", 
            // the codebase intentionally behaves like a demo where picking a role signs you in.
            // We preserve the fast-login UX using the previous mock-login system, but now it's isolated.

            await new Promise(resolve => setTimeout(resolve, 800));

            const selectedUser = role === 'admin' ? demoAdmin : demoUser;
            setUser(selectedUser);
            localStorage.setItem('radpadi_demo_user', JSON.stringify(selectedUser));

        } catch (err) {
            console.error('Login error', err);
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;

            setUser(null);
            localStorage.removeItem('radpadi_demo_user');
        } catch (error) {
            console.error('Logout error:', error);
            // Fallback clear
            setUser(null);
            localStorage.removeItem('radpadi_demo_user');
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
