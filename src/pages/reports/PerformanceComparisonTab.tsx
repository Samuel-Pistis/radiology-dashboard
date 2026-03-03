import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, EmptyState, Input } from '@/components/ui';
import { ChartCard } from '@/components/ui/ChartCard';
import { Spline, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import {
    CHART_COLORS, AXIS_TICK_PROPS, TOOLTIP_CONTENT_STYLE,
    LEGEND_WRAPPER_STYLE, GRID_PROPS,
} from '@/lib/chartConfig';

const PERIOD_COLORS = {
    periodA: CHART_COLORS.slate,
    periodB: CHART_COLORS.primary,
} as const;

export const PerformanceComparisonTab: React.FC = () => {
    const { activityLogs, contrastRecords } = useAppContext();

    const [startA, setStartA] = useState('');
    const [endA, setEndA] = useState('');
    const [startB, setStartB] = useState('');
    const [endB, setEndB] = useState('');

    const calculateMetrics = (start: string, end: string) => {
        if (!start || !end) return null;
        const pActivity = activityLogs.filter(log => log.date >= start && log.date <= end);
        const pContrast = contrastRecords.filter(log => log.date >= start && log.date <= end);
        const totalInvestigations = pActivity.reduce((sum, log) => sum + (log.totalInvestigations || 0), 0);
        const totalRevenue = pActivity.reduce((sum, log) => sum + (log.revenueAmount || 0), 0);
        const totalContrastMl = pContrast.reduce((outerSum, record) => {
            const dailyMls =
                record.morning.items.reduce((s, i) => s + i.amountConsumedMls, 0) +
                record.afternoon.items.reduce((s, i) => s + i.amountConsumedMls, 0) +
                record.night.items.reduce((s, i) => s + i.amountConsumedMls, 0);
            return outerSum + dailyMls;
        }, 0);
        return { totalInvestigations, totalRevenue, totalContrastMl };
    };

    const metricsA = useMemo(() => calculateMetrics(startA, endA), [startA, endA, activityLogs, contrastRecords]);
    const metricsB = useMemo(() => calculateMetrics(startB, endB), [startB, endB, activityLogs, contrastRecords]);

    const calculateChange = (valA: number, valB: number) => {
        if (valA === 0 && valB === 0) return { pct: 0, trend: 'neutral' };
        if (valA === 0) return { pct: 100, trend: 'up' };
        const change = ((valB - valA) / valA) * 100;
        return { pct: Number(Math.abs(change).toFixed(1)), trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral' };
    };

    const chartData = useMemo(() => {
        if (!metricsA || !metricsB) return [];
        return [
            { name: 'Total Scans', 'Period A': metricsA.totalInvestigations, 'Period B': metricsB.totalInvestigations },
            { name: 'Contrast Used (ML)', 'Period A': metricsA.totalContrastMl, 'Period B': metricsB.totalContrastMl },
        ];
    }, [metricsA, metricsB]);

    const revenueChartData = useMemo(() => {
        if (!metricsA || !metricsB) return [];
        return [{ name: 'Total Revenue', 'Period A': metricsA.totalRevenue, 'Period B': metricsB.totalRevenue }];
    }, [metricsA, metricsB]);

    const renderTrendIndicator = (trendObj: { pct: number; trend: string }) => {
        if (trendObj.trend === 'up')
            return <span className="text-success flex items-center gap-1 font-bold text-sm bg-success/10 px-2 py-1 rounded-md"><ArrowUpRight className="w-4 h-4" /> +{trendObj.pct}%</span>;
        if (trendObj.trend === 'down')
            return <span className="text-danger flex items-center gap-1 font-bold text-sm bg-danger/10 px-2 py-1 rounded-md"><ArrowDownRight className="w-4 h-4" /> -{trendObj.pct}%</span>;
        return <span className="text-text-muted flex items-center gap-1 font-bold text-sm bg-black/5 px-2 py-1 rounded-md"><Minus className="w-4 h-4" /> 0%</span>;
    };

    const sharedBarChart = (data: any[]) => (
        <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis dataKey="name" {...AXIS_TICK_PROPS} />
            <YAxis {...AXIS_TICK_PROPS} />
            <Tooltip contentStyle={TOOLTIP_CONTENT_STYLE} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
            <Legend wrapperStyle={LEGEND_WRAPPER_STYLE} />
            <Bar name="Period A" dataKey="Period A" fill={PERIOD_COLORS.periodA} radius={[4, 4, 0, 0]} />
            <Bar name="Period B" dataKey="Period B" fill={PERIOD_COLORS.periodB} radius={[4, 4, 0, 0]} />
        </BarChart>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[
                    { label: 'Period A', dot: 'bg-slate-400', start: startA, end: endA, setStart: setStartA, setEnd: setEndA },
                    { label: 'Period B', dot: 'bg-primary', start: startB, end: endB, setStart: setStartB, setEnd: setEndB },
                ].map(p => (
                    <div key={p.label} className="bg-white/40 p-5 rounded-3xl border border-white/60 shadow-sm backdrop-blur-md">
                        <div className="flex justify-between items-center border-b border-black/5 pb-4 mb-4">
                            <h3 className="font-bold text-text-primary flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${p.dot}`}></div> {p.label}
                            </h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Start Date" type="date" value={p.start} onChange={(e) => p.setStart(e.target.value)} />
                            <Input label="End Date" type="date" value={p.end} onChange={(e) => p.setEnd(e.target.value)} />
                        </div>
                    </div>
                ))}
            </div>

            {(!metricsA || !metricsB) ? (
                <EmptyState
                    icon={Spline}
                    title="Select Comparison Dates"
                    description="Please provide start and end dates for both Period A and Period B to see the performance comparison."
                />
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { label: 'Investigations', a: metricsA.totalInvestigations, b: metricsB.totalInvestigations, fmt: (v: number) => String(v) },
                            { label: 'Total Revenue', a: metricsA.totalRevenue, b: metricsB.totalRevenue, fmt: (v: number) => `₦${v.toLocaleString()}` },
                            { label: 'Contrast Consumed (ML)', a: metricsA.totalContrastMl, b: metricsB.totalContrastMl, fmt: (v: number) => String(v) },
                        ].map(m => (
                            <Card key={m.label} className="p-6 relative overflow-hidden group">
                                <div className="text-[10px] font-bold tracking-widest text-text-secondary uppercase mb-4">{m.label}</div>
                                <div className="flex justify-between items-end mb-2">
                                    <div className="space-y-1">
                                        <div className="text-sm font-semibold text-text-muted">Period A: <span className="text-text-primary">{m.fmt(m.a)}</span></div>
                                        <div className="text-sm font-bold text-primary">Period B: {m.fmt(m.b)}</div>
                                    </div>
                                    {renderTrendIndicator(calculateChange(m.a, m.b))}
                                </div>
                            </Card>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <ChartCard title="Operational Volumes">{sharedBarChart(chartData)}</ChartCard>
                        <ChartCard title="Financial Comparison">
                            <BarChart data={revenueChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                <CartesianGrid {...GRID_PROPS} />
                                <XAxis dataKey="name" {...AXIS_TICK_PROPS} />
                                <YAxis {...AXIS_TICK_PROPS} tickFormatter={(val) => `₦${val / 1000}k`} />
                                <Tooltip
                                    formatter={(value: any) => [`₦${Number(value || 0).toLocaleString()}`, '']}
                                    contentStyle={TOOLTIP_CONTENT_STYLE}
                                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                />
                                <Legend wrapperStyle={LEGEND_WRAPPER_STYLE} />
                                <Bar name="Period A" dataKey="Period A" fill={PERIOD_COLORS.periodA} radius={[4, 4, 0, 0]} />
                                <Bar name="Period B" dataKey="Period B" fill={PERIOD_COLORS.periodB} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ChartCard>
                    </div>
                </>
            )}
        </div>
    );
};
