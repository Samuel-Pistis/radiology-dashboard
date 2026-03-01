import React from 'react';
import { cn } from '@/lib/utils';
import { type LucideIcon } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
    icon: LucideIcon;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
    ({ className, icon: Icon, title, description, action, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn("flex flex-col items-center justify-center p-8 md:p-16 text-center", className)}
                {...props}
            >
                <div className="w-16 h-16 bg-surface-hover rounded-full flex items-center justify-center text-text-muted mb-6">
                    <Icon className="w-8 h-8 stroke-[1.5]" />
                </div>

                <h3 className="font-bold text-2xl text-text-primary tracking-tight mb-2">
                    {title}
                </h3>

                {description && (
                    <p className="font-semibold text-text-muted max-w-sm mb-6">
                        {description}
                    </p>
                )}

                {action && (
                    <Button variant="primary" onClick={action.onClick}>
                        {action.label}
                    </Button>
                )}
            </div>
        );
    }
);

EmptyState.displayName = 'EmptyState';
