import React from 'react';
import { cn } from '@/lib/utils';

export interface PageHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
    title: React.ReactNode;
    description?: React.ReactNode;
    actions?: React.ReactNode;
}

export const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
    ({ className, title, description, actions, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn("flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8", className)}
                {...props}
            >
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-text-primary">
                        {title}
                    </h2>
                    {description && (
                        <p className="text-text-secondary font-semibold mt-1">
                            {description}
                        </p>
                    )}
                </div>

                {actions && (
                    <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                        {actions}
                    </div>
                )}
            </div>
        );
    }
);

PageHeader.displayName = 'PageHeader';
