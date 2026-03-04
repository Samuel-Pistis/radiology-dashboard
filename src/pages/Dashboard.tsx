import React, { useMemo, useState } from 'react';
import { useAppContext } from '../context/AppContext';

import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

import { PageHeader, StatCard, Card, Button, Select } from '@/components/ui';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatNaira } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';

import { Activity, AlertOctagon } from 'lucide-react';
import { HandoverTimeline } from '../components/HandoverTimeline';
import { EquipmentStatusWidget } from '../components/EquipmentStatusWidget';
import { DowntimeModal } from '../components/DowntimeModal';

import { useAuth } from '../context/AuthContext';

const COLORS = ['#0D9488', '#6366F1', '#F59E0B', '#10B981', '#111827', '#6B7280'];

type DateRangeFilter = 'today' | 'this_week' | 'this_month' | 'last_30_days' | 'all_time';

interface DailyActivityLog {
    id: string;
    date: string;
    modalityId: string;
    totalInvestigations?: number;
    revenueAmount?: number;
    film10x12Used?: number;
    film14x17Used?: number;
}

export const Dashboard: React.FC = () => {
    const { activityLogs, contrastRecords, weeklyOpsLogs, modalities, contrastTypes, isLoading } = useAppContext();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [dateRange, setDateRange] = useState<DateRangeFilter>('today');
    const [isDowntimeModalOpen, setIsDowntimeModalOpen] = useState(false);

    // Filter Logic
    const filterLogsByDate = <T extends { date?: string, weekStartDate?: string }>(logs: T[]): T[] => {
        if (!logs) return [];
        const now = new Date();
        return logs.filter(log => {
            const logDate = new Date(log.date || log.weekStartDate || '');
            if (isNaN(logDate.getTime())) return true; // Safety fallback

            switch (dateRange) {
                case 'today': {
                    return logDate.getDate() === now.getDate() &&
                        logDate.getMonth() === now.getMonth() &&
                        logDate.getFullYear() === now.getFullYear();
                }
                case 'this_week': {
                    const oneWeekAgo = new Date();
                    oneWeekAgo.setDate(now.getDate() - 7);
                    return logDate >= oneWeekAgo;
                }
                case 'this_month': {
                    return logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear();
                }
                case 'last_30_days': {
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(now.getDate() - 30);
                    return logDate >= thirtyDaysAgo;
                }
                case 'all_time':
                default:
                    return true;
            }
        });
    };

    const filteredActivityLogs = useMemo(() => filterLogsByDate(activityLogs), [activityLogs, dateRange]);
    const filteredContrastRecords = useMemo(() => filterLogsByDate(contrastRecords), [contrastRecords, dateRange]);
    const filteredWeeklyLogs = useMemo(() => filterLogsByDate(weeklyOpsLogs), [weeklyOpsLogs, dateRange]);

    // KPI Calculations based strictly on the filtered dates
    const totalInvestigations = useMemo(() =>
        filteredActivityLogs.reduce((acc, log) => acc + (log.totalInvestigations || 0), 0)
        , [filteredActivityLogs]);

    const totalRevenue = useMemo(() =>
        filteredActivityLogs.reduce((acc, log) => acc + (log.revenueAmount || 0), 0)
        , [filteredActivityLogs]);

    const totalContrastML = useMemo(() =>
        filteredContrastRecords.reduce((acc, log) => {
            const m = log.morning?.items?.reduce((s, i) => s + (i.amountConsumedMls || 0), 0) || 0;
            const a = log.afternoon?.items?.reduce((s, i) => s + (i.amountConsumedMls || 0), 0) || 0;
            const n = log.night?.items?.reduce((s, i) => s + (i.amountConsumedMls || 0), 0) || 0;
            return acc + m + a + n;
        }, 0)
        , [filteredContrastRecords]);

    const totalFilmsUsed = useMemo(() =>
        filteredActivityLogs.reduce((acc, log) => acc + (log.film10x12Used || 0) + (log.film14x17Used || 0), 0)
        , [filteredActivityLogs]);


    // 1. Film Consumption Trend (Stacked Bar)
    const filmData = useMemo(() => {
        return modalities.map(modality => {
            const logs = filteredActivityLogs.filter(log => log.modalityId === modality.id);
            const film10x12 = logs.reduce((sum, log) => sum + (log.film10x12Used || 0), 0);
            const film14x17 = logs.reduce((sum, log) => sum + (log.film14x17Used || 0), 0);
            return {
                name: modality.name,
                '10x12': film10x12,
                '14x17': film14x17,
                total: film10x12 + film14x17
            };
        }).filter(data => data.total > 0);
    }, [filteredActivityLogs, modalities]);

    const contrastData = useMemo(() => {
        const dates = Array.from(new Set(filteredContrastRecords.map(r => r.date))).sort();
        return dates.map(date => {
            const dayRecord = filteredContrastRecords.find(r => r.date === date);
            const dataPoint: any = { date: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) };
            if (dayRecord) {
                contrastTypes.forEach(type => {
                    const mlForType = (dayRecord.morning.items.find(i => i.contrastTypeId === type.id)?.amountConsumedMls || 0) +
                        (dayRecord.afternoon.items.find(i => i.contrastTypeId === type.id)?.amountConsumedMls || 0) +
                        (dayRecord.night.items.find(i => i.contrastTypeId === type.id)?.amountConsumedMls || 0);
                    if (mlForType > 0) {
                        dataPoint[type.name] = mlForType;
                    }
                });
            }
            return dataPoint;
        });
    }, [filteredContrastRecords, contrastTypes]);

    // 4. Revenue Comparison (Bar Chart)
    const revenueComparisonData = useMemo(() => {
        const sortedLogs = [...filteredWeeklyLogs].sort((a, b) => new Date(a.weekStartDate).getTime() - new Date(b.weekStartDate).getTime());
        if (sortedLogs.length === 0) return [];
        const logThisWeek = sortedLogs[sortedLogs.length - 1];
        const logLastWeek = sortedLogs.length > 1 ? sortedLogs[sortedLogs.length - 2] : null;

        return modalities.map(modality => {
            const current = logThisWeek.revenue?.find(r => r.modalityId === modality.id)?.amount || 0;
            const previous = logLastWeek?.revenue?.find(r => r.modalityId === modality.id)?.amount || 0;
            return {
                name: modality.name,
                'This Week': current,
                'Last Week': previous,
                total: current + previous
            };
        }).filter(data => data.total > 0);
    }, [filteredWeeklyLogs, modalities]);

    const recentActivityLogs = useMemo(() => {
        return [...activityLogs]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);
    }, [activityLogs]);

    const recentActivityColumns: Column<DailyActivityLog>[] = [
        { header: 'Date', accessorKey: (row: DailyActivityLog) => new Date(row.date).toLocaleDateString() },
        { header: 'Modality', accessorKey: (row: DailyActivityLog) => modalities.find(m => m.id === row.modalityId)?.name || 'Unknown' },
        { header: 'Investigations', accessorKey: 'totalInvestigations' }
    ];

    if (user?.role === 'admin') {
        recentActivityColumns.push({ header: 'Revenue', accessorKey: (row: DailyActivityLog) => formatNaira(row.revenueAmount || 0) });
    }

    const chartTooltipStyle = {
        backgroundColor: '#ffffff',
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        color: '#111827',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
    };

    if (isLoading) {
        return (
            <div className="space-y-8 animate-in fade-in pb-12">
                <div className="h-10 w-48 bg-gray-200 rounded animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-96 bg-gray-100 rounded-xl animate-pulse" />
                    <div className="h-96 bg-gray-100 rounded-xl animate-pulse" />
                </div>
            </div>
        );
    }

    const hasNoData = activityLogs.length === 0 && contrastRecords.length === 0;

    if (hasNoData) {
        return (
            <div className="max-w-4xl mx-auto py-12">
                <EmptyState
                    title="No activity logged yet"
                    icon={Activity}
                    description="Start tracking your facility's performance by adding your first daily log."
                    action={{
                        label: "Log Daily Activity",
                        onClick: () => navigate('/daily-logging')
                    }}
                />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <PageHeader
                title="Dashboard"
                actions={
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsDowntimeModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-danger/10 hover:bg-danger/20 text-danger text-sm font-bold transition-colors border border-danger/20"
                        >
                            <AlertOctagon className="w-4 h-4" />
                            Report Downtime
                        </button>
                        <Select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value as DateRangeFilter)}
                            className="w-48 bg-white"
                        >
                            <option value="today">Today</option>
                            <option value="this_week">This Week</option>
                            <option value="this_month">This Month</option>
                            <option value="last_30_days">Last 30 Days</option>
                            <option value="all_time">All Time</option>
                        </Select>
                    </div>
                }
            />

            {/* Top Section - KPI Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Total Investigations"
                    value={totalInvestigations}
                    accentColor="border-l-primary"
                    trend={{ direction: 'up', value: 0, label: "vs previous" }}
                />
                <StatCard
                    label="Contrast Used"
                    value={totalContrastML}
                    unit="mL"
                    accentColor="border-l-indigo-500"
                    trend={{ direction: 'neutral', value: 0, label: "Total volume" }}
                />

                {user?.role === 'admin' && (
                    <StatCard
                        label="Revenue Collected"
                        value={formatNaira(totalRevenue)}
                        accentColor="border-l-success"
                        trend={{ direction: 'up', value: 0, label: "vs previous" }}
                    />
                )}

                <StatCard
                    label="Films Used"
                    value={totalFilmsUsed}
                    accentColor="border-l-amber-500"
                    trend={{ direction: 'down', value: 0, label: "vs previous" }}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weekly Revenue Bar Chart (Admin Only) */}
                {user?.role === 'admin' && (
                    <Card>
                        <h3 className="text-xl font-semibold mb-6 text-text-primary">Weekly Revenue</h3>
                        {revenueComparisonData.length === 0 ? (
                            <div className="py-12 text-center text-text-secondary">
                                <p>No revenue comparison data available for this range.</p>
                            </div>
                        ) : (
                            <div className="h-80 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={revenueComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                                        <XAxis dataKey="name" stroke="#6B7280" axisLine={false} tickLine={false} />
                                        <YAxis stroke="#6B7280" axisLine={false} tickLine={false} />
                                        <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={chartTooltipStyle} />
                                        <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                                        <Bar dataKey="Last Week" fill="#E5E7EB" radius={[4, 4, 0, 0]} barSize={30} />
                                        <Bar dataKey="This Week" fill="#0D9488" radius={[4, 4, 0, 0]} barSize={30} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </Card>
                )}

                {/* Contrast Usage Line Chart */}
                <Card>
                    <h3 className="text-xl font-semibold mb-6 text-text-primary">Contrast Volume</h3>
                    {contrastData.length === 0 ? (
                        <div className="py-12 text-center text-text-secondary">
                            <p>No contrast usage data available for this range.</p>
                        </div>
                    ) : (
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={contrastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                                    <XAxis dataKey="date" stroke="#6B7280" axisLine={false} tickLine={false} dy={10} />
                                    <YAxis stroke="#6B7280" axisLine={false} tickLine={false} dx={-10} />
                                    <Tooltip contentStyle={chartTooltipStyle} />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                                    {contrastTypes.map((type, index) => (
                                        <Line
                                            key={type.id}
                                            type="monotone"
                                            dataKey={type.name}
                                            stroke={COLORS[index % COLORS.length]}
                                            strokeWidth={3}
                                            dot={{ r: 4, strokeWidth: 0, fill: COLORS[index % COLORS.length] }}
                                            activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                                        />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </Card>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Film Consumption Stacked Bar */}
                <Card>
                    <h3 className="text-xl font-semibold mb-6 text-text-primary">Film Consumption</h3>
                    {filmData.length === 0 ? (
                        <div className="py-12 text-center text-text-secondary">
                            <p>No film data available for this range.</p>
                        </div>
                    ) : (
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart layout="vertical" data={filmData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={true} vertical={false} />
                                    <XAxis type="number" stroke="#6B7280" axisLine={false} tickLine={false} />
                                    <YAxis type="category" dataKey="name" stroke="#6B7280" axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={chartTooltipStyle} />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                                    <Bar dataKey="10x12" stackId="a" fill="#F59E0B" radius={[0, 0, 0, 0]} barSize={30} />
                                    <Bar dataKey="14x17" stackId="a" fill="#D97706" radius={[0, 4, 4, 0]} barSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </Card>

                {/* Recent Activity Table */}
                <Card>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-semibold text-text-primary">Recent Activity</h3>
                        <Button variant="ghost" size="sm" onClick={() => navigate('/reports')}>View All</Button>
                    </div>
                    {recentActivityLogs.length === 0 ? (
                        <div className="py-12 text-center text-text-secondary">
                            <p>No activity has been logged yet.</p>
                        </div>
                    ) : (
                        <DataTable
                            data={recentActivityLogs}
                            columns={recentActivityColumns}
                        />
                    )}
                </Card>
            </div>

            {/* Equipment Status Widget */}
            <EquipmentStatusWidget />

            {/* Handover Timeline — Admin only, rendered by HandoverTimeline itself */}
            <HandoverTimeline />

            <DowntimeModal
                isOpen={isDowntimeModalOpen}
                onClose={() => setIsDowntimeModalOpen(false)}
            />
        </div>
    );
};
