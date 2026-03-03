import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, DataTable, EmptyState, Badge, Input } from '@/components/ui';
import { ReportFilterBar } from '@/components/ui/ReportFilterBar';
import { ChartCard } from '@/components/ui/ChartCard';
import { Droplets, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import {
    CHART_PALETTE, AXIS_TICK_PROPS, TOOLTIP_CONTENT_STYLE,
    TOOLTIP_LABEL_STYLE, LEGEND_WRAPPER_STYLE, GRID_PROPS,
} from '@/lib/chartConfig';

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

    const discrepancyData = useMemo(() => {
        return filteredRecords.flatMap(record => {
            return contrastTypes.map(cType => {
                const mEntry = record.morning.items.find(i => i.contrastTypeId === cType.id) || { additionalStockMls: 0, amountConsumedMls: 0 };
                const aEntry = record.afternoon.items.find(i => i.contrastTypeId === cType.id) || { additionalStockMls: 0, amountConsumedMls: 0 };
                const nEntry = record.night.items.find(i => i.contrastTypeId === cType.id) || { additionalStockMls: 0, amountConsumedMls: 0 };
                const totalReceived = mEntry.additionalStockMls + aEntry.additionalStockMls + nEntry.additionalStockMls;
                const totalConsumed = mEntry.amountConsumedMls + aEntry.amountConsumedMls + nEntry.amountConsumedMls;
                if (totalReceived > 0 || totalConsumed > 0) {
                    return {
                        id: `${record.id}-${cType.id}`,
                        date: record.date,
                        typeName: cType.name,
                        received: totalReceived,
                        consumed: totalConsumed,
                        netStock: totalReceived - totalConsumed,
                        isDiscrepancy: totalConsumed > totalReceived,
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
            align: 'right' as const,
        },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <ReportFilterBar
                title="Filter Contrast"
                description="Select a date range to track consumption over time."
                hasActiveFilter={!!(startDate || endDate)}
                onClear={() => { setStartDate(''); setEndDate(''); }}
            >
                <div className="flex items-center gap-2">
                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full sm:w-auto" />
                    <span className="text-text-muted font-medium">to</span>
                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full sm:w-auto" />
                </div>
            </ReportFilterBar>

            {filteredRecords.length === 0 ? (
                <EmptyState
                    icon={Droplets}
                    title="No contrast logs found"
                    description="Try adjusting your date requirements to see reporting data."
                />
            ) : (
                <>
                    <ChartCard title="Contrast Consumption Trend (ML)" height={384}>
                        <AreaChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                            <CartesianGrid {...GRID_PROPS} />
                            <XAxis dataKey="date" {...AXIS_TICK_PROPS} />
                            <YAxis {...AXIS_TICK_PROPS} />
                            <Tooltip contentStyle={TOOLTIP_CONTENT_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} />
                            <Legend wrapperStyle={LEGEND_WRAPPER_STYLE} />
                            {contrastTypes.map((c, index) => (
                                <Area
                                    key={c.id}
                                    type="monotone"
                                    name={c.name}
                                    dataKey={c.name}
                                    stackId="1"
                                    stroke={CHART_PALETTE[index % CHART_PALETTE.length]}
                                    fill={CHART_PALETTE[index % CHART_PALETTE.length]}
                                    fillOpacity={0.6}
                                />
                            ))}
                        </AreaChart>
                    </ChartCard>

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
