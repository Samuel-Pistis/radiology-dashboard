import React, { useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card } from '@/components/ui';
import { DataTable } from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import {
    BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import type { EquipmentLog } from '@/types';
import { TrendingDown, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const COLORS = ['#EF4444', '#F59E0B', '#6366F1', '#10B981', '#0D9488', '#EC4899'];

function downtimeHours(log: EquipmentLog): number {
    const start = new Date(log.start_time).getTime();
    const end = log.end_time ? new Date(log.end_time).getTime() : Date.now();
    return (end - start) / 3600000;
}

interface RecentEventRow {
    modality: string;
    reason: string;
    duration: string;
    status: string;
    date: string;
}

export const EquipmentReportTab: React.FC = () => {
    const { equipmentLogs, modalities, shiftActivityLogs } = useAppContext();

    // 1 — Downtime hours per modality
    const downtimeByModality = useMemo(() => {
        return modalities.map(m => {
            const hours = equipmentLogs
                .filter(l => l.modality_id === m.id)
                .reduce((sum, l) => sum + downtimeHours(l), 0);
            return { name: m.name, hours: Math.round(hours * 10) / 10 };
        }).filter(d => d.hours > 0);
    }, [equipmentLogs, modalities]);

    // 2 — Failure reasons distribution
    const reasonsData = useMemo(() => {
        const counts: Record<string, number> = {};
        equipmentLogs.forEach(l => {
            counts[l.reason_category] = (counts[l.reason_category] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [equipmentLogs]);

    // 3 — Revenue impact per modality
    const revenueImpact = useMemo(() => {
        return modalities.map(m => {
            const modalityLogs = shiftActivityLogs.filter(l => {
                const investigations = l.investigations as Record<string, { count: number; revenue: number }>;
                return investigations && investigations[m.id]?.revenue;
            });
            const totalRevenue = modalityLogs.reduce((sum, l) => {
                const investigations = l.investigations as Record<string, { count: number; revenue: number }>;
                return sum + (investigations?.[m.id]?.revenue || 0);
            }, 0);
            const totalHoursLogged = modalityLogs.length * 8; // Each shift ≈ 8h
            const hourlyRate = totalHoursLogged > 0 ? totalRevenue / totalHoursLogged : 0;

            const downHours = equipmentLogs
                .filter(l => l.modality_id === m.id)
                .reduce((sum, l) => sum + downtimeHours(l), 0);

            const impact = Math.round(hourlyRate * downHours);
            return { name: m.name, downHours: Math.round(downHours * 10) / 10, impact };
        }).filter(d => d.downHours > 0);
    }, [equipmentLogs, modalities, shiftActivityLogs]);

    const totalDownHours = Math.round(equipmentLogs.reduce((sum, l) => sum + downtimeHours(l), 0) * 10) / 10;
    const ongoingCount = equipmentLogs.filter(l => l.is_ongoing).length;
    const totalRevenueLost = revenueImpact.reduce((sum, r) => sum + r.impact, 0);

    // 4 — Recent Events table data
    const recentEvents: RecentEventRow[] = useMemo(() => {
        return [...equipmentLogs]
            .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
            .slice(0, 20)
            .map(l => ({
                modality: l.modality_name,
                reason: l.reason_category,
                duration: (() => {
                    const h = downtimeHours(l);
                    if (h >= 1) return `${Math.round(h * 10) / 10}h`;
                    return `${Math.round(h * 60)}m`;
                })(),
                status: l.is_ongoing ? 'Ongoing' : 'Resolved',
                date: new Date(l.start_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
            }));
    }, [equipmentLogs]);

    const recentColumns: Column<RecentEventRow>[] = [
        { header: 'Modality', accessorKey: 'modality' },
        { header: 'Reason', accessorKey: 'reason' },
        { header: 'Duration', accessorKey: 'duration' },
        {
            header: 'Status',
            accessorKey: (row: RecentEventRow) => (
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${row.status === 'Ongoing' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {row.status}
                </span>
            )
        },
        { header: 'Date', accessorKey: 'date' },
    ];

    const chartTooltipStyle = {
        backgroundColor: '#ffffff',
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
    };

    if (equipmentLogs.length === 0) {
        return (
            <div className="py-24 text-center">
                <CheckCircle className="w-12 h-12 text-success mx-auto mb-4 opacity-40" />
                <h3 className="text-lg font-bold text-text-primary mb-1">No downtime events logged</h3>
                <p className="text-text-muted font-medium">All equipment is performing normally. Downtime analytics will appear here once events are reported.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* KPI Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <Clock className="w-5 h-5 text-danger" />
                        <span className="text-xs font-bold text-danger uppercase tracking-wide">Total Downtime</span>
                    </div>
                    <p className="text-3xl font-bold text-danger">{totalDownHours}h</p>
                    <p className="text-xs text-text-muted mt-1 font-medium">Across all modalities</p>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                        <span className="text-xs font-bold text-amber-600 uppercase tracking-wide">Currently Down</span>
                    </div>
                    <p className="text-3xl font-bold text-amber-700">{ongoingCount}</p>
                    <p className="text-xs text-text-muted mt-1 font-medium">{ongoingCount === 1 ? 'Modality offline' : 'Modalities offline'}</p>
                </div>
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <TrendingDown className="w-5 h-5 text-indigo-600" />
                        <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">Est. Revenue Lost</span>
                    </div>
                    <p className="text-3xl font-bold text-indigo-700">₦{totalRevenueLost.toLocaleString()}</p>
                    <p className="text-xs text-text-muted mt-1 font-medium">Based on avg. hourly rate</p>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <h3 className="text-lg font-bold text-text-primary mb-6">Downtime Hours by Modality</h3>
                    {downtimeByModality.length === 0 ? (
                        <div className="py-12 text-center text-text-muted text-sm">No resolved downtime data to chart.</div>
                    ) : (
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={downtimeByModality} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                                    <XAxis dataKey="name" stroke="#6B7280" axisLine={false} tickLine={false} />
                                    <YAxis stroke="#6B7280" axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={chartTooltipStyle} />
                                    <Bar dataKey="hours" fill="#EF4444" radius={[6, 6, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </Card>

                <Card>
                    <h3 className="text-lg font-bold text-text-primary mb-6">Failure Reasons</h3>
                    {reasonsData.length === 0 ? (
                        <div className="py-12 text-center text-text-muted text-sm">No data yet.</div>
                    ) : (
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={reasonsData}
                                        cx="50%"
                                        cy="45%"
                                        outerRadius={90}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {reasonsData.map((_, i) => (
                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={chartTooltipStyle} />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '12px', fontSize: '12px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </Card>
            </div>

            {/* Revenue Impact */}
            {revenueImpact.length > 0 && (
                <Card>
                    <h3 className="text-lg font-bold text-text-primary mb-6">Estimated Revenue Impact</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr>
                                    <th className="p-3 border-b font-semibold text-text-secondary">Modality</th>
                                    <th className="p-3 border-b font-semibold text-text-secondary">Downtime Hours</th>
                                    <th className="p-3 border-b font-semibold text-text-secondary">Est. Revenue Lost</th>
                                </tr>
                            </thead>
                            <tbody>
                                {revenueImpact.map((r, i) => (
                                    <tr key={i} className="border-b border-surface-hover last:border-0 hover:bg-surface/40 transition-colors">
                                        <td className="p-3 font-semibold text-text-primary">{r.name}</td>
                                        <td className="p-3 text-text-secondary">{r.downHours}h</td>
                                        <td className="p-3 font-bold text-danger">
                                            {r.impact > 0 ? `₦${r.impact.toLocaleString()}` : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Recent Events Table */}
            <Card>
                <h3 className="text-lg font-bold text-text-primary mb-6">Recent Downtime Events</h3>
                <DataTable<RecentEventRow> columns={recentColumns} data={recentEvents} />
            </Card>
        </div>
    );
};
