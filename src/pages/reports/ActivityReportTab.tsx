import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, DataTable, EmptyState, Badge, Input, Button } from '@/components/ui';
import { Activity, Calendar } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Use same colors defined in index.css
const CHART_COLORS = {
    primary: '#0D9488',
    indigo: '#6366F1',
    amber: '#F59E0B'
};

export const ActivityReportTab: React.FC = () => {
    const { activityLogs, modalities } = useAppContext();
    const [filterDate, setFilterDate] = useState('');

    const filteredLogs = filterDate
        ? activityLogs.filter(log => log.date === filterDate)
        : activityLogs;

    // aggregate data for charting
    const chartData = useMemo(() => {
        // Group by Date for time-series charts
        const dateMap: Record<string, { date: string, investigations: number, revenue: number }> = {};

        filteredLogs.forEach(log => {
            if (!dateMap[log.date]) {
                dateMap[log.date] = { date: log.date, investigations: 0, revenue: 0 };
            }
            dateMap[log.date].investigations += (log.totalInvestigations || 0);
            dateMap[log.date].revenue += (log.revenueAmount || 0);
        });

        // Convert map to sorted array
        return Object.values(dateMap).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [filteredLogs]);

    const getModalityName = (id: string) => modalities.find(m => m.id === id)?.name || 'Unknown';

    const tableColumns: import('@/components/ui').Column<any>[] = [
        { header: 'Date', accessorKey: 'date', sortable: true },
        { header: 'Modality', accessorKey: (row: any) => <Badge variant="neutral">{getModalityName(row.modalityId)}</Badge> },
        { header: 'Investigations', accessorKey: 'totalInvestigations', sortable: true, align: 'center' as const },
        { header: '10x12 Film', accessorKey: 'film10x12Used', sortable: true, align: 'center' as const },
        { header: '14x17 Film', accessorKey: 'film14x17Used', sortable: true, align: 'center' as const },
        { header: 'Revenue (₦)', accessorKey: (row: any) => `₦${row.revenueAmount?.toLocaleString() || 0}`, align: 'right' as const }
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Filter Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/40 p-5 rounded-3xl border border-white/60 shadow-sm backdrop-blur-md">
                <div>
                    <h3 className="font-bold text-text-primary">Filter Activity</h3>
                    <p className="text-sm text-text-secondary">Select a specific date to narrow down the report.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <Calendar className="w-4 h-4 text-text-muted" />
                        </div>
                        <Input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    {filterDate && (
                        <Button variant="ghost" onClick={() => setFilterDate('')}>
                            Clear
                        </Button>
                    )}
                </div>
            </div>

            {filteredLogs.length === 0 ? (
                <EmptyState
                    icon={Activity}
                    title="No activity logs found"
                    description="Try adjusting your date requirements to see reporting data."
                />
            ) : (
                <>
                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="p-6">
                            <h4 className="font-bold text-text-primary mb-6">Daily Investigations</h4>
                            <div className="h-72 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6B7280' }} tickLine={false} axisLine={false} />
                                        <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            labelStyle={{ color: '#6B7280', fontWeight: 'bold', marginBottom: '4px' }}
                                        />
                                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                        <Line
                                            type="monotone"
                                            name="Investigations"
                                            dataKey="investigations"
                                            stroke={CHART_COLORS.primary}
                                            strokeWidth={3}
                                            dot={{ r: 4, strokeWidth: 2 }}
                                            activeDot={{ r: 6 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <h4 className="font-bold text-text-primary mb-6">Revenue Collection</h4>
                            <div className="h-72 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6B7280' }} tickLine={false} axisLine={false} />
                                        <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} tickLine={false} axisLine={false} tickFormatter={(val) => `₦${val / 1000}k`} />
                                        <Tooltip
                                            formatter={(value: any) => [`₦${Number(value || 0).toLocaleString()}`, 'Revenue']}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                        <Bar
                                            name="Revenue (₦)"
                                            dataKey="revenue"
                                            fill={CHART_COLORS.indigo}
                                            radius={[4, 4, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </div>

                    {/* Data Table */}
                    <Card className="p-0 overflow-hidden">
                        <div className="p-5 border-b border-border bg-white/50">
                            <h4 className="font-bold text-text-primary tracking-tight">Activity Log Details</h4>
                        </div>
                        <DataTable columns={tableColumns} data={filteredLogs} />
                    </Card>
                </>
            )}
        </div>
    );
};
