import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { CalendarRange, Activity, Layers, Droplets, CreditCard, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export const WeeklyComparison: React.FC = () => {
    const { activityLogs, contrastRecords, modalities, contrastTypes } = useAppContext();
    const [periodAStart, setPeriodAStart] = useState('');
    const [periodAEnd, setPeriodAEnd] = useState('');
    const [periodBStart, setPeriodBStart] = useState('');
    const [periodBEnd, setPeriodBEnd] = useState('');

    const calculateStats = (start: string, end: string) => {
        if (!start || !end) return null;

        const periodActivityLogs = activityLogs.filter(log => log.date >= start && log.date <= end);
        const periodContrastRecords = contrastRecords.filter(log => log.date >= start && log.date <= end);

        if (periodActivityLogs.length === 0 && periodContrastRecords.length === 0) return null;

        const modalityStats = modalities.map(m => {
            const logs = periodActivityLogs.filter(log => log.modalityId === m.id);
            return {
                id: m.id,
                name: m.name,
                investigations: logs.reduce((sum, log) => sum + (log.totalInvestigations || 0), 0),
                film10x12: logs.reduce((sum, log) => sum + (log.film10x12Used || 0), 0),
                film14x17: logs.reduce((sum, log) => sum + (log.film14x17Used || 0), 0),
                revenue: logs.reduce((sum, log) => sum + (log.revenueAmount || 0), 0),
            };
        });

        const contrastStats = contrastTypes.map(c => {
            const ml = periodContrastRecords.reduce((sum, record) => {
                const m = record.morning.items.find(i => i.contrastTypeId === c.id)?.amountConsumedMls || 0;
                const a = record.afternoon.items.find(i => i.contrastTypeId === c.id)?.amountConsumedMls || 0;
                const n = record.night.items.find(i => i.contrastTypeId === c.id)?.amountConsumedMls || 0;
                return sum + m + a + n;
            }, 0);
            return {
                id: c.id,
                name: c.name,
                ml
            };
        });

        const totalInvestigations = modalityStats.reduce((sum, s) => sum + s.investigations, 0);
        const totalRevenue = modalityStats.reduce((sum, s) => sum + s.revenue, 0);
        const totalFilm10x12 = modalityStats.reduce((sum, s) => sum + s.film10x12, 0);
        const totalFilm14x17 = modalityStats.reduce((sum, s) => sum + s.film14x17, 0);
        const totalContrastML = contrastStats.reduce((sum, s) => sum + s.ml, 0);

        return {
            modalityStats,
            contrastStats,
            totals: {
                investigations: totalInvestigations,
                revenue: totalRevenue,
                film10x12: totalFilm10x12,
                film14x17: totalFilm14x17,
                contrastML: totalContrastML
            }
        };
    };

    const statsA = useMemo(() => calculateStats(periodAStart, periodAEnd), [activityLogs, contrastRecords, periodAStart, periodAEnd, modalities, contrastTypes]);
    const statsB = useMemo(() => calculateStats(periodBStart, periodBEnd), [activityLogs, contrastRecords, periodBStart, periodBEnd, modalities, contrastTypes]);

    const calculatePercentageChange = (oldValue: number, newValue: number) => {
        if (oldValue === 0 && newValue === 0) return 0;
        if (oldValue === 0) return 100; // technically infinite, but 100% is clear enough for a 0 -> positive increase
        return ((newValue - oldValue) / oldValue) * 100;
    };

    const renderTrend = (valueA: number, valueB: number, reverseColors: boolean = false) => {
        if (valueA === 0 && valueB === 0) {
            return (
                <div className="flex items-center gap-1 text-text-muted text-[10px] tracking-widest font-bold bg-white/50 border border-white/60 px-3 py-1 rounded-full shadow-sm backdrop-blur-md">
                    <Minus className="w-3 h-3 stroke-[3]" /> 0%
                </div>
            );
        }

        const percentage = calculatePercentageChange(valueA, valueB);
        const isPositive = percentage > 0;
        const isNegative = percentage < 0;

        let textColor = "text-text-secondary";
        let bgClass = "bg-white/50 border border-white/60 shadow-sm";

        if (isPositive) {
            textColor = "text-text-primary";
            bgClass = reverseColors ? "bg-peach/40 border border-peach/50 shadow-sm" : "bg-mint/40 border border-mint/50 shadow-sm";
        } else if (isNegative) {
            textColor = "text-text-primary";
            bgClass = reverseColors ? "bg-mint/40 border border-mint/50 shadow-sm" : "bg-peach/40 border border-peach/50 shadow-sm";
        }

        return (
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] tracking-widest font-bold ${textColor} ${bgClass} backdrop-blur-md`}>
                {isPositive && <ArrowUpRight className="w-3 h-3 stroke-[3]" />}
                {isNegative && <ArrowDownRight className="w-3 h-3 stroke-[3]" />}
                {(!isPositive && !isNegative) && <Minus className="w-3 h-3 stroke-[3]" />}
                {Math.abs(percentage).toFixed(1)}%
            </div>
        );
    };

    const inputClasses = "w-full bg-white/50 border border-white/60 rounded-full px-5 py-3 text-text-primary font-semibold focus:border-black/20 focus:bg-white outline-none transition-all shadow-sm backdrop-blur-md";

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Period A */}
                <div className="bg-white/40 backdrop-blur-3xl p-8 rounded-[2.5rem] shadow-sm border border-white/60">
                    <div className="flex items-center gap-4 mb-8 pb-6 border-b border-black/5">
                        <div className="w-10 h-10 rounded-full bg-white/60 border border-white flex items-center justify-center text-text-primary font-bold shadow-sm tracking-tighter">A</div>
                        <h3 className="text-2xl font-bold text-text-primary tracking-tight">Base Period</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold tracking-widest text-text-secondary">Start Date</label>
                            <input type="date" value={periodAStart} onChange={e => setPeriodAStart(e.target.value)} className={inputClasses} />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold tracking-widest text-text-secondary">End Date</label>
                            <input type="date" value={periodAEnd} onChange={e => setPeriodAEnd(e.target.value)} className={inputClasses} />
                        </div>
                    </div>
                </div>

                {/* Period B */}
                <div className="bg-white/40 backdrop-blur-3xl p-8 rounded-[2.5rem] shadow-sm border border-white/60">
                    <div className="flex items-center gap-4 mb-8 pb-6 border-b border-black/5">
                        <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white font-bold shadow-sm tracking-tighter">B</div>
                        <h3 className="text-2xl font-bold text-text-primary tracking-tight">Comparison Period</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold tracking-widest text-text-secondary">Start Date</label>
                            <input type="date" value={periodBStart} onChange={e => setPeriodBStart(e.target.value)} className={inputClasses} />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold tracking-widest text-text-secondary">End Date</label>
                            <input type="date" value={periodBEnd} onChange={e => setPeriodBEnd(e.target.value)} className={inputClasses} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Empty State */}
            {(!statsA || !statsB) ? (
                <div className="bg-white/40 backdrop-blur-3xl rounded-[2.5rem] p-16 text-center shadow-sm border border-white/60">
                    <CalendarRange className="w-16 h-16 text-black/20 mx-auto mb-6 stroke-[1.5]" />
                    <h3 className="text-2xl font-bold text-text-primary mb-2 tracking-tight">Select Dates to Compare</h3>
                    <p className="text-text-secondary font-semibold">Please select complete start and end dates for both Period A and Period B to view the comparison.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Overall Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        <div className="bg-white/50 backdrop-blur-xl p-8 rounded-[2rem] shadow-sm border border-white/60 flex flex-col justify-between hover:-translate-y-1 transition-transform">
                            <div className="flex items-center gap-2 text-text-secondary font-bold mb-6 text-[10px] tracking-widest">
                                <Activity className="w-4 h-4 inline-block -mt-1 mr-1 text-mint stroke-[3]" />
                                Investigations
                            </div>
                            <div className="flex justify-between items-end">
                                <div>
                                    <div className="text-4xl font-bold text-text-primary tracking-tighter">{statsB.totals.investigations}</div>
                                    <div className="text-sm text-text-muted font-semibold mt-1">vs {statsA.totals.investigations}</div>
                                </div>
                                {renderTrend(statsA.totals.investigations, statsB.totals.investigations)}
                            </div>
                        </div>

                        <div className="bg-white/50 backdrop-blur-xl p-8 rounded-[2rem] shadow-sm border border-white/60 flex flex-col justify-between hover:-translate-y-1 transition-transform relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-mint/20 rounded-bl-full pointer-events-none"></div>
                            <div className="flex items-center gap-2 text-text-secondary font-bold mb-6 text-[10px] tracking-widest relative z-10">
                                <CreditCard className="w-4 h-4 inline-block -mt-1 mr-1 text-mint stroke-[3]" />
                                Revenue
                            </div>
                            <div className="flex justify-between items-end relative z-10">
                                <div>
                                    <div className="text-4xl font-bold text-text-primary tracking-tighter">₦{(statsB.totals.revenue / 1000).toFixed(1)}k</div>
                                    <div className="text-sm text-text-muted font-semibold mt-1">vs ₦{(statsA.totals.revenue / 1000).toFixed(1)}k</div>
                                </div>
                                {renderTrend(statsA.totals.revenue, statsB.totals.revenue)}
                            </div>
                        </div>

                        <div className="bg-white/50 backdrop-blur-xl p-8 rounded-[2rem] shadow-sm border border-white/60 flex flex-col justify-between hover:-translate-y-1 transition-transform">
                            <div className="flex items-center gap-2 text-text-secondary font-bold mb-6 text-[10px] tracking-widest">
                                <Layers className="w-4 h-4 inline-block -mt-1 mr-1 text-peach stroke-[3]" />
                                Total Film
                            </div>
                            <div className="flex justify-between items-end">
                                <div>
                                    <div className="text-4xl font-bold text-text-primary tracking-tighter">{statsB.totals.film10x12 + statsB.totals.film14x17}</div>
                                    <div className="text-sm text-text-muted font-semibold mt-1">vs {statsA.totals.film10x12 + statsA.totals.film14x17}</div>
                                </div>
                                {renderTrend(statsA.totals.film10x12 + statsA.totals.film14x17, statsB.totals.film10x12 + statsB.totals.film14x17, true)}
                            </div>
                        </div>

                        <div className="bg-white/50 backdrop-blur-xl p-8 rounded-[2rem] shadow-sm border border-white/60 flex flex-col justify-between hover:-translate-y-1 transition-transform">
                            <div className="flex items-center gap-2 text-text-secondary font-bold mb-6 text-[10px] tracking-widest">
                                <Droplets className="w-4 h-4 inline-block -mt-1 mr-1 text-yellow stroke-[3]" />
                                Total Contrast (ML)
                            </div>
                            <div className="flex justify-between items-end">
                                <div>
                                    <div className="text-4xl font-bold text-text-primary tracking-tighter">{statsB.totals.contrastML}</div>
                                    <div className="text-sm text-text-muted font-semibold mt-1">vs {statsA.totals.contrastML}</div>
                                </div>
                                {renderTrend(statsA.totals.contrastML, statsB.totals.contrastML, true)}
                            </div>
                        </div>
                    </div>

                    {/* Detailed Breakdowns */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Investigations by Modality */}
                        <div className="bg-white/40 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden shadow-sm border border-white/60">
                            <div className="p-8 border-b border-black/5 bg-white/40">
                                <h3 className="text-xl font-bold text-text-primary flex items-center gap-2 tracking-tight">
                                    <Activity className="w-5 h-5 text-mint stroke-[3]" /> Investigations by Modality
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-black/5 text-text-secondary">
                                        <tr>
                                            <th className="px-8 py-5 font-bold tracking-widest text-[10px]">Modality</th>
                                            <th className="px-8 py-5 font-bold tracking-widest text-[10px] text-center">Period A</th>
                                            <th className="px-8 py-5 font-bold tracking-widest text-[10px] text-center">Period B</th>
                                            <th className="px-8 py-5 font-bold tracking-widest text-[10px] text-right">Trend</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-black/5">
                                        {modalities.map(m => {
                                            const valA = statsA.modalityStats.find(s => s.id === m.id)?.investigations || 0;
                                            const valB = statsB.modalityStats.find(s => s.id === m.id)?.investigations || 0;
                                            if (valA === 0 && valB === 0) return null;
                                            return (
                                                <tr key={m.id} className="hover:bg-white/30 transition-colors">
                                                    <td className="px-8 py-5 font-bold text-text-primary">{m.name}</td>
                                                    <td className="px-8 py-5 text-center font-semibold text-text-secondary">{valA}</td>
                                                    <td className="px-8 py-5 text-center font-bold text-text-primary">{valB}</td>
                                                    <td className="px-8 py-5 flex justify-end">{renderTrend(valA, valB)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Revenue by Modality (₦) */}
                        <div className="bg-white/40 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden shadow-sm border border-white/60">
                            <div className="p-8 border-b border-black/5 bg-white/40">
                                <h3 className="text-xl font-bold text-text-primary flex items-center gap-2 tracking-tight">
                                    <CreditCard className="w-5 h-5 text-mint stroke-[3]" /> Revenue by Modality (₦)
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-black/5 text-text-secondary">
                                        <tr>
                                            <th className="px-8 py-5 font-bold tracking-widest text-[10px]">Modality</th>
                                            <th className="px-8 py-5 font-bold tracking-widest text-[10px] text-right">Period A</th>
                                            <th className="px-8 py-5 font-bold tracking-widest text-[10px] text-right">Period B</th>
                                            <th className="px-8 py-5 font-bold tracking-widest text-[10px] text-right">Trend</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-black/5">
                                        {modalities.map(m => {
                                            const valA = statsA.modalityStats.find(s => s.id === m.id)?.revenue || 0;
                                            const valB = statsB.modalityStats.find(s => s.id === m.id)?.revenue || 0;
                                            if (valA === 0 && valB === 0) return null;
                                            return (
                                                <tr key={m.id} className="hover:bg-white/30 transition-colors">
                                                    <td className="px-8 py-5 font-bold text-text-primary">{m.name}</td>
                                                    <td className="px-8 py-5 text-right font-semibold text-text-secondary">{valA.toLocaleString()}</td>
                                                    <td className="px-8 py-5 text-right font-bold text-text-primary">{valB.toLocaleString()}</td>
                                                    <td className="px-8 py-5 flex justify-end">{renderTrend(valA, valB)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Contrast Usage (ML) */}
                        <div className="bg-white/40 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden shadow-sm border border-white/60">
                            <div className="p-8 border-b border-black/5 bg-white/40">
                                <h3 className="text-xl font-bold text-text-primary flex items-center gap-2 tracking-tight">
                                    <Droplets className="w-5 h-5 text-yellow stroke-[3]" /> Contrast Usage (ML)
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-black/5 text-text-secondary">
                                        <tr>
                                            <th className="px-8 py-5 font-bold tracking-widest text-[10px]">Contrast Type</th>
                                            <th className="px-8 py-5 font-bold tracking-widest text-[10px] text-center">Period A</th>
                                            <th className="px-8 py-5 font-bold tracking-widest text-[10px] text-center">Period B</th>
                                            <th className="px-8 py-5 font-bold tracking-widest text-[10px] text-right">Trend</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-black/5">
                                        {contrastTypes.map(c => {
                                            const valA = statsA.contrastStats.find(s => s.id === c.id)?.ml || 0;
                                            const valB = statsB.contrastStats.find(s => s.id === c.id)?.ml || 0;
                                            if (valA === 0 && valB === 0) return null;
                                            return (
                                                <tr key={c.id} className="hover:bg-white/30 transition-colors">
                                                    <td className="px-8 py-5 font-bold text-text-primary">{c.name}</td>
                                                    <td className="px-8 py-5 text-center font-semibold text-text-secondary">{valA}</td>
                                                    <td className="px-8 py-5 text-center font-bold text-text-primary">{valB}</td>
                                                    <td className="px-8 py-5 flex justify-end">{renderTrend(valA, valB, true)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
