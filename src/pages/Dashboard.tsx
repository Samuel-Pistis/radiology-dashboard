import React, { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { ArrowUpRight } from 'lucide-react';
import { calculateTotalInvestigations, calculateTotalContrastML, calculateTotalRevenue } from '../utils/calculations';
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle }) => {
    let bgClass = 'bg-white/40 border border-white/60 text-black backdrop-blur-2xl';

    // Use the reference image colors for different stat cards
    if (title.includes('Revenue')) {
        bgClass = 'bg-mint text-black border border-mint/50 shadow-[0_0_20px_rgba(122,255,161,0.3)]';
    } else if (title.includes('Contrast')) {
        bgClass = 'bg-yellow text-black border border-yellow/50 shadow-[0_0_20px_rgba(255,248,124,0.3)]';
    } else if (title.includes('Investigations')) {
        bgClass = 'bg-white/60 text-black border border-white/80 shadow-[0_0_20px_rgba(255,255,255,0.4)] backdrop-blur-2xl';
    }

    return (
        <div className={`rounded-[2.5rem] p-6 md:p-8 shadow-sm transition-transform duration-300 relative overflow-hidden flex flex-col justify-center ${bgClass}`}>
            <div className="flex justify-between items-center mb-6">
                <p className="text-black/70 font-bold text-sm uppercase tracking-widest bg-black/5 px-4 py-1.5 rounded-full inline-block">
                    {title}
                </p>
                <div className="p-2.5 rounded-full bg-white/40 text-black shadow-sm mr-2">
                    <ArrowUpRight className="w-5 h-5 stroke-[3]" />
                </div>
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold opacity-60 mb-1">{title.includes('Revenue') ? '₦' : ''}</span>
                <h3 className="text-[3.5rem] font-black tracking-tighter leading-none">{value}</h3>
                {subtitle && (
                    <span className="text-xs font-bold text-black/50 tracking-wider uppercase ml-2">
                        {subtitle}
                    </span>
                )}
            </div>
        </div>
    );
};

const COLORS = ['#7AFFA1', '#FFF87C', '#DDCBF5', '#FFA27D', '#000000', '#A0AEC0'];

