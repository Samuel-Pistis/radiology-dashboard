import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Activity, CheckCircle, Save, FileText, PieChart as PieChartIcon, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { PageHeader, Tabs, Card, Input, Select, Button, StatCard } from '@/components/ui';
import type { ShiftRecord, DailyContrastRecord, ContrastItemData } from '../types';

export const DailyLogging: React.FC = () => {
    const { modalities, locations, contrastTypes, addActivityLog, saveContrastRecord, contrastRecords } = useAppContext();

    const [activeTab, setActiveTab] = useState<'activity' | 'contrast'>('contrast'); // Default to contrast for testing
    const [successMessage, setSuccessMessage] = useState('');

    const showSuccess = (msg: string) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    // === ACTIVITY LOGGING STATE ===
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [modalityId, setModalityId] = useState('');
    const [locationId, setLocationId] = useState('');
    const [totalInvestigations, setTotalInvestigations] = useState(0);
    const [film10x12, setFilm10x12] = useState(0);
    const [film14x17, setFilm14x17] = useState(0);
    const [revenue, setRevenue] = useState(0);

    const handleActivitySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!modalityId) return;

        addActivityLog({
            id: `act-${Date.now()}`,
            date,
            modalityId,
            locationId: locationId || undefined,
            totalInvestigations,
            film10x12Used: film10x12,
            film14x17Used: film14x17,
            revenueAmount: revenue,
        });

        setTotalInvestigations(0);
        setFilm10x12(0);
        setFilm14x17(0);
        setRevenue(0);
        showSuccess('Activity log saved successfully!');
    };

    // === CONTRAST TRACKER STATE ===
    const [contrastDate, setContrastDate] = useState(new Date().toISOString().split('T')[0]);
    const [dateOffset, setDateOffset] = useState(0);

    const visibleDates = useMemo(() => {
        const dates = [];
        const today = new Date();
        // Generate 7 days. If offset = 0, today is the right-most (last) day.
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() + dateOffset - i);
            dates.push(d);
        }
        return dates;
    }, [dateOffset]);

    const initItems = (): ContrastItemData[] => contrastTypes.map(c => ({
        contrastTypeId: c.id,
        totalReceivedMls: 0,
        totalReceivedBottles: 0,
        additionalStockMls: 0,
        additionalStockBottles: 0,
        amountConsumedMls: 0,
        amountConsumedBottles: 0,
        outstandingMls: 0,
        outstandingBottles: 0
    }));

    const defaultShift = (): ShiftRecord => ({ items: initItems(), handedOverTo: '', calculatedBy: '', isVerified: false });

    const [shifts, setShifts] = useState({
        morning: defaultShift(),
        afternoon: defaultShift(),
        night: defaultShift()
    });

    useEffect(() => {
        const existing = contrastRecords.find(r => r.date === contrastDate);
        if (existing) {
            // Ensure compatibility if new contrast types were added after saving
            const ensureItems = (shiftItems: ContrastItemData[]) => {
                return contrastTypes.map(ct => {
                    const found = shiftItems.find(i => i.contrastTypeId === ct.id);
                    return found || {
                        contrastTypeId: ct.id,
                        totalReceivedMls: 0, totalReceivedBottles: 0,
                        additionalStockMls: 0, additionalStockBottles: 0,
                        amountConsumedMls: 0, amountConsumedBottles: 0,
                        outstandingMls: 0, outstandingBottles: 0
                    };
                });
            };

            setShifts({
                morning: { ...existing.morning, items: ensureItems(existing.morning.items) },
                afternoon: { ...existing.afternoon, items: ensureItems(existing.afternoon.items) },
                night: { ...existing.night, items: ensureItems(existing.night.items) }
            });
        } else {
            setShifts({ morning: defaultShift(), afternoon: defaultShift(), night: defaultShift() });
        }
    }, [contrastDate, contrastRecords, contrastTypes]);

    // Cascading math recalculation
    const handleShiftItemChange = (
        shiftName: 'morning' | 'afternoon' | 'night',
        typeId: string,
        field: keyof ContrastItemData,
        value: number
    ) => {
        setShifts(prev => {
            // Deep clone
            const next = {
                morning: { ...prev.morning, items: prev.morning.items.map(i => ({ ...i })) },
                afternoon: { ...prev.afternoon, items: prev.afternoon.items.map(i => ({ ...i })) },
                night: { ...prev.night, items: prev.night.items.map(i => ({ ...i })) }
            };

            // Update specific field
            const targetItem = next[shiftName].items.find(i => i.contrastTypeId === typeId);
            if (!targetItem) return prev;
            // @ts-ignore dynamic assignment
            targetItem[field] = isNaN(value) ? 0 : value;

            // Cascade Math
            const m = next.morning.items.find(i => i.contrastTypeId === typeId)!;
            const a = next.afternoon.items.find(i => i.contrastTypeId === typeId)!;
            const n = next.night.items.find(i => i.contrastTypeId === typeId)!;

            m.outstandingMls = m.totalReceivedMls - m.amountConsumedMls;
            m.outstandingBottles = m.totalReceivedBottles - m.amountConsumedBottles;

            a.totalReceivedMls = m.outstandingMls + a.additionalStockMls;
            a.totalReceivedBottles = m.outstandingBottles + a.additionalStockBottles;
            a.outstandingMls = a.totalReceivedMls - a.amountConsumedMls;
            a.outstandingBottles = a.totalReceivedBottles - a.amountConsumedBottles;

            n.totalReceivedMls = a.outstandingMls + n.additionalStockMls;
            n.totalReceivedBottles = a.outstandingBottles + n.additionalStockBottles;
            n.outstandingMls = n.totalReceivedMls - n.amountConsumedMls;
            n.outstandingBottles = n.totalReceivedBottles - n.amountConsumedBottles;

            return next;
        });
    };

    const updateShiftDetails = (shiftName: 'morning' | 'afternoon' | 'night', field: 'handedOverTo' | 'calculatedBy' | 'isVerified', value: any) => {
        setShifts(prev => ({
            ...prev,
            [shiftName]: { ...prev[shiftName], [field]: value }
        }));
    };

    const handleContrastSubmit = () => {
        const id = contrastRecords.find(r => r.date === contrastDate)?.id || `cont-${Date.now()}`;
        const record: DailyContrastRecord = {
            id,
            date: contrastDate,
            morning: shifts.morning,
            afternoon: shifts.afternoon,
            night: shifts.night
        };
        saveContrastRecord(record);
        showSuccess('Shift contrast data saved successfully!');
    };

    const donutData = useMemo(() => {
        const morning = shifts.morning.items.reduce((s, i) => s + (i.amountConsumedMls || 0), 0);
        const afternoon = shifts.afternoon.items.reduce((s, i) => s + (i.amountConsumedMls || 0), 0);
        const night = shifts.night.items.reduce((s, i) => s + (i.amountConsumedMls || 0), 0);

        return [
            { name: 'Morning', value: morning, fill: '#0D9488' },
            { name: 'Afternoon', value: afternoon, fill: '#10B981' },
            { name: 'Night', value: night, fill: '#111827' }
        ].filter(d => d.value > 0);
    }, [shifts]);

    // Top Header Stats
    const totalDayReceived = useMemo(() => {
        let t = 0;
        shifts.morning.items.forEach(i => t += i.totalReceivedMls);
        shifts.afternoon.items.forEach(i => t += i.additionalStockMls);
        shifts.night.items.forEach(i => t += i.additionalStockMls);
        return t;
    }, [shifts]);

    const totalDayConsumed = useMemo(() => {
        let t = 0;
        shifts.morning.items.forEach(i => t += i.amountConsumedMls);
        shifts.afternoon.items.forEach(i => t += i.amountConsumedMls);
        shifts.night.items.forEach(i => t += i.amountConsumedMls);
        return t;
    }, [shifts]);

    const totalRemaining = useMemo(() => {
        let t = 0;
        shifts.night.items.forEach(i => t += i.outstandingMls);
        return t;
    }, [shifts]);




    const getShiftIcon = (name: string) => {
        if (name === 'morning') return <div className="w-6 h-6 rounded bg-primary-100 flex items-center justify-center text-primary-500 font-semibold text-xs shadow-sm">☀</div>;
        if (name === 'afternoon') return <div className="w-6 h-6 rounded bg-green-100 flex items-center justify-center text-green-600 font-semibold text-xs shadow-sm">☼</div>;
        return <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-xs shadow-sm">☽</div>;
    };

    const renderShiftCard = (shiftName: 'morning' | 'afternoon' | 'night', title: string, timeRange: string) => {
        const shiftData = shifts[shiftName];
        const isMorning = shiftName === 'morning';

        return (
            <div className={`bg-white/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/50 shadow-sm overflow-hidden transition-all mb-8`}>
                <div className="w-full flex justify-between items-center p-8 bg-black/5 border-b border-black/5">
                    <div className="flex items-center gap-4">
                        {getShiftIcon(shiftName)}
                        <div className="text-left">
                            <h4 className="font-bold text-2xl text-text-primary tracking-tight leading-none">
                                {title} Shift <span className="text-sm font-semibold text-text-muted ml-2 tracking-wide">({timeRange})</span>
                            </h4>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <div className="overflow-x-auto pb-4">
                        <table className="w-full min-w-[800px] border-collapse">
                            {/* HTML Table Header */}
                            <thead>
                                <tr>
                                    <th className="p-4 text-left font-medium text-sm text-text-secondary bg-surface border-b border-border">Row Type</th>
                                    {contrastTypes.map(c => (
                                        <th key={c.id} className="p-4 text-center font-medium text-sm text-text-primary bg-surface border-b border-border border-l max-w-[100px]">
                                            {c.name}
                                        </th>
                                    ))}
                                </tr>
                                <tr>
                                    <th className="p-2 border-b border-border bg-surface"></th>
                                    {contrastTypes.map(c => (
                                        <th key={`sub-${c.id}`} className="p-3 border-b border-border border-l bg-surface text-xs font-medium text-text-muted tracking-wide">
                                            <div className="grid grid-cols-2 gap-2">
                                                <span className="text-center">Total (mls)</span>
                                                <span className="text-center">Bottles</span>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            {/* HTML Table Body */}
                            <tbody>
                                {/* 1. Received Row */}
                                <tr className="border-b border-black/5 hover:bg-white/30 transition-colors">
                                    <td className="p-4 text-sm font-semibold text-text-primary">
                                        Total Qty Received <br /><span className="text-[10px] font-semibold text-text-muted tracking-wider">({isMorning ? 'Start stock' : 'Carried over + Additional'})</span>
                                    </td>
                                    {contrastTypes.map(c => {
                                        const item = shiftData.items.find(i => i.contrastTypeId === c.id)!;
                                        return (
                                            <td key={`rec-${c.id}`} className="p-3 border-l border-white/30">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <input type="number" min="0" value={item.totalReceivedMls || ''} onChange={(e) => handleShiftItemChange(shiftName, c.id, 'totalReceivedMls', parseInt(e.target.value) || 0)} readOnly={!isMorning} className={`w-full bg-white/50 border-2 border-transparent rounded-full px-2 py-2 text-center text-sm font-bold text-text-primary focus:bg-white focus:border-black/20 outline-none transition-all shadow-sm ${!isMorning ? 'opacity-50 cursor-not-allowed' : ''}`} placeholder="0" />
                                                    <input type="number" min="0" value={item.totalReceivedBottles || ''} onChange={(e) => handleShiftItemChange(shiftName, c.id, 'totalReceivedBottles', parseInt(e.target.value) || 0)} readOnly={!isMorning} className={`w-full bg-white/50 border-2 border-transparent rounded-full px-2 py-2 text-center text-sm font-bold text-text-primary focus:bg-white focus:border-black/20 outline-none transition-all shadow-sm ${!isMorning ? 'opacity-50 cursor-not-allowed' : ''}`} placeholder="0" />
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>

                                {/* 2. Additional Row */}
                                {!isMorning && (
                                    <tr className="border-b border-black/5 hover:bg-white/30 transition-colors">
                                        <td className="p-4 text-sm font-semibold text-text-primary">
                                            <span className="text-mint font-bold text-lg mr-1">+</span> Additional Stock <br /><span className="text-[10px] font-semibold text-text-muted tracking-wider">(Extra received this shift)</span>
                                        </td>
                                        {contrastTypes.map(c => {
                                            const item = shiftData.items.find(i => i.contrastTypeId === c.id)!;
                                            return (
                                                <td key={`add-${c.id}`} className="p-3 border-l border-white/30">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <input type="number" min="0" value={item.additionalStockMls || ''} onChange={(e) => handleShiftItemChange(shiftName, c.id, 'additionalStockMls', parseInt(e.target.value) || 0)} className="w-full bg-white/50 border-2 border-transparent rounded-full px-2 py-2 text-center text-sm font-bold text-text-primary focus:bg-white focus:border-black/20 outline-none transition-all shadow-sm" placeholder="0" />
                                                        <input type="number" min="0" value={item.additionalStockBottles || ''} onChange={(e) => handleShiftItemChange(shiftName, c.id, 'additionalStockBottles', parseInt(e.target.value) || 0)} className="w-full bg-white/50 border-2 border-transparent rounded-full px-2 py-2 text-center text-sm font-bold text-text-primary focus:bg-white focus:border-black/20 outline-none transition-all shadow-sm" placeholder="0" />
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                )}

                                {/* 3. Consumption Row */}
                                <tr className="border-b border-black/5 hover:bg-white/30 transition-colors">
                                    <td className="p-4 text-sm font-semibold text-text-primary">
                                        Total Consumption
                                    </td>
                                    {contrastTypes.map(c => {
                                        const item = shiftData.items.find(i => i.contrastTypeId === c.id)!;
                                        return (
                                            <td key={`cons-${c.id}`} className="p-3 border-l border-white/30">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <input type="number" min="0" value={item.amountConsumedMls || ''} onChange={(e) => handleShiftItemChange(shiftName, c.id, 'amountConsumedMls', parseInt(e.target.value) || 0)} className="w-full bg-white/50 border-2 border-transparent rounded-full px-2 py-2 text-center text-sm font-bold text-text-primary focus:bg-white focus:border-black/20 outline-none transition-all shadow-sm" placeholder="0" />
                                                    <input type="number" min="0" value={item.amountConsumedBottles || ''} onChange={(e) => handleShiftItemChange(shiftName, c.id, 'amountConsumedBottles', parseInt(e.target.value) || 0)} className="w-full bg-white/50 border-2 border-transparent rounded-full px-2 py-2 text-center text-sm font-bold text-text-primary focus:bg-white focus:border-black/20 outline-none transition-all shadow-sm" placeholder="0" />
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>

                                {/* 4. Outstanding Row */}
                                <tr className="bg-primary-50 border-t-2 border-primary-200">
                                    <td className="p-3 text-sm font-semibold text-primary-800 rounded-bl-xl border-l-4 border-l-primary-500">
                                        Outstanding Stock <br /><span className="text-[10px] font-medium text-primary-700/70">(Received - Consumption)</span>
                                    </td>
                                    {contrastTypes.map(c => {
                                        const item = shiftData.items.find(i => i.contrastTypeId === c.id)!;
                                        return (
                                            <td key={`out-${c.id}`} className="p-3 border-l border-primary-200/50">
                                                <div className="grid grid-cols-2 gap-px">
                                                    <div className={`w-full text-center text-sm font-semibold tracking-wide ${item.outstandingMls < 0 ? 'text-red-600' : 'text-primary-900'}`}>{item.outstandingMls}</div>
                                                    <div className={`w-full text-center text-sm font-semibold tracking-wide ${item.outstandingBottles < 0 ? 'text-red-600' : 'text-primary-900'}`}>{item.outstandingBottles}</div>
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Progress Bars */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-b border-surface-hover/50 mt-2">
                        {contrastTypes.map(c => {
                            const item = shiftData.items.find(i => i.contrastTypeId === c.id)!;
                            const percent = item.totalReceivedMls > 0 ? Math.min(100, Math.round((item.amountConsumedMls / item.totalReceivedMls) * 100)) : 0;
                            return (
                                <div key={`prog-${c.id}`} className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs font-semibold text-text-primary tracking-wide">{c.name}</span>
                                        <span className="text-[10px] font-semibold text-text-secondary">{percent}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-surface-hover/80 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary-300 transition-all duration-500" style={{ width: `${percent}%` }}></div>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-medium text-text-secondary">
                                        <div>Used:<br /><span className="text-text-primary text-xs font-semibold">{item.amountConsumedMls} mls</span></div>
                                        <div className="text-right">Total:<br /><span className="text-text-primary text-xs font-semibold">{item.totalReceivedMls} mls</span></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Sign Off Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 pb-2 border-t border-black/5 mx-6">
                        <div className="bg-white/40 rounded-[1.5rem] p-5 border border-white/60 shadow-sm backdrop-blur-md">
                            <label className="text-sm font-bold text-text-secondary tracking-widest flex items-center gap-2 mb-3"><div className="w-3 h-3 rounded-full bg-mint" /> Handed Over To</label>
                            <input type="text" placeholder="Enter staff name" value={shiftData.handedOverTo} onChange={e => updateShiftDetails(shiftName, 'handedOverTo', e.target.value)} className="w-full bg-transparent border-b-2 border-black/10 pb-2 text-lg outline-none focus:border-black transition-colors font-semibold text-text-primary placeholder:text-text-muted placeholder:font-medium" />
                        </div>
                        <div className="bg-white/40 rounded-[1.5rem] p-5 border border-white/60 shadow-sm backdrop-blur-md">
                            <label className="text-sm font-bold text-text-secondary tracking-widest flex items-center gap-2 mb-3"><div className="w-3 h-3 rounded-sm bg-yellow" /> Calculated By</label>
                            <input type="text" placeholder="Enter staff name" value={shiftData.calculatedBy} onChange={e => updateShiftDetails(shiftName, 'calculatedBy', e.target.value)} className="w-full bg-transparent border-b-2 border-black/10 pb-2 text-lg outline-none focus:border-black transition-colors font-semibold text-text-primary placeholder:text-text-muted placeholder:font-medium" />
                        </div>
                        <div className="bg-black text-white rounded-[1.5rem] p-5 shadow-lg flex flex-col justify-center relative overflow-hidden group">
                            <label className="text-sm font-bold text-white/60 tracking-widest flex items-center gap-2 mb-3 z-10"><div className="w-3 h-3 rounded-sm border-2 border-white/30" /> Verification</label>
                            <label className="flex items-center gap-4 cursor-pointer z-10">
                                <div className={`w-8 h-8 rounded-full border-[3px] flex items-center justify-center transition-colors ${shiftData.isVerified ? 'border-mint bg-mint text-text-primary' : 'border-white/30 group-hover:border-white/50'}`}>
                                    {shiftData.isVerified && <CheckCircle className="w-5 h-5 font-bold" />}
                                </div>
                                <input type="checkbox" checked={shiftData.isVerified} onChange={e => updateShiftDetails(shiftName, 'isVerified', e.target.checked)} className="hidden" />
                                <span className="text-sm font-semibold text-white tracking-wide">I attest to the correctness</span>
                            </label>
                        </div>
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
            />

            {successMessage && (
                <div className="p-4 bg-green-50/80 border border-green-200 text-green-700 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">{successMessage}</span>
                </div>
            )}

            <Tabs
                items={[
                    { label: 'Activity Log', value: 'activity', icon: <Activity className="w-5 h-5" /> },
                    { label: 'Contrast Log', value: 'contrast', icon: <PieChartIcon className="w-5 h-5" /> }
                ]}
                activeValue={activeTab}
                onChange={(value) => setActiveTab(value as any)}
            />

            {activeTab === 'activity' && (
                <form onSubmit={handleActivitySubmit} className="space-y-8 animate-in fade-in relative">
                    {/* General Information */}
                    <Card>
                        <h3 className="text-xl font-semibold mb-6 flex items-center gap-2 text-text-primary">
                            <FileText className="w-6 h-6 text-primary" />
                            General Information
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                            <Select label="Modality" value={modalityId} onChange={(e) => setModalityId(e.target.value)} required>
                                <option value="" disabled>Select Modality</option>
                                {modalities.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </Select>
                            <Select label="Location (Optional)" value={locationId} onChange={(e) => setLocationId(e.target.value)}>
                                <option value="">None</option>
                                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                            </Select>
                        </div>
                    </Card>

                    <Card>
                        <h3 className="text-xl font-semibold mb-6 text-text-primary">Investigations & Film Usage</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Input label="Total Investigations" type="number" min="0" value={totalInvestigations} onChange={(e) => setTotalInvestigations(Number(e.target.value))} required />
                            <Input label="Film 10x12 Used" type="number" min="0" value={film10x12} onChange={(e) => setFilm10x12(Number(e.target.value))} />
                            <Input label="Film 14x17 Used" type="number" min="0" value={film14x17} onChange={(e) => setFilm14x17(Number(e.target.value))} />
                            <Input
                                label="Revenue Amount"
                                type="number"
                                min="0"
                                value={revenue}
                                onChange={(e) => setRevenue(Number(e.target.value))}
                                leftIcon={<span className="text-text-secondary font-medium">₦</span>}
                                className="pl-10"
                            />
                        </div>
                    </Card>

                    <div className="pt-2 flex justify-end">
                        <Button type="submit" size="lg" className="w-full md:w-auto">
                            Save Activity Log
                        </Button>
                    </div>
                </form>
            )}

            {activeTab === 'contrast' && (
                <div className="animate-in fade-in space-y-8">
                    {/* Header Controls */}
                    <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-8 mt-2">
                        <div className="flex flex-col">
                            <h3 className="text-xs font-semibold text-text-secondary tracking-wider mb-1">BT Health & Diagnostics Centre</h3>
                            <h2 className="text-2xl font-bold text-text-primary">Daily Contrast Consumption</h2>
                            <p className="text-text-secondary font-medium mt-1">
                                {new Date(contrastDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                            </p>
                        </div>

                        {/* Custom Date Navigation Carousel */}
                        <div className="flex items-center gap-1 md:gap-2">
                            <button onClick={() => setDateOffset(prev => prev - 7)} className="p-1.5 md:p-2 text-text-secondary hover:text-text-primary hover:bg-surface-hover/50 rounded-full transition-colors">
                                <ChevronLeft className="w-5 h-5 opacity-40" />
                            </button>

                            <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar">
                                {visibleDates.map(d => {
                                    const dateStr = d.toISOString().split('T')[0];
                                    const isSelected = dateStr === contrastDate;
                                    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
                                    const dayNum = d.getDate();

                                    return (
                                        <button
                                            key={dateStr}
                                            onClick={() => setContrastDate(dateStr)}
                                            className={`flex flex-col items-center justify-center min-w-[3.5rem] py-2 rounded-2xl transition-all ${isSelected ? 'bg-[#1E5C46] text-white shadow-md' : 'text-text-secondary hover:bg-surface-hover/60 hover:text-text-primary'}`}
                                        >
                                            <span className={`text-[10px] font-semibold tracking-wider mb-1 ${isSelected ? 'text-white/80' : 'text-text-secondary/80'}`}>{dayName}</span>
                                            <span className={`text-lg font-bold leading-none ${isSelected ? 'text-white' : 'text-text-primary'}`}>{dayNum}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            <button onClick={() => setDateOffset(prev => prev + 7)} className="p-1.5 md:p-2 text-text-secondary hover:text-text-primary hover:bg-surface-hover/50 rounded-full transition-colors">
                                <ChevronRight className="w-5 h-5 opacity-40" />
                            </button>

                            <div className="ml-1 md:ml-3 pl-3 md:pl-5 border-l-2 border-surface-hover/50 flex items-center h-12">
                                <Calendar className="w-5 h-5 md:w-6 md:h-6 text-text-secondary opacity-60" />
                            </div>
                        </div>
                    </div>

                    {/* Top Stat Cards matching screenshot directly */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                        <StatCard accentColor="primary" label="Total Received" value={totalDayReceived} unit="mls" />
                        <StatCard accentColor="success" label="Total Consumed" value={totalDayConsumed} unit="mls" />
                        <StatCard accentColor="warning" label="Remaining Stock" value={totalRemaining} unit="mls" />
                        <StatCard accentColor="indigo" label="Contrast Types" value={contrastTypes.length} unit="tracked" />
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-10 gap-8">
                        {/* Static Cards List */}
                        <div className="xl:col-span-7 space-y-6">
                            {renderShiftCard('morning', 'Morning', '8am - 4pm')}
                            {renderShiftCard('afternoon', 'Afternoon', '4pm - 7pm')}
                            {renderShiftCard('night', 'Night', '7pm - 8am')}

                            <div className="pt-2">
                                <Button onClick={handleContrastSubmit} size="lg" icon={Save} className="w-full">
                                    <span className="hidden sm:inline">Save Daily Contrast Records</span><span className="sm:hidden">Save Records</span>
                                </Button>
                            </div>
                        </div>

                        {/* Daily Summary Sidebar (matching screenshot) */}
                        <div className="xl:col-span-3">
                            <div className="bg-white/40 backdrop-blur-3xl p-8 rounded-[2.5rem] shadow-sm border border-white/60 sticky top-6">
                                <h3 className="text-sm font-bold text-text-secondary tracking-widest mb-8">Daily Summary</h3>

                                <div className="relative h-56 w-full mb-10">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={donutData.length > 0 ? donutData : [{ name: 'Empty', value: 1, fill: '#FFFFFF' }]}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={80}
                                                outerRadius={100}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {donutData.length > 0
                                                    ? donutData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)
                                                    : <Cell fill="#FFFFFF" fillOpacity={0.5} />
                                                }
                                            </Pie>
                                            {donutData.length > 0 && <RechartsTooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px 20px', fontWeight: 'bold' }} />}
                                        </PieChart>
                                    </ResponsiveContainer>
                                    {/* Center Text inside Donut */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center mt-2">
                                        <span className="text-[3.5rem] font-bold text-text-primary tracking-tighter leading-none">{totalDayConsumed}</span>
                                        <span className="text-[10px] font-semibold text-text-muted mt-1 tracking-wider">mls used</span>
                                    </div>
                                </div>

                                {/* Legend (Contrast Types breakdown) */}
                                <div className="space-y-4 mb-8">
                                    {contrastTypes.map((c, i) => {
                                        const typeTotal = shifts.morning.items.find(item => item.contrastTypeId === c.id)!.amountConsumedMls
                                            + shifts.afternoon.items.find(item => item.contrastTypeId === c.id)!.amountConsumedMls
                                            + shifts.night.items.find(item => item.contrastTypeId === c.id)!.amountConsumedMls;

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
                                    <h4 className="text-xs font-semibold text-text-secondary mb-5 tracking-wide">By Shift</h4>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-text-secondary font-medium tracking-wide">Morning</span>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-1 bg-surface-hover rounded-full overflow-hidden">
                                                    <div className="h-full bg-[#31A5F5]" style={{ width: totalDayConsumed > 0 ? `${(shifts.morning.items.reduce((s, i) => s + i.amountConsumedMls, 0) / totalDayConsumed) * 100}%` : '0%' }}></div>
                                                </div>
                                                <span className="font-semibold text-text-primary w-6 text-right tracking-wide">
                                                    {shifts.morning.items.reduce((s, i) => s + i.amountConsumedMls, 0)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-text-secondary font-medium tracking-wide">Afternoon</span>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-1 bg-surface-hover rounded-full overflow-hidden">
                                                    <div className="h-full bg-[#49CBA4]" style={{ width: totalDayConsumed > 0 ? `${(shifts.afternoon.items.reduce((s, i) => s + i.amountConsumedMls, 0) / totalDayConsumed) * 100}%` : '0%' }}></div>
                                                </div>
                                                <span className="font-semibold text-text-primary w-6 text-right tracking-wide">
                                                    {shifts.afternoon.items.reduce((s, i) => s + i.amountConsumedMls, 0)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-text-secondary font-medium tracking-wide">Night</span>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-1 bg-surface-hover rounded-full overflow-hidden">
                                                    <div className="h-full bg-[#0F172A]" style={{ width: totalDayConsumed > 0 ? `${(shifts.night.items.reduce((s, i) => s + i.amountConsumedMls, 0) / totalDayConsumed) * 100}%` : '0%' }}></div>
                                                </div>
                                                <span className="font-semibold text-text-primary w-6 text-right tracking-wide">
                                                    {shifts.night.items.reduce((s, i) => s + i.amountConsumedMls, 0)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
