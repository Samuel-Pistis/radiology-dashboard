import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, DataTable, EmptyState, Badge, Input } from '@/components/ui';
import { ReportFilterBar } from '@/components/ui/ReportFilterBar';
import { ChartCard } from '@/components/ui/ChartCard';
import { Activity, Calendar } from 'lucide-react';
import {
    LineChart, Line, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import {
    CHART_COLORS, AXIS_TICK_PROPS, TOOLTIP_CONTENT_STYLE,
    TOOLTIP_LABEL_STYLE, LEGEND_WRAPPER_STYLE, GRID_PROPS,
} from '@/lib/chartConfig';

export const ActivityReportTab: React.FC = () => {
    const { activityLogs, modalities } = useAppContext();
    const [filterDate, setFilterDate] = useState('');

    const filteredLogs = filterDate
        ? activityLogs.filter(log => log.date === filterDate)
        : activityLogs;

    const chartData = useMemo(() => {
        const dateMap: Record<string, { date: string; investigations: number; revenue: number }> = {};
        filteredLogs.forEach(log => {
            if (!dateMap[log.date]) {
                dateMap[log.date] = { date: log.date, investigations: 0, revenue: 0 };
            }
            dateMap[log.date].investigations += (log.totalInvestigations || 0);
            dateMap[log.date].revenue += (log.revenueAmount || 0);
        });
        return Object.values(dateMap).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [filteredLogs]);

    const getModalityName = (id: string) => modalities.find(m => m.id === id)?.name || 'Unknown';

    const tableColumns: import('@/components/ui').Column<any>[] = [
        { header: 'Date', accessorKey: 'date', sortable: true },
        { header: 'Modality', accessorKey: (row: any) => <Badge variant="neutral">{getModalityName(row.modalityId)}</Badge> },
        { header: 'Investigations', accessorKey: 'totalInvestigations', sortable: true, align: 'center' as const },
        { header: '10x12 Film', accessorKey: 'film10x12Used', sortable: true, align: 'center' as const },
        { header: '14x17 Film', accessorKey: 'film14x17Used', sortable: true, align: 'center' as const },
        { header: 'Revenue (₦)', accessorKey: (row: any) => `₦${row.revenueAmount?.toLocaleString() || 0}`, align: 'right' as const },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <ReportFilterBar
                title="Filter Activity"
                description="Select a specific date to narrow down the report."
                hasActiveFilter={!!filterDate}
                onClear={() => setFilterDate('')}
            >
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
            </ReportFilterBar>

            {filteredLogs.length === 0 ? (
                <EmptyState
                    icon={Activity}
                    title="No activity logs found"
                    description="Try adjusting your date requirements to see reporting data."
                />
            ) : (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <ChartCard title="Daily Investigations">
                            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                <CartesianGrid {...GRID_PROPS} />
                                <XAxis dataKey="date" {...AXIS_TICK_PROPS} />
                                <YAxis {...AXIS_TICK_PROPS} />
                                <Tooltip contentStyle={TOOLTIP_CONTENT_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} />
                                <Legend wrapperStyle={LEGEND_WRAPPER_STYLE} />
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
                        </ChartCard>

                        <ChartCard title="Revenue Collection">
                            <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                <CartesianGrid {...GRID_PROPS} />
                                <XAxis dataKey="date" {...AXIS_TICK_PROPS} />
                                <YAxis {...AXIS_TICK_PROPS} tickFormatter={(val) => `₦${val / 1000}k`} />
                                <Tooltip
                                    formatter={(value: any) => [`₦${Number(value || 0).toLocaleString()}`, 'Revenue']}
                                    contentStyle={TOOLTIP_CONTENT_STYLE}
                                />
                                <Legend wrapperStyle={LEGEND_WRAPPER_STYLE} />
                                <Bar name="Revenue (₦)" dataKey="revenue" fill={CHART_COLORS.indigo} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ChartCard>
                    </div>

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
