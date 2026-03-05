import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { PageHeader, Tabs, Card, Button, StatCard } from '@/components/ui';
import { formatNaira } from '@/lib/utils';
import {
    Activity, CheckCircle, Save, PieChart as PieChartIcon,
    ChevronLeft, ChevronRight, Calendar, AlertCircle, Sun, Sunset, Moon,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { HandoverBanner } from '../components/HandoverBanner';
import { HandoverComposer } from '../components/HandoverComposer';
import { DowntimeModal } from '../components/DowntimeModal';
import type { PendingNote } from '../components/HandoverComposer';

// ── Types ─────────────────────────────────────────────────────────────────────

type ShiftName = 'Morning' | 'Afternoon' | 'Night';

interface ContrastEntry {
    receivedMls: number;
    receivedBottles: number;
    consumedMls: number;
    consumedBottles: number;
    outstandingMls: number;
    outstandingBottles: number;
}

interface ContrastType {
    id: string;
    name: string;
    defaultVolumeMls?: number;
    minStockAlert?: number;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const SHIFTS: ShiftName[] = ['Morning', 'Afternoon', 'Night'];

const SHIFT_TIMES: Record<ShiftName, string> = {
    Morning: '8am – 4pm',
    Afternoon: '4pm – 12am',
    Night: '12am – 8am',
};

const SHIFT_STYLES: Record<ShiftName, { header: string; icon: string; accent: string }> = {
    Morning: { header: 'bg-amber-50 border-amber-100', icon: 'text-amber-500', accent: 'text-amber-700' },
    Afternoon: { header: 'bg-teal-50 border-teal-100', icon: 'text-teal-500', accent: 'text-teal-700' },
    Night: { header: 'bg-slate-100 border-slate-200', icon: 'text-slate-500', accent: 'text-slate-700' },
};

const CHART_COLORS = ['#0D9488', '#10B981', '#F59E0B', '#6366F1', '#111827'];

const defaultEntry = (): ContrastEntry => ({
    receivedMls: 0, receivedBottles: 0,
    consumedMls: 0, consumedBottles: 0,
    outstandingMls: 0, outstandingBottles: 0,
});

// ── Main Component ─────────────────────────────────────────────────────────────

export const DailyLogging: React.FC = () => {
    const {
        modalities, filmSizes, saveShiftActivityLog, shiftActivityLogs,
        centreSettings, saveShiftContrastLog, shiftContrastLogs, addHandoverNote,
    } = useAppContext();
    const { user } = useAuth();

    const [activeTab, setActiveTab] = useState<'activity' | 'contrast'>('activity');
    const [successMessage, setSuccessMessage] = useState('');
    const [pendingNotes, setPendingNotes] = useState<PendingNote[]>([]);
    const [isDowntimeModalOpen, setIsDowntimeModalOpen] = useState(false);

    const showSuccess = (msg: string) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    // ── Activity state ────────────────────────────────────────────────────────

    const [activityDate, setActivityDate] = useState(new Date().toISOString().split('T')[0]);
    const [activityDateOffset, setActivityDateOffset] = useState(0);
    const [activityShift, setActivityShift] = useState<ShiftName>('Morning');
    const [investigations, setInvestigations] = useState<Record<string, { count: number; revenue: number }>>({});
    const [films, setFilms] = useState<Record<string, number>>({});
    const [challenges, setChallenges] = useState('');
    const [resolutions, setResolutions] = useState('');

    const activityVisibleDates = useMemo(() => {
        const today = new Date();
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(today);
            d.setDate(today.getDate() + activityDateOffset - (6 - i));
            return d;
        });
    }, [activityDateOffset]);

    useEffect(() => {
        const log = shiftActivityLogs.find(l => l.date === activityDate && l.shift === activityShift);
        if (log) {
            setInvestigations(log.investigations || {});
            setFilms(log.films || {});
            setChallenges(log.challenges || '');
            setResolutions(log.resolutions || '');
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
                count: prev[modalityId]?.count || 0,
                revenue: prev[modalityId]?.revenue || 0,
                [field]: isNaN(value) ? 0 : value,
            },
        }));
    };

    const handleFilmChange = (sizeId: string, value: number) => {
        setFilms(prev => ({ ...prev, [sizeId]: isNaN(value) ? 0 : value }));
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
            resolutions,
        });
        if (pendingNotes.length > 0) {
            const nextShift = activityShift === 'Morning' ? 'Afternoon' : activityShift === 'Afternoon' ? 'Night' : 'Morning';
            await Promise.all(
                pendingNotes.map(note =>
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
                )
            );
            setPendingNotes([]);
        }
        showSuccess('Activity log saved successfully!');
    };

    const totalActivityInvestigations = useMemo(
        () => Object.values(investigations).reduce((s, i) => s + (i.count || 0), 0),
        [investigations]
    );
    const totalActivityRevenue = useMemo(
        () => Object.values(investigations).reduce((s, i) => s + (i.revenue || 0), 0),
        [investigations]
    );
    const totalActivityFilms = useMemo(
        () => Object.values(films).reduce((s, v) => s + (v || 0), 0),
        [films]
    );
    const activityPieData = useMemo(() =>
        modalities
            .map((m, i) => ({ name: m.name, value: investigations[m.id]?.count || 0, fill: CHART_COLORS[i % CHART_COLORS.length] }))
            .filter(d => d.value > 0),
        [investigations, modalities]
    );

    // ── Contrast state ────────────────────────────────────────────────────────

    const [contrastDate, setContrastDate] = useState(new Date().toISOString().split('T')[0]);
    const [contrastDateOffset, setContrastDateOffset] = useState(0);

    const contrastVisibleDates = useMemo(() => {
        const today = new Date();
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(today);
            d.setDate(today.getDate() + contrastDateOffset - (6 - i));
            return d;
        });
    }, [contrastDateOffset]);

    const activeContrastTypes = useMemo<ContrastType[]>(() => {
        const raw = centreSettings?.contrast_types;
        if (!raw) return [];
        if (Array.isArray(raw)) return raw;
        return Object.values(raw) as ContrastType[];
    }, [centreSettings]);

    const minThresholds: { min_ml: number; min_bottles: number } =
        centreSettings?.contrast_alerts ?? { min_ml: 100, min_bottles: 2 };

    const [allShiftEntries, setAllShiftEntries] = useState<Record<ShiftName, Record<string, ContrastEntry>>>({
        Morning: {}, Afternoon: {}, Night: {},
    });

    useEffect(() => {
        const fresh: Record<ShiftName, Record<string, ContrastEntry>> = { Morning: {}, Afternoon: {}, Night: {} };
        for (const shift of SHIFTS) {
            const log = shiftContrastLogs.find(l => l.date === contrastDate && l.shift === shift);
            fresh[shift] = log?.entries
                ? (log.entries as Record<string, ContrastEntry>)
                : Object.fromEntries(activeContrastTypes.map(c => [c.id, defaultEntry()]));
        }
        setAllShiftEntries(fresh);
    }, [contrastDate, shiftContrastLogs, activeContrastTypes]);

    const handleContrastChange = useCallback((
        shift: ShiftName,
        typeId: string,
        field: 'receivedMls' | 'receivedBottles' | 'consumedMls' | 'consumedBottles',
        value: number,
    ) => {
        setAllShiftEntries(prev => {
            const curr = prev[shift][typeId] || defaultEntry();
            const updated = { ...curr, [field]: isNaN(value) ? 0 : value };
            updated.outstandingMls = updated.receivedMls - updated.consumedMls;
            updated.outstandingBottles = updated.receivedBottles - updated.consumedBottles;
            return { ...prev, [shift]: { ...prev[shift], [typeId]: updated } };
        });
    }, []);

    const handleSaveShift = async (shift: ShiftName) => {
        await saveShiftContrastLog({
            id: `cont-${shift.toLowerCase()}-${Date.now()}`,
            date: contrastDate,
            shift,
            logged_by: user?.id || 'unknown',
            logged_by_name: user?.name || 'Unknown User',
            entries: allShiftEntries[shift],
        });
        showSuccess(`${shift} shift contrast saved!`);
    };

    const dailyTotals = useMemo(() => {
        let received = 0, consumed = 0, outstanding = 0;
        for (const shift of SHIFTS) {
            for (const e of Object.values(allShiftEntries[shift])) {
                received += e.receivedMls || 0;
                consumed += e.consumedMls || 0;
                outstanding += e.outstandingMls || 0;
            }
        }
        return { received, consumed, outstanding };
    }, [allShiftEntries]);

    const hasAnyLowStock = useMemo(() =>
        SHIFTS.some(shift =>
            Object.values(allShiftEntries[shift]).some(
                e => e.outstandingMls < minThresholds.min_ml || e.outstandingBottles < minThresholds.min_bottles
            )
        ),
        [allShiftEntries, minThresholds]
    );

    // ── Render ────────────────────────────────────────────────────────────────

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

            <HandoverBanner currentShift={activeTab === 'activity' ? activityShift : 'Morning'} />

            <Tabs
                items={[
                    { label: 'Activity Log', value: 'activity', icon: <Activity className="w-5 h-5" /> },
                    { label: 'Contrast Log', value: 'contrast', icon: <PieChartIcon className="w-5 h-5" /> },
                ]}
                activeValue={activeTab}
                onChange={v => setActiveTab(v as 'activity' | 'contrast')}
            />

            {/* ── ACTIVITY TAB ─────────────────────────────────────────────── */}
            {activeTab === 'activity' && (
                <div className="animate-in fade-in space-y-8">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mt-2">
                        <div>
                            <h3 className="text-xs font-semibold text-text-secondary tracking-wider mb-1">Activity Log</h3>
                            <h2 className="text-2xl font-bold text-text-primary">Shift Activity Record</h2>
                            <p className="text-text-secondary font-medium mt-1">
                                {new Date(activityDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                            </p>
                        </div>
                        <DateCarousel
                            visibleDates={activityVisibleDates}
                            selectedDate={activityDate}
                            onSelect={setActivityDate}
                            onPrev={() => setActivityDateOffset(p => p - 7)}
                            onNext={() => setActivityDateOffset(p => p + 7)}
                        />
                    </div>

                    <ShiftSelector value={activityShift} onChange={setActivityShift} />

                    <form onSubmit={handleActivitySubmit} className="grid grid-cols-1 xl:grid-cols-10 gap-8">
                        <div className="xl:col-span-7 space-y-6">
                            {/* Investigations */}
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
                                                            type="number" min="0"
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
                                                                type="number" min="0"
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

                            {/* Films */}
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
                                                    type="number" min="0"
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

                            {/* Challenges */}
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
                                <HandoverComposer onNotesChange={setPendingNotes} shift={activityShift} />
                            </Card>

                            <div className="pt-2 flex justify-end gap-3">
                                <Button
                                    type="button" variant="secondary"
                                    onClick={() => { setInvestigations({}); setFilms({}); setChallenges(''); setResolutions(''); }}
                                    className="w-full md:w-auto"
                                >
                                    Clear Form
                                </Button>
                                <Button type="submit" size="lg" icon={Save} className="w-full md:w-auto">
                                    Save Activity Log
                                </Button>
                            </div>
                        </div>

                        {/* Activity sidebar */}
                        <div className="xl:col-span-3">
                            <div className="bg-white/40 backdrop-blur-3xl p-8 rounded-[2.5rem] shadow-sm border border-white/60 sticky top-6">
                                <h3 className="text-sm font-bold text-text-secondary tracking-widest mb-8">Shift Summary</h3>
                                <div className="relative h-56 w-full mb-10">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={activityPieData.length > 0 ? activityPieData : [{ name: 'Empty', value: 1, fill: '#E5E7EB' }]}
                                                cx="50%" cy="50%"
                                                innerRadius={70} outerRadius={90}
                                                dataKey="value" stroke="none"
                                            >
                                                {activityPieData.length > 0
                                                    ? activityPieData.map((d, i) => <Cell key={i} fill={d.fill} />)
                                                    : <Cell fill="#E5E7EB" fillOpacity={0.5} />
                                                }
                                            </Pie>
                                            {activityPieData.length > 0 && (
                                                <RechartsTooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '8px 12px' }} />
                                            )}
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-[2.5rem] font-bold text-text-primary tracking-tighter leading-none">{totalActivityInvestigations}</span>
                                        <span className="text-[10px] font-semibold text-text-muted mt-1 tracking-wider uppercase">Total Scans</span>
                                    </div>
                                </div>
                                <div className="space-y-4 mb-8">
                                    {activityPieData.map((d, i) => (
                                        <div key={i} className="flex justify-between items-center text-sm font-bold">
                                            <div className="flex items-center gap-3">
                                                <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: d.fill }} />
                                                <span className="text-text-primary">{d.name}</span>
                                            </div>
                                            <span className="text-text-primary">{d.value}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="border-t border-surface-hover/50 pt-6 space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-text-secondary font-medium">Total Revenue</span>
                                        <span className="font-bold text-success">{formatNaira(totalActivityRevenue)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-text-secondary font-medium">Films Consumed</span>
                                        <span className="font-bold text-text-primary">{totalActivityFilms}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* ── CONTRAST TAB ─────────────────────────────────────────────── */}
            {activeTab === 'contrast' && (
                <div className="animate-in fade-in space-y-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mt-2">
                        <div>
                            <h3 className="text-xs font-semibold text-text-secondary tracking-wider mb-1">
                                {centreSettings?.name || 'Radiology Centre'}
                            </h3>
                            <h2 className="text-2xl font-bold text-text-primary">Daily Contrast Consumption</h2>
                            <p className="text-text-secondary font-medium mt-1">
                                {new Date(contrastDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                            </p>
                        </div>
                        <DateCarousel
                            visibleDates={contrastVisibleDates}
                            selectedDate={contrastDate}
                            onSelect={setContrastDate}
                            onPrev={() => setContrastDateOffset(p => p - 7)}
                            onNext={() => setContrastDateOffset(p => p + 7)}
                        />
                    </div>

                    {/* Day-level stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard accentColor="primary" label="Total Received" value={dailyTotals.received} unit="mls" />
                        <StatCard accentColor="success" label="Total Consumed" value={dailyTotals.consumed} unit="mls" />
                        <StatCard accentColor={hasAnyLowStock ? 'warning' : 'success'} label="Remaining Stock" value={dailyTotals.outstanding} unit="mls" />
                        <StatCard accentColor="indigo" label="Contrast Types" value={activeContrastTypes.length} unit="tracked" />
                    </div>

                    {hasAnyLowStock && (
                        <div className="p-4 bg-warning/10 border border-warning/30 rounded-2xl flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-warning-dark">Low Stock Alert</p>
                                <p className="text-xs font-medium text-warning-dark/80 mt-0.5">
                                    One or more contrast types are below the minimum threshold. Please reorder.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 xl:grid-cols-10 gap-8">
                        {/* Shift panels */}
                        <div className="xl:col-span-7 space-y-6">
                            {SHIFTS.map(shift => (
                                <ShiftContrastPanel
                                    key={shift}
                                    shift={shift}
                                    contrastTypes={activeContrastTypes}
                                    entries={allShiftEntries[shift]}
                                    minThresholds={minThresholds}
                                    onChange={(typeId, field, value) => handleContrastChange(shift, typeId, field, value)}
                                    onSave={() => handleSaveShift(shift)}
                                />
                            ))}
                        </div>

                        {/* Daily summary sidebar */}
                        <div className="xl:col-span-3">
                            <div className="bg-white/40 backdrop-blur-3xl p-8 rounded-[2.5rem] shadow-sm border border-white/60 sticky top-6">
                                <h3 className="text-sm font-bold text-text-secondary tracking-widest mb-6">Daily Summary</h3>

                                <div className="space-y-4 mb-6">
                                    {activeContrastTypes.map((c, i) => {
                                        const typeConsumed = SHIFTS.reduce(
                                            (sum, s) => sum + (allShiftEntries[s][c.id]?.consumedMls || 0), 0
                                        );
                                        return (
                                            <div key={c.id} className="flex justify-between items-center text-sm font-bold">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                                                    <span className="text-text-primary">{c.name}</span>
                                                </div>
                                                <span className="text-text-primary">{typeConsumed} mL</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="border-t border-surface-hover/50 pt-5 pb-5 space-y-2.5">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-text-secondary font-medium">Total Received</span>
                                        <span className="font-semibold text-text-primary">{dailyTotals.received} mL</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-text-secondary font-medium">Total Consumed</span>
                                        <span className="font-semibold text-text-primary">{dailyTotals.consumed} mL</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-text-secondary font-medium">Remaining</span>
                                        <span className={`font-semibold ${hasAnyLowStock ? 'text-warning-dark' : 'text-success-dark'}`}>
                                            {dailyTotals.outstanding} mL
                                        </span>
                                    </div>
                                </div>

                                <div className="border-t border-surface-hover/50 pt-5">
                                    <h4 className="text-xs font-semibold text-text-secondary mb-4 tracking-wide">By Shift</h4>
                                    <div className="space-y-3">
                                        {SHIFTS.map(s => {
                                            const shiftConsumed = Object.values(allShiftEntries[s])
                                                .reduce((sum, e) => sum + (e.consumedMls || 0), 0);
                                            const wPct = dailyTotals.consumed > 0
                                                ? (shiftConsumed / dailyTotals.consumed) * 100 : 0;
                                            const barColor = s === 'Morning' ? '#F59E0B' : s === 'Afternoon' ? '#0D9488' : '#475569';
                                            return (
                                                <div key={s} className="flex items-center gap-3 text-xs">
                                                    <span className="text-text-secondary font-medium w-20 shrink-0">{s}</span>
                                                    <div className="flex-1 h-1.5 bg-surface-hover rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full transition-all duration-500"
                                                            style={{ width: `${wPct}%`, backgroundColor: barColor }}
                                                        />
                                                    </div>
                                                    <span className="font-semibold text-text-primary w-14 text-right">
                                                        {shiftConsumed} mL
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <DowntimeModal isOpen={isDowntimeModalOpen} onClose={() => setIsDowntimeModalOpen(false)} />
        </div>
    );
};

// ── Sub-components ─────────────────────────────────────────────────────────────

interface DateCarouselProps {
    visibleDates: Date[];
    selectedDate: string;
    onSelect: (date: string) => void;
    onPrev: () => void;
    onNext: () => void;
}

const DateCarousel: React.FC<DateCarouselProps> = ({ visibleDates, selectedDate, onSelect, onPrev, onNext }) => (
    <div className="flex items-center gap-1 md:gap-2">
        <button onClick={onPrev} className="p-1.5 md:p-2 text-text-secondary hover:text-text-primary hover:bg-surface-hover/50 rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5 opacity-50" />
        </button>
        <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar">
            {visibleDates.map(d => {
                const dateStr = d.toISOString().split('T')[0];
                const isSelected = dateStr === selectedDate;
                return (
                    <button
                        key={dateStr}
                        type="button"
                        onClick={() => onSelect(dateStr)}
                        className={`flex flex-col items-center justify-center min-w-[3.5rem] py-2 rounded-2xl transition-all ${isSelected ? 'bg-primary text-white shadow-md' : 'text-text-secondary hover:bg-surface-hover/60 hover:text-text-primary'}`}
                    >
                        <span className={`text-[10px] font-semibold tracking-wider mb-1 ${isSelected ? 'text-white/80' : 'text-text-secondary/80'}`}>
                            {d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                        </span>
                        <span className={`text-lg font-bold leading-none ${isSelected ? 'text-white' : 'text-text-primary'}`}>
                            {d.getDate()}
                        </span>
                    </button>
                );
            })}
        </div>
        <button onClick={onNext} className="p-1.5 md:p-2 text-text-secondary hover:text-text-primary hover:bg-surface-hover/50 rounded-full transition-colors">
            <ChevronRight className="w-5 h-5 opacity-50" />
        </button>
        <div className="ml-1 md:ml-3 pl-3 md:pl-5 border-l-2 border-surface-hover/50 flex items-center h-12">
            <Calendar className="w-5 h-5 md:w-6 md:h-6 text-text-secondary opacity-60" />
        </div>
    </div>
);

interface ShiftSelectorProps {
    value: ShiftName;
    onChange: (shift: ShiftName) => void;
}

const ShiftSelector: React.FC<ShiftSelectorProps> = ({ value, onChange }) => (
    <div className="flex gap-2 p-1.5 bg-surface-hover rounded-xl w-fit">
        {SHIFTS.map(shift => (
            <button
                key={shift}
                type="button"
                onClick={() => onChange(shift)}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${value === shift ? 'bg-white text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-white/50'}`}
            >
                {shift} <span className="hidden sm:inline text-xs font-normal opacity-70">({SHIFT_TIMES[shift]})</span>
            </button>
        ))}
    </div>
);

// ── Shift Contrast Panel ───────────────────────────────────────────────────────

interface ShiftContrastPanelProps {
    shift: ShiftName;
    contrastTypes: ContrastType[];
    entries: Record<string, ContrastEntry>;
    minThresholds: { min_ml: number; min_bottles: number };
    onChange: (typeId: string, field: 'receivedMls' | 'receivedBottles' | 'consumedMls' | 'consumedBottles', value: number) => void;
    onSave: () => void;
}

const ShiftIcon: React.FC<{ shift: ShiftName; className?: string }> = ({ shift, className }) => {
    if (shift === 'Morning') return <Sun className={className} />;
    if (shift === 'Afternoon') return <Sunset className={className} />;
    return <Moon className={className} />;
};

const ShiftContrastPanel: React.FC<ShiftContrastPanelProps> = ({
    shift, contrastTypes, entries, minThresholds, onChange, onSave,
}) => {
    const styles = SHIFT_STYLES[shift];

    const hasLowStock = Object.values(entries).some(
        e => e.outstandingMls < minThresholds.min_ml || e.outstandingBottles < minThresholds.min_bottles
    );

    return (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            {/* Panel header */}
            <div className={`flex items-center justify-between px-5 py-4 ${styles.header} border-b border-border`}>
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/70 shadow-sm flex items-center justify-center">
                        <ShiftIcon shift={shift} className={`w-5 h-5 ${styles.icon}`} />
                    </div>
                    <div>
                        <h4 className={`font-bold text-base leading-tight ${styles.accent}`}>{shift} Shift</h4>
                        <span className="text-xs font-medium text-text-muted">{SHIFT_TIMES[shift]}</span>
                    </div>
                </div>
                {hasLowStock && (
                    <span className="flex items-center gap-1.5 text-warning text-xs font-semibold px-2.5 py-1 bg-warning/10 rounded-full">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Low Stock
                    </span>
                )}
            </div>

            {/* Table */}
            <div className="p-5">
                {contrastTypes.length === 0 ? (
                    <p className="text-sm text-text-muted text-center py-10">
                        No contrast types configured. Add them in <strong>Settings → Contrast Types</strong>.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[680px] border-collapse text-sm">
                            <thead>
                                <tr>
                                    <th className="p-3 text-left font-semibold text-text-secondary bg-surface/60 rounded-tl-lg">Contrast Type</th>
                                    <th className="p-3 text-center font-semibold text-text-secondary bg-surface/60 border-l border-border/50">Received (mL)</th>
                                    <th className="p-3 text-center font-semibold text-text-secondary bg-surface/60 border-l border-border/50">Received (Btls)</th>
                                    <th className="p-3 text-center font-semibold text-text-secondary bg-surface/60 border-l border-border/50">Consumed (mL)</th>
                                    <th className="p-3 text-center font-semibold text-text-secondary bg-surface/60 border-l border-border/50">Consumed (Btls)</th>
                                    <th className="p-3 text-center font-semibold text-text-secondary bg-surface/60 border-l border-border/50 rounded-tr-lg">Outstanding</th>
                                </tr>
                            </thead>
                            <tbody>
                                {contrastTypes.map(c => {
                                    const entry = entries[c.id] || defaultEntry();
                                    const hasDiscrepancy = entry.consumedMls > entry.receivedMls || entry.consumedBottles > entry.receivedBottles;
                                    const isLow = entry.outstandingMls < minThresholds.min_ml || entry.outstandingBottles < minThresholds.min_bottles;

                                    return (
                                        <tr key={c.id} className="border-t border-border/50 hover:bg-surface/40 transition-colors">
                                            <td className="p-3 font-semibold text-text-primary">{c.name}</td>
                                            <td className="p-2 border-l border-border/40">
                                                <input
                                                    type="number" min="0"
                                                    value={entry.receivedMls || ''}
                                                    onChange={e => onChange(c.id, 'receivedMls', parseInt(e.target.value) || 0)}
                                                    className="w-full min-h-[40px] bg-white border border-border rounded-lg px-3 py-2 text-center font-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                                    placeholder="0"
                                                />
                                            </td>
                                            <td className="p-2 border-l border-border/40">
                                                <input
                                                    type="number" min="0"
                                                    value={entry.receivedBottles || ''}
                                                    onChange={e => onChange(c.id, 'receivedBottles', parseInt(e.target.value) || 0)}
                                                    className="w-full min-h-[40px] bg-white border border-border rounded-lg px-3 py-2 text-center font-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                                    placeholder="0"
                                                />
                                            </td>
                                            <td className="p-2 border-l border-border/40">
                                                <input
                                                    type="number" min="0"
                                                    value={entry.consumedMls || ''}
                                                    onChange={e => onChange(c.id, 'consumedMls', parseInt(e.target.value) || 0)}
                                                    className={`w-full min-h-[40px] border rounded-lg px-3 py-2 text-center font-medium focus:ring-1 outline-none transition-all ${hasDiscrepancy ? 'border-red-300 bg-red-50 text-red-700 focus:border-red-400 focus:ring-red-200' : 'bg-white border-border focus:border-primary focus:ring-primary'}`}
                                                    placeholder="0"
                                                />
                                            </td>
                                            <td className="p-2 border-l border-border/40">
                                                <input
                                                    type="number" min="0"
                                                    value={entry.consumedBottles || ''}
                                                    onChange={e => onChange(c.id, 'consumedBottles', parseInt(e.target.value) || 0)}
                                                    className={`w-full min-h-[40px] border rounded-lg px-3 py-2 text-center font-medium focus:ring-1 outline-none transition-all ${hasDiscrepancy ? 'border-red-300 bg-red-50 text-red-700 focus:border-red-400 focus:ring-red-200' : 'bg-white border-border focus:border-primary focus:ring-primary'}`}
                                                    placeholder="0"
                                                />
                                            </td>
                                            <td className="p-3 border-l border-border/40 bg-surface/40">
                                                <div className="flex justify-center gap-5">
                                                    <div className="text-center">
                                                        <div className={`text-lg font-bold ${isLow ? 'text-warning-dark' : 'text-primary'}`}>
                                                            {entry.outstandingMls}
                                                        </div>
                                                        <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">mL</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className={`text-lg font-bold ${isLow ? 'text-warning-dark' : 'text-primary'}`}>
                                                            {entry.outstandingBottles}
                                                        </div>
                                                        <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Btls</div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Progress bars */}
                {contrastTypes.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-6 pt-5 border-t border-border">
                        {contrastTypes.map(c => {
                            const entry = entries[c.id] || defaultEntry();
                            const pct = entry.receivedMls > 0
                                ? Math.min(100, Math.round((entry.consumedMls / entry.receivedMls) * 100)) : 0;
                            const barCls = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-warning' : 'bg-success';
                            const textCls = pct >= 90 ? 'text-red-600' : pct >= 70 ? 'text-warning-dark' : 'text-success-dark';
                            return (
                                <div key={c.id} className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs font-bold text-text-primary truncate mr-2">{c.name}</span>
                                        <span className={`text-xs font-bold shrink-0 ${textCls}`}>{pct}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-surface-hover rounded-full overflow-hidden">
                                        <div className={`h-full ${barCls} transition-all duration-500`} style={{ width: `${pct}%` }} />
                                    </div>
                                    <div className="flex justify-between text-xs text-text-secondary">
                                        <span>Used: <strong className="text-text-primary">{entry.consumedMls} mL</strong></span>
                                        <span>Rcvd: <strong className="text-text-primary">{entry.receivedMls} mL</strong></span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Save footer */}
            <div className="px-5 pb-5 flex justify-end border-t border-border pt-4">
                <Button onClick={onSave} icon={Save}>
                    Save {shift} Shift
                </Button>
            </div>
        </div>
    );
};
