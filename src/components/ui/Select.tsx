import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    helperText?: string;
    error?: string;
    leftIcon?: React.ReactNode;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, label, helperText, error, leftIcon, id, children, ...props }, ref) => {

        const selectId = id || React.useId();

        return (
            <div className="flex flex-col w-full">
                {label && (
                    <label htmlFor={selectId} className="mb-1.5 text-sm font-semibold text-text-primary flex items-center gap-2">
                        {label}
                    </label>
                )}

                <div className="relative flex items-center">
                    {leftIcon && (
                        <div className="absolute left-3 text-text-muted flex items-center justify-center pointer-events-none w-5 h-5 [&>svg]:w-5 [&>svg]:h-5 [&>svg]:stroke-[2.5]">
                            {leftIcon}
                        </div>
                    )}

                    <select
                        id={selectId}
                        ref={ref}
                        className={cn(
                            'w-full appearance-none rounded-lg border bg-white px-3 py-2 pr-10 text-text-primary font-medium outline-none transition-all focus:ring-2 disabled:cursor-not-allowed disabled:bg-surface disabled:opacity-50',
                            error
                                ? 'border-danger focus:border-danger focus:ring-danger/20'
                                : 'border-border focus:border-primary focus:ring-primary/20 hover:border-text-muted/50',
                            leftIcon && 'pl-10',
                            className
                        )}
                        {...props}
                    >
                        {children}
                    </select>

                    <div className="absolute right-3 text-text-muted flex items-center justify-center pointer-events-none">
                        <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                    </div>
                </div>

                {(helperText || error) && (
                    <p className={cn("mt-1.5 text-xs font-medium", error ? "text-danger" : "text-text-muted")}>
                        {error || helperText}
                    </p>
                )}
            </div>
        );
    }
);

Select.displayName = 'Select';