export const Dashboard: React.FC = () => {
    const { activityLogs, contrastRecords, weeklyOpsLogs, modalities, contrastTypes } = useAppContext();

    const totalInvestigations = calculateTotalInvestigations(activityLogs);
    const totalContrastML = calculateTotalContrastML(contrastRecords);
    const totalRevenue = calculateTotalRevenue(activityLogs);

    // 1. Film Consumption Trend (Stacked Bar)
    const filmData = useMemo(() => {
        return modalities.map(modality => {
            const logs = activityLogs.filter(log => log.modalityId === modality.id);
            const film10x12 = logs.reduce((sum, log) => sum + (log.film10x12Used || 0), 0);
            const film14x17 = logs.reduce((sum, log) => sum + (log.film14x17Used || 0), 0);
            return {
                name: modality.name,
                '10x12': film10x12,
                '14x17': film14x17,
                total: film10x12 + film14x17
            };
        }).filter(data => data.total > 0);
    }, [activityLogs, modalities]);

    const contrastData = useMemo(() => {
        const dates = Array.from(new Set(contrastRecords.map(r => r.date))).sort();
        return dates.map(date => {
            const dayRecord = contrastRecords.find(r => r.date === date);
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
    }, [contrastRecords, contrastTypes]);

    // 4. Revenue Comparison (Bar Chart)
    const revenueComparisonData = useMemo(() => {
        const sortedLogs = [...weeklyOpsLogs].sort((a, b) => new Date(a.weekStartDate).getTime() - new Date(b.weekStartDate).getTime());
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
    }, [weeklyOpsLogs, modalities]);

    const chartTooltipStyle = {
        backgroundColor: '#ffffff',
        border: 'none',
        borderRadius: '12px',
        color: '#0F172A',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <div className="flex justify-between items-center mb-10">
                <h2 className="text-[2.5rem] font-medium tracking-tight text-black">
                    <span className="opacity-40 font-bold">←</span> Dashboard
                </h2>
                <div className="flex gap-4">
                    <button className="bg-white/50 backdrop-blur-md px-6 py-2.5 rounded-full font-bold text-sm shadow-sm border border-white/60">Issue Report</button>
                    <button className="bg-white/50 backdrop-blur-md px-6 py-2.5 rounded-full font-bold text-sm shadow-sm border border-white/60">Edit Metrics</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Total Investigations"
                    value={totalInvestigations}
                    subtitle="Logged entries"
                />
                <StatCard
                    title="Contrast Used (ML)"
                    value={totalContrastML}
                    subtitle="Total volume"
                />
                <StatCard
                    title="Total Revenue (₦)"
                    value={totalRevenue.toLocaleString()}
                    subtitle="Collected fees"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Film Consumption Stacked Bar */}
                <div className="bg-white/40 backdrop-blur-2xl border border-white/50 rounded-[2.5rem] p-6 md:p-8 shadow-sm">
                    <h3 className="text-2xl font-black mb-6 md:mb-8 text-black tracking-tight">Film Consumption</h3>
                    {filmData.length === 0 ? (
                        <div className="py-12 text-center text-text-secondary">
                            <p>No film data available.</p>
                        </div>
                    ) : (
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={filmData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                                    <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#64748B' }} axisLine={false} tickLine={false} />
                                    <YAxis stroke="#94a3b8" tick={{ fill: '#64748B' }} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={chartTooltipStyle} />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                                    <Bar dataKey="10x12" stackId="a" fill="#DDCBF5" radius={[0, 0, 4, 4]} barSize={40} />
                                    <Bar dataKey="14x17" stackId="a" fill="#7AFFA1" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Contrast Usage Line Chart */}
                <div className="bg-white/40 backdrop-blur-2xl border border-white/50 rounded-[2.5rem] p-6 md:p-8 shadow-sm lg:col-span-2">
                    <div className="flex justify-between items-center mb-6 md:mb-8">
                        <h3 className="text-2xl font-black text-black tracking-tight">Contrast Volume</h3>
                        <div className="hidden sm:block px-5 py-2.5 bg-white/50 rounded-full text-xs font-bold border border-white/60 text-black shadow-sm uppercase tracking-wider">
                            Last 30 Days
                        </div>
                    </div>
                    {contrastData.length === 0 ? (
                        <div className="py-12 text-center text-text-secondary">
                            <p>No contrast usage data available.</p>
                        </div>
                    ) : (
                        <div className="h-96 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={contrastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                                    <XAxis dataKey="date" stroke="#94a3b8" tick={{ fill: '#64748B' }} axisLine={false} tickLine={false} dy={10} />
                                    <YAxis stroke="#94a3b8" tick={{ fill: '#64748B' }} axisLine={false} tickLine={false} dx={-10} />
                                    <Tooltip contentStyle={chartTooltipStyle} />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                                    {contrastTypes.map((type, index) => (
                                        <Line
                                            key={type.id}
                                            type="monotone"
                                            dataKey={type.name}
                                            stroke={COLORS[index % COLORS.length]}
                                            strokeWidth={4}
                                            dot={{ r: 4, strokeWidth: 0, fill: COLORS[index % COLORS.length] }}
                                            activeDot={{ r: 8, stroke: '#fff', strokeWidth: 3 }}
                                        />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Revenue Comparison Bar Chart */}
                <div className="bg-white/40 backdrop-blur-2xl border border-white/50 rounded-[2.5rem] p-6 md:p-8 shadow-sm lg:col-span-2 mt-4">
                    <h3 className="text-2xl font-black mb-6 md:mb-8 text-black tracking-tight">Weekly Revenue</h3>
                    {revenueComparisonData.length === 0 ? (
                        <div className="py-12 text-center text-text-secondary">
                            <p>No revenue comparison data available.</p>
                        </div>
                    ) : (
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={revenueComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                                    <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#64748B' }} axisLine={false} tickLine={false} />
                                    <YAxis stroke="#94a3b8" tick={{ fill: '#64748B' }} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={chartTooltipStyle} />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                                    <Bar dataKey="Last Week" fill="#DDCBF5" radius={[4, 4, 0, 0]} barSize={30} />
                                    <Bar dataKey="This Week" fill="#FFA27D" radius={[4, 4, 0, 0]} barSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};
