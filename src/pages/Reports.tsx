import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Calendar, Activity, Droplet, FileBarChart, Spline } from 'lucide-react';
import { WeeklyReportGenerator } from '../components/WeeklyReportGenerator';
import { WeeklyComparison } from '../components/WeeklyComparison';
import { PageHeader, Tabs, Card, DataTable, EmptyState, Badge, Input, Button, type Column } from '@/components/ui';

export const Reports: React.FC = () => {
    const { activityLogs, contrastRecords, modalities, contrastTypes } = useAppContext();
    const [activeTab, setActiveTab] = useState<'activity' | 'contrast' | 'generator' | 'comparison'>('activity');
    const [filterDate, setFilterDate] = useState('');

    const filteredActivity = filterDate
        ? activityLogs.filter(log => log.date === filterDate)
        : activityLogs;

    const filteredContrast = filterDate
        ? contrastRecords.filter(log => log.date === filterDate)
        : contrastRecords;

    const flatContrastReports = filteredContrast.flatMap(record => {
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
                    consumed: totalConsumed
                };
            }
            return null;
        }).filter(Boolean);
    });

    const getModalityName = (id: string) => modalities.find(m => m.id === id)?.name || 'Unknown';

    const activityColumns: Column<typeof activityLogs[0]>[] = [
        { header: 'Date', accessorKey: 'date', sortable: true },
        { header: 'Modality', accessorKey: (row) => <Badge variant="neutral">{getModalityName(row.modalityId)}</Badge> },
        { header: 'Investigations', accessorKey: 'totalInvestigations', sortable: true, align: 'center' },
        { header: '10x12 Film', accessorKey: 'film10x12Used', sortable: true, align: 'center' },
        { header: '14x17 Film', accessorKey: 'film14x17Used', sortable: true, align: 'center' },
        { header: 'Revenue (₦)', accessorKey: (row) => `₦${row.revenueAmount?.toLocaleString() || 0}`, align: 'right' }
    ];

    const contrastColumns: Column<any>[] = [
        { header: 'Date', accessorKey: 'date', sortable: true },
        { header: 'Contrast Type', accessorKey: (row) => <Badge variant="neutral">{row.typeName}</Badge> },
        { header: 'Total Received (ML)', accessorKey: (row) => `${row.received} ml`, align: 'center' },
        { header: 'Total Consumed (ML)', accessorKey: (row) => `${row.consumed} ml`, align: 'right' }
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <PageHeader
                title="Reports"
                description="Review historical activity, contrast usage, and generate summaries."
                actions={
                    activeTab !== 'generator' && activeTab !== 'comparison' && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full md:w-auto">
                            <label className="text-[10px] font-bold tracking-widest text-text-secondary flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-primary stroke-[3]" /> Filter
                            </label>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <Input
                                    type="date"
                                    value={filterDate}
                                    onChange={(e) => setFilterDate(e.target.value)}
                                    className="w-full sm:w-auto"
                                />
                                {filterDate && (
                                    <Button variant="ghost" size="sm" onClick={() => setFilterDate('')}>
                                        Clear
                                    </Button>
                                )}
                            </div>
                        </div>
                    )
                }
            />

            <Tabs
                items={[
                    { label: 'Activity Reports', value: 'activity', icon: <Activity className="w-5 h-5" /> },
                    { label: 'Contrast Reports', value: 'contrast', icon: <Droplet className="w-5 h-5" /> },
                    { label: 'Generate Weekly Report', value: 'generator', icon: <FileBarChart className="w-5 h-5" /> },
                    { label: 'Performance Comparison', value: 'comparison', icon: <Spline className="w-5 h-5" /> }
                ]}
                activeValue={activeTab}
                onChange={(value) => setActiveTab(value as any)}
            />

            <div className="w-full">
                {activeTab === 'activity' ? (
                    <Card className="p-0 overflow-hidden">
                        {filteredActivity.length === 0 ? (
                            <EmptyState
                                icon={Activity}
                                title="No activity logs found"
                                description="Try adjusting your date requirements."
                            />
                        ) : (
                            <DataTable columns={activityColumns} data={filteredActivity} />
                        )}
                    </Card>
                ) : activeTab === 'contrast' ? (
                    <Card className="p-0 overflow-hidden">
                        {flatContrastReports.length === 0 ? (
                            <EmptyState
                                icon={Droplet}
                                title="No contrast logs found"
                                description="Try adjusting your date requirements."
                            />
                        ) : (
                            <DataTable columns={contrastColumns} data={flatContrastReports} />
                        )}
                    </Card>
                ) : activeTab === 'generator' ? (
                    <WeeklyReportGenerator />
                ) : (
                    <WeeklyComparison />
                )}
            </div>
        </div>
    );
};
