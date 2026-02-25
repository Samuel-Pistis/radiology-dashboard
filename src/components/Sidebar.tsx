import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, CalendarRange, FileBarChart, Settings, LogOut, PlusSquare } from 'lucide-react';
import clsx from 'clsx';

const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Daily Logging', path: '/daily-logging', icon: CalendarDays },
    { name: 'Weekly Operations', path: '/weekly-operations', icon: CalendarRange },
    { name: 'Reports', path: '/reports', icon: FileBarChart },
    { name: 'Settings', path: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
    return (
        <aside className="w-64 bg-surface m-4 rounded-3xl shadow-sm flex flex-col h-[calc(100vh-2rem)] text-text-primary">
            <div className="h-20 flex items-center px-8">
                <div className="bg-text-primary text-surface p-1.5 rounded-lg mr-3">
                    <PlusSquare className="w-5 h-5" />
                </div>
                <h1 className="text-xl font-bold tracking-tight">MediControl</h1>
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

                <button className="flex items-center gap-3 px-2 py-3 w-full text-text-secondary hover:text-text-primary transition-colors font-medium">
                    <LogOut className="w-5 h-5" />
                    <span>Log out</span>
                </button>
            </div>
        </aside>
    );
};
