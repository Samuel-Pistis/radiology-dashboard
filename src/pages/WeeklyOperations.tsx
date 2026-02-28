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
                const mAmount = record.morning.items.find(i => i.contrastTypeId === c.id)?.amountConsumedMls || 0;
                const aAmount = record.afternoon.items.find(i => i.contrastTypeId === c.id)?.amountConsumedMls || 0;
                const nAmount = record.night.items.find(i => i.contrastTypeId === c.id)?.amountConsumedMls || 0;
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

    const inputClasses = "w-full bg-white/40 border-2 border-transparent rounded-full px-5 py-3 text-black font-semibold focus:border-black/20 focus:bg-white/60 outline-none transition-all shadow-sm placeholder:text-black/40 backdrop-blur-md";
    const smallInputClasses = "w-full bg-white/40 border-2 border-transparent rounded-full px-4 py-2 text-sm text-black font-semibold focus:border-black/20 focus:bg-white/60 outline-none transition-all shadow-sm placeholder:text-black/40 backdrop-blur-md";


    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <div>
                <h2 className="text-3xl font-semibold tracking-tight text-text-primary">Weekly Operations</h2>
                <p className="text-text-secondary mt-1">Log and review weekly turnaround times, challenges, resolutions, and revenue.</p>
            </div>

            {successMessage && (
                <div className="p-4 bg-secondary-500/10 border border-secondary-500/20 text-secondary-500 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <CheckCircle className="w-5 h-5" />
                    {successMessage}
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div className="bg-white/40 backdrop-blur-3xl rounded-[2.5rem] p-8 shadow-sm border border-white/60 h-fit">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8 border-b border-black/5 pb-6">
                        <div className="p-4 bg-lavender rounded-[1.5rem] text-black w-fit shadow-sm">
                            <CalendarRange className="w-8 h-8 stroke-[2.5]" />
                        </div>
                        <h3 className="text-3xl font-bold text-black tracking-tight">New Weekly Log</h3>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-black/60 uppercase tracking-widest pl-2">Start Date</label>
                                <input type="date" value={weekStartDate} onChange={(e) => setWeekStartDate(e.target.value)} required className={inputClasses} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-black/60 uppercase tracking-widest pl-2">End Date</label>
                                <input type="date" value={weekEndDate} onChange={(e) => setWeekEndDate(e.target.value)} required className={inputClasses} />
                            </div>
                        </div>

                        {/* Auto-Calculated Weekly Totals Display */}
                        <div className="space-y-4 pt-2">
                            <h4 className="text-sm font-bold text-black uppercase tracking-widest flex items-center gap-2">
                                <Activity className="w-5 h-5 text-mint stroke-[2.5]" />
                                Total Investigations by Modality
                            </h4>
                            {!weeklyData ? (
                                <p className="text-sm font-medium text-black/50 pb-2 pl-7">Please select a Start and End Date.</p>
                            ) : (
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 p-4 bg-white/30 rounded-[2rem] border border-white/50 backdrop-blur-md">
                                    {modalities.map(m => (
                                        <div key={m.id} className="flex flex-col py-4 px-2 bg-white/50 rounded-2xl border border-white/60 shadow-sm text-center">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-black/60 mb-1 truncate" title={m.name}>{m.name}</span>
                                            <span className="text-3xl font-bold text-black tracking-tighter leading-none">{weeklyData.totals[m.id]}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Total Film Consumption by Modality */}
                        <div className="space-y-4 pt-4 border-t border-black/5">
                            <h4 className="text-sm font-bold text-black uppercase tracking-widest flex items-center gap-2">
                                <Layers className="w-5 h-5 text-lavender stroke-[2.5]" />
                                Total Film Consumption by Modality
                            </h4>
                            {!weeklyData ? (
                                <p className="text-sm font-medium text-black/50 pb-2 pl-7">Please select a Start and End Date.</p>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 bg-white/30 rounded-[2rem] border border-white/50 backdrop-blur-md">
                                    {modalities.map(m => {
                                        const film = weeklyData.filmTotals[m.id];
                                        if (film.f10x12 === 0 && film.f14x17 === 0) return null;
                                        return (
                                            <div key={m.id} className="flex flex-col p-4 bg-white/50 rounded-2xl border border-white/60 shadow-sm">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-black/60 mb-3 truncate" title={m.name}>{m.name}</span>
                                                <div className="flex justify-between items-center bg-white/60 px-3 py-2 rounded-full mb-2 shadow-sm border border-transparent">
                                                    <span className="text-xs font-bold text-black/50">10x12</span>
                                                    <span className="text-base font-bold text-black">{film.f10x12}</span>
                                                </div>
                                                <div className="flex justify-between items-center bg-white/60 px-3 py-2 rounded-full shadow-sm border border-transparent">
                                                    <span className="text-xs font-bold text-black/50">14x17</span>
                                                    <span className="text-base font-bold text-black">{film.f14x17}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {modalities.every(m => weeklyData.filmTotals[m.id].f10x12 === 0 && weeklyData.filmTotals[m.id].f14x17 === 0) && (
                                        <p className="text-sm font-medium text-black/50 col-span-full py-2">No film usage logged for this period.</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Total Contrast Consumption */}
                        <div className="space-y-4 pt-4 border-t border-black/5">
                            <h4 className="text-sm font-bold text-black uppercase tracking-widest flex items-center gap-2">
                                <Droplets className="w-5 h-5 text-peach stroke-[2.5]" />
                                Total Contrast Consumption by Type
                            </h4>
                            {!weeklyData ? (
                                <p className="text-sm font-medium text-black/50 pb-2 pl-7">Please select a Start and End Date.</p>
                            ) : (
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 p-4 bg-white/30 rounded-[2rem] border border-white/50 backdrop-blur-md">
                                    {contrastTypes.map(c => {
                                        const totalML = weeklyData.contrastTotals[c.id];
                                        if (totalML === 0) return null;
                                        return (
                                            <div key={c.id} className="flex flex-col py-4 px-2 bg-white/50 rounded-2xl border border-white/60 shadow-sm text-center">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-black/60 mb-1 truncate" title={c.name}>{c.name}</span>
                                                <div className="flex items-baseline justify-center gap-1">
                                                    <span className="text-3xl font-bold text-black tracking-tighter leading-none">{totalML}</span>
                                                    <span className="text-[10px] font-semibold text-black/40 uppercase tracking-wider">ML</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {contrastTypes.every(c => weeklyData.contrastTotals[c.id] === 0) && (
                                        <p className="text-sm font-medium text-black/50 col-span-full text-left py-2">No contrast usage logged for this period.</p>
                                    )}
                                </div>
                            )}
                        </div>                        <div className="space-y-4 pt-4 border-t border-black/5">
                            <h4 className="text-sm font-bold text-black uppercase tracking-widest flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-yellow stroke-[2.5]" />
                                Revenue Collection by Modality (₦)
                            </h4>
                            {modalities.length === 0 ? (
                                <p className="text-sm font-medium text-black/50 pb-2 pl-7">No modalities configured.</p>
                            ) : !weeklyData ? (
                                <p className="text-sm font-medium text-black/50 pb-2 pl-7">Please select a Start and End Date.</p>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {modalities.map(modality => (
                                        <div key={modality.id} className="space-y-2 p-4 bg-white/30 rounded-3xl border border-white/50 backdrop-blur-md text-center">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-black/60 truncate block" title={modality.name}>{modality.name}</label>
                                            <input
                                                type="text"
                                                value={weeklyData.revenueTotals[modality.id].toLocaleString()}
                                                disabled
                                                readOnly
                                                className={`${smallInputClasses} disabled:opacity-70 disabled:bg-white/50 text-center text-lg shadow-none`}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="space-y-6 pt-4 border-t border-black/5">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-black uppercase tracking-widest flex items-center gap-2 pl-2">
                                    <AlertTriangle className="w-5 h-5 text-peach stroke-[2.5]" />
                                    Challenges Faced
                                </label>
                                <textarea rows={3} value={challenges} onChange={(e) => setChallenges(e.target.value)} className={`${inputClasses} rounded-[2rem] resize-none`} placeholder="Describe any operational challenges..." />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-black uppercase tracking-widest flex items-center gap-2 pl-2">
                                    <CheckCircle className="w-5 h-5 text-mint stroke-[2.5]" />
                                    Resolutions / Actions Taken
                                </label>
                                <textarea rows={3} value={resolutions} onChange={(e) => setResolutions(e.target.value)} className={`${inputClasses} rounded-[2rem] resize-none`} placeholder="Describe how challenges were addressed..." />
                            </div>
                        </div>

                        <div className="pt-6 flex justify-end border-t border-black/5 text-right">
                            <button type="submit" className="bg-black text-white px-10 py-4 rounded-full font-bold text-lg transition-all duration-300 shadow-lg hover:scale-105 active:scale-95 cursor-pointer w-full md:w-auto">
                                Save Weekly Log
                            </button>
                        </div>
                    </form>
                </div>

                <div className="space-y-6">
                    <h3 className="text-3xl font-bold mb-8 px-2 text-black tracking-tight">Recent Logs</h3>
                    <div className="space-y-6 pb-8 max-h-[1000px] overflow-y-auto pr-2">
                        {weeklyOpsLogs.length === 0 ? (
                            <div className="bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[2.5rem] p-12 text-center shadow-sm">
                                <CalendarRange className="w-16 h-16 text-black/20 mx-auto mb-6 stroke-[1.5]" />
                                <p className="text-black font-bold text-2xl tracking-tight">No weekly logs found.</p>
                                <p className="text-base font-semibold text-black/50 mt-2">Submit a log to see it here.</p>
                            </div>
                        ) : (
                            [...weeklyOpsLogs].reverse().map(log => {
                                const totalWeeklyRevenue = log.revenue?.reduce((sum, rev) => sum + rev.amount, 0) || 0;

                                return (
                                    <div key={log.id} className="bg-white/40 backdrop-blur-3xl rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-white/60 hover:shadow-md transition-all">
                                        <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
                                            <div className="text-sm font-bold text-black bg-white/60 px-5 py-2.5 rounded-full shadow-sm border border-white">
                                                {log.weekStartDate} to {log.weekEndDate}
                                            </div>
                                            {totalWeeklyRevenue > 0 && (
                                                <div className="text-2xl font-bold text-black tracking-tighter">
                                                    ₦{totalWeeklyRevenue.toLocaleString()}
                                                </div>
                                            )}
                                        </div>


                                        {log.revenue && log.revenue.length > 0 && totalWeeklyRevenue > 0 && (
                                            <div className="mt-4 pt-6 border-t border-black/5">
                                                <span className="text-[10px] font-bold text-black/50 uppercase tracking-widest block mb-4">Revenue Breakdown</span>
                                                <div className="flex flex-wrap gap-2">
                                                    {log.revenue.filter(r => r.amount > 0).map(r => (
                                                        <div key={r.modalityId} className="bg-white/50 border border-white/60 px-4 py-2 text-sm rounded-full flex items-center gap-2 shadow-sm">
                                                            <span className="text-black/60 font-semibold">{getModalityName(r.modalityId)}:</span>
                                                            <span className="font-bold text-black">₦{r.amount.toLocaleString()}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {((log.challenges && log.challenges.trim() !== '') || (log.resolutions && log.resolutions.trim() !== '')) && (
                                            <div className="space-y-4 mt-6 pt-6 border-t border-black/5">
                                                {log.challenges && log.challenges.trim() !== '' && (
                                                    <div className="bg-peach/30 border border-peach/50 p-5 rounded-[1.5rem] shadow-sm">
                                                        <span className="text-[10px] font-bold text-peach tracking-widest uppercase block mb-2 flex items-center gap-1">
                                                            <AlertTriangle className="w-3 h-3 stroke-[3]" /> Challenges
                                                        </span>
                                                        <p className="text-base text-black font-semibold leading-relaxed">{log.challenges}</p>
                                                    </div>
                                                )}
                                                {log.resolutions && log.resolutions.trim() !== '' && (
                                                    <div className="bg-mint/30 border border-mint/50 p-5 rounded-[1.5rem] shadow-sm">
                                                        <span className="text-[10px] font-bold text-black/60 tracking-widest uppercase block mb-2 flex items-center gap-1">
                                                            <CheckCircle className="w-3 h-3 text-mint stroke-[3]" /> Resolutions
                                                        </span>
                                                        <p className="text-base text-black font-semibold leading-relaxed">{log.resolutions}</p>
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
