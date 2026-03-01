import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'stat';
    accentColor?: string; // Tailwind color class like 'border-primary'
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant = 'default', accentColor, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'bg-card rounded-xl border border-border shadow-sm p-5',
                    variant === 'stat' && cn('border-l-4', accentColor || 'border-l-primary'),
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = 'Card';
