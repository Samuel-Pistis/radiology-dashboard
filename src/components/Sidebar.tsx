import React from 'react';
import { NavLink, Link } from 'react-router-dom';
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
                    "fixed md:static inset-y-0 left-0 z-50 w-72 md:w-64 bg-gray-900 text-white md:m-4 rounded-r-2xl md:rounded-2xl shadow-xl flex flex-col h-full md:h-[calc(100vh-2rem)] transition-transform duration-300 ease-in-out",
                    isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                )}
            >
                <div className="h-24 flex items-center justify-between px-6 md:px-8 border-b border-gray-800 md:border-none">
                    <Link to="/" className="flex items-center gap-3">
                        <div className="bg-primary text-white p-2 rounded-xl flex items-center justify-center shadow-sm">
                            <span className="font-bold text-xl leading-none">RP</span>
                        </div>
                        <span className="font-bold text-xl tracking-tight">RadPadi</span>
                    </Link>
                    {/* Mobile close button */}
                    <button
                        onClick={onClose}
                        className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors"
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
                                    'flex items-center gap-3 px-5 py-3.5 rounded-xl transition-all duration-300 font-medium',
                                    isActive
                                        ? 'bg-primary text-white shadow-md'
                                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                )}
                            >
                                <Icon className="w-5 h-5" />
                                <span>{item.name}</span>
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="px-6 py-6 pb-8">
                    <div className="flex items-center gap-4 mb-5 px-4 py-4 bg-gray-800 rounded-xl border border-gray-700 shadow-sm">
                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-300">
                            {user?.role === 'admin' ? <ShieldCheck className="w-5 h-5" /> : <UserCog className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">{user?.name}</p>
                            <p className="text-xs font-semibold text-gray-400 truncate capitalize">{user?.role.replace('_', ' ')}</p>
                        </div>
                    </div>

                    <button
                        onClick={() => { logout(); onClose(); }}
                        className="flex items-center gap-3 px-4 py-3 w-full text-gray-400 hover:text-danger hover:bg-danger/10 rounded-xl transition-all font-medium group"
                    >
                        <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span>Log out</span>
                    </button>
                </div>
            </aside>
        </>
    );
};
