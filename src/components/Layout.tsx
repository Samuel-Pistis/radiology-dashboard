import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';

export const Layout: React.FC = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();

    // Close mobile menu on route change
    React.useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    return (
        <div className="flex h-screen overflow-hidden bg-background relative selection:bg-primary-500/30">
            <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

            <main className="flex-1 flex flex-col relative overflow-hidden">
                {/* Mobile Header */}
                <header className="md:hidden flex items-center justify-between p-4 bg-white/40 backdrop-blur-md border-b border-white/50 z-20 sticky top-0">
                    <div className="flex items-center">
                        <div className="bg-black text-white p-2 rounded-xl mr-3 shadow-sm flex items-center justify-center">
                            <span className="font-black text-lg italic leading-none pr-0.5">sf.</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="p-2 -mr-2 text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-xl transition-colors"
                        aria-label="Open menu"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8">
                    <div className="max-w-7xl mx-auto w-full pb-20 md:pb-0">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
};
