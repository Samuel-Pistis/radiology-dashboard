import React from 'react';
import { cn } from '@/lib/utils';

export interface TabItem {
    label: string | React.ReactNode;
    value: string;
    icon?: React.ReactNode;
}

export interface TabsProps {
    items: TabItem[];
    activeValue: string;
    onChange: (value: string) => void;
    className?: string;
    scrollable?: boolean;
}

export const Tabs: React.FC<TabsProps> = ({
    items,
    activeValue,
    onChange,
    className,
    scrollable = true
}) => {
    return (
        <div className={cn(
            "flex border-b-2 border-border mb-8 pb-px w-full",
            scrollable && "overflow-x-auto hide-scrollbar space-x-2",
            className
        )}>
            {items.map((tab) => (
                <button
                    key={tab.value}
                    onClick={() => onChange(tab.value)}
                    className={cn(
                        "flex items-center gap-2 px-6 md:px-8 py-4 font-bold transition-colors rounded-t-2xl whitespace-nowrap border-b-2 -mb-[2px]",
                        activeValue === tab.value
                            ? 'border-primary text-text-primary bg-surface shadow-sm'
                            : 'border-transparent text-text-muted hover:text-text-primary hover:bg-surface-hover/50'
                    )}
                >
                    {tab.icon && (
                        <span className={cn(activeValue === tab.value && 'stroke-[3] opacity-100', 'opacity-70')}>
                            {tab.icon}
                        </span>
                    )}
                    {tab.label}
                </button>
            ))}
        </div>
    );
};
