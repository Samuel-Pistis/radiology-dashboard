import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { CalendarRange, CheckCircle, AlertTriangle, CreditCard, Activity, Layers, Droplets } from 'lucide-react';

export const WeeklyOperations: React.FC = () => {
    const { modalities, contrastTypes, addWeeklyOpsLog, weeklyOpsLogs, activityLogs, contrastRecords } = useAppContext();
    const [weekStartDate, setWeekStartDate] = useState('');
    const [weekEndDate, setWeekEndDate] = useState('');
    const [challenges, setChallenges] = useState('');
    const [resolutions, setResolutions] = useState('');

    const [successMessage, setSuccessMessage] = useState('');

    const showSuccess = (msg: string) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    // Auto-calculate expected totals for the selected week
    const weeklyData = useMemo(() => {
        if (!weekStartDate || !weekEndDate) return null;

        const periodActivityLogs = activityLogs.filter(log =>
            log.date >= weekStartDate && log.date <= weekEndDate
        );
        const periodContrastRecords = contrastRecords.filter(log =>
            log.date >= weekStartDate && log.date <= weekEndDate
        );

        const totals: Record<string, number> = {};
        const revenueTotals: Record<string, number> = {};
        const filmTotals: Record<string, { f10x12: number, f14x17: number }> = {};
        const contrastTotals: Record<string, number> = {};

        modalities.forEach(m => {
            totals[m.id] = 0;
            revenueTotals[m.id] = 0;
            filmTotals[m.id] = { f10x12: 0, f14x17: 0 };
        });

        contrastTypes.forEach(c => {
            contrastTotals[c.id] = 0;
        });

        periodActivityLogs.forEach(log => {
            if (totals[log.modalityId] !== undefined) {
                totals[log.modalityId] += (log.totalInvestigations || 0);
            }
            if (revenueTotals[log.modalityId] !== undefined) {
                revenueTotals[log.modalityId] += (log.revenueAmount || 0);
            }
            if (filmTotals[log.modalityId] !== undefined) {
                filmTotals[log.modalityId].f10x12 += (log.film10x12Used || 0);
                filmTotals[log.modalityId].f14x17 += (log.film14x17Used || 0);
            }
        });

        periodContrastRecords.forEach(record => {
            contrastTypes.forEach(c => {
                const mAmount = record.morning.items.find(i => i.contrastTypeId === c.id)?.amountConsumed || 0;
                const aAmount = record.afternoon.items.find(i => i.contrastTypeId === c.id)?.amountConsumed || 0;
                const nAmount = record.night.items.find(i => i.contrastTypeId === c.id)?.amountConsumed || 0;
                contrastTotals[c.id] += (mAmount + aAmount + nAmount);
            });
        });

        return { totals, revenueTotals, filmTotals, contrastTotals };
    }, [activityLogs, contrastRecords, weekStartDate, weekEndDate, modalities, contrastTypes]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!weekStartDate || !weekEndDate) return;

        const revenue = modalities.map(m => ({
            modalityId: m.id,
            amount: weeklyData?.revenueTotals[m.id] || 0
        }));

        addWeeklyOpsLog({
            id: Date.now().toString(),
            weekStartDate,
            weekEndDate,
            challenges,
            resolutions,
            revenue,
        });

        setWeekStartDate('');
        setWeekEndDate('');
        setChallenges('');
        setResolutions('');

        showSuccess('Weekly Operations log saved successfully!');
    };

    const getModalityName = (id: string) => modalities.find(m => m.id === id)?.name || 'Unknown';

    const inputClasses = "w-full bg-background border-none rounded-xl px-4 py-3 text-text-primary focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-inner";
    const smallInputClasses = "w-full bg-background border-none rounded-lg px-3 py-2 text-sm text-text-primary focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-inner";


    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-text-primary">Weekly Operations</h2>
                <p className="text-text-secondary mt-1">Log and review weekly turnaround times, challenges, resolutions, and revenue.</p>
            </div>

            {successMessage && (
                <div className="p-4 bg-secondary-500/10 border border-secondary-500/20 text-secondary-500 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <CheckCircle className="w-5 h-5" />
                    {successMessage}
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div className="bg-surface rounded-3xl p-8 shadow-sm overflow-hidden h-fit">
                    <div className="flex items-center gap-4 mb-8 border-b border-surface-hover/50 pb-6">
                        <div className="p-3 bg-primary-50 rounded-xl text-primary-500">
                            <CalendarRange className="w-6 h-6" />
                        </div>
                        <h3 className="text-2xl font-bold text-text-primary">New Weekly Log</h3>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-secondary">Start Date</label>
                                <input type="date" value={weekStartDate} onChange={(e) => setWeekStartDate(e.target.value)} required className={inputClasses} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-secondary">End Date</label>
                                <input type="date" value={weekEndDate} onChange={(e) => setWeekEndDate(e.target.value)} required className={inputClasses} />
                            </div>
                        </div>

                        {/* Auto-Calculated Weekly Totals Display */}
                        <div className="space-y-4 pt-2">
                            <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                                <Activity className="w-5 h-5 text-primary-500" />
                                Total Investigations by Modality
                            </h4>
                            {!weeklyData ? (
                                <p className="text-sm text-text-secondary pb-2">Please select a Start and End Date to view auto-calculated investigation number.</p>
                            ) : (
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 p-4 bg-background rounded-2xl border border-surface-hover/30">
                                    {modalities.map(m => (
                                        <div key={m.id} className="flex flex-col p-2 bg-surface rounded-xl border border-surface-hover/50 shadow-sm text-center">
                                            <span className="text-xs font-bold text-text-secondary mb-1 truncate" title={m.name}>{m.name}</span>
                                            <span className="text-xl font-bold text-primary-600">{weeklyData.totals[m.id]}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Total Film Consumption by Modality */}
                        <div className="space-y-4 pt-4 border-t border-surface-hover/50">
                            <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                                <Layers className="w-5 h-5 text-secondary-500" />
                                Total Film Consumption by Modality
                            </h4>
                            {!weeklyData ? (
                                <p className="text-sm text-text-secondary pb-2">Please select a Start and End Date to view auto-calculated film consumption.</p>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 bg-background rounded-2xl border border-surface-hover/30">
                                    {modalities.map(m => {
                                        const film = weeklyData.filmTotals[m.id];
                                        if (film.f10x12 === 0 && film.f14x17 === 0) return null;
                                        return (
                                            <div key={m.id} className="flex flex-col p-3 bg-surface rounded-xl border border-surface-hover/50 shadow-sm">
                                                <span className="text-xs font-bold text-text-secondary mb-2 truncate" title={m.name}>{m.name}</span>
                                                <div className="flex justify-between items-center bg-background px-2 py-1.5 rounded-lg mb-1">
                                                    <span className="text-xs font-medium text-text-secondary">10x12</span>
                                                    <span className="text-sm font-bold text-primary-600">{film.f10x12}</span>
                                                </div>
                                                <div className="flex justify-between items-center bg-background px-2 py-1.5 rounded-lg">
                                                    <span className="text-xs font-medium text-text-secondary">14x17</span>
                                                    <span className="text-sm font-bold text-secondary-600">{film.f14x17}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {modalities.every(m => weeklyData.filmTotals[m.id].f10x12 === 0 && weeklyData.filmTotals[m.id].f14x17 === 0) && (
                                        <p className="text-sm text-text-secondary col-span-full py-2">No film usage logged for this period.</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Total Contrast Consumption */}
                        <div className="space-y-4 pt-4 border-t border-surface-hover/50">
                            <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                                <Droplets className="w-5 h-5 text-amber-500" />
                                Total Contrast Consumption by Type
                            </h4>
                            {!weeklyData ? (
                                <p className="text-sm text-text-secondary pb-2">Please select a Start and End Date to view auto-calculated contrast consumption.</p>
                            ) : (
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 p-4 bg-background rounded-2xl border border-surface-hover/30">
                                    {contrastTypes.map(c => {
                                        const totalML = weeklyData.contrastTotals[c.id];
                                        if (totalML === 0) return null;
                                        return (
                                            <div key={c.id} className="flex flex-col p-3 bg-surface rounded-xl border border-surface-hover/50 shadow-sm text-center">
                                                <span className="text-xs font-bold text-text-secondary mb-1 truncate" title={c.name}>{c.name}</span>
                                                <div className="flex items-baseline justify-center gap-1">
                                                    <span className="text-xl font-bold text-amber-600">{totalML}</span>
                                                    <span className="text-xs font-medium text-text-secondary">ML</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {contrastTypes.every(c => weeklyData.contrastTotals[c.id] === 0) && (
                                        <p className="text-sm text-text-secondary col-span-full text-left py-2">No contrast usage logged for this period.</p>
                                    )}
                                </div>
                            )}
                        </div>                        <div className="space-y-4 pt-4 border-t border-surface-hover/50">
                            <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-secondary-500" />
                                Revenue Collection by Modality (₦)
                            </h4>
                            {modalities.length === 0 ? (
                                <p className="text-sm text-text-secondary pb-2">No modalities configured.</p>
                            ) : !weeklyData ? (
                                <p className="text-sm text-text-secondary pb-2">Please select a Start and End Date to view auto-calculated revenue.</p>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {modalities.map(modality => (
                                        <div key={modality.id} className="space-y-1.5 p-3 bg-background rounded-xl border border-surface-hover/30">
                                            <label className="text-xs font-bold text-text-secondary truncate block" title={modality.name}>{modality.name}</label>
                                            <input
                                                type="text"
                                                value={weeklyData.revenueTotals[modality.id].toLocaleString()}
                                                disabled
                                                readOnly
                                                className={`${smallInputClasses} disabled:opacity-50 disabled:bg-surface-hover font-semibold`}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="space-y-6 pt-4 border-t border-surface-hover/50">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-text-primary flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                                    Challenges Faced
                                </label>
                                <textarea rows={3} value={challenges} onChange={(e) => setChallenges(e.target.value)} className={`${inputClasses} resize-none`} placeholder="Describe any operational challenges..." />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-text-primary flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-secondary-500" />
                                    Resolutions / Actions Taken
                                </label>
                                <textarea rows={3} value={resolutions} onChange={(e) => setResolutions(e.target.value)} className={`${inputClasses} resize-none`} placeholder="Describe how challenges were addressed..." />
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end border-t border-surface-hover/50 text-right">
                            <button type="submit" className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-3.5 rounded-2xl font-bold transition-all duration-300 shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 hover:-translate-y-1 w-full md:w-auto">
                                Save Weekly Log
                            </button>
                        </div>
                    </form>
                </div>

                <div className="space-y-6">
                    <h3 className="text-2xl font-bold mb-6 px-2 text-text-primary">Recent Logs</h3>
                    <div className="space-y-4 pb-8 max-h-[1000px] overflow-y-auto pr-2">
                        {weeklyOpsLogs.length === 0 ? (
                            <div className="bg-surface border-none rounded-3xl p-12 text-center shadow-sm">
                                <CalendarRange className="w-16 h-16 text-surface-hover mx-auto mb-4" />
                                <p className="text-text-primary font-bold text-lg">No weekly logs found.</p>
                                <p className="text-sm text-text-secondary mt-2">Submit a log to see it here.</p>
                            </div>
                        ) : (
                            [...weeklyOpsLogs].reverse().map(log => {
                                const totalWeeklyRevenue = log.revenue?.reduce((sum, rev) => sum + rev.amount, 0) || 0;

                                return (
                                    <div key={log.id} className="bg-surface rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-center mb-6">
                                            <div className="text-sm font-bold text-primary-600 bg-primary-50 px-4 py-1.5 rounded-full">
                                                {log.weekStartDate} to {log.weekEndDate}
                                            </div>
                                            {totalWeeklyRevenue > 0 && (
                                                <div className="text-lg font-bold text-text-primary">
                                                    ₦{totalWeeklyRevenue.toLocaleString()}
                                                </div>
                                            )}
                                        </div>


                                        {log.revenue && log.revenue.length > 0 && totalWeeklyRevenue > 0 && (
                                            <div className="mt-4 pt-4 border-t border-surface-hover/50">
                                                <span className="text-xs font-bold text-text-secondary uppercase tracking-wider block mb-3">Revenue Breakdown</span>
                                                <div className="flex flex-wrap gap-2">
                                                    {log.revenue.filter(r => r.amount > 0).map(r => (
                                                        <div key={r.modalityId} className="bg-white border border-surface-hover px-3 py-1.5 text-xs rounded-lg flex items-center gap-2 shadow-sm">
                                                            <span className="text-text-secondary font-medium">{getModalityName(r.modalityId)}:</span>
                                                            <span className="font-bold text-text-primary">₦{r.amount.toLocaleString()}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {((log.challenges && log.challenges.trim() !== '') || (log.resolutions && log.resolutions.trim() !== '')) && (
                                            <div className="space-y-4 mt-6 pt-4 border-t border-surface-hover/50">
                                                {log.challenges && log.challenges.trim() !== '' && (
                                                    <div className="bg-amber-50/50 p-4 rounded-xl">
                                                        <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block mb-2 flex items-center gap-1">
                                                            <AlertTriangle className="w-3 h-3" /> Challenges
                                                        </span>
                                                        <p className="text-sm text-text-primary font-medium">{log.challenges}</p>
                                                    </div>
                                                )}
                                                {log.resolutions && log.resolutions.trim() !== '' && (
                                                    <div className="bg-secondary-500/10 p-4 rounded-xl">
                                                        <span className="text-xs font-bold text-secondary-600 uppercase tracking-wider block mb-2 flex items-center gap-1">
                                                            <CheckCircle className="w-3 h-3" /> Resolutions
                                                        </span>
                                                        <p className="text-sm text-text-primary font-medium">{log.resolutions}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
