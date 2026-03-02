import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, DataTable, EmptyState, Badge, Input, Button } from '@/components/ui';
import { Droplets, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CHART_COLORS = [
    '#0D9488', // primary
    '#6366F1', // indigo
    '#F59E0B', // amber
    '#EC4899', // pink
    '#8B5CF6', // purple
    '#10B981', // emerald
];

export const ContrastReportTab: React.FC = () => {
    const { contrastRecords, contrastTypes } = useAppContext();
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const filteredRecords = useMemo(() => {
        return contrastRecords.filter(log => {
            if (startDate && log.date < startDate) return false;
            if (endDate && log.date > endDate) return false;
            return true;
        });
    }, [contrastRecords, startDate, endDate]);

    // Data for Stacked Area Chart
    const chartData = useMemo(() => {
        const dateMap: Record<string, any> = {};

        filteredRecords.forEach(record => {
            if (!dateMap[record.date]) {
                dateMap[record.date] = { date: record.date };
                contrastTypes.forEach(c => dateMap[record.date][c.name] = 0);
            }

            contrastTypes.forEach(c => {
                const mAmount = record.morning.items.find(i => i.contrastTypeId === c.id)?.amountConsumedMls || 0;
                const aAmount = record.afternoon.items.find(i => i.contrastTypeId === c.id)?.amountConsumedMls || 0;
                const nAmount = record.night.items.find(i => i.contrastTypeId === c.id)?.amountConsumedMls || 0;
                dateMap[record.date][c.name] += (mAmount + aAmount + nAmount);
            });
        });

        return Object.values(dateMap).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [filteredRecords, contrastTypes]);

    // Data for Discrepancy Table
    const discrepancyData = useMemo(() => {
        return filteredRecords.flatMap(record => {
            return contrastTypes.map(cType => {
                const mEntry = record.morning.items.find(i => i.contrastTypeId === cType.id) || { additionalStockMls: 0, amountConsumedMls: 0 };
                const aEntry = record.afternoon.items.find(i => i.contrastTypeId === cType.id) || { additionalStockMls: 0, amountConsumedMls: 0 };
                const nEntry = record.night.items.find(i => i.contrastTypeId === cType.id) || { additionalStockMls: 0, amountConsumedMls: 0 };

                const totalReceived = mEntry.additionalStockMls + aEntry.additionalStockMls + nEntry.additionalStockMls;
                const totalConsumed = mEntry.amountConsumedMls + aEntry.amountConsumedMls + nEntry.amountConsumedMls;

                // Assuming we want to show all records, or just all records where there's consumption/received
                if (totalReceived > 0 || totalConsumed > 0) {
                    return {
                        id: `${record.id}-${cType.id}`,
                        date: record.date,
                        typeName: cType.name,
                        received: totalReceived,
                        consumed: totalConsumed,
                        netStock: totalReceived - totalConsumed, // Negative means consumed > received Today (might be okay if carried over, but flag it)
                        isDiscrepancy: totalConsumed > totalReceived
                    };
                }
                return null;
            }).filter(Boolean);
        });
    }, [filteredRecords, contrastTypes]);

    const tableColumns: import('@/components/ui').Column<any>[] = [
        { header: 'Date', accessorKey: 'date', sortable: true },
        { header: 'Contrast Type', accessorKey: (row: any) => <Badge variant="neutral">{row.typeName}</Badge> },
        { header: 'Received (ML)', accessorKey: (row: any) => `${row.received} ml`, align: 'center' as const },
        { header: 'Consumed (ML)', accessorKey: (row: any) => `${row.consumed} ml`, align: 'center' as const },
        {
            header: 'Net Daily Change',
            accessorKey: (row: any) => (
                <div className={`flex items-center justify-end gap-2 font-bold ${row.isDiscrepancy ? 'text-danger' : 'text-success'}`}>
                    {row.isDiscrepancy && <AlertTriangle className="w-4 h-4" />}
                    {row.netStock > 0 ? '+' : ''}{row.netStock} ml
                </div>
            ),
            align: 'right' as const
        }
    ];

    // To highlight rows, we can just let the text colors do the work, or we can use custom row classes if DataTable supported it. 
    // We added the alert triangle and text-danger.

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Filter Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/40 p-5 rounded-3xl border border-white/60 shadow-sm backdrop-blur-md">
                <div>
                    <h3 className="font-bold text-text-primary">Filter Contrast</h3>
                    <p className="text-sm text-text-secondary">Select a date range to track consumption over time.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full sm:w-auto"
                        />
                        <span className="text-text-muted font-medium">to</span>
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full sm:w-auto"
                        />
                    </div>
                    {(startDate || endDate) && (
                        <Button variant="ghost" onClick={() => { setStartDate(''); setEndDate(''); }}>
                            Clear
                        </Button>
                    )}
                </div>
            </div>

            {filteredRecords.length === 0 ? (
                <EmptyState
                    icon={Droplets}
                    title="No contrast logs found"
                    description="Try adjusting your date requirements to see reporting data."
                />
            ) : (
                <>
                    {/* Charts Row */}
                    <Card className="p-6">
                        <h4 className="font-bold text-text-primary mb-6">Contrast Consumption Trend (ML)</h4>
                        <div className="h-96 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6B7280' }} tickLine={false} axisLine={false} />
                                    <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        labelStyle={{ color: '#6B7280', fontWeight: 'bold', marginBottom: '4px' }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    {contrastTypes.map((c, index) => (
                                        <Area
                                            key={c.id}
                                            type="monotone"
                                            name={c.name}
                                            dataKey={c.name}
                                            stackId="1"
                                            stroke={CHART_COLORS[index % CHART_COLORS.length]}
                                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                                            fillOpacity={0.6}
                                        />
                                    ))}
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    {/* Data Table */}
                    <Card className="p-0 overflow-hidden">
                        <div className="p-5 border-b border-border bg-white/50 flex justify-between items-center">
                            <h4 className="font-bold text-text-primary tracking-tight">Stock Discrepancy Analysis</h4>
                            <div className="bg-danger/10 text-danger px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Flags days consumed &gt; received
                            </div>
                        </div>
                        <DataTable columns={tableColumns} data={discrepancyData} />
                    </Card>
                </>
            )}
        </div>
    );
};
