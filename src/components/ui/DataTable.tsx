import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export interface Column<T> {
    header: string;
    accessorKey: keyof T | ((row: T) => React.ReactNode);
    sortable?: boolean;
    align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    striped?: boolean;
    emptyStateMessage?: React.ReactNode;
    className?: string;
}

export function DataTable<T>({
    columns,
    data,
    striped = false,
    emptyStateMessage = "No data available.",
    className
}: DataTableProps<T>) {

    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

    const handleSort = (column: Column<T>) => {
        if (!column.sortable || typeof column.accessorKey === 'function') return;

        const key = String(column.accessorKey);
        let direction: 'asc' | 'desc' = 'asc';

        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }

        setSortConfig({ key, direction });
    };

    const sortedData = React.useMemo(() => {
        if (!sortConfig) return data;

        return [...data].sort((a, b) => {
            const aValue = a[sortConfig.key as keyof T];
            const bValue = b[sortConfig.key as keyof T];

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data, sortConfig]);

    if (data.length === 0) {
        return (
            <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-border rounded-xl", className)}>
                <p className="text-text-muted font-medium">{emptyStateMessage}</p>
            </div>
        );
    }

    return (
        <div className={cn("w-full overflow-auto rounded-xl border border-border bg-white shadow-sm", className)}>
            <table className="w-full text-sm text-left">
                <thead className="bg-surface border-b border-border sticky top-0 z-10">
                    <tr>
                        {columns.map((column, idx) => (
                            <th
                                key={idx}
                                className={cn(
                                    "p-4 font-semibold text-text-secondary tracking-wide whitespace-nowrap",
                                    column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left',
                                    column.sortable && typeof column.accessorKey !== 'function' ? 'cursor-pointer hover:bg-border/50 transition-colors select-none' : ''
                                )}
                                onClick={() => handleSort(column)}
                            >
                                <div className={cn("flex items-center gap-2", column.align === 'center' ? 'justify-center' : column.align === 'right' ? 'flex-row-reverse' : 'justify-start')}>
                                    {column.header}
                                    {column.sortable && typeof column.accessorKey !== 'function' && (
                                        <span className="text-text-muted shrink-0">
                                            {sortConfig?.key === String(column.accessorKey) ? (
                                                sortConfig.direction === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-primary" /> : <ArrowDown className="w-3.5 h-3.5 text-primary" />
                                            ) : (
                                                <ArrowUpDown className="w-3.5 h-3.5 opacity-50" />
                                            )}
                                        </span>
                                    )}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {sortedData.map((row, rowIndex) => (
                        <tr
                            key={rowIndex}
                            className={cn(
                                "hover:bg-surface-hover/50 transition-colors",
                                striped && rowIndex % 2 === 1 ? 'bg-surface/30' : 'bg-white'
                            )}
                        >
                            {columns.map((column, colIndex) => (
                                <td
                                    key={colIndex}
                                    className={cn(
                                        "p-4 text-text-primary font-medium",
                                        column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'
                                    )}
                                >
                                    {typeof column.accessorKey === 'function'
                                        ? column.accessorKey(row)
                                        : row[column.accessorKey as keyof T] as React.ReactNode}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
