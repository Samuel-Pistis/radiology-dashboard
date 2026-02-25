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
                const m = record.morning.items.find(i => i.contrastTypeId === c.id)?.amountConsumed || 0;
                const a = record.afternoon.items.find(i => i.contrastTypeId === c.id)?.amountConsumed || 0;
                const n = record.night.items.find(i => i.contrastTypeId === c.id)?.amountConsumed || 0;
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
                <div className="flex items-center gap-1 text-text-secondary text-sm font-medium">
                    <Minus className="w-4 h-4" /> 0%
                </div>
            );
        }

        const percentage = calculatePercentageChange(valueA, valueB);
        const isPositive = percentage > 0;
        const isNegative = percentage < 0;

        // If reverseColors is true, positive percentage is bad (red), negative is good (green)
        // E.g., for Film Consumption where less is better.
        let colorClass = "text-text-secondary";
        let bgClass = "bg-surface-hover/50";

        if (isPositive) {
            colorClass = reverseColors ? "text-red-600" : "text-green-600";
            bgClass = reverseColors ? "bg-red-50" : "bg-green-50";
        } else if (isNegative) {
            colorClass = reverseColors ? "text-green-600" : "text-red-600";
            bgClass = reverseColors ? "bg-green-50" : "bg-red-50";
        }

        return (
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-sm font-bold ${colorClass} ${bgClass}`}>
                {isPositive && <ArrowUpRight className="w-4 h-4" />}
                {isNegative && <ArrowDownRight className="w-4 h-4" />}
                {(!isPositive && !isNegative) && <Minus className="w-4 h-4" />}
                {Math.abs(percentage).toFixed(1)}%
            </div>
        );
    };

    const inputClasses = "w-full bg-background border border-surface-hover/50 rounded-xl px-4 py-2.5 text-text-primary focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm text-sm";

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Period A */}
                <div className="bg-surface p-6 rounded-3xl shadow-sm border border-surface-hover/30">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-surface-hover/50">
                        <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 font-bold">A</div>
                        <h3 className="text-xl font-bold text-text-primary">Base Period</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-text-secondary">Start Date</label>
                            <input type="date" value={periodAStart} onChange={e => setPeriodAStart(e.target.value)} className={inputClasses} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-text-secondary">End Date</label>
                            <input type="date" value={periodAEnd} onChange={e => setPeriodAEnd(e.target.value)} className={inputClasses} />
                        </div>
                    </div>
                </div>

                {/* Period B */}
                <div className="bg-surface p-6 rounded-3xl shadow-sm border border-surface-hover/30">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-surface-hover/50">
                        <div className="w-8 h-8 rounded-full bg-secondary-50 flex items-center justify-center text-secondary-600 font-bold">B</div>
                        <h3 className="text-xl font-bold text-text-primary">Comparison Period</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-text-secondary">Start Date</label>
                            <input type="date" value={periodBStart} onChange={e => setPeriodBStart(e.target.value)} className={inputClasses} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-text-secondary">End Date</label>
                            <input type="date" value={periodBEnd} onChange={e => setPeriodBEnd(e.target.value)} className={inputClasses} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Empty State */}
            {(!statsA || !statsB) ? (
                <div className="bg-surface rounded-3xl p-16 text-center shadow-sm border border-surface-hover/30">
                    <CalendarRange className="w-16 h-16 text-surface-hover mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-text-primary mb-2">Select Dates to Compare</h3>
                    <p className="text-text-secondary">Please select complete start and end dates for both Period A and Period B to view the comparison.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Overall Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        <div className="bg-surface p-6 rounded-3xl shadow-sm border border-surface-hover/30 flex flex-col justify-between hover:-translate-y-1 transition-transform">
                            <div className="flexitems-center gap-2 text-text-secondary font-semibold mb-4 text-sm uppercase tracking-wider">
                                <Activity className="w-4 h-4 inline-block -mt-1 mr-1 text-primary-500" />
                                Investigations
                            </div>
                            <div className="flex justify-between items-end">
                                <div>
                                    <div className="text-3xl font-bold text-text-primary">{statsB.totals.investigations}</div>
                                    <div className="text-xs text-text-secondary mt-1">vs {statsA.totals.investigations}</div>
                                </div>
                                {renderTrend(statsA.totals.investigations, statsB.totals.investigations)}
                            </div>
                        </div>

                        <div className="bg-surface p-6 rounded-3xl shadow-sm border border-surface-hover/30 flex flex-col justify-between hover:-translate-y-1 transition-transform relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400/20 to-emerald-500/0 rounded-bl-full pointer-events-none"></div>
                            <div className="flex items-center gap-2 text-text-secondary font-semibold mb-4 text-sm uppercase tracking-wider relative z-10">
                                <CreditCard className="w-4 h-4 inline-block -mt-1 mr-1 text-green-500" />
                                Revenue
                            </div>
                            <div className="flex justify-between items-end relative z-10">
                                <div>
                                    <div className="text-2xl font-bold text-text-primary">₦{(statsB.totals.revenue / 1000).toFixed(1)}k</div>
                                    <div className="text-xs text-text-secondary mt-1">vs ₦{(statsA.totals.revenue / 1000).toFixed(1)}k</div>
                                </div>
                                {renderTrend(statsA.totals.revenue, statsB.totals.revenue)}
                            </div>
                        </div>

                        <div className="bg-surface p-6 rounded-3xl shadow-sm border border-surface-hover/30 flex flex-col justify-between hover:-translate-y-1 transition-transform">
                            <div className="flex items-center gap-2 text-text-secondary font-semibold mb-4 text-sm uppercase tracking-wider">
                                <Layers className="w-4 h-4 inline-block -mt-1 mr-1 text-secondary-500" />
                                Total Film
                            </div>
                            <div className="flex justify-between items-end">
                                <div>
                                    <div className="text-3xl font-bold text-text-primary">{statsB.totals.film10x12 + statsB.totals.film14x17}</div>
                                    <div className="text-xs text-text-secondary mt-1">vs {statsA.totals.film10x12 + statsA.totals.film14x17}</div>
                                </div>
                                {renderTrend(statsA.totals.film10x12 + statsA.totals.film14x17, statsB.totals.film10x12 + statsB.totals.film14x17, true)}
                            </div>
                        </div>

                        <div className="bg-surface p-6 rounded-3xl shadow-sm border border-surface-hover/30 flex flex-col justify-between hover:-translate-y-1 transition-transform">
                            <div className="flex items-center gap-2 text-text-secondary font-semibold mb-4 text-sm uppercase tracking-wider">
                                <Droplets className="w-4 h-4 inline-block -mt-1 mr-1 text-amber-500" />
                                Total Contrast (ML)
                            </div>
                            <div className="flex justify-between items-end">
                                <div>
                                    <div className="text-3xl font-bold text-text-primary">{statsB.totals.contrastML}</div>
                                    <div className="text-xs text-text-secondary mt-1">vs {statsA.totals.contrastML}</div>
                                </div>
                                {renderTrend(statsA.totals.contrastML, statsB.totals.contrastML, true)}
                            </div>
                        </div>
                    </div>

                    {/* Detailed Breakdowns */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Investigations by Modality */}
                        <div className="bg-surface rounded-3xl overflow-hidden shadow-sm border border-surface-hover/30">
                            <div className="p-6 border-b border-surface-hover/50 bg-background/50">
                                <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-primary-500" /> Investigations by Modality
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-background/80 text-text-secondary">
                                        <tr>
                                            <th className="px-6 py-4 font-semibold">Modality</th>
                                            <th className="px-6 py-4 font-semibold text-center">Period A</th>
                                            <th className="px-6 py-4 font-semibold text-center">Period B</th>
                                            <th className="px-6 py-4 font-semibold text-right">Trend</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-surface-hover/30">
                                        {modalities.map(m => {
                                            const valA = statsA.modalityStats.find(s => s.id === m.id)?.investigations || 0;
                                            const valB = statsB.modalityStats.find(s => s.id === m.id)?.investigations || 0;
                                            if (valA === 0 && valB === 0) return null;
                                            return (
                                                <tr key={m.id} className="hover:bg-surface-hover/20 transition-colors">
                                                    <td className="px-6 py-4 font-bold text-text-primary">{m.name}</td>
                                                    <td className="px-6 py-4 text-center font-medium text-text-secondary">{valA}</td>
                                                    <td className="px-6 py-4 text-center font-bold text-text-primary">{valB}</td>
                                                    <td className="px-6 py-4 flex justify-end">{renderTrend(valA, valB)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Revenue by Modality (₦) */}
                        <div className="bg-surface rounded-3xl overflow-hidden shadow-sm border border-surface-hover/30">
                            <div className="p-6 border-b border-surface-hover/50 bg-background/50">
                                <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                                    <CreditCard className="w-5 h-5 text-green-500" /> Revenue by Modality (₦)
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-background/80 text-text-secondary">
                                        <tr>
                                            <th className="px-6 py-4 font-semibold">Modality</th>
                                            <th className="px-6 py-4 font-semibold text-right">Period A</th>
                                            <th className="px-6 py-4 font-semibold text-right">Period B</th>
                                            <th className="px-6 py-4 font-semibold text-right">Trend</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-surface-hover/30">
                                        {modalities.map(m => {
                                            const valA = statsA.modalityStats.find(s => s.id === m.id)?.revenue || 0;
                                            const valB = statsB.modalityStats.find(s => s.id === m.id)?.revenue || 0;
                                            if (valA === 0 && valB === 0) return null;
                                            return (
                                                <tr key={m.id} className="hover:bg-surface-hover/20 transition-colors">
                                                    <td className="px-6 py-4 font-bold text-text-primary">{m.name}</td>
                                                    <td className="px-6 py-4 text-right font-medium text-text-secondary">{valA.toLocaleString()}</td>
                                                    <td className="px-6 py-4 text-right font-bold text-text-primary">{valB.toLocaleString()}</td>
                                                    <td className="px-6 py-4 flex justify-end">{renderTrend(valA, valB)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Contrast Usage (ML) */}
                        <div className="bg-surface rounded-3xl overflow-hidden shadow-sm border border-surface-hover/30">
                            <div className="p-6 border-b border-surface-hover/50 bg-background/50">
                                <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                                    <Droplets className="w-5 h-5 text-amber-500" /> Contrast Usage (ML)
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-background/80 text-text-secondary">
                                        <tr>
                                            <th className="px-6 py-4 font-semibold">Contrast Type</th>
                                            <th className="px-6 py-4 font-semibold text-center">Period A</th>
                                            <th className="px-6 py-4 font-semibold text-center">Period B</th>
                                            <th className="px-6 py-4 font-semibold text-right">Trend</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-surface-hover/30">
                                        {contrastTypes.map(c => {
                                            const valA = statsA.contrastStats.find(s => s.id === c.id)?.ml || 0;
                                            const valB = statsB.contrastStats.find(s => s.id === c.id)?.ml || 0;
                                            if (valA === 0 && valB === 0) return null;
                                            return (
                                                <tr key={c.id} className="hover:bg-surface-hover/20 transition-colors">
                                                    <td className="px-6 py-4 font-bold text-text-primary">{c.name}</td>
                                                    <td className="px-6 py-4 text-center font-medium text-text-secondary">{valA}</td>
                                                    <td className="px-6 py-4 text-center font-bold text-text-primary">{valB}</td>
                                                    <td className="px-6 py-4 flex justify-end">{renderTrend(valA, valB, true)}</td>
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
