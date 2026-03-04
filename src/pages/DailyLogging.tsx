import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { PageHeader, Tabs, Card, Button, StatCard } from '@/components/ui';
import { formatNaira } from '@/lib/utils';
import { Activity, CheckCircle, Save, PieChart as PieChartIcon, ChevronLeft, ChevronRight, Calendar, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { HandoverBanner } from '../components/HandoverBanner';
import { HandoverComposer } from '../components/HandoverComposer';
import { DowntimeModal } from '../components/DowntimeModal';
import type { PendingNote } from '../components/HandoverComposer';

export const DailyLogging: React.FC = () => {
    const { modalities, filmSizes, saveShiftActivityLog, shiftActivityLogs, centreSettings, saveShiftContrastLog, shiftContrastLogs, addHandoverNote } = useAppContext();
    const { user } = useAuth();

    const [activeTab, setActiveTab] = useState<'activity' | 'contrast'>('contrast'); // Default to contrast for testing
    const [successMessage, setSuccessMessage] = useState('');
    const [pendingNotes, setPendingNotes] = useState<PendingNote[]>([]);
    const [isDowntimeModalOpen, setIsDowntimeModalOpen] = useState(false);

    const showSuccess = (msg: string) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    // === ACTIVITY LOGGING STATE ===
    const [activityDate, setActivityDate] = useState(new Date().toISOString().split('T')[0]);
    const [activityDateOffset, setActivityDateOffset] = useState(0);
    const [activityShift, setActivityShift] = useState<'Morning' | 'Afternoon' | 'Night'>('Morning');

    const [investigations, setInvestigations] = useState<Record<string, { count: number, revenue: number }>>({});
    const [films, setFilms] = useState<Record<string, number>>({});

    const [challenges, setChallenges] = useState('');
    const [resolutions, setResolutions] = useState('');

    const activityVisibleDates = useMemo(() => {
        const dates = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() + activityDateOffset - i);
            dates.push(d);
        }
        return dates;
    }, [activityDateOffset]);

    useEffect(() => {
        const existingLog = shiftActivityLogs.find(log => log.date === activityDate && log.shift === activityShift);
        if (existingLog) {
            setInvestigations(existingLog.investigations || {});
            setFilms(existingLog.films || {});
            setChallenges(existingLog.challenges || '');
            setResolutions(existingLog.resolutions || '');
        } else {
            setInvestigations({});
            setFilms({});
            setChallenges('');
            setResolutions('');
        }
    }, [activityDate, activityShift, shiftActivityLogs]);

    const handleInvestigationChange = (modalityId: string, field: 'count' | 'revenue', value: number) => {
        setInvestigations(prev => ({
            ...prev,
            [modalityId]: {
                ...prev[modalityId],
                count: prev[modalityId]?.count || 0,
                revenue: prev[modalityId]?.revenue || 0,
                [field]: isNaN(value) ? 0 : value
            }
        }));
    };

    const handleFilmChange = (sizeId: string, value: number) => {
        setFilms(prev => ({
            ...prev,
            [sizeId]: isNaN(value) ? 0 : value
        }));
    };

    const handleActivitySubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        await saveShiftActivityLog({
            id: `act-${Date.now()}`,
            date: activityDate,
            shift: activityShift,
            logged_by: user?.id || 'unknown',
            logged_by_name: user?.name || 'Unknown User',
            investigations,
            films,
            challenges,
            resolutions
        });

        // Save any pending handover notes
        if (pendingNotes.length > 0) {
            const nextShift = activityShift === 'Morning' ? 'Afternoon' : activityShift === 'Afternoon' ? 'Night' : 'Morning';
            await Promise.all(pendingNotes.map(note =>
                addHandoverNote({
                    id: `hov-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                    date: activityDate,
                    from_shift: activityShift,
                    to_shift: nextShift,
                    flagged_by: user?.id || 'unknown',
                    flagged_by_name: user?.name || 'Unknown User',
                    category: note.category,
                    message: note.message,
                    acknowledged: false,
                })
            ));
            setPendingNotes([]);
        }

        showSuccess('Activity log saved successfully!');
    };

    const clearActivityForm = () => {
        setInvestigations({});
        setFilms({});
        setChallenges('');
        setResolutions('');
    };

    // Calculate Totals
    const totalActivityInvestigations = useMemo(() => Object.values(investigations).reduce((sum, item) => sum + (item.count || 0), 0), [investigations]);
    const totalActivityRevenue = useMemo(() => Object.values(investigations).reduce((sum, item) => sum + (item.revenue || 0), 0), [investigations]);
    const totalActivityFilms = useMemo(() => Object.values(films).reduce((sum, val) => sum + (val || 0), 0), [films]);

    const activityPieData = useMemo(() => {
        const colors = ['#0D9488', '#10B981', '#F59E0B', '#6366F1', '#111827'];
        return modalities.map((m, i) => ({
            name: m.name,
            value: investigations[m.id]?.count || 0,
            fill: colors[i % colors.length]
        })).filter(d => d.value > 0);
    }, [investigations, modalities]);

    // === CONTRAST TRACKER STATE ===
    const [contrastDate, setContrastDate] = useState(new Date().toISOString().split('T')[0]);
    const [contrastDateOffset, setContrastDateOffset] = useState(0);
    const [contrastShift, setContrastShift] = useState<'Morning' | 'Afternoon' | 'Night'>('Morning');

    const contrastVisibleDates = useMemo(() => {
        const dates = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() + contrastDateOffset - i);
            dates.push(d);
        }
        return dates;
    }, [contrastDateOffset]);

    const activeContrastTypes = centreSettings?.contrast_types || [];
    const minThresholds = centreSettings?.contrast_alerts || { min_ml: 100, min_bottles: 2 };

    const [contrastEntries, setContrastEntries] = useState<Record<string, { receivedMls: number, receivedBottles: number, consumedMls: number, consumedBottles: number, outstandingMls: number, outstandingBottles: number }>>({});

    useEffect(() => {
        const existingLog = shiftContrastLogs.find(log => log.date === contrastDate && log.shift === contrastShift);
        if (existingLog) {
            setContrastEntries(existingLog.entries || {});
        } else {
            const defaultEntries: Record<string, any> = {};
            activeContrastTypes.forEach((c: { id: string }) => {
                defaultEntries[c.id] = { receivedMls: 0, receivedBottles: 0, consumedMls: 0, consumedBottles: 0, outstandingMls: 0, outstandingBottles: 0 };
            });
            setContrastEntries(defaultEntries);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contrastDate, contrastShift, shiftContrastLogs]);

    const handleContrastChange = (typeId: string, field: 'receivedMls' | 'receivedBottles' | 'consumedMls' | 'consumedBottles', value: number) => {
        setContrastEntries(prev => {
            const currentItem = prev[typeId] || { receivedMls: 0, receivedBottles: 0, consumedMls: 0, consumedBottles: 0, outstandingMls: 0, outstandingBottles: 0 };
            const updatedItem = { ...currentItem, [field]: isNaN(value) ? 0 : value };

            updatedItem.outstandingMls = updatedItem.receivedMls - updatedItem.consumedMls;
            updatedItem.outstandingBottles = updatedItem.receivedBottles - updatedItem.consumedBottles;

            return { ...prev, [typeId]: updatedItem };
        });
    };

    const handleContrastSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        await saveShiftContrastLog({
            id: `cont-shift-${Date.now()}`,
            date: contrastDate,
            shift: contrastShift,
            logged_by: user?.id || 'unknown',
            logged_by_name: user?.name || 'Unknown User',
            entries: contrastEntries
        });

        showSuccess('Shift contrast data saved successfully!');
    };

    const clearContrastForm = () => {
        const defaultEntries: Record<string, any> = {};
        activeContrastTypes.forEach((c: { id: string }) => {
            defaultEntries[c.id] = { receivedMls: 0, receivedBottles: 0, consumedMls: 0, consumedBottles: 0, outstandingMls: 0, outstandingBottles: 0 };
        });
        setContrastEntries(defaultEntries);
    };

    // Top Header Stats
    const totalDayReceived = useMemo(() => Object.values(contrastEntries).reduce((sum, item) => sum + (item.receivedMls || 0), 0), [contrastEntries]);
    const totalDayConsumed = useMemo(() => Object.values(contrastEntries).reduce((sum, item) => sum + (item.consumedMls || 0), 0), [contrastEntries]);
    const totalRemaining = useMemo(() => Object.values(contrastEntries).reduce((sum, item) => sum + (item.outstandingMls || 0), 0), [contrastEntries]);

    const hasLowStockAlert = useMemo(() => {
        return Object.values(contrastEntries).some(item =>
            item.outstandingMls < minThresholds.min_ml || item.outstandingBottles < minThresholds.min_bottles
        );
    }, [contrastEntries, minThresholds]);

    const activeShiftLogs = useMemo(() => {
        return shiftContrastLogs.filter(log => log.date === contrastDate);
    }, [shiftContrastLogs, contrastDate]);

    const renderContrastGrid = () => {
        return (
            <div className="bg-white/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/50 shadow-sm overflow-hidden transition-all mb-8">
                <div className="w-full flex justify-between items-center p-8 bg-black/5 border-b border-black/5">
                    <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm ${contrastShift === 'Morning' ? 'bg-primary-100 text-primary-600' :
                            contrastShift === 'Afternoon' ? 'bg-green-100 text-green-600' :
                                'bg-slate-100 text-slate-700'
                            } `}>
                            {contrastShift === 'Morning' ? '☀' : contrastShift === 'Afternoon' ? '☼' : '☽'}
                        </div>
                        <div className="text-left">
                            <h4 className="font-bold text-2xl text-text-primary tracking-tight leading-none">
                                {contrastShift} Shift <span className="text-sm font-semibold text-text-muted ml-2 tracking-wide">
                                    ({contrastShift === 'Morning' ? '8am-4pm' : contrastShift === 'Afternoon' ? '4pm-12am' : '12am-8am'})
                                </span>
                            </h4>
                        </div>
                    </div>
                </div>

                {hasLowStockAlert && (
                    <div className="mx-6 mt-6 p-4 bg-warning/10 border border-warning/30 rounded-2xl flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-bold text-warning-dark">Low Stock Alert</h4>
                            <p className="text-xs font-medium text-warning-dark/80 mt-1">One or more contrast types have dropped below the minimum required threshold. Please reorder.</p>
                        </div>
                    </div>
                )}

                <div className="p-6">
                    <div className="overflow-x-auto pb-4">
                        <table className="w-full min-w-[800px] border-collapse">
                            <thead>
                                <tr>
                                    <th className="p-4 text-left font-medium text-sm text-text-secondary bg-surface border-b border-border">Contrast Type</th>
                                    <th className="p-4 text-center font-medium text-sm text-text-secondary bg-surface border-b border-border border-l">Received (mL)</th>
                                    <th className="p-4 text-center font-medium text-sm text-text-secondary bg-surface border-b border-border border-l">Received (Btls)</th>
                                    <th className="p-4 text-center font-medium text-sm text-text-secondary bg-surface border-b border-border border-l">Consumed (mL)</th>
                                    <th className="p-4 text-center font-medium text-sm text-text-secondary bg-surface border-b border-border border-l">Consumed (Btls)</th>
                                    <th className="p-4 text-center font-medium text-sm text-text-secondary bg-surface border-b border-border border-l">Outstanding</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activeContrastTypes.map((c: any) => {
                                    const entry = contrastEntries[c.id] || { receivedMls: 0, receivedBottles: 0, consumedMls: 0, consumedBottles: 0, outstandingMls: 0, outstandingBottles: 0 };
                                    const hasDiscrepancy = entry.consumedMls > entry.receivedMls || entry.consumedBottles > entry.receivedBottles;
                                    const isLowStock = entry.outstandingMls < minThresholds.min_ml || entry.outstandingBottles < minThresholds.min_bottles;

                                    return (
                                        <tr key={c.id} className="border-b border-black/5 hover:bg-white/30 transition-colors">
                                            <td className="p-4 font-semibold text-text-primary">{c.name}</td>
                                            <td className="p-3 border-l border-white/30">
                                                <input type="number" min="0" value={entry.receivedMls || ''} onChange={(e) => handleContrastChange(c.id, 'receivedMls', parseInt(e.target.value) || 0)} className="w-full min-h-[44px] bg-white/50 border-2 border-transparent rounded-xl px-3 py-2 text-center text-sm font-bold text-text-primary focus:bg-white focus:border-primary/50 outline-none transition-all shadow-sm" placeholder="0" />
                                            </td>
                                            <td className="p-3 border-l border-white/30">
                                                <input type="number" min="0" value={entry.receivedBottles || ''} onChange={(e) => handleContrastChange(c.id, 'receivedBottles', parseInt(e.target.value) || 0)} className="w-full min-h-[44px] bg-white/50 border-2 border-transparent rounded-xl px-3 py-2 text-center text-sm font-bold text-text-primary focus:bg-white focus:border-primary/50 outline-none transition-all shadow-sm" placeholder="0" />
                                            </td>
                                            <td className="p-3 border-l border-white/30">
                                                <input type="number" min="0" value={entry.consumedMls || ''} onChange={(e) => handleContrastChange(c.id, 'consumedMls', parseInt(e.target.value) || 0)} className={`w-full min-h-[44px] bg-white/50 border-2 border-transparent rounded-xl px-3 py-2 text-center text-sm font-bold focus:bg-white focus:border-primary/50 outline-none transition-all shadow-sm ${hasDiscrepancy ? 'text-red-600 bg-red-50/50' : 'text-text-primary'}`} placeholder="0" />
                                            </td>
                                            <td className="p-3 border-l border-white/30">
                                                <input type="number" min="0" value={entry.consumedBottles || ''} onChange={(e) => handleContrastChange(c.id, 'consumedBottles', parseInt(e.target.value) || 0)} className={`w-full min-h-[44px] bg-white/50 border-2 border-transparent rounded-xl px-3 py-2 text-center text-sm font-bold focus:bg-white focus:border-primary/50 outline-none transition-all shadow-sm ${hasDiscrepancy ? 'text-red-600 bg-red-50/50' : 'text-text-primary'}`} placeholder="0" />
                                            </td>
                                            <td className="p-3 border-l border-white/30 bg-surface/30">
                                                <div className="grid grid-cols-2 gap-2 mt-1">
                                                    <div className="flex flex-col items-center">
                                                        <span className={`text-lg font-bold ${isLowStock ? 'text-warning-dark' : 'text-primary'}`}>{entry.outstandingMls}</span>
                                                        <span className="text-[10px] font-semibold text-text-muted mt-0.5 uppercase tracking-wider">mls</span>
                                                    </div>
                                                    <div className="flex flex-col items-center">
                                                        <span className={`text - lg font - bold ${isLowStock ? 'text-warning-dark' : 'text-primary'} `}>{entry.outstandingBottles}</span>
                                                        <span className="text-[10px] font-semibold text-text-muted mt-0.5 uppercase tracking-wider">btls</span>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Progress Bars */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 py-8 border-t border-b border-black/5 mt-4">
                        {activeContrastTypes.map((c: any) => {
                            const entry = contrastEntries[c.id] || { receivedMls: 0, consumedMls: 0 };
                            const percent = entry.receivedMls > 0 ? Math.min(100, Math.round((entry.consumedMls / entry.receivedMls) * 100)) : 0;
                            const progressColor = percent >= 90 ? 'bg-red-500' : percent >= 70 ? 'bg-warning' : 'bg-success';

                            return (
                                <div key={`prog - ${c.id} `} className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <span className="text-sm font-bold text-text-primary">{c.name}</span>
                                        <span className={`text - xs font - bold ${percent >= 90 ? 'text-red-600' : percent >= 70 ? 'text-warning-dark' : 'text-success-dark'} `}>{percent}% Used</span>
                                    </div>
                                    <div className="h-2.5 w-full bg-surface-hover rounded-full overflow-hidden shadow-inner">
                                        <div className={`h - full ${progressColor} transition - all duration - 500`} style={{ width: `${percent}% ` }}></div>
                                    </div>
                                    <div className="flex justify-between text-xs font-medium text-text-secondary">
                                        <span>Cons: <span className="text-text-primary font-bold">{entry.consumedMls} ml</span></span>
                                        <span>Recv: <span className="text-text-primary font-bold">{entry.receivedMls} ml</span></span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <PageHeader
                title="Daily Logging"
                description="Record daily activity and shift-based contrast usage."
                actions={
                    <button
                        onClick={() => setIsDowntimeModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-danger/10 hover:bg-danger/20 text-danger text-sm font-bold transition-colors border border-danger/20"
                    >
                        <AlertCircle className="w-4 h-4" />
                        Report Downtime
                    </button>
                }
            />

            {successMessage && (
                <div className="p-4 bg-green-50/80 border border-green-200 text-green-700 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">{successMessage}</span>
                </div>
            )}

            <HandoverBanner currentShift={activeTab === 'activity' ? activityShift : contrastShift} />

            <Tabs
                items={[
                    { label: 'Activity Log', value: 'activity', icon: <Activity className="w-5 h-5" /> },
                    { label: 'Contrast Log', value: 'contrast', icon: <PieChartIcon className="w-5 h-5" /> }
                ]}
                activeValue={activeTab}
                onChange={(value) => setActiveTab(value as any)}
            />

            {activeTab === 'activity' && (
                <div className="animate-in fade-in space-y-8">
                    {/* Header Controls */}
                    <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-8 mt-2">
                        <div className="flex flex-col">
                            <h3 className="text-xs font-semibold text-text-secondary tracking-wider mb-1">Activity Log</h3>
                            <h2 className="text-2xl font-bold text-text-primary">Shift Activity Record</h2>
                            <p className="text-text-secondary font-medium mt-1">
                                {new Date(activityDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                            </p>
                        </div>

                        <div className="flex items-center gap-1 md:gap-2">
                            <button onClick={() => setActivityDateOffset(prev => prev - 7)} className="p-1.5 md:p-2 text-text-secondary hover:text-text-primary hover:bg-surface-hover/50 rounded-full transition-colors">
                                <ChevronLeft className="w-5 h-5 opacity-40" />
                            </button>

                            <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar">
                                {activityVisibleDates.map(d => {
                                    const dateStr = d.toISOString().split('T')[0];
                                    const isSelected = dateStr === activityDate;
                                    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
                                    const dayNum = d.getDate();

                                    return (
                                        <button
                                            key={dateStr}
                                            type="button"
                                            onClick={() => setActivityDate(dateStr)}
                                            className={`flex flex - col items - center justify - center min - w - [3.5rem] py - 2 rounded - 2xl transition - all ${isSelected ? 'bg-primary text-white shadow-md' : 'text-text-secondary hover:bg-surface-hover/60 hover:text-text-primary'} `}
                                        >
                                            <span className={`text - [10px] font - semibold tracking - wider mb - 1 ${isSelected ? 'text-white/80' : 'text-text-secondary/80'} `}>{dayName}</span>
                                            <span className={`text - lg font - bold leading - none ${isSelected ? 'text-white' : 'text-text-primary'} `}>{dayNum}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            <button onClick={() => setActivityDateOffset(prev => prev + 7)} className="p-1.5 md:p-2 text-text-secondary hover:text-text-primary hover:bg-surface-hover/50 rounded-full transition-colors">
                                <ChevronRight className="w-5 h-5 opacity-40" />
                            </button>

                            <div className="ml-1 md:ml-3 pl-3 md:pl-5 border-l-2 border-surface-hover/50 flex items-center h-12">
                                <Calendar className="w-5 h-5 md:w-6 md:h-6 text-text-secondary opacity-60" />
                            </div>
                        </div>
                    </div>

                    {/* Shift Buttons */}
                    <div className="flex gap-4 p-1.5 bg-surface-hover rounded-xl w-fit">
                        {['Morning', 'Afternoon', 'Night'].map((shift) => (
                            <button
                                key={shift}
                                type="button"
                                onClick={() => setActivityShift(shift as any)}
                                className={`px - 6 py - 2.5 rounded - lg text - sm font - semibold transition - all ${activityShift === shift ? 'bg-white text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-white/50'} `}
                            >
                                {shift} {shift === 'Morning' ? '(8am-4pm)' : shift === 'Afternoon' ? '(4pm-12am)' : '(12am-8am)'}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleActivitySubmit} className="grid grid-cols-1 xl:grid-cols-10 gap-8 relative">
                        {/* Form Area */}
                        <div className="xl:col-span-7 space-y-6">

                            <Card className="p-0 overflow-hidden">
                                <div className="p-6 border-b border-border bg-surface/30">
                                    <h3 className="text-xl font-semibold text-text-primary flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-primary" />
                                        Investigations & Revenue
                                    </h3>
                                </div>
                                <div className="p-6 overflow-x-auto">
                                    <table className="w-full text-left border-collapse min-w-[500px]">
                                        <thead>
                                            <tr>
                                                <th className="p-3 border-b text-sm font-semibold text-text-secondary">Modality</th>
                                                <th className="p-3 border-b text-sm font-semibold text-text-secondary">Investigations</th>
                                                <th className="p-3 border-b text-sm font-semibold text-text-secondary">Revenue (₦)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {modalities.map(m => (
                                                <tr key={m.id} className="border-b border-surface-hover last:border-0 hover:bg-surface/50 transition-colors">
                                                    <td className="p-3 font-medium text-text-primary">{m.name}</td>
                                                    <td className="p-3">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={investigations[m.id]?.count || ''}
                                                            onChange={e => handleInvestigationChange(m.id, 'count', parseInt(e.target.value))}
                                                            className="w-full min-h-[44px] px-3 rounded-lg border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                                            placeholder="0"
                                                        />
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-medium">₦</span>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={investigations[m.id]?.revenue || ''}
                                                                onChange={e => handleInvestigationChange(m.id, 'revenue', parseInt(e.target.value))}
                                                                className="w-full min-h-[44px] pl-8 pr-3 rounded-lg border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            <tr className="bg-surface/50">
                                                <td className="p-4 font-bold text-text-primary border-t border-border">Totals</td>
                                                <td className="p-4 font-bold text-primary border-t border-border">{totalActivityInvestigations}</td>
                                                <td className="p-4 font-bold text-success border-t border-border">{formatNaira(totalActivityRevenue)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </Card>

                            <Card className="p-0 overflow-hidden">
                                <div className="p-6 border-b border-border bg-surface/30">
                                    <h3 className="text-lg font-semibold text-text-primary">Film Consumption</h3>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {filmSizes.map(f => (
                                            <div key={f.id} className="space-y-2">
                                                <label className="text-sm font-medium text-text-secondary">{f.name}</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={films[f.name] || ''}
                                                    onChange={e => handleFilmChange(f.name, parseInt(e.target.value))}
                                                    className="w-full min-h-[44px] px-3 rounded-lg border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                                    placeholder="0"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-6 pt-4 border-t border-border flex justify-between items-center text-sm">
                                        <span className="font-medium text-text-secondary">Total Films Used</span>
                                        <span className="font-bold text-lg text-text-primary">{totalActivityFilms}</span>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-0 overflow-hidden">
                                <div className="p-6 border-b border-border bg-surface/30">
                                    <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                                        <AlertCircle className="w-5 h-5 text-warning" />
                                        Shift Challenges & Resolutions
                                    </h3>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-text-secondary">Challenges Encountered</label>
                                        <textarea
                                            value={challenges}
                                            onChange={e => setChallenges(e.target.value)}
                                            rows={2}
                                            className="w-full p-3 rounded-lg border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-y"
                                            placeholder="e.g. Server downtime delayed 2 patients..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-text-secondary">Resolutions / Actions Taken</label>
                                        <textarea
                                            value={resolutions}
                                            onChange={e => setResolutions(e.target.value)}
                                            rows={2}
                                            className="w-full p-3 rounded-lg border border-border focus:border-success focus:ring-1 focus:ring-success outline-none transition-all resize-y"
                                            placeholder="e.g. Switched to backup server, called IT..."
                                        />
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-6">
                                <HandoverComposer
                                    onNotesChange={setPendingNotes}
                                    shift={activityShift}
                                />
                            </Card>

                            <div className="pt-2 flex justify-end gap-3">
                                <Button type="button" variant="secondary" onClick={clearActivityForm} className="w-full md:w-auto">
                                    Clear Form
                                </Button>
                                <Button type="submit" size="lg" icon={Save} className="w-full md:w-auto">
                                    Save Activity Log
                                </Button>
                            </div>
                        </div>

                        {/* Summary Sidebar */}
                        <div className="xl:col-span-3">
                            <div className="bg-white/40 backdrop-blur-3xl p-8 rounded-[2.5rem] shadow-sm border border-white/60 sticky top-6">
                                <h3 className="text-sm font-bold text-text-secondary tracking-widest mb-8">Shift Summary</h3>

                                <div className="relative h-56 w-full mb-10">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={activityPieData.length > 0 ? activityPieData : [{ name: 'Empty', value: 1, fill: '#E5E7EB' }]}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={70}
                                                outerRadius={90}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {activityPieData.length > 0
                                                    ? activityPieData.map((entry, index) => <Cell key={`cell - ${index} `} fill={entry.fill} />)
                                                    : <Cell fill="#E5E7EB" fillOpacity={0.5} />
                                                }
                                            </Pie>
                                            {activityPieData.length > 0 && <RechartsTooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '8px 12px' }} />}
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center -mt-2">
                                        <span className="text-[2.5rem] font-bold text-text-primary tracking-tighter leading-none">{totalActivityInvestigations}</span>
                                        <span className="text-[10px] font-semibold text-text-muted mt-1 tracking-wider uppercase">Total Scans</span>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-8">
                                    {activityPieData.map((d, i) => (
                                        <div key={i} className="flex justify-between items-center text-sm font-bold">
                                            <div className="flex items-center gap-3">
                                                <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: d.fill }}></div>
                                                <span className="text-text-primary">{d.name}</span>
                                            </div>
                                            <span className="text-text-primary">{d.value}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t border-surface-hover/50 pt-6 pb-6 space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-text-secondary font-medium tracking-wide">Total Revenue</span>
                                        <span className="font-bold text-success tracking-wide">{formatNaira(totalActivityRevenue)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-text-secondary font-medium tracking-wide">Films Consumed</span>
                                        <span className="font-bold text-text-primary tracking-wide">{totalActivityFilms}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {activeTab === 'contrast' && (
                <div className="animate-in fade-in space-y-8">
                    {/* Header Controls */}
                    <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-8 mt-2">
                        <div className="flex flex-col">
                            <h3 className="text-xs font-semibold text-text-secondary tracking-wider mb-1">{centreSettings?.name || 'Radiology Centre'}</h3>
                            <h2 className="text-2xl font-bold text-text-primary">Daily Contrast Consumption</h2>
                            <p className="text-text-secondary font-medium mt-1">
                                {new Date(contrastDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                            </p>
                        </div>

                        {/* Custom Date Navigation Carousel */}
                        <div className="flex items-center gap-1 md:gap-2">
                            <button onClick={() => setContrastDateOffset(prev => prev - 7)} className="p-1.5 md:p-2 text-text-secondary hover:text-text-primary hover:bg-surface-hover/50 rounded-full transition-colors">
                                <ChevronLeft className="w-5 h-5 opacity-40" />
                            </button>

                            <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar">
                                {contrastVisibleDates.map(d => {
                                    const dateStr = d.toISOString().split('T')[0];
                                    const isSelected = dateStr === contrastDate;
                                    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
                                    const dayNum = d.getDate();

                                    return (
                                        <button
                                            key={dateStr}
                                            onClick={() => setContrastDate(dateStr)}
                                            className={`flex flex-col items-center justify-center min-w-[3.5rem] py-2 rounded-2xl transition-all ${isSelected ? 'bg-primary text-white shadow-md' : 'text-text-secondary hover:bg-surface-hover/60 hover:text-text-primary'}`}
                                        >
                                            <span className={`text-[10px] font-semibold tracking-wider mb-1 ${isSelected ? 'text-white/80' : 'text-text-secondary/80'}`}>{dayName}</span>
                                            <span className={`text-lg font-bold leading-none ${isSelected ? 'text-white' : 'text-text-primary'}`}>{dayNum}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            <button onClick={() => setContrastDateOffset(prev => prev + 7)} className="p-1.5 md:p-2 text-text-secondary hover:text-text-primary hover:bg-surface-hover/50 rounded-full transition-colors">
                                <ChevronRight className="w-5 h-5 opacity-40" />
                            </button>

                            <div className="ml-1 md:ml-3 pl-3 md:pl-5 border-l-2 border-surface-hover/50 flex items-center h-12">
                                <Calendar className="w-5 h-5 md:w-6 md:h-6 text-text-secondary opacity-60" />
                            </div>
                        </div>
                    </div>

                    {/* Shift Buttons */}
                    <div className="flex gap-4 p-1.5 bg-surface-hover rounded-xl w-fit">
                        {['Morning', 'Afternoon', 'Night'].map((shift) => (
                            <button
                                key={shift}
                                type="button"
                                onClick={() => setContrastShift(shift as any)}
                                className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${contrastShift === shift ? 'bg-white text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-white/50'}`}
                            >
                                {shift} {shift === 'Morning' ? '(8am-4pm)' : shift === 'Afternoon' ? '(4pm-12am)' : '(12am-8am)'}
                            </button>
                        ))}
                    </div>

                    {/* Top Stat Cards matching screenshot directly */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10 mt-6">
                        <StatCard accentColor="primary" label="Total Received" value={totalDayReceived} unit="mls" />
                        <StatCard accentColor="success" label="Total Consumed" value={totalDayConsumed} unit="mls" />
                        <StatCard accentColor={hasLowStockAlert ? 'warning' : 'success'} label="Remaining Stock" value={totalRemaining} unit="mls" />
                        <StatCard accentColor="indigo" label="Contrast Types" value={activeContrastTypes.length} unit="tracked" />
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-10 gap-8">
                        {/* Static Cards List */}
                        <div className="xl:col-span-7 space-y-6">
                            {renderContrastGrid()}

                            <div className="pt-2 flex justify-end gap-3">
                                <Button type="button" variant="secondary" onClick={clearContrastForm} className="w-full md:w-auto">
                                    Clear Form
                                </Button>
                                <Button onClick={handleContrastSubmit} size="lg" icon={Save} className="w-full md:w-auto">
                                    Save Shift Record
                                </Button>
                            </div>
                        </div>

                        {/* Daily Summary Sidebar (matching screenshot) */}
                        <div className="xl:col-span-3">
                            <div className="bg-white/40 backdrop-blur-3xl p-8 rounded-[2.5rem] shadow-sm border border-white/60 sticky top-6">
                                <h3 className="text-sm font-bold text-text-secondary tracking-widest mb-8">Daily Summary</h3>

                                <div className="space-y-4 mb-8">
                                    {activeContrastTypes.map((c: any, i: number) => {
                                        const typeTotal = contrastEntries[c.id]?.consumedMls || 0;
                                        const colors = ['#0D9488', '#10B981', '#F59E0B', '#6366F1', '#111827'];

                                        return (
                                            <div key={`leg-${c.id}`} className="flex justify-between items-center text-sm font-bold">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: colors[i % colors.length] }}></div>
                                                    <span className="text-text-primary">{c.name}</span>
                                                </div>
                                                <span className="text-text-primary">{typeTotal}</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="border-t border-surface-hover/50 pt-6 pb-6 space-y-3">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-text-secondary font-medium tracking-wide">Total Stock</span>
                                        <span className="font-semibold text-text-primary tracking-wide">{totalDayReceived} mls</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-text-secondary font-medium tracking-wide">Remaining</span>
                                        <span className="font-semibold text-text-primary tracking-wide">{totalRemaining} mls</span>
                                    </div>
                                </div>

                                <div className="border-t border-surface-hover/50 pt-6">
                                    <h4 className="text-xs font-semibold text-text-secondary mb-5 tracking-wide">By Shift (Recorded logs today)</h4>
                                    <div className="space-y-4">
                                        {['Morning', 'Afternoon', 'Night'].map((s: string) => {
                                            const shiftLog = activeShiftLogs.find(l => l.shift === s);
                                            const shiftConsumed = shiftLog
                                                ? Object.values(shiftLog.entries).reduce((sum: number, item: any) => sum + (item.consumedMls || 0), 0)
                                                : 0;

                                            // Compute % width relative to total day 
                                            const wPercent = totalDayConsumed > 0 ? (shiftConsumed / totalDayConsumed) * 100 : 0;
                                            const colors = { 'Morning': '#31A5F5', 'Afternoon': '#49CBA4', 'Night': '#0F172A' };

                                            return (
                                                <div key={s} className="flex justify-between items-center text-xs">
                                                    <span className="text-text-secondary font-medium tracking-wide">{s}</span>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-1 bg-surface-hover rounded-full overflow-hidden">
                                                            <div className="h-full" style={{ width: `${wPercent}%`, backgroundColor: colors[s as keyof typeof colors] }}></div>
                                                        </div>
                                                        <span className="font-semibold text-text-primary w-6 text-right tracking-wide">
                                                            {Number(shiftConsumed)}
                                                        </span>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <DowntimeModal
                isOpen={isDowntimeModalOpen}
                onClose={() => setIsDowntimeModalOpen(false)}
            />
        </div>
    );
};
