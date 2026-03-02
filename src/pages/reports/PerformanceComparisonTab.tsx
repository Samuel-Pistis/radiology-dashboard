import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, EmptyState, Input } from '@/components/ui';
import { Spline, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CHART_COLORS = {
    periodA: '#94A3B8', // slate-400
    periodB: '#0D9488'  // primary
};

export const PerformanceComparisonTab: React.FC = () => {
    const { activityLogs, contrastRecords } = useAppContext();

    // Period A
    const [startA, setStartA] = useState('');
    const [endA, setEndA] = useState('');

    // Period B
    const [startB, setStartB] = useState('');
    const [endB, setEndB] = useState('');

    const calculateMetrics = (start: string, end: string) => {
        if (!start || !end) return null;

        const pActivity = activityLogs.filter(log => log.date >= start && log.date <= end);
        const pContrast = contrastRecords.filter(log => log.date >= start && log.date <= end);

        const totalInvestigations = pActivity.reduce((sum, log) => sum + (log.totalInvestigations || 0), 0);
        const totalRevenue = pActivity.reduce((sum, log) => sum + (log.revenueAmount || 0), 0);

        const totalContrastMl = pContrast.reduce((outerSum, record) => {
            const dailyMls = record.morning.items.reduce((s, i) => s + i.amountConsumedMls, 0) +
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
        return {
            pct: Number(Math.abs(change).toFixed(1)),
            trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
            rawChange: valB - valA
        };
    };

    // Chart Data Generation
    const chartData = useMemo(() => {
        if (!metricsA || !metricsB) return [];

        return [
            {
                name: 'Total Scans',
                'Period A': metricsA.totalInvestigations,
                'Period B': metricsB.totalInvestigations
            },
            {
                name: 'Contrast Used (ML)',
                'Period A': metricsA.totalContrastMl,
                'Period B': metricsB.totalContrastMl
            }
        ];
    }, [metricsA, metricsB]);

    const revenueChartData = useMemo(() => {
        if (!metricsA || !metricsB) return [];

        return [
            {
                name: 'Total Revenue',
                'Period A': metricsA.totalRevenue,
                'Period B': metricsB.totalRevenue
            }
        ];
    }, [metricsA, metricsB]);

    const renderTrendIndicator = (trendObj: { pct: number, trend: string }) => {
        if (trendObj.trend === 'up') {
            return (
                <span className="text-success flex items-center gap-1 font-bold text-sm bg-success/10 px-2 py-1 rounded-md">
                    <ArrowUpRight className="w-4 h-4" /> +{trendObj.pct}%
                </span>
            );
        }
        if (trendObj.trend === 'down') {
            return (
                <span className="text-danger flex items-center gap-1 font-bold text-sm bg-danger/10 px-2 py-1 rounded-md">
                    <ArrowDownRight className="w-4 h-4" /> -{trendObj.pct}%
                </span>
            );
        }
        return (
            <span className="text-text-muted flex items-center gap-1 font-bold text-sm bg-black/5 px-2 py-1 rounded-md">
                <Minus className="w-4 h-4" /> 0%
            </span>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Filter Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Period A */}
                <div className="bg-white/40 p-5 rounded-3xl border border-white/60 shadow-sm backdrop-blur-md">
                    <div className="flex justify-between items-center border-b border-black/5 pb-4 mb-4">
                        <h3 className="font-bold text-text-primary flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-slate-400"></div> Period A
                        </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Start Date"
                            type="date"
                            value={startA}
                            onChange={(e) => setStartA(e.target.value)}
                        />
                        <Input
                            label="End Date"
                            type="date"
                            value={endA}
                            onChange={(e) => setEndA(e.target.value)}
                        />
                    </div>
                </div>

                {/* Period B */}
                <div className="bg-white/40 p-5 rounded-3xl border border-white/60 shadow-sm backdrop-blur-md">
                    <div className="flex justify-between items-center border-b border-black/5 pb-4 mb-4">
                        <h3 className="font-bold text-text-primary flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-primary"></div> Period B
                        </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Start Date"
                            type="date"
                            value={startB}
                            onChange={(e) => setStartB(e.target.value)}
                        />
                        <Input
                            label="End Date"
                            type="date"
                            value={endB}
                            onChange={(e) => setEndB(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {(!metricsA || !metricsB) ? (
                <EmptyState
                    icon={Spline}
                    title="Select Comparison Dates"
                    description="Please provide start and end dates for both Period A and Period B to see the performance comparison."
                />
            ) : (
                <>
                    {/* High-Level Metric Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Investigations */}
                        <Card className="p-6 relative overflow-hidden group">
                            <div className="text-[10px] font-bold tracking-widest text-text-secondary uppercase mb-4">Investigations</div>
                            <div className="flex justify-between items-end mb-2">
                                <div className="space-y-1">
                                    <div className="text-sm font-semibold text-text-muted">Period A: <span className="text-text-primary">{metricsA.totalInvestigations}</span></div>
                                    <div className="text-sm font-bold text-primary">Period B: {metricsB.totalInvestigations}</div>
                                </div>
                                {renderTrendIndicator(calculateChange(metricsA.totalInvestigations, metricsB.totalInvestigations))}
                            </div>
                        </Card>

                        {/* Revenue */}
                        <Card className="p-6 relative overflow-hidden group">
                            <div className="text-[10px] font-bold tracking-widest text-text-secondary uppercase mb-4">Total Revenue</div>
                            <div className="flex justify-between items-end mb-2">
                                <div className="space-y-1">
                                    <div className="text-sm font-semibold text-text-muted">Period A: <span className="text-text-primary">₦{metricsA.totalRevenue.toLocaleString()}</span></div>
                                    <div className="text-sm font-bold text-primary">Period B: ₦{metricsB.totalRevenue.toLocaleString()}</div>
                                </div>
                                {renderTrendIndicator(calculateChange(metricsA.totalRevenue, metricsB.totalRevenue))}
                            </div>
                        </Card>

                        {/* Contrast */}
                        <Card className="p-6 relative overflow-hidden group">
                            <div className="text-[10px] font-bold tracking-widest text-text-secondary uppercase mb-4">Contrast Consumed (ML)</div>
                            <div className="flex justify-between items-end mb-2">
                                <div className="space-y-1">
                                    <div className="text-sm font-semibold text-text-muted">Period A: <span className="text-text-primary">{metricsA.totalContrastMl}</span></div>
                                    <div className="text-sm font-bold text-primary">Period B: {metricsB.totalContrastMl}</div>
                                </div>
                                {renderTrendIndicator(calculateChange(metricsA.totalContrastMl, metricsB.totalContrastMl))}
                            </div>
                        </Card>
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Operational Volumes Chart */}
                        <Card className="p-6">
                            <h4 className="font-bold text-text-primary mb-6">Operational Volumes</h4>
                            <div className="h-72 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} tickLine={false} axisLine={false} />
                                        <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                        />
                                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                        <Bar name="Period A" dataKey="Period A" fill={CHART_COLORS.periodA} radius={[4, 4, 0, 0]} />
                                        <Bar name="Period B" dataKey="Period B" fill={CHART_COLORS.periodB} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        {/* Revenue Comparison Chart */}
                        <Card className="p-6">
                            <h4 className="font-bold text-text-primary mb-6">Financial Comparison</h4>
                            <div className="h-72 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={revenueChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} tickLine={false} axisLine={false} />
                                        <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} tickLine={false} axisLine={false} tickFormatter={(val) => `₦${val / 1000}k`} />
                                        <Tooltip
                                            formatter={(value: any) => [`₦${Number(value || 0).toLocaleString()}`, '']}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                        />
                                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                        <Bar name="Period A" dataKey="Period A" fill={CHART_COLORS.periodA} radius={[4, 4, 0, 0]} />
                                        <Bar name="Period B" dataKey="Period B" fill={CHART_COLORS.periodB} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
};
