import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, UserCog, ArrowRight, ShieldCheck, HeartPulse } from 'lucide-react';

export const Login: React.FC = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState<string | null>(null);

    const handleLogin = async (role: 'admin' | 'radiology_user') => {
        setIsLoading(role);
        try {
            await login(role);
            navigate('/');
        } catch (error) {
            console.error('Login failed', error);
        } finally {
            setIsLoading(null);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-100/40 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary-100/40 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full max-w-md bg-surface p-8 rounded-3xl shadow-xl shadow-primary-500/5 backdrop-blur-sm z-10 border border-border/50">
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-primary-50 p-4 rounded-2xl mb-4 relative">
                        <Activity className="w-10 h-10 text-primary-500" />
                        <div className="absolute -bottom-1 -right-1 bg-secondary-50 p-1.5 rounded-full shadow-sm">
                            <HeartPulse className="w-4 h-4 text-secondary-500" />
                        </div>
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl font-bold tracking-tight text-text-primary mb-2">MediControl Secure</h1>
                        <p className="text-text-secondary text-sm">Please select your demo role to continue</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={() => handleLogin('admin')}
                        disabled={isLoading !== null}
                        className={`w-full group flex items-center p-4 rounded-2xl border transition-all duration-300 ${isLoading === 'admin'
                            ? 'bg-primary-50 border-primary-200'
                            : 'bg-surface border-border hover:border-primary-300 hover:shadow-md hover:bg-primary-50/30'
                            }`}
                    >
                        <div className="bg-primary-100 text-primary-600 p-3 rounded-xl mr-4 group-hover:scale-110 transition-transform">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div className="flex-1 text-left">
                            <h3 className="font-semibold text-text-primary group-hover:text-primary-600 transition-colors">Admin Portal</h3>
                            <p className="text-xs text-text-secondary">Full access & settings</p>
                        </div>
                        {isLoading === 'admin' ? (
                            <Activity className="w-5 h-5 text-primary-500 animate-spin" />
                        ) : (
                            <ArrowRight className="w-5 h-5 text-text-secondary group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                        )}
                    </button>

                    <button
                        onClick={() => handleLogin('radiology_user')}
                        disabled={isLoading !== null}
                        className={`w-full group flex items-center p-4 rounded-2xl border transition-all duration-300 ${isLoading === 'radiology_user'
                            ? 'bg-secondary-50 border-secondary-200'
                            : 'bg-surface border-border hover:border-secondary-300 hover:shadow-md hover:bg-secondary-50/30'
                            }`}
                    >
                        <div className="bg-secondary-100 text-secondary-600 p-3 rounded-xl mr-4 group-hover:scale-110 transition-transform">
                            <UserCog className="w-6 h-6" />
                        </div>
                        <div className="flex-1 text-left">
                            <h3 className="font-semibold text-text-primary group-hover:text-secondary-600 transition-colors">Radiology Tech</h3>
                            <p className="text-xs text-text-secondary">Daily logging & reports</p>
                        </div>
                        {isLoading === 'radiology_user' ? (
                            <Activity className="w-5 h-5 text-secondary-500 animate-spin" />
                        ) : (
                            <ArrowRight className="w-5 h-5 text-text-secondary group-hover:text-secondary-500 group-hover:translate-x-1 transition-all" />
                        )}
                    </button>
                </div>

                <div className="mt-8 pt-6 border-t border-border/60 text-center">
                    <p className="text-xs text-text-secondary/70">
                        Demo environment. Secure connection verified.
                    </p>
                </div>
            </div>

            {/* Background pattern */}
            <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>
        </div>
    );
};
