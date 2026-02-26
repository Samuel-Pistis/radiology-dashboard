import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, UserRole } from '../types';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (role: UserRole) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const demoAdmin: User = {
    id: 'demo-admin-1',
    name: 'Dr. Sarah Chen',
    role: 'admin',
    email: 'admin@medicontrol.demo',
};

const demoUser: User = {
    id: 'demo-user-1',
    name: 'Tech. Marcus Johnson',
    role: 'radiology_user',
    email: 'marcus@medicontrol.demo',
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check local storage for existing session on mount
        const storedUser = localStorage.getItem('medicontrol_demo_user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (error) {
                console.error('Failed to parse stored user:', error);
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (role: UserRole) => {
        setIsLoading(true);
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));

        const selectedUser = role === 'admin' ? demoAdmin : demoUser;
        setUser(selectedUser);
        localStorage.setItem('medicontrol_demo_user', JSON.stringify(selectedUser));
        setIsLoading(false);
    };

    const logout = async () => {
        setIsLoading(true);
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 300));

        setUser(null);
        localStorage.removeItem('medicontrol_demo_user');
        setIsLoading(false);
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
