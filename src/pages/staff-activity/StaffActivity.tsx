import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { PageHeader, Button, StatCard } from '@/components/ui';
import { Save, Plus, Minus, ChevronDown, ChevronRight, X, AlertTriangle, TrendingUp, Download, UserX, Activity } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

const RadiographerActivityForm: React.FC = () => {
    const { modalities, centreSettings, addStaffLog, staffLogs } = useAppContext();
    const { user } = useAuth();

    // State: Section 1 - Procedures
    const [procedures, setProcedures] = useState<Record<string, number>>({});

    // State: Section 2 - Repeats
    const [repeats, setRepeats] = useState<Record<string, number>>({});
    const [repeatReasons, setRepeatReasons] = useState<Record<string, string>>({});

    // State: Section 3 - Contrast
    const activeContrastTypes = centreSettings?.contrast_types || [];
    const [selectedContrastType, setSelectedContrastType] = useState(activeContrastTypes[0]?.id || '');
    const [contrastVolume, setContrastVolume] = useState<number | ''>('');
    const [contrastEntries, setContrastEntries] = useState<{ id: string, typeId: string, name: string, volume: number }[]>([]);

    // State: Section 4 - Films
    const [filmsPrinted, setFilmsPrinted] = useState<number>(0);

    // State: Section 5 - Notes
    const [issues, setIssues] = useState('');
    const [notesExpanded, setNotesExpanded] = useState(false);

    // Derived values
    const totalProcedures = useMemo(() => Object.values(procedures).reduce((sum, val) => sum + (val || 0), 0), [procedures]);
    const totalRepeats = useMemo(() => Object.values(repeats).reduce((sum, val) => sum + (val || 0), 0), [repeats]);
    const repeatRate = totalProcedures > 0 ? (totalRepeats / totalProcedures) * 100 : 0;
    const totalContrastMls = useMemo(() => contrastEntries.reduce((sum, entry) => sum + entry.volume, 0), [contrastEntries]);

    // Handlers
    const handleProcChange = (id: string, delta: number) => {
        setProcedures(prev => ({
            ...prev,
            [id]: Math.max(0, (prev[id] || 0) + delta)
        }));
        // If procedures drop to 0, ensure repeats drop to 0
        if (delta < 0) {
            const newVal = Math.max(0, (procedures[id] || 0) + delta);
            if (newVal === 0 && repeats[id] > 0) {
                handleRepeatChange(id, -repeats[id]);
            }
        }
    };

    const handleRepeatChange = (id: string, delta: number) => {
        setRepeats(prev => {
            const currentRepeats = prev[id] || 0;
            const maxAllowed = procedures[id] || 0;
            const newRepeats = Math.min(maxAllowed, Math.max(0, currentRepeats + delta));
            return { ...prev, [id]: newRepeats };
        });
    };

    const addContrastEntry = (vol?: number) => {
        const volumeToAdd = vol !== undefined ? vol : (typeof contrastVolume === 'number' ? contrastVolume : 0);
        if (volumeToAdd <= 0 || !selectedContrastType) return;

        const typeObj = activeContrastTypes.find((c: { id: string; name: string }) => c.id === selectedContrastType);
        if (!typeObj) return;

        setContrastEntries(prev => [
            ...prev,
            { id: Date.now().toString() + Math.random(), typeId: selectedContrastType, name: typeObj.name, volume: volumeToAdd }
        ]);
        setContrastVolume('');
    };

    const removeContrastEntry = (id: string) => {
        setContrastEntries(prev => prev.filter(e => e.id !== id));
    };

    const handleSubmit = async () => {
        if (totalProcedures === 0 && filmsPrinted === 0 && contrastEntries.length === 0) {
            alert("Please log at least one procedure, contrast, or film.");
            return;
        }

        // Construct log payload
        const log = {
            id: `staff-log-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            staff_id: user?.id || 'unknown',
            staff_name: user?.name || 'Unknown',
            shift: 'Morning', // This could be derived or selected
            procedures_performed: procedures,
            total_procedures: totalProcedures,
            repeats: repeats,
            total_repeats: totalRepeats,
            repeat_rate: repeatRate,
            contrast_administered: contrastEntries,
            films_printed: filmsPrinted,
            issues_encountered: issues,
            created_at: new Date().toISOString()
        };

        try {
            await addStaffLog(log);
            alert("Shift logged successfully!");
            // Reset form
            setProcedures({});
            setRepeats({});
            setRepeatReasons({});
            setContrastEntries([]);
            setFilmsPrinted(0);
            setIssues('');
        } catch {
            alert("Failed to save log.");
        }
    };

    const userRecentLogs = useMemo(() => {
        return staffLogs.filter(log => log.staff_id === user?.id).slice(-7).reverse();
    }, [staffLogs, user?.id]);

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <PageHeader
                title="My Daily Log"
                description="Fast, personal activity entry for your current shift."
            />

            {/* Top Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard accentColor="primary" label="Procedures Today" value={totalProcedures} />
                <StatCard accentColor={repeatRate > 10 ? 'warning' : 'success'} label="Repeat Rate" value={`${repeatRate.toFixed(1)}`} unit="%" />
                <StatCard accentColor="indigo" label="Contrast Used" value={totalContrastMls} unit="mL" />
                <StatCard accentColor="teal" label="Films Printed" value={filmsPrinted} />
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 md:p-8 space-y-10">

                    {/* Section 1: Procedures */}
                    <section>
                        <h2 className="text-lg font-bold text-text-primary mb-4">Procedures Performed</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {modalities.map(mod => {
                                const count = procedures[mod.id] || 0;
                                return (
                                    <div key={mod.id} className={`p-4 rounded-2xl border-2 transition-all ${count > 0 ? 'border-primary/50 bg-primary/5' : 'border-gray-100 bg-gray-50'}`}>
                                        <div className="font-semibold text-text-secondary text-sm mb-3 truncate">{mod.name}</div>
                                        <div className="flex items-center justify-between bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                                            <button type="button" onClick={() => handleProcChange(mod.id, -1)} className="p-3 text-text-muted hover:text-danger hover:bg-gray-50 transition-colors active:bg-gray-100">
                                                <Minus className="w-5 h-5" />
                                            </button>
                                            <span className="font-bold w-12 text-center text-lg">{count}</span>
                                            <button type="button" onClick={() => handleProcChange(mod.id, 1)} className="p-3 text-primary hover:text-primary-600 hover:bg-primary/10 transition-colors active:bg-primary/20">
                                                <Plus className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-4 flex items-center justify-between bg-primary/5 p-4 rounded-xl border border-primary/10">
                            <span className="font-medium text-text-secondary">Running Total</span>
                            <span className="font-bold text-primary text-xl">{totalProcedures} procedures</span>
                        </div>
                    </section>

                    {/* Section 2: Repeats */}
                    {totalProcedures > 0 && (
                        <section className="pt-6 border-t border-gray-100 animate-in fade-in slide-in-from-top-4 duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-text-primary">Repeat Examinations</h2>
                                {repeatRate > 10 && (
                                    <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                                        <AlertTriangle className="w-3.5 h-3.5" /> High Repeat Rate
                                    </span>
                                )}
                            </div>

                            <div className="space-y-4">
                                {modalities.filter(m => procedures[m.id] > 0).map(mod => {
                                    const repCount = repeats[mod.id] || 0;
                                    const procCount = procedures[mod.id] || 0;
                                    return (
                                        <div key={`rep-${mod.id}`} className="flex flex-col md:flex-row gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100 items-start md:items-center">
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-text-primary text-sm truncate">{mod.name}</div>
                                                <div className="text-xs text-text-muted mt-0.5">{procCount} total procedures</div>
                                            </div>

                                            <div className="flex items-center justify-between bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 shrink-0">
                                                <button type="button" onClick={() => handleRepeatChange(mod.id, -1)} className="p-2.5 text-text-muted hover:text-danger hover:bg-gray-50">
                                                    <Minus className="w-4 h-4" />
                                                </button>
                                                <span className="font-bold w-10 text-center text-sm">{repCount}</span>
                                                <button type="button" onClick={() => handleRepeatChange(mod.id, 1)} className="p-2.5 text-amber-600 hover:bg-amber-50" disabled={repCount >= procCount}>
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>

                                            {repCount > 0 && (
                                                <select
                                                    className="w-full md:w-48 bg-white border border-gray-200 text-sm rounded-xl px-3 py-2.5 outline-none focus:border-primary shrink-0"
                                                    value={repeatReasons[mod.id] || ''}
                                                    onChange={(e) => setRepeatReasons(prev => ({ ...prev, [mod.id]: e.target.value }))}
                                                >
                                                    <option value="" disabled>Select Reason...</option>
                                                    <option value="Patient motion">Patient motion</option>
                                                    <option value="Technical error">Technical error</option>
                                                    <option value="Positioning error">Positioning error</option>
                                                    <option value="Equipment fault">Equipment fault</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* Section 3: Contrast */}
                    <section className="pt-6 border-t border-gray-100">
                        <h2 className="text-lg font-bold text-text-primary mb-4">Contrast Administered</h2>

                        <div className="flex flex-col md:flex-row gap-3 relative z-20">
                            <select
                                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-primary focus:bg-white transition-colors"
                                value={selectedContrastType}
                                onChange={(e) => setSelectedContrastType(e.target.value)}
                            >
                                {activeContrastTypes.length === 0 && <option value="" disabled>No contrast types configured</option>}
                                {activeContrastTypes.map((c: { id: string; name: string }) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>

                            <div className="flex gap-2 relative">
                                <input
                                    type="number"
                                    placeholder="Vol (mL)"
                                    className="w-28 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-primary focus:bg-white transition-colors"
                                    value={contrastVolume}
                                    onChange={(e) => setContrastVolume(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                                    min="0"
                                />
                                <Button type="button" onClick={() => addContrastEntry()} disabled={!contrastVolume || !selectedContrastType} className="px-6 rounded-xl">
                                    Add
                                </Button>
                            </div>
                        </div>

                        {/* Quick Adds */}
                        <div className="flex gap-2 mt-4 overflow-x-auto hide-scrollbar pb-2">
                            {['50', '100', '150'].map(volStr => (
                                <button
                                    key={volStr}
                                    type="button"
                                    onClick={() => addContrastEntry(parseInt(volStr))}
                                    className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition-colors border border-indigo-100 whitespace-nowrap"
                                >
                                    +{volStr} mL
                                </button>
                            ))}
                        </div>

                        {/* Chips */}
                        {contrastEntries.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                {contrastEntries.map(entry => (
                                    <div key={entry.id} className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-full shadow-sm">
                                        <span className="text-sm font-semibold text-text-primary">{entry.name}</span>
                                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{entry.volume} mL</span>
                                        <button type="button" onClick={() => removeContrastEntry(entry.id)} className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-red-50 text-text-muted hover:text-red-500 transition-colors ml-1">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Section 4: Films */}
                    <section className="pt-6 border-t border-gray-100 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-text-primary">Films Printed</h2>
                            <p className="text-sm text-text-muted mt-1">Total physical sheets consumed</p>
                        </div>
                        <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200 w-40">
                            <button type="button" onClick={() => setFilmsPrinted(Math.max(0, filmsPrinted - 1))} className="p-4 text-text-muted hover:text-danger hover:bg-gray-50 transition-colors">
                                <Minus className="w-5 h-5" />
                            </button>
                            <span className="font-bold flex-1 text-center text-xl">{filmsPrinted}</span>
                            <button type="button" onClick={() => setFilmsPrinted(filmsPrinted + 1)} className="p-4 text-primary hover:text-primary-600 hover:bg-primary/10 transition-colors">
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                    </section>

                    {/* Section 5: Notes */}
                    <section className="pt-6 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => setNotesExpanded(!notesExpanded)}
                            className="flex items-center justify-between w-full text-left font-bold text-text-primary group"
                        >
                            <span>Any issues or notes?</span>
                            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-gray-100 transition-colors text-text-secondary">
                                {notesExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                            </div>
                        </button>
                        {notesExpanded && (
                            <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                <textarea
                                    value={issues}
                                    onChange={(e) => setIssues(e.target.value)}
                                    placeholder="Briefly describe any equipment faults, supply shortages, or handovers..."
                                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm outline-none focus:border-primary focus:bg-white resize-y min-h-[100px] transition-all"
                                />
                            </div>
                        )}
                    </section>
                </div>

                <div className="p-6 md:p-8 bg-gray-50 border-t border-gray-100 flex justify-end">
                    <Button onClick={handleSubmit} size="lg" icon={Save} className="w-full md:w-auto px-10 rounded-xl shadow-md">
                        Log My Shift
                    </Button>
                </div>
            </div>

            {/* My Recent Logs */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 md:px-8 py-5 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="font-bold text-text-primary">My Recent Logs (Last 7 Days)</h3>
                </div>
                <div className="divide-y divide-gray-100">
                    {userRecentLogs.length === 0 ? (
                        <div className="p-8 text-center text-text-muted text-sm">No recent logs found. Start logging your shifts above!</div>
                    ) : (
                        userRecentLogs.map(log => (
                            <div key={log.id} className="p-6 md:px-8 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="font-bold text-text-primary">{new Date(log.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                                    <div className="text-xs font-semibold px-2.5 py-1 bg-surface-hover rounded-full text-text-secondary">{log.shift}</div>
                                </div>
                                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-text-muted">Procedures:</span>
                                        <span className="font-semibold text-text-primary">{log.total_procedures}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-text-muted">Repeats:</span>
                                        <span className={`font-semibold ${log.repeat_rate > 10 ? 'text-danger' : 'text-text-primary'}`}>{log.repeat_rate?.toFixed(1) || 0}%</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-text-muted">Films:</span>
                                        <span className="font-semibold text-text-primary">{log.films_printed || 0}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

        </div>
    );
};

export const AdminPerformanceDashboard: React.FC = () => {
    const { staffLogs, modalities } = useAppContext();
    const [dateRange, setDateRange] = useState<'this_week' | 'this_month' | 'last_30' | 'custom'>('last_30');
    // Custom Date Range State
    const [customStartDate, setCustomStartDate] = useState<string>('');
    const [customEndDate, setCustomEndDate] = useState<string>('');

    // Table Sorting State
    const [sortColumn, setSortColumn] = useState<'name' | 'procedures' | 'avgDaily' | 'repeatRate' | 'contrast' | 'films' | 'lastActive'>('procedures');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    // Expanded Row State
    const [expandedStaffId, setExpandedStaffId] = useState<string | null>(null);

    // Filter logs based on date Range
    const filteredLogs = useMemo(() => {
        const today = new Date();
        const pastDate = new Date();

        switch (dateRange) {
            case 'this_week':
                pastDate.setDate(today.getDate() - today.getDay()); // Start of week (Sun)
                break;
            case 'this_month':
                pastDate.setDate(1); // Start of month
                break;
            case 'last_30':
                pastDate.setDate(today.getDate() - 30);
                break;
            case 'custom':
                if (customStartDate && customEndDate) {
                    const start = new Date(customStartDate).getTime();
                    // Set end time to end of day to include full day logs
                    const end = new Date(customEndDate).setHours(23, 59, 59, 999);
                    return staffLogs.filter(log => {
                        const logTime = new Date(log.date).getTime();
                        return logTime >= start && logTime <= end;
                    });
                } else if (customStartDate) {
                    const start = new Date(customStartDate).getTime();
                    return staffLogs.filter(log => new Date(log.date).getTime() >= start);
                } else if (customEndDate) {
                    const end = new Date(customEndDate).setHours(23, 59, 59, 999);
                    return staffLogs.filter(log => new Date(log.date).getTime() <= end);
                }
                break; // If custom but no dates, return all by default or fall through to next logic
        }

        if (dateRange !== 'custom') {
            const filterTime = pastDate.getTime();
            return staffLogs.filter(log => new Date(log.date).getTime() >= filterTime);
        }
        return staffLogs; // fallback
    }, [staffLogs, dateRange, customStartDate, customEndDate]);

    // Top Stats Calculations
    const totalProcedures = useMemo(() => filteredLogs.reduce((sum, log) => sum + log.total_procedures, 0), [filteredLogs]);
    const totalRepeats = useMemo(() => filteredLogs.reduce((sum, log) => sum + log.total_repeats, 0), [filteredLogs]);
    const deptRepeatRate = totalProcedures > 0 ? (totalRepeats / totalProcedures) * 100 : 0;

    // Avg Daily per Radiographer
    const uniqueStaffIds = useMemo(() => new Set(filteredLogs.map(l => l.staff_id)), [filteredLogs]);
    const uniqueDays = useMemo(() => new Set(filteredLogs.map(l => l.date)), [filteredLogs]);
    const avgDailyPerStaff = (uniqueStaffIds.size > 0 && uniqueDays.size > 0)
        ? totalProcedures / (uniqueStaffIds.size * uniqueDays.size)
        : 0;

    // Compliance (Today's Logs)
    const todayStr = new Date().toISOString().split('T')[0];
    const todayLogStaffIds = useMemo(() => new Set(staffLogs.filter(l => l.date === todayStr).map(l => l.staff_id)), [staffLogs, todayStr]);
    const compliancePct = uniqueStaffIds.size > 0 ? (todayLogStaffIds.size / uniqueStaffIds.size) * 100 : 0;

    // Anomaly Detection Algorithm
    const anomalies = useMemo(() => {
        const flags: { id: string, staffName: string, type: 'danger' | 'warning', message: string, icon: React.ElementType }[] = [];

        if (filteredLogs.length === 0) return flags;

        // Group by staff_id for analysis
        const staffGroups = filteredLogs.reduce((acc, log) => {
            if (!acc[log.staff_id]) acc[log.staff_id] = { name: log.staff_name, logs: [] };
            acc[log.staff_id].logs.push(log);
            return acc;
        }, {} as Record<string, { name: string, logs: typeof filteredLogs }>);

        // Department averages
        const avgProcsPerStaff = totalProcedures / Object.keys(staffGroups).length;
        const avgContrastVol = filteredLogs.reduce((sum, log) => sum + (log.contrast_administered?.reduce((s: number, e: { volume: number }) => s + e.volume, 0) || 0), 0) / filteredLogs.length;

        Object.entries(staffGroups).forEach(([staffId, data]) => {
            const logs = data.logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            // 1. Missing Logs (No logs in 3+ days)
            const daysSinceLastLog = Math.floor((new Date().getTime() - new Date(logs[0].date).getTime()) / (1000 * 3600 * 24));
            if (daysSinceLastLog >= 3 && dateRange !== 'this_week') {
                flags.push({ id: `missing-${staffId}`, staffName: data.name, type: 'danger', message: `No shift logged in ${daysSinceLastLog} days`, icon: UserX });
            }

            // 2. High Repeat Rate
            const staffProcs = logs.reduce((sum, l) => sum + l.total_procedures, 0);
            const staffRepeats = logs.reduce((sum, l) => sum + l.total_repeats, 0);
            const staffRepeatRate = staffProcs > 0 ? (staffRepeats / staffProcs) * 100 : 0;

            if (staffRepeatRate > 10 && staffProcs > 5) {
                flags.push({ id: `repeats-${staffId}`, staffName: data.name, type: 'danger', message: `High repeat rate (${staffRepeatRate.toFixed(1)}%)`, icon: AlertTriangle });
            }

            // 3. Low Procedures
            if (staffProcs < (avgProcsPerStaff * 0.5) && staffProcs > 0) {
                flags.push({ id: `low-${staffId}`, staffName: data.name, type: 'warning', message: `Procedures well below average (${staffProcs} vs ${Math.round(avgProcsPerStaff)})`, icon: TrendingUp });
            }

            // 4. High Contrast Usage per shift
            const staffActiveDays = logs.length;
            const staffTotalContrast = logs.reduce((sum, log) => sum + (log.contrast_administered?.reduce((s: number, e: { volume: number }) => s + e.volume, 0) || 0), 0);
            const staffAvgContrastPerDay = staffActiveDays > 0 ? staffTotalContrast / staffActiveDays : 0;

            if (staffAvgContrastPerDay > (avgContrastVol * 2) && avgContrastVol > 0) {
                flags.push({ id: `contrast-${staffId}`, staffName: data.name, type: 'warning', message: `High contrast usage average (${Math.round(staffAvgContrastPerDay)} mL/shift)`, icon: Activity });
            }
        });

        return flags.sort((a) => (a.type === 'danger' ? -1 : 1)); // Danger first
    }, [filteredLogs, totalProcedures, dateRange]);

    // Table Aggregation Logic
    const staffSummaries = useMemo(() => {
        const summaries = Object.values(filteredLogs.reduce((acc, log) => {
            if (!acc[log.staff_id]) {
                acc[log.staff_id] = {
                    staffId: log.staff_id,
                    name: log.staff_name,
                    totalProcedures: 0,
                    totalRepeats: 0,
                    totalContrast: 0,
                    totalFilms: 0,
                    activeDays: new Set<string>(),
                    lastActiveDate: log.date
                };
            }

            const s = acc[log.staff_id];
            s.totalProcedures += log.total_procedures || 0;
            s.totalRepeats += log.total_repeats || 0;
            s.totalContrast += log.contrast_administered?.reduce((sum: number, c: { volume: number }) => sum + c.volume, 0) || 0;
            s.totalFilms += log.films_printed || 0;
            s.activeDays.add(log.date);

            if (new Date(log.date).getTime() > new Date(s.lastActiveDate).getTime()) {
                s.lastActiveDate = log.date;
            }
            return acc;
        }, {} as Record<string, {
            staffId: string;
            name: string;
            totalProcedures: number;
            totalRepeats: number;
            totalContrast: number;
            totalFilms: number;
            activeDays: Set<string>;
            lastActiveDate: string;
        }>)).map((s) => {
            const repeatRate = s.totalProcedures > 0 ? (s.totalRepeats / s.totalProcedures) * 100 : 0;
            const avgDaily = s.activeDays.size > 0 ? s.totalProcedures / s.activeDays.size : 0;

            // Last active string formatting
            const todayTime = new Date().setHours(0, 0, 0, 0);
            const daysAgo = Math.floor((todayTime - new Date(s.lastActiveDate).setHours(0, 0, 0, 0)) / (1000 * 3600 * 24));

            let lastActiveStr = `${daysAgo} days ago`;
            if (daysAgo === 0) lastActiveStr = 'Today';
            else if (daysAgo === 1) lastActiveStr = 'Yesterday';

            return {
                staffId: s.staffId,
                name: s.name,
                procedures: s.totalProcedures,
                avgDaily: avgDaily,
                repeatRate: repeatRate,
                contrast: s.totalContrast,
                films: s.totalFilms,
                lastActiveStr,
                daysSinceActive: daysAgo,
                activeDaysCount: s.activeDays.size
            };
        });

        // Sorting
        return summaries.sort((a, b) => {
            let valA = a[sortColumn as keyof typeof a];
            let valB = b[sortColumn as keyof typeof b];

            if (sortColumn === 'lastActive') {
                valA = a.daysSinceActive;
                valB = b.daysSinceActive;
                // For last active, asc means more recent (fewer days), desc means older. Reverse typical sort logic.
                if (sortDirection === 'asc') return valA > valB ? 1 : -1;
                return valA < valB ? 1 : -1;
            }

            if (typeof valA === 'string' && typeof valB === 'string') {
                return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            }

            return sortDirection === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
        });
    }, [filteredLogs, sortColumn, sortDirection]);

    const handleSort = (column: typeof sortColumn) => {
        if (sortColumn === column) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('desc'); // Default new sorts to descending (usually want highest scores)
        }
    };

    const handleExportCSV = () => {
        if (staffSummaries.length === 0) return;

        const headers = ["Staff Name", "Procedures", "Avg Daily", "Repeat Rate (%)", "Contrast (mL)", "Films", "Last Active"];

        const csvRows = [headers.join(',')];

        staffSummaries.forEach(s => {
            csvRows.push([
                `"${s.name}"`,
                s.procedures,
                s.avgDaily.toFixed(1),
                s.repeatRate.toFixed(1),
                s.contrast,
                s.films,
                `"${s.lastActiveStr}"`
            ].join(','));
        });

        const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(csvRows.join('\n'));
        const link = document.createElement('a');
        link.setAttribute('href', csvContent);
        link.setAttribute('download', `radpadi_staff_performance_${dateRange}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <PageHeader
                    title="Staff Performance Dashboard"
                    description="Monitor department activity, compliance, and procedure statistics."
                    className="mb-0"
                />
                <div className="flex items-center gap-3">
                    <select
                        className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium outline-none focus:border-primary shadow-sm"
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value as 'this_week' | 'this_month' | 'last_30' | 'custom')}
                    >
                        <option value="this_week">This Week</option>
                        <option value="this_month">This Month</option>
                        <option value="last_30">Last 30 Days</option>
                        <option value="custom">Custom Range</option>
                    </select>

                    {dateRange === 'custom' && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                            <input
                                type="date"
                                className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-sm font-medium outline-none focus:border-primary shadow-sm h-10 w-36"
                                value={customStartDate}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                                placeholder="Start"
                            />
                            <span className="text-gray-400">-</span>
                            <input
                                type="date"
                                className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-sm font-medium outline-none focus:border-primary shadow-sm h-10 w-36"
                                value={customEndDate}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                                placeholder="End"
                            />
                        </div>
                    )}

                    <Button variant="secondary" icon={Download} onClick={handleExportCSV}>Export CSV</Button>
                </div>
            </div>

            {/* Top Stats Banner */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard accentColor="primary" label="Total Procedures" value={totalProcedures} />
                <StatCard accentColor="indigo" label="Avg Daily / Staff" value={avgDailyPerStaff.toFixed(1)} />
                <StatCard accentColor={deptRepeatRate > 10 ? 'warning' : 'success'} label="Dept Repeat Rate" value={`${deptRepeatRate.toFixed(1)}`} unit="%" />
                <StatCard accentColor={compliancePct < 80 ? 'danger' : 'success'} label="Staff Compliance" value={`${todayLogStaffIds.size} / ${uniqueStaffIds.size}`} unit=" today" />
            </div>

            {/* Anomaly Flags */}
            {anomalies.length > 0 && (
                <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 pt-2">
                    {anomalies.map(flag => {
                        const Icon = flag.icon;
                        const bgColor = flag.type === 'danger' ? 'bg-danger/10 border-danger/20 text-danger' : 'bg-warning/10 border-warning/20 text-warning-700';

                        return (
                            <div key={flag.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm shrink-0 text-sm font-medium ${bgColor}`}>
                                <Icon className="w-4 h-4" />
                                <span className="font-bold">{flag.staffName}:</span>
                                <span>{flag.message}</span>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Staff Overview Table */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden mt-8">
                <div className="px-6 md:px-8 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <h3 className="font-bold text-text-primary">Staff Overview</h3>
                    <div className="text-sm font-semibold px-3 py-1 bg-white rounded-full border border-gray-200 shadow-sm text-text-secondary">
                        {staffSummaries.length} Active Staff
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-50/50 text-text-muted font-semibold border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 cursor-pointer hover:text-text-primary transition-colors" onClick={() => handleSort('name')}>
                                    <div className="flex items-center gap-1">Staff Name {sortColumn === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}</div>
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:text-text-primary transition-colors text-right" onClick={() => handleSort('procedures')}>
                                    <div className="flex items-center justify-end gap-1">Procedures {sortColumn === 'procedures' && (sortDirection === 'asc' ? '↑' : '↓')}</div>
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:text-text-primary transition-colors text-right" onClick={() => handleSort('avgDaily')}>
                                    <div className="flex items-center justify-end gap-1">Avg Daily {sortColumn === 'avgDaily' && (sortDirection === 'asc' ? '↑' : '↓')}</div>
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:text-text-primary transition-colors text-right" onClick={() => handleSort('repeatRate')}>
                                    <div className="flex items-center justify-end gap-1">Repeat Rate {sortColumn === 'repeatRate' && (sortDirection === 'asc' ? '↑' : '↓')}</div>
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:text-text-primary transition-colors text-right hidden md:table-cell" onClick={() => handleSort('contrast')}>
                                    <div className="flex items-center justify-end gap-1">Contrast (mL) {sortColumn === 'contrast' && (sortDirection === 'asc' ? '↑' : '↓')}</div>
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:text-text-primary transition-colors text-right hidden sm:table-cell" onClick={() => handleSort('films')}>
                                    <div className="flex items-center justify-end gap-1">Films {sortColumn === 'films' && (sortDirection === 'asc' ? '↑' : '↓')}</div>
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:text-text-primary transition-colors text-right" onClick={() => handleSort('lastActive')}>
                                    <div className="flex items-center justify-end gap-1">Last Active {sortColumn === 'lastActive' && (sortDirection === 'asc' ? '↑' : '↓')}</div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {staffSummaries.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-text-muted">No data available for the selected range.</td>
                                </tr>
                            )}
                            {staffSummaries.map((staff) => {
                                const isExpanded = expandedStaffId === staff.staffId;

                                // Chart Data specific to this staff
                                const staffSpecificLogs = filteredLogs.filter(l => l.staff_id === staff.staffId).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                                const modalityTotals = staffSpecificLogs.reduce((acc, log) => {
                                    Object.entries(log.procedures_performed || {}).forEach(([modId, count]) => {
                                        const numCount = count as number;
                                        if (numCount > 0) {
                                            const mName = modalities.find((m: { id: string; name: string }) => m.id === modId)?.name || modId;
                                            acc[mName] = (acc[mName] || 0) + numCount;
                                        }
                                    });
                                    return acc;
                                }, {} as Record<string, number>);

                                const pieData = Object.entries(modalityTotals).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);
                                const COLORS = ['#0ea5e9', '#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

                                // Trend Line Chart
                                const trendData = staffSpecificLogs.map(log => ({
                                    date: new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                                    procedures: log.total_procedures
                                }));

                                return (
                                    <React.Fragment key={staff.staffId}>
                                        <tr
                                            onClick={() => setExpandedStaffId(isExpanded ? null : staff.staffId)}
                                            className={`hover:bg-gray-50/50 transition-colors cursor-pointer group ${isExpanded ? 'bg-primary/5' : ''}`}
                                        >
                                            <td className="px-6 py-4 font-bold text-text-primary">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">
                                                        {staff.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    {staff.name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium">{staff.procedures}</td>
                                            <td className="px-6 py-4 text-right font-medium text-text-secondary">{staff.avgDaily.toFixed(1)}</td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${staff.repeatRate > 10 ? 'bg-danger/10 text-danger' :
                                                    staff.repeatRate >= 5 ? 'bg-warning/10 text-warning-700' :
                                                        'bg-success/10 text-success'
                                                    }`}>
                                                    {staff.repeatRate.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium hidden md:table-cell text-text-secondary">{staff.contrast}</td>
                                            <td className="px-6 py-4 text-right font-medium hidden sm:table-cell text-text-secondary">{staff.films}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {staff.daysSinceActive >= 3 && <span className="w-2 h-2 rounded-full bg-danger animate-pulse"></span>}
                                                    <span className={`font-medium ${staff.daysSinceActive === 0 ? 'text-primary' : 'text-text-secondary'}`}>
                                                        {staff.lastActiveStr}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                        {isExpanded && (
                                            <tr className="bg-gray-50/30 border-b-2 border-primary/20">
                                                <td colSpan={7} className="p-0">
                                                    <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-4 duration-300">
                                                        {/* Activity Trend Chart */}
                                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                                            <h4 className="font-bold text-text-primary mb-4 text-sm">Procedure Trend (Selected Range)</h4>
                                                            <div className="h-[200px] w-full">
                                                                {trendData.length > 1 ? (
                                                                    <ResponsiveContainer width="100%" height="100%">
                                                                        <LineChart data={trendData}>
                                                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                                                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dx={-10} allowDecimals={false} />
                                                                            <RechartsTooltip
                                                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                                            />
                                                                            <Line type="monotone" dataKey="procedures" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4, fill: '#0ea5e9', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                                                                        </LineChart>
                                                                    </ResponsiveContainer>
                                                                ) : (
                                                                    <div className="h-full flex items-center justify-center text-sm text-text-muted">Not enough data to show trend</div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Modality Split Chart */}
                                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                                            <h4 className="font-bold text-text-primary mb-4 text-sm">Modality Breakdown</h4>
                                                            <div className="h-[200px] w-full flex items-center justify-center">
                                                                {pieData.length > 0 ? (
                                                                    <ResponsiveContainer width="100%" height="100%">
                                                                        <PieChart>
                                                                            <Pie
                                                                                data={pieData}
                                                                                cx="50%"
                                                                                cy="50%"
                                                                                innerRadius={60}
                                                                                outerRadius={80}
                                                                                paddingAngle={5}
                                                                                dataKey="value"
                                                                            >
                                                                                {pieData.map((_entry, index) => (
                                                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                                                ))}
                                                                            </Pie>
                                                                            <RechartsTooltip
                                                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                                            />
                                                                        </PieChart>
                                                                    </ResponsiveContainer>
                                                                ) : (
                                                                    <div className="text-sm text-text-muted">No procedure data logged</div>
                                                                )}
                                                            </div>

                                                            {/* Comparison Text */}
                                                            {avgDailyPerStaff > 0 && (
                                                                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
                                                                    <span className="text-text-muted">Avg Daily Procedures:</span>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-bold text-text-primary">{staff.avgDaily.toFixed(1)}</span>
                                                                        {(() => {
                                                                            const diff = staff.avgDaily - avgDailyPerStaff;
                                                                            const pctDiff = Math.abs((diff / avgDailyPerStaff) * 100).toFixed(0);
                                                                            if (diff > 0) {
                                                                                return <span className="text-success font-medium bg-success/10 px-2 py-0.5 rounded-full">{pctDiff}% above avg</span>;
                                                                            } else if (diff < 0) {
                                                                                return <span className="text-warning-700 font-medium bg-warning/10 px-2 py-0.5 rounded-full">{pctDiff}% below avg</span>;
                                                                            }
                                                                            return <span className="text-text-muted font-medium bg-gray-100 px-2 py-0.5 rounded-full">Average</span>;
                                                                        })()}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    );
};

export default function StaffActivity() {
    const { user } = useAuth();
    if (user?.role === 'admin') {
        return <AdminPerformanceDashboard />;
    }
    return <RadiographerActivityForm />;
}
