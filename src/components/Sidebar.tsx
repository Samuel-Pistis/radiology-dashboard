import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, CalendarRange, FileBarChart, Settings, LogOut, PlusSquare, ShieldCheck, UserCog, X } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';

const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Daily Logging', path: '/daily-logging', icon: CalendarDays },
    { name: 'Weekly Operations', path: '/weekly-operations', icon: CalendarRange },
    { name: 'Reports', path: '/reports', icon: FileBarChart },
    { name: 'Settings', path: '/settings', icon: Settings },
];

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    const { user, logout } = useAuth();

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 z-40 bg-zinc-900/60 backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}
            <aside
                className={clsx(
                    "fixed md:static inset-y-0 left-0 z-50 w-72 md:w-64 bg-surface md:m-4 rounded-r-3xl md:rounded-3xl shadow-2xl md:shadow-sm flex flex-col h-full md:h-[calc(100vh-2rem)] text-text-primary transition-transform duration-300 ease-in-out",
                    isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                )}
            >
                <div className="h-20 flex items-center justify-between px-6 md:px-8 border-b border-border/10 md:border-none">
                    <div className="flex items-center">
                        <div className="bg-text-primary text-surface p-1.5 rounded-lg mr-3 shadow-sm">
                            <PlusSquare className="w-5 h-5" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight">MediControl</h1>
                    </div>
                    {/* Mobile close button */}
                    <button
                        onClick={onClose}
                        className="md:hidden p-2 text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.name}
                                to={item.path}
                                className={({ isActive }) => clsx(
                                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium',
                                    isActive
                                        ? 'bg-surface shadow-[0_4px_12px_rgba(0,0,0,0.05)] text-text-primary'
                                        : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                                )}
                            >
                                <Icon className="w-5 h-5" />
                                <span>{item.name}</span>
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="px-6 py-4">
                    <div className="bg-gradient-to-br from-secondary-500 to-primary-500 rounded-2xl p-5 text-white shadow-lg shadow-primary-500/20 mb-4">
                        <h3 className="font-bold text-lg mb-1">MediControl PRO</h3>
                        <p className="text-xs text-white/90 mb-4 font-medium leading-relaxed">
                            Full hospital management features. Access analytics, schedules, KPIs, and reports.
                        </p>
                        <button className="w-full bg-white text-text-primary font-bold text-sm py-2 rounded-xl shadow-sm hover:shadow transition-shadow">
                            Get PRO
                        </button>
                    </div>

                    <div className="flex items-center gap-3 mb-4 px-2 py-3 bg-surface-hover rounded-xl border border-border/50">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                            {user?.role === 'admin' ? <ShieldCheck className="w-5 h-5" /> : <UserCog className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-text-primary truncate">{user?.name}</p>
                            <p className="text-xs text-text-secondary truncate capitalize">{user?.role.replace('_', ' ')}</p>
                        </div>
                    </div>

                    <button
                        onClick={() => { logout(); onClose(); }}
                        className="flex items-center gap-3 px-2 py-3 w-full text-text-secondary hover:text-red-600 hover:bg-red-50 rounded-xl transition-all font-medium group"
                    >
                        <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span>Log out</span>
                    </button>
                </div>
            </aside>
        </>
    );
};
