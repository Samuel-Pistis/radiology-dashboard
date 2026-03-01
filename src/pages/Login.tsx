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
        <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full max-w-md rad-card z-10 mx-4">
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-primary/10 p-4 rounded-2xl mb-4 relative">
                        <Activity className="w-10 h-10 text-primary" />
                        <div className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-full shadow-sm">
                            <HeartPulse className="w-4 h-4 text-primary" />
                        </div>
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl font-semibold tracking-tight text-text-primary mb-2">RadPadi</h1>
                        <p className="text-text-secondary text-sm">Radiology Management System</p>
                    </div>
                </div>
                <div className="space-y-4">
                    <button
                        onClick={() => handleLogin('admin')}
                        disabled={isLoading !== null}
                        className={`w-full group flex items-center p-4 rounded-xl border transition-all duration-300 ${isLoading === 'admin'
                            ? 'bg-primary/5 border-primary/30 border-l-4 border-l-primary'
                            : 'bg-white border-border hover:border-border hover:shadow-sm hover:border-l-4 hover:border-l-primary'
                            }`}
                    >
                        <div className="bg-primary/10 text-primary p-3 rounded-xl mr-4 group-hover:scale-110 transition-transform">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div className="flex-1 text-left">
                            <h3 className="font-semibold text-text-primary group-hover:text-primary transition-colors">Admin Portal</h3>
                            <p className="text-sm text-text-muted font-medium">Full access & settings</p>
                        </div>
                        {isLoading === 'admin' ? (
                            <Activity className="w-5 h-5 text-primary animate-spin" />
                        ) : (
                            <ArrowRight className="w-5 h-5 text-text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        )}
                    </button>

                    <button
                        onClick={() => handleLogin('radiology_user')}
                        disabled={isLoading !== null}
                        className={`w-full group flex items-center p-4 rounded-xl border transition-all duration-300 ${isLoading === 'radiology_user'
                            ? 'bg-primary/5 border-primary/30 border-l-4 border-l-primary'
                            : 'bg-white border-border hover:border-border hover:shadow-sm hover:border-l-4 hover:border-l-primary'
                            }`}
                    >
                        <div className="bg-primary/10 text-primary p-3 rounded-xl mr-4 group-hover:scale-110 transition-transform">
                            <UserCog className="w-6 h-6" />
                        </div>
                        <div className="flex-1 text-left">
                            <h3 className="font-semibold text-text-primary group-hover:text-primary transition-colors">Radiology Tech</h3>
                            <p className="text-sm text-text-muted font-medium">Daily logging & reports</p>
                        </div>
                        {isLoading === 'radiology_user' ? (
                            <Activity className="w-5 h-5 text-primary animate-spin" />
                        ) : (
                            <ArrowRight className="w-5 h-5 text-text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        )}
                    </button>
                </div>

                <div className="mt-8 pt-6 border-t border-border text-center">
                    <p className="text-sm text-text-muted font-medium">
                        Demo environment. Secure connection verified.
                    </p>
                </div>
            </div>

            {/* Background pattern */}
            <div className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%230D9488\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>
        </div>
    );
};
