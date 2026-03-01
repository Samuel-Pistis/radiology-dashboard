import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2, type LucideIcon } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    icon?: LucideIcon;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', loading = false, icon: Icon, children, disabled, ...props }, ref) => {

        // Base styles all buttons share
        const baseStyles = 'inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50';

        // Variant-specific styles
        const variants = {
            primary: 'bg-primary text-white hover:bg-primary/90 shadow-sm',
            secondary: 'bg-surface hover:bg-border text-text-primary border border-border shadow-sm',
            ghost: 'hover:bg-surface-hover hover:text-text-primary text-text-secondary',
            danger: 'bg-danger text-white hover:bg-danger/90 shadow-sm'
        };

        // Size-specific styles
        const sizes = {
            sm: 'h-8 px-3 text-xs',
            md: 'h-10 px-4 py-2',
            lg: 'h-12 px-8 text-lg'
        };

        return (
            <button
                ref={ref}
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                disabled={disabled || loading}
                {...props}
            >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {!loading && Icon && <Icon className={cn('mr-2 h-4 w-4', size === 'lg' && 'h-5 w-5', size === 'sm' && 'h-3 w-3')} />}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';
