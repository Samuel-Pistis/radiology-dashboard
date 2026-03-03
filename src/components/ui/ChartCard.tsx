import React from 'react';
import { ResponsiveContainer } from 'recharts';
import { Card } from './Card';

interface ChartCardProps {
    title: string;
    height?: number;
    className?: string;
    children: React.ReactElement; // the Recharts chart element
}

/**
 * Wraps a Recharts chart in the standard card + title + ResponsiveContainer shell.
 *
 * Usage:
 *   <ChartCard title="Daily Investigations">
 *     <LineChart data={data}>…</LineChart>
 *   </ChartCard>
 */
export const ChartCard: React.FC<ChartCardProps> = ({
    title,
    height = 288, // 72 * 4 = h-72
    className,
    children,
}) => (
    <Card className={`p-6 ${className ?? ''}`}>
        <h4 className="font-bold text-text-primary mb-6">{title}</h4>
        <div style={{ height }} className="w-full">
            <ResponsiveContainer width="100%" height="100%">
                {children}
            </ResponsiveContainer>
        </div>
    </Card>
);
