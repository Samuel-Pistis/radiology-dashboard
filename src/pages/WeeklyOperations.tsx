import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { CalendarRange, CheckCircle, AlertTriangle, CreditCard, Activity, Layers, Droplets, Info, Edit2, Trash2, X } from 'lucide-react';
import { PageHeader, Card, Input, Button } from '@/components/ui';

export const WeeklyOperations: React.FC = () => {
    const {
        modalities,
        contrastTypes,
        addWeeklyOpsLog,
        deleteWeeklyOpsLog,
        weeklyOpsLogs,
        activityLogs,
        contrastRecords
    } = useAppContext();
    const { showToast } = useToast();

    // Form State
    const [loadedLogId, setLoadedLogId] = useState<string | null>(null);
    const [weekStartDate, setWeekStartDate] = useState('');
    const [weekEndDate, setWeekEndDate] = useState('');
    const [dateError, setDateError] = useState('');

    // Mutable Data States
    const [investigationsState, setInvestigationsState] = useState<Record<string, number>>({});
    const [filmState, setFilmState] = useState<Record<string, { f10x12: number, f14x17: number }>>({})
    const [contrastState, setContrastState] = useState<Record<string, number>>({});
    const [revenueState, setRevenueState] = useState<Record<string, number>>({});

    const [challenges, setChallenges] = useState('');
    const [resolutions, setResolutions] = useState('');

    const [autoPopulatedCount, setAutoPopulatedCount] = useState(0);

    const showSuccess = (msg: string) => showToast(msg, 'success');

    // Initialize Empty States
    const initializeEmptyStates = () => {
        const inv: Record<string, number> = {};
        const rev: Record<string, number> = {};
        const flm: Record<string, { f10x12: number, f14x17: number }> = {};
        const ctr: Record<string, number> = {};

        modalities.forEach(m => {
            inv[m.id] = 0;
            rev[m.id] = 0;
            flm[m.id] = { f10x12: 0, f14x17: 0 };
        });

        contrastTypes.forEach(c => {
            ctr[c.id] = 0;
        });

        setInvestigationsState(inv);
        setRevenueState(rev);
        setFilmState(flm);
        setContrastState(ctr);
    };

    // Run once on mount to set empty objects based on current modalities/contrastTypes
    useEffect(() => {
        if (!loadedLogId && (!weekStartDate || !weekEndDate)) {
            initializeEmptyStates();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [modalities, contrastTypes]);

    // Auto-population Logic Hook
    useEffect(() => {
        if (loadedLogId) return; // Do not auto-populate if we've explicitly loaded a saved log
        if (!weekStartDate || !weekEndDate) {
            setAutoPopulatedCount(0);
            return;
        }

        const periodActivityLogs = activityLogs.filter(log =>
            log.date >= weekStartDate && log.date <= weekEndDate
        );
        const periodContrastRecords = contrastRecords.filter(log =>
            log.date >= weekStartDate && log.date <= weekEndDate
        );

        // Calculate unique days with logs
        const dateSet = new Set([
            ...periodActivityLogs.map(l => l.date),
            ...periodContrastRecords.map(l => l.date)
        ]);

        setAutoPopulatedCount(dateSet.size);

        const inv: Record<string, number> = {};
        const rev: Record<string, number> = {};
        const flm: Record<string, { f10x12: number, f14x17: number }> = {};
        const ctr: Record<string, number> = {};

        modalities.forEach(m => {
            inv[m.id] = 0;
            rev[m.id] = 0;
            flm[m.id] = { f10x12: 0, f14x17: 0 };
        });

        contrastTypes.forEach(c => {
            ctr[c.id] = 0;
        });

        periodActivityLogs.forEach(log => {
            if (inv[log.modalityId] !== undefined) {
                inv[log.modalityId] += (log.totalInvestigations || 0);
            }
            if (rev[log.modalityId] !== undefined) {
                rev[log.modalityId] += (log.revenueAmount || 0);
            }
            if (flm[log.modalityId] !== undefined) {
                flm[log.modalityId].f10x12 += (log.film10x12Used || 0);
                flm[log.modalityId].f14x17 += (log.film14x17Used || 0);
            }
        });

        periodContrastRecords.forEach(record => {
            contrastTypes.forEach(c => {
                const mAmount = record.morning.items.find(i => i.contrastTypeId === c.id)?.amountConsumedMls || 0;
                const aAmount = record.afternoon.items.find(i => i.contrastTypeId === c.id)?.amountConsumedMls || 0;
                const nAmount = record.night.items.find(i => i.contrastTypeId === c.id)?.amountConsumedMls || 0;
                if (ctr[c.id] !== undefined) {
                    ctr[c.id] += (mAmount + aAmount + nAmount);
                }
            });
        });

        setInvestigationsState(inv);
        setRevenueState(rev);
        setFilmState(flm);
        setContrastState(ctr);

    }, [weekStartDate, weekEndDate, activityLogs, contrastRecords, modalities, contrastTypes, loadedLogId]);

    const handleClearForm = () => {
        setLoadedLogId(null);
        setWeekStartDate('');
        setWeekEndDate('');
        setDateError('');
        setChallenges('');
        setResolutions('');
        setAutoPopulatedCount(0);
        initializeEmptyStates();
    };

    const handleLoadLog = (log: import('../types').WeeklyOperationsLog) => {
        setLoadedLogId(log.id);
        setWeekStartDate(log.weekStartDate);
        setWeekEndDate(log.weekEndDate);
        setChallenges(log.challenges || '');
        setResolutions(log.resolutions || '');

        // Restore revenue array into state object
        const rev: Record<string, number> = {};
        modalities.forEach(m => rev[m.id] = 0);
        if (log.revenue) {
            log.revenue.forEach((r: import('../types').ModalityRevenue) => rev[r.modalityId] = r.amount);
        }
        setRevenueState(rev);

        // Restore investigations
        const inv: Record<string, number> = {};
        modalities.forEach(m => inv[m.id] = 0);
        if (log.investigations) Object.assign(inv, log.investigations);
        setInvestigationsState(inv);

        // Restore films
        const flm: Record<string, { f10x12: number, f14x17: number }> = {};
        modalities.forEach(m => flm[m.id] = { f10x12: 0, f14x17: 0 });
        if (log.films) Object.assign(flm, log.films);
        setFilmState(flm);

        // Restore contrast
        const ctr: Record<string, number> = {};
        contrastTypes.forEach(c => ctr[c.id] = 0);
        if (log.contrast) Object.assign(ctr, log.contrast);
        setContrastState(ctr);

        setAutoPopulatedCount(0); // It's loaded, not auto-populated right now
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteLog = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this weekly log? This action cannot be undone.")) {
            try {
                await deleteWeeklyOpsLog(id);
                showSuccess("Weekly log deleted.");
                if (loadedLogId === id) handleClearForm();
            } catch (err) {
                console.error("Delete failed", err);
                // toast is shown by AppContext catch
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!weekStartDate || !weekEndDate) return;

        // Validate date range
        if (weekEndDate < weekStartDate) {
            setDateError('End date must be on or after start date.');
            return;
        }
        setDateError('');

        const revenue = modalities.map(m => ({
            modalityId: m.id,
            amount: revenueState[m.id] || 0
        }));

        try {
            await addWeeklyOpsLog({
                id: loadedLogId || Date.now().toString(),
                weekStartDate,
                weekEndDate,
                challenges,
                resolutions,
                revenue,
                investigations: investigationsState,
                films: filmState,
                contrast: contrastState
            });

            handleClearForm();
            showSuccess(`Weekly Operations log ${loadedLogId ? 'updated' : 'saved'} successfully!`);
        } catch (error) {
            console.error(error);
            // toast shown by AppContext catch
        }
    };

    const totalCurrentRevenue = useMemo(() => Object.values(revenueState).reduce((a, b) => a + (Number(b) || 0), 0), [revenueState]);

    const inputClasses = "rad-input";
    // Helper to safely format numbers avoiding leading zero issues on focus
    const handleNumInput = (val: string) => val === '' ? 0 : Number(val);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <PageHeader
                title="Weekly Operations"
                description="Review auto-populated metrics for the week, make manual adjustments, and log operational challenges."
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* LEFT COLUMN: FORM (approx 60% on lg screens, taking 7 cols) */}
                <div className="lg:col-span-7 xl:col-span-8">
                    <Card className="h-fit p-6 md:p-8 relative overflow-hidden">

                        {loadedLogId && (
                            <div className="absolute top-0 left-0 right-0 bg-warning/20 border-b border-warning/30 text-warning px-4 py-2 text-sm font-bold flex justify-between items-center z-10 transition-all">
                                <span>Editing Existing Log ({weekStartDate} to {weekEndDate})</span>
                                <button onClick={handleClearForm} className="hover:bg-warning/20 p-1 rounded-full transition-colors flex items-center gap-1 text-xs">
                                    <X className="w-4 h-4" /> Cancel Edit
                                </button>
                            </div>
                        )}

                        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-border pb-6 ${loadedLogId ? 'mt-8' : ''}`}>
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-primary/10 rounded-xl text-primary w-fit shadow-sm">
                                    <CalendarRange className="w-8 h-8 stroke-[2.5]" />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-bold text-text-primary tracking-tight">
                                        {loadedLogId ? 'Edit Weekly Log' : 'New Weekly Log'}
                                    </h3>
                                    {!loadedLogId && <p className="text-text-muted text-sm font-medium mt-1">Select dates to auto-populate from daily logs.</p>}
                                </div>
                            </div>

                            {!loadedLogId && (weekStartDate || weekEndDate) && Object.keys(investigationsState).length > 0 && (
                                <Button type="button" variant="secondary" size="sm" onClick={handleClearForm}>
                                    Clear Form
                                </Button>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-10">
                            {/* DATE RANGE */}
                            <div className="space-y-2">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-5 bg-black/[0.02] rounded-3xl border border-black/5">
                                    <Input
                                        label="Start Date"
                                        type="date"
                                        value={weekStartDate}
                                        onChange={(e) => { setWeekStartDate(e.target.value); setDateError(''); }}
                                        required
                                    />
                                    <Input
                                        label="End Date"
                                        type="date"
                                        value={weekEndDate}
                                        onChange={(e) => { setWeekEndDate(e.target.value); setDateError(''); }}
                                        required
                                    />
                                </div>
                                {dateError && (
                                    <p className="text-xs font-semibold text-danger flex items-center gap-1.5 px-1">
                                        <AlertTriangle className="w-3.5 h-3.5" />
                                        {dateError}
                                    </p>
                                )}
                            </div>

                            {autoPopulatedCount > 0 && (
                                <div className="bg-primary/5 text-primary border border-primary/20 rounded-2xl p-4 flex items-center gap-3 animate-pulse-once shadow-sm">
                                    <Info className="w-6 h-6 stroke-[2.5]" />
                                    <div>
                                        <p className="font-bold text-sm">Data Auto-Populated</p>
                                        <p className="text-xs font-semibold opacity-80">Found {autoPopulatedCount} day(s) of logs matching this date range. You can manually edit the totals below if needed.</p>
                                    </div>
                                </div>
                            )}

                            {/* INVESTIGATIONS */}
                            <div className="space-y-4">
                                <h4 className="text-base font-bold text-text-primary flex items-center gap-2">
                                    <div className="p-1.5 bg-accent-indigo/10 rounded-lg text-accent-indigo"><Activity className="w-5 h-5 stroke-[2.5]" /></div>
                                    Investigations by Modality
                                </h4>
                                {modalities.length === 0 ? <p className="text-sm text-text-muted">No modalities</p> : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 bg-white/40 p-3 rounded-3xl border border-white/60 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]">
                                        {modalities.map(m => (
                                            <div key={m.id} className="bg-white rounded-2xl p-3 shadow-sm border border-black/5 relative group">
                                                <label className="text-[10px] font-bold text-text-secondary tracking-widest block mb-1 truncate">{m.name}</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={investigationsState[m.id] === 0 ? '' : investigationsState[m.id]}
                                                    placeholder="0"
                                                    onChange={e => setInvestigationsState(prev => ({ ...prev, [m.id]: handleNumInput(e.target.value) }))}
                                                    className="w-full text-2xl font-bold text-text-primary bg-transparent outline-none p-0 focus:ring-0 placeholder:text-text-muted/30"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* FILM CONSUMPTION */}
                            <div className="space-y-4">
                                <h4 className="text-base font-bold text-text-primary flex items-center gap-2">
                                    <div className="p-1.5 bg-lavender/10 rounded-lg text-lavender"><Layers className="w-5 h-5 stroke-[2.5]" /></div>
                                    Film Consumption
                                </h4>
                                {modalities.length === 0 ? <p className="text-sm text-text-muted">No modalities</p> : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 bg-white/40 p-3 rounded-3xl border border-white/60 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]">
                                        {modalities.map(m => (
                                            <div key={m.id} className="bg-white rounded-2xl p-3 shadow-sm border border-black/5 flex flex-col gap-2">
                                                <label className="text-[10px] font-bold text-text-secondary tracking-widest block truncate">{m.name}</label>
                                                <div className="flex gap-2">
                                                    <div className="bg-black/[0.03] rounded-xl p-2 flex-1 relative">
                                                        <span className="text-[9px] font-bold text-text-muted absolute top-1 left-2">10x12</span>
                                                        <input
                                                            type="number" min="0" placeholder="0"
                                                            value={filmState[m.id]?.f10x12 === 0 ? '' : filmState[m.id]?.f10x12}
                                                            onChange={e => setFilmState(prev => ({ ...prev, [m.id]: { ...prev[m.id], f10x12: handleNumInput(e.target.value) } }))}
                                                            className="w-full text-right text-lg font-bold text-text-primary bg-transparent outline-none mt-2 placeholder:text-black/20"
                                                        />
                                                    </div>
                                                    <div className="bg-black/[0.03] rounded-xl p-2 flex-1 relative">
                                                        <span className="text-[9px] font-bold text-text-muted absolute top-1 left-2">14x17</span>
                                                        <input
                                                            type="number" min="0" placeholder="0"
                                                            value={filmState[m.id]?.f14x17 === 0 ? '' : filmState[m.id]?.f14x17}
                                                            onChange={e => setFilmState(prev => ({ ...prev, [m.id]: { ...prev[m.id], f14x17: handleNumInput(e.target.value) } }))}
                                                            className="w-full text-right text-lg font-bold text-text-primary bg-transparent outline-none mt-2 placeholder:text-black/20"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* CONTRAST CONSUMPTION */}
                            <div className="space-y-4">
                                <h4 className="text-base font-bold text-text-primary flex items-center gap-2">
                                    <div className="p-1.5 bg-peach/10 rounded-lg text-peach"><Droplets className="w-5 h-5 stroke-[2.5]" /></div>
                                    Contrast Consumption (ML)
                                </h4>
                                {contrastTypes.length === 0 ? <p className="text-sm text-text-muted">No contrast types</p> : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 bg-white/40 p-3 rounded-3xl border border-white/60 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]">
                                        {contrastTypes.map(c => (
                                            <div key={c.id} className="bg-white rounded-2xl p-3 shadow-sm border border-black/5 relative">
                                                <label className="text-[10px] font-bold text-text-secondary tracking-widest block mb-1 truncate" title={c.name}>{c.name}</label>
                                                <div className="flex items-center">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={contrastState[c.id] === 0 ? '' : contrastState[c.id]}
                                                        placeholder="0"
                                                        onChange={e => setContrastState(prev => ({ ...prev, [c.id]: handleNumInput(e.target.value) }))}
                                                        className="w-full text-2xl font-bold text-text-primary bg-transparent outline-none p-0 focus:ring-0 placeholder:text-text-muted/30"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* REVENUE */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <h4 className="text-base font-bold text-text-primary flex items-center gap-2">
                                        <div className="p-1.5 bg-yellow/10 rounded-lg text-yellow"><CreditCard className="w-5 h-5 stroke-[2.5]" /></div>
                                        Revenue Collection (₦)
                                    </h4>
                                    <span className="text-xl font-bold text-success bg-success/10 px-4 py-1.5 rounded-full border border-success/20">
                                        Total: ₦{totalCurrentRevenue.toLocaleString()}
                                    </span>
                                </div>
                                {modalities.length === 0 ? <p className="text-sm text-text-muted">No modalities</p> : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-white/40 p-3 rounded-3xl border border-white/60 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]">
                                        {modalities.map(m => (
                                            <div key={m.id} className="bg-white border border-black/5 rounded-2xl p-3 shadow-sm flex items-center">
                                                <div className="flex-1">
                                                    <label className="text-[10px] font-bold tracking-widest text-text-secondary truncate block">{m.name}</label>
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <span className="text-lg font-bold text-text-muted">₦</span>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={revenueState[m.id] === 0 ? '' : revenueState[m.id]}
                                                            placeholder="0"
                                                            onChange={e => setRevenueState(prev => ({ ...prev, [m.id]: handleNumInput(e.target.value) }))}
                                                            className="w-full text-lg font-bold text-text-primary bg-transparent outline-none p-0 placeholder:text-text-muted/30"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* TEXT BOXES */}
                            <div className="space-y-6 pt-4 border-t border-black/5">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-text-primary tracking-widest flex items-center gap-2 pl-2">
                                        <AlertTriangle className="w-5 h-5 text-peach stroke-[2.5]" />
                                        Challenges Faced
                                    </label>
                                    <textarea rows={3} value={challenges} onChange={(e) => setChallenges(e.target.value)} className={`${inputClasses} rounded-[2rem] resize-none`} placeholder="Describe any operational challenges..." />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-text-primary tracking-widest flex items-center gap-2 pl-2">
                                        <CheckCircle className="w-5 h-5 text-mint stroke-[2.5]" />
                                        Resolutions / Actions Taken
                                    </label>
                                    <textarea rows={3} value={resolutions} onChange={(e) => setResolutions(e.target.value)} className={`${inputClasses} rounded-[2rem] resize-none`} placeholder="Describe how challenges were addressed..." />
                                </div>
                            </div>

                            <div className="pt-6 flex justify-end border-t border-border text-right gap-4">
                                <Button type="submit" size="lg" className="w-full sm:w-auto">
                                    {loadedLogId ? 'Update Weekly Log' : 'Save Weekly Log'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>

                {/* RIGHT COLUMN: RECENT LOGS (approx 40% on lg screens, taking 5 cols) */}
                <div className="lg:col-span-5 xl:col-span-4 space-y-6">
                    <h3 className="text-2xl font-bold px-2 text-text-primary tracking-tight sticky top-0 bg-background/80 backdrop-blur-md py-2 z-10 flex justify-between items-center">
                        Recent Logs
                        <span className="bg-black/5 text-black/50 text-xs px-2 py-1 rounded-full">{weeklyOpsLogs.length} total</span>
                    </h3>
                    <div className="space-y-4 max-h-[85vh] overflow-y-auto pr-2 pb-12 custom-scrollbar">
                        {weeklyOpsLogs.length === 0 ? (
                            <div className="bg-white/40 backdrop-blur-3xl border border-white/60 rounded-3xl p-10 text-center shadow-sm">
                                <CalendarRange className="w-12 h-12 text-black/20 mx-auto mb-4 stroke-[1.5]" />
                                <p className="text-text-primary font-bold text-lg tracking-tight">No weekly logs yet</p>
                            </div>
                        ) : (
                            [...weeklyOpsLogs].reverse().map(log => {
                                const totalWeeklyRevenue = log.revenue?.reduce((sum, rev) => sum + rev.amount, 0) || 0;
                                const isLoaded = loadedLogId === log.id;

                                // Compute total investigations quickly for display
                                const totalInv = log.investigations
                                    ? Object.values(log.investigations).reduce((a: number, b: unknown) => a + (Number(b) || 0), 0)
                                    : 0;

                                return (
                                    <div key={log.id} className={`bg-white/60 backdrop-blur-3xl rounded-[2rem] p-5 shadow-sm border transition-all relative overflow-hidden group ${isLoaded ? 'border-primary ring-2 ring-primary/20 bg-white shadow-md' : 'border-white/80 hover:shadow-md hover:bg-white'}`}>

                                        {/* Action buttons (hidden until hover on desktop) */}
                                        <div className="absolute top-4 right-4 flex gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity z-10">
                                            <button
                                                onClick={() => handleLoadLog(log)}
                                                className="bg-white/80 hover:bg-white text-primary p-2 rounded-full shadow-sm border border-black/5 transition-all"
                                                title="Edit Log"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteLog(log.id)}
                                                className="bg-white/80 hover:bg-white text-danger p-2 rounded-full shadow-sm border border-black/5 transition-all"
                                                title="Delete Log"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="flex flex-col gap-1 mb-4 pr-20">
                                            <span className="text-[10px] font-bold text-text-muted tracking-widest uppercase">Reporting Period</span>
                                            <div className="text-sm font-bold text-text-primary">
                                                {log.weekStartDate} to {log.weekEndDate}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                            <div className="bg-black/[0.03] rounded-xl p-3">
                                                <span className="text-[10px] font-bold text-text-secondary tracking-widest block mb-1">REVENUE</span>
                                                <span className="text-lg font-bold text-success leading-none block">₦{totalWeeklyRevenue.toLocaleString()}</span>
                                            </div>
                                            <div className="bg-black/[0.03] rounded-xl p-3">
                                                <span className="text-[10px] font-bold text-text-secondary tracking-widest block mb-1">TOTAL SCANS</span>
                                                <span className="text-lg font-bold text-text-primary leading-none block">{Number(totalInv)}</span>
                                            </div>
                                        </div>

                                        {((log.challenges && log.challenges.trim() !== '') || (log.resolutions && log.resolutions.trim() !== '')) && (
                                            <div className="flex gap-2 pt-3 border-t border-black/5">
                                                {log.challenges && <span className="text-xs font-semibold text-warning bg-warning/10 px-2 py-1 rounded-md">Has Challenges</span>}
                                                {log.resolutions && <span className="text-xs font-semibold text-success bg-success/10 px-2 py-1 rounded-md">Has resolutions</span>}
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
