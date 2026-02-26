import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Activity, CheckCircle, ChevronDown, ChevronUp, Save, FileText, PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
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
    const [expandedShift, setExpandedShift] = useState<'morning' | 'afternoon' | 'night' | null>('morning');

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
            { name: 'Morning', value: morning, fill: '#31A5F5' },
            { name: 'Afternoon', value: afternoon, fill: '#49CBA4' },
            { name: 'Night', value: night, fill: '#0F172A' }
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


    const inputClasses = "w-full bg-background border-none rounded-xl px-4 py-3 text-text-primary focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-inner";

    const getShiftIcon = (name: string) => {
        if (name === 'morning') return <div className="w-6 h-6 rounded bg-primary-100 flex items-center justify-center text-primary-500 font-bold text-xs shadow-sm">☀</div>;
        if (name === 'afternoon') return <div className="w-6 h-6 rounded bg-green-100 flex items-center justify-center text-green-600 font-bold text-xs shadow-sm">☼</div>;
        return <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs shadow-sm">☽</div>;
    };

    const renderShiftAccordion = (shiftName: 'morning' | 'afternoon' | 'night', title: string, timeRange: string) => {
        const isExpanded = expandedShift === shiftName;
        const shiftData = shifts[shiftName];
        const isMorning = shiftName === 'morning';

        return (
            <div className={`bg-surface rounded-3xl border ${isExpanded ? 'border-surface-hover shadow-md' : 'border-surface-hover/50 shadow-sm'} overflow-hidden transition-all mb-6`}>
                <button
                    type="button"
                    onClick={() => setExpandedShift(isExpanded ? null : shiftName)}
                    className="w-full flex justify-between items-center p-6 bg-gradient-to-r hover:from-surface-hover/30 hover:to-transparent transition-colors"
                >
                    <div className="flex items-center gap-4">
                        {getShiftIcon(shiftName)}
                        <div className="text-left">
                            <h4 className="font-bold text-lg text-text-primary">{title} Shift</h4>
                            <p className="text-xs font-semibold text-text-secondary">{timeRange}</p>
                        </div>
                    </div>
                    <div className="bg-surface-hover/30 p-2 rounded-full">
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-text-secondary" /> : <ChevronDown className="w-5 h-5 text-text-secondary" />}
                    </div>
                </button>

                {isExpanded && (
                    <div className="p-6 border-t border-surface-hover/30">
                        <div className="overflow-x-auto pb-4">
                            <table className="w-full min-w-[800px] border-collapse">
                                {/* HTML Table Header */}
                                <thead>
                                    <tr>
                                        <th className="p-3 text-left font-semibold text-sm text-text-secondary bg-surface-hover/10 rounded-tl-xl border-b border-surface-hover">Row Type</th>
                                        {contrastTypes.map(c => (
                                            <th key={c.id} className="p-3 text-center font-bold text-sm text-text-primary bg-surface-hover/10 border-b border-surface-hover border-l">
                                                {c.name}
                                            </th>
                                        ))}
                                    </tr>
                                    <tr>
                                        <th className="p-2 border-b border-surface-hover"></th>
                                        {contrastTypes.map(c => (
                                            <th key={`sub-${c.id}`} className="p-2 border-b border-surface-hover border-l text-xs font-medium text-text-secondary">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <span className="text-center">Total (mls)</span>
                                                    <span className="text-center">Total Bottles</span>
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>

                                {/* HTML Table Body */}
                                <tbody>
                                    {/* 1. Received Row */}
                                    <tr className="border-b border-surface-hover/30 hover:bg-surface-hover/10">
                                        <td className="p-3 text-sm font-semibold text-text-secondary">
                                            Total Qty Received <br /><span className="text-[10px] font-normal text-text-secondary/70">({isMorning ? 'Start stock' : 'Carried over + Additional'})</span>
                                        </td>
                                        {contrastTypes.map(c => {
                                            const item = shiftData.items.find(i => i.contrastTypeId === c.id)!;
                                            return (
                                                <td key={`rec-${c.id}`} className="p-3 border-l border-surface-hover/30">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <input type="number" min="0" value={item.totalReceivedMls || ''} onChange={(e) => handleShiftItemChange(shiftName, c.id, 'totalReceivedMls', parseInt(e.target.value) || 0)} readOnly={!isMorning} className={`w-full bg-background border border-surface-hover rounded-full px-2 py-1.5 text-center text-sm font-medium focus:ring-1 focus:ring-primary-500 outline-none transition-colors ${!isMorning ? 'bg-surface-hover/30 text-text-secondary cursor-not-allowed' : ''}`} placeholder="0" />
                                                        <input type="number" min="0" value={item.totalReceivedBottles || ''} onChange={(e) => handleShiftItemChange(shiftName, c.id, 'totalReceivedBottles', parseInt(e.target.value) || 0)} readOnly={!isMorning} className={`w-full bg-background border border-surface-hover rounded-full px-2 py-1.5 text-center text-sm font-medium focus:ring-1 focus:ring-primary-500 outline-none transition-colors ${!isMorning ? 'bg-surface-hover/30 text-text-secondary cursor-not-allowed' : ''}`} placeholder="0" />
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>

                                    {/* 2. Additional Row */}
                                    {!isMorning && (
                                        <tr className="border-b border-surface-hover/30 hover:bg-surface-hover/10">
                                            <td className="p-3 text-sm font-semibold text-text-secondary">
                                                <span className="text-primary-500">+</span> Additional Stock <br /><span className="text-[10px] font-normal text-text-secondary/70">(Extra received this shift)</span>
                                            </td>
                                            {contrastTypes.map(c => {
                                                const item = shiftData.items.find(i => i.contrastTypeId === c.id)!;
                                                return (
                                                    <td key={`add-${c.id}`} className="p-3 border-l border-surface-hover/30">
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <input type="number" min="0" value={item.additionalStockMls || ''} onChange={(e) => handleShiftItemChange(shiftName, c.id, 'additionalStockMls', parseInt(e.target.value) || 0)} className="w-full bg-background border border-surface-hover rounded-full px-2 py-1.5 text-center text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none transition-colors" placeholder="0" />
                                                            <input type="number" min="0" value={item.additionalStockBottles || ''} onChange={(e) => handleShiftItemChange(shiftName, c.id, 'additionalStockBottles', parseInt(e.target.value) || 0)} className="w-full bg-background border border-surface-hover rounded-full px-2 py-1.5 text-center text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none transition-colors" placeholder="0" />
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    )}

                                    {/* 3. Consumption Row */}
                                    <tr className="border-b border-surface-hover/30 hover:bg-surface-hover/10">
                                        <td className="p-3 text-sm font-semibold text-text-secondary">
                                            Total Consumption
                                        </td>
                                        {contrastTypes.map(c => {
                                            const item = shiftData.items.find(i => i.contrastTypeId === c.id)!;
                                            return (
                                                <td key={`cons-${c.id}`} className="p-3 border-l border-surface-hover/30">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <input type="number" min="0" value={item.amountConsumedMls || ''} onChange={(e) => handleShiftItemChange(shiftName, c.id, 'amountConsumedMls', parseInt(e.target.value) || 0)} className="w-full bg-background border border-surface-hover rounded-full px-2 py-1.5 text-center text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none transition-colors" placeholder="0" />
                                                        <input type="number" min="0" value={item.amountConsumedBottles || ''} onChange={(e) => handleShiftItemChange(shiftName, c.id, 'amountConsumedBottles', parseInt(e.target.value) || 0)} className="w-full bg-background border border-surface-hover rounded-full px-2 py-1.5 text-center text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none transition-colors" placeholder="0" />
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>

                                    {/* 4. Outstanding Row */}
                                    <tr className="bg-[#EAF5F0]">
                                        <td className="p-3 text-sm font-bold text-[#2A7B5F] rounded-bl-xl border-l-4 border-l-[#49CBA4]">
                                            Outstanding Stock <br /><span className="text-[10px] font-medium text-[#2A7B5F]/70">(Received - Consumption)</span>
                                        </td>
                                        {contrastTypes.map(c => {
                                            const item = shiftData.items.find(i => i.contrastTypeId === c.id)!;
                                            return (
                                                <td key={`out-${c.id}`} className="p-3 border-l border-[#49CBA4]/20">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="w-full bg-[#D1EBE1] rounded-full px-2 py-1.5 text-center text-sm font-bold text-[#1E5C46] tracking-wide">{item.outstandingMls}</div>
                                                        <div className="w-full bg-[#D1EBE1] rounded-full px-2 py-1.5 text-center text-sm font-bold text-[#1E5C46] tracking-wide">{item.outstandingBottles}</div>
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
                                            <span className="text-xs font-bold text-text-primary uppercase tracking-wide">{c.name}</span>
                                            <span className="text-[10px] font-bold text-text-secondary">{percent}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-surface-hover/80 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary-300 transition-all duration-500" style={{ width: `${percent}%` }}></div>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-medium text-text-secondary">
                                            <div>Used:<br /><span className="text-text-primary text-xs font-bold">{item.amountConsumedMls} mls</span></div>
                                            <div className="text-right">Total:<br /><span className="text-text-primary text-xs font-bold">{item.totalReceivedMls} mls</span></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Sign Off Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 bg-surface">
                            <div className="bg-background rounded-2xl p-4 border border-surface-hover/40 shadow-sm">
                                <label className="text-xs font-bold text-text-secondary flex items-center gap-2 mb-2"><div className="w-3 h-3 rounded-full bg-[#D0F3FF]" /> Handed Over To</label>
                                <input type="text" placeholder="Enter staff name" value={shiftData.handedOverTo} onChange={e => updateShiftDetails(shiftName, 'handedOverTo', e.target.value)} className="w-full bg-transparent border-b border-surface-hover/60 pb-2 text-sm outline-none focus:border-primary-500 transition-colors font-semibold placeholder:font-normal" />
                            </div>
                            <div className="bg-background rounded-2xl p-4 border border-surface-hover/40 shadow-sm">
                                <label className="text-xs font-bold text-text-secondary flex items-center gap-2 mb-2"><div className="w-3 h-3 rounded-sm bg-[#49CBA4]/40" /> Calculated By</label>
                                <input type="text" placeholder="Enter staff name" value={shiftData.calculatedBy} onChange={e => updateShiftDetails(shiftName, 'calculatedBy', e.target.value)} className="w-full bg-transparent border-b border-surface-hover/60 pb-2 text-sm outline-none focus:border-primary-500 transition-colors font-semibold placeholder:font-normal" />
                            </div>
                            <div className="bg-background rounded-2xl p-4 border border-surface-hover/40 shadow-sm flex flex-col justify-center">
                                <label className="text-xs font-bold text-text-secondary flex items-center gap-2 mb-3"><div className="w-3 h-3 rounded-sm border-2 border-surface-hover" /> Verification</label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${shiftData.isVerified ? 'border-primary-500 bg-primary-500' : 'border-surface-hover group-hover:border-primary-400'}`}>
                                        {shiftData.isVerified && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <input type="checkbox" checked={shiftData.isVerified} onChange={e => updateShiftDetails(shiftName, 'isVerified', e.target.checked)} className="hidden" />
                                    <span className="text-xs font-semibold text-text-primary">I attest to the correctness of this data</span>
                                </label>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-text-primary">Daily Logging</h2>
                <p className="text-text-secondary mt-1">Record daily activity and shift-based contrast usage.</p>
            </div>

            {successMessage && (
                <div className="p-4 bg-green-50/80 border border-green-200 text-green-700 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">{successMessage}</span>
                </div>
            )}

            <div className="flex overflow-x-auto hide-scrollbar space-x-2 border-b border-surface-hover/50 pb-px">
                <button
                    onClick={() => setActiveTab('activity')}
                    className={`flex items-center gap-2 px-4 md:px-6 py-3 md:py-4 font-semibold transition-colors border-b-2 whitespace-nowrap ${activeTab === 'activity' ? 'border-primary-500 text-primary-600 bg-primary-50/50 rounded-t-xl' : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-hover/30 rounded-t-xl'
                        }`}
                >
                    <Activity className="w-5 h-5" />
                    Activity Log
                </button>
                <button
                    onClick={() => setActiveTab('contrast')}
                    className={`flex items-center gap-2 px-4 md:px-6 py-3 md:py-4 font-semibold transition-colors border-b-2 whitespace-nowrap ${activeTab === 'contrast' ? 'border-primary-500 text-primary-600 bg-primary-50/50 rounded-t-xl' : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-hover/30 rounded-t-xl'
                        }`}
                >
                    <PieChartIcon className="w-5 h-5" />
                    Contrast Log
                </button>
            </div>

            {activeTab === 'activity' && (
                <form onSubmit={handleActivitySubmit} className="space-y-8 animate-in fade-in relative">
                    {/* General Information */}
                    <div className="bg-surface rounded-3xl p-6 md:p-8 shadow-sm border border-surface-hover/20">
                        <h3 className="text-xl font-semibold mb-6 flex items-center gap-2 text-text-primary">
                            <FileText className="w-6 h-6 text-primary-500" />
                            General Information
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-secondary">Date</label>
                                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className={inputClasses} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-secondary">Modality</label>
                                <select value={modalityId} onChange={(e) => setModalityId(e.target.value)} required className={inputClasses}>
                                    <option value="" disabled>Select Modality</option>
                                    {modalities.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-secondary">Location (Optional)</label>
                                <select value={locationId} onChange={(e) => setLocationId(e.target.value)} className={inputClasses}>
                                    <option value="">None</option>
                                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Activity & Film Usage */}
                    <div className="bg-surface rounded-3xl p-6 md:p-8 shadow-sm border border-surface-hover/20">
                        <h3 className="text-xl font-semibold mb-6 text-text-primary">Investigations & Film Usage</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-secondary">Total Investigations</label>
                                <input type="number" min="0" value={totalInvestigations} onChange={(e) => setTotalInvestigations(Number(e.target.value))} required className={inputClasses} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-secondary">Film 10x12 Used</label>
                                <input type="number" min="0" value={film10x12} onChange={(e) => setFilm10x12(Number(e.target.value))} className={inputClasses} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-secondary">Film 14x17 Used</label>
                                <input type="number" min="0" value={film14x17} onChange={(e) => setFilm14x17(Number(e.target.value))} className={inputClasses} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-secondary">Revenue Amount</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-medium">₦</span>
                                    <input type="number" min="0" value={revenue} onChange={(e) => setRevenue(Number(e.target.value))} className={`${inputClasses} pl-10`} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                        <button type="submit" className="bg-primary-500 hover:bg-primary-600 text-white px-10 py-4 rounded-2xl font-bold text-lg transition-all duration-300 w-full md:w-auto shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 hover:-translate-y-1">
                            Save Activity Log
                        </button>
                    </div>
                </form>
            )}

            {activeTab === 'contrast' && (
                <div className="animate-in fade-in space-y-8">
                    {/* Header Controls */}
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
                        <div className="flex flex-col">
                            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">BT Health & Diagnostics Centre</h3>
                            <h2 className="text-2xl font-black text-text-primary">Daily Contrast Consumption</h2>
                            <p className="text-text-secondary font-medium mt-1">
                                {new Date(contrastDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                            </p>
                        </div>
                        <input type="date" value={contrastDate} onChange={e => setContrastDate(e.target.value)} className={`${inputClasses} w-full md:w-auto py-2 font-medium shadow-sm border border-surface-hover`} />
                    </div>

                    {/* Top Stat Cards matching screenshot directly */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="bg-surface rounded-2xl p-6 shadow-sm border border-surface-hover/40 flex flex-col justify-center">
                            <h2 className="text-4xl font-black text-text-primary tracking-tight leading-none mb-1">{totalDayReceived}</h2>
                            <p className="text-[10px] font-bold text-text-secondary mb-3">mls</p>
                            <p className="text-xs font-bold text-text-secondary">Total Received</p>
                        </div>
                        <div className="bg-surface rounded-2xl p-6 shadow-sm border border-surface-hover/40 flex flex-col justify-center">
                            <h2 className="text-4xl font-black text-text-primary tracking-tight leading-none mb-1">{totalDayConsumed}</h2>
                            <p className="text-[10px] font-bold text-text-secondary mb-3">mls</p>
                            <p className="text-xs font-bold text-text-secondary">Total Consumed</p>
                        </div>
                        <div className="bg-surface rounded-2xl p-6 shadow-sm border border-surface-hover/40 flex flex-col justify-center">
                            <h2 className="text-4xl font-black text-text-primary tracking-tight leading-none mb-1">{totalRemaining}</h2>
                            <p className="text-[10px] font-bold text-text-secondary mb-3">mls</p>
                            <p className="text-xs font-bold text-text-secondary">Remaining Stock</p>
                        </div>
                        <div className="bg-surface rounded-2xl p-6 shadow-sm border border-surface-hover/40 flex flex-col justify-center">
                            <h2 className="text-4xl font-black text-text-primary tracking-tight leading-none mb-1">{contrastTypes.length}</h2>
                            <p className="text-[10px] font-bold text-text-secondary mb-3">tracked</p>
                            <p className="text-xs font-bold text-text-secondary">Contrast Types</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                        {/* Accordions */}
                        <div className="xl:col-span-3 space-y-2">
                            {renderShiftAccordion('morning', 'Morning', '8:00 AM - 4:00 PM')}
                            {renderShiftAccordion('afternoon', 'Afternoon', '4:00 PM - 7:00 PM')}
                            {renderShiftAccordion('night', 'Night', '7:00 PM - 8:00 AM')}

                            <div className="pt-2">
                                <button onClick={handleContrastSubmit} className="flex justify-center items-center gap-2 w-full bg-slate-800 hover:bg-slate-900 text-white px-6 md:px-10 py-5 rounded-3xl font-bold text-lg transition-all duration-300 shadow-md hover:-translate-y-1">
                                    <Save className="w-5 h-5" /> <span className="hidden sm:inline">Save Daily Contrast Records</span><span className="sm:hidden">Save Records</span>
                                </button>
                            </div>
                        </div>

                        {/* Daily Summary Sidebar (matching screenshot) */}
                        <div className="xl:col-span-1">
                            <div className="bg-surface p-7 rounded-3xl shadow-sm border border-surface-hover/40 sticky top-6">
                                <h3 className="text-sm font-bold text-text-primary mb-6">Daily Summary</h3>

                                <div className="relative h-48 w-full mb-8">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={donutData.length > 0 ? donutData : [{ name: 'Empty', value: 1, fill: '#EAF5F0' }]}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={65}
                                                outerRadius={85}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {donutData.length > 0
                                                    ? donutData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)
                                                    : <Cell fill="#D1EBE1" />
                                                }
                                            </Pie>
                                            {donutData.length > 0 && <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />}
                                        </PieChart>
                                    </ResponsiveContainer>
                                    {/* Center Text inside Donut */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center mt-2">
                                        <span className="text-3xl font-black text-text-primary tracking-tight">{totalDayConsumed}</span>
                                        <span className="text-[10px] font-semibold text-text-secondary mt-1 tracking-wide">mls used</span>
                                    </div>
                                </div>

                                {/* Legend (Contrast Types breakdown) */}
                                <div className="space-y-4 mb-8">
                                    {contrastTypes.map((c, i) => {
                                        const typeTotal = shifts.morning.items.find(item => item.contrastTypeId === c.id)!.amountConsumedMls
                                            + shifts.afternoon.items.find(item => item.contrastTypeId === c.id)!.amountConsumedMls
                                            + shifts.night.items.find(item => item.contrastTypeId === c.id)!.amountConsumedMls;

                                        const colors = ['#2A7B5F', '#49CBA4', '#31A5F5', '#0F172A', '#f59e0b', '#8b5cf6'];

                                        return (
                                            <div key={`leg-${c.id}`} className="flex justify-between items-center text-xs font-bold">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[i % colors.length] }}></div>
                                                    <span className="text-text-primary tracking-wide">{c.name}</span>
                                                </div>
                                                <span className="text-text-primary">{typeTotal}</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="border-t border-surface-hover/50 pt-6 pb-6 space-y-3">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-text-secondary font-medium tracking-wide">Total Stock</span>
                                        <span className="font-bold text-text-primary tracking-wide">{totalDayReceived} mls</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-text-secondary font-medium tracking-wide">Remaining</span>
                                        <span className="font-bold text-text-primary tracking-wide">{totalRemaining} mls</span>
                                    </div>
                                </div>

                                <div className="border-t border-surface-hover/50 pt-6">
                                    <h4 className="text-xs font-bold text-text-secondary mb-5 tracking-wide">By Shift</h4>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-text-secondary font-medium tracking-wide">Morning</span>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-1 bg-surface-hover rounded-full overflow-hidden">
                                                    <div className="h-full bg-[#E2E8F0] w-full"></div>
                                                </div>
                                                <span className="font-bold text-text-primary w-6 text-right tracking-wide">
                                                    {shifts.morning.items.reduce((s, i) => s + i.amountConsumedMls, 0)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-text-secondary font-medium tracking-wide">Afternoon</span>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-1 bg-surface-hover rounded-full overflow-hidden">
                                                    <div className="h-full bg-[#E2E8F0] w-3/4"></div>
                                                </div>
                                                <span className="font-bold text-text-primary w-6 text-right tracking-wide">
                                                    {shifts.afternoon.items.reduce((s, i) => s + i.amountConsumedMls, 0)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-text-secondary font-medium tracking-wide">Night</span>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-1 bg-surface-hover rounded-full overflow-hidden">
                                                    <div className="h-full bg-[#E2E8F0] w-1/2"></div>
                                                </div>
                                                <span className="font-bold text-text-primary w-6 text-right tracking-wide">
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
