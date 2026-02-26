import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Menu, PlusSquare } from 'lucide-react';

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
                <header className="md:hidden flex items-center justify-between p-4 bg-surface border-b border-border/50 z-20 sticky top-0">
                    <div className="flex items-center">
                        <div className="bg-text-primary text-surface p-1 rounded-md mr-2">
                            <PlusSquare className="w-4 h-4" />
                        </div>
                        <h1 className="text-lg font-bold tracking-tight">MediControl</h1>
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
