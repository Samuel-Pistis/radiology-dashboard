import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, CalendarRange, FileBarChart, Settings, LogOut, ShieldCheck, UserCog, X } from 'lucide-react';
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
                    "fixed md:static inset-y-0 left-0 z-50 w-72 md:w-64 bg-surface/40 backdrop-blur-2xl border border-white/50 md:m-4 rounded-r-[2rem] md:rounded-[2rem] shadow-xl flex flex-col h-full md:h-[calc(100vh-2rem)] text-text-primary transition-transform duration-300 ease-in-out",
                    isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                )}
            >
                <div className="h-24 flex items-center justify-between px-6 md:px-8 border-b border-black/5 md:border-none">
                    <div className="flex items-center">
                        <div className="bg-black text-white p-2 rounded-2xl mr-3 shadow-md flex items-center justify-center">
                            <span className="font-bold text-xl italic leading-none pr-1">sf.</span>
                        </div>
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
                                    'flex items-center gap-3 px-5 py-3.5 rounded-full transition-all duration-300 font-semibold',
                                    isActive
                                        ? 'bg-black shadow-lg shadow-black/20 text-white translate-x-1'
                                        : 'text-text-secondary hover:bg-white/40 hover:text-black'
                                )}
                            >
                                <Icon className="w-5 h-5" />
                                <span>{item.name}</span>
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="px-6 py-6 pb-8">
                    <div className="bg-gradient-to-br from-[#DDCBF5] to-[#7AFFA1] rounded-[1.5rem] p-5 text-black shadow-lg mb-6 border border-white/60">
                        <h3 className="font-bold text-xl mb-1 tracking-tight">MediControl PRO</h3>
                        <p className="text-xs text-black/80 mb-5 font-semibold leading-relaxed">
                            Full hospital management features. Access analytics, schedules, KPIs, and reports.
                        </p>
                        <button className="w-full bg-black text-white font-bold text-sm py-3 rounded-full shadow-md hover:scale-105 transition-transform">
                            Get PRO
                        </button>
                    </div>

                    <div className="flex items-center gap-4 mb-5 px-4 py-4 bg-white/40 rounded-full border border-white/60 shadow-sm backdrop-blur-md">
                        <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white shadow-inner">
                            {user?.role === 'admin' ? <ShieldCheck className="w-5 h-5" /> : <UserCog className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-black truncate">{user?.name}</p>
                            <p className="text-xs font-semibold text-black/60 truncate capitalize">{user?.role.replace('_', ' ')}</p>
                        </div>
                    </div>

                    <button
                        onClick={() => { logout(); onClose(); }}
                        className="flex items-center gap-3 px-4 py-3 w-full text-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all font-semibold group"
                    >
                        <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span>Log out</span>
                    </button>
                </div>
            </aside>
        </>
    );
};
