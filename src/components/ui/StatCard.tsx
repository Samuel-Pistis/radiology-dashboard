import React from 'react';
import { cn } from '@/lib/utils';
import { Card } from './Card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
    label: string;
    value: string | number;
    unit?: string;
    accentColor?: string;
    trend?: {
        direction: 'up' | 'down' | 'neutral';
        value: number;
        label: string;
    };
}

export const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
    ({ className, label, value, unit, accentColor = 'border-l-primary', trend, ...props }, ref) => {
        return (
            <Card ref={ref} variant="stat" accentColor={accentColor} className={cn('flex flex-col', className)} {...props}>
                <h3 className="text-sm font-medium text-text-secondary capitalize tracking-wide">{label}</h3>

                <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-semibold text-text-primary">{value}</span>
                    {unit && <span className="text-sm font-medium text-text-muted">{unit}</span>}
                </div>

                {trend && (
                    <div className={cn(
                        "flex items-center gap-1.5 mt-4 text-xs font-medium",
                        trend.direction === 'up' ? 'text-success' : trend.direction === 'down' ? 'text-danger' : 'text-text-muted'
                    )}>
                        {trend.direction === 'up' && <TrendingUp className="w-4 h-4" />}
                        {trend.direction === 'down' && <TrendingDown className="w-4 h-4" />}
                        {trend.direction === 'neutral' && <Minus className="w-4 h-4" />}
                        <span>{trend.direction === 'up' ? '+' : trend.direction === 'down' ? '-' : ''}{trend.value}%</span>
                        <span className="text-text-muted ml-0.5">{trend.label}</span>
                    </div>
                )}
            </Card>
        );
    }
);

StatCard.displayName = 'StatCard';
