import React from 'react';
import { Button } from './Button';

interface ReportFilterBarProps {
    title: string;
    description: string;
    hasActiveFilter: boolean;
    onClear: () => void;
    children: React.ReactNode; // the filter inputs
}

/**
 * Shared filter bar used at the top of report tabs.
 * Replaces the repeated glassmorphism filter container.
 *
 * Usage:
 *   <ReportFilterBar
 *     title="Filter Activity"
 *     description="Select a specific date to narrow down the report."
 *     hasActiveFilter={!!filterDate}
 *     onClear={() => setFilterDate('')}
 *   >
 *     <Input type="date" … />
 *   </ReportFilterBar>
 */
export const ReportFilterBar: React.FC<ReportFilterBarProps> = ({
    title,
    description,
    hasActiveFilter,
    onClear,
    children,
}) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/40 p-5 rounded-3xl border border-white/60 shadow-sm backdrop-blur-md">
        <div>
            <h3 className="font-bold text-text-primary">{title}</h3>
            <p className="text-sm text-text-secondary">{description}</p>
        </div>
        <div className="flex items-center gap-3">
            {children}
            {hasActiveFilter && (
                <Button variant="ghost" onClick={onClear}>
                    Clear
                </Button>
            )}
        </div>
    </div>
);
