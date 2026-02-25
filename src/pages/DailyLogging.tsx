import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Activity, CheckCircle, Droplets, ChevronDown, ChevronUp, Save, FileText, PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import type { ShiftRecord, DailyContrastRecord } from '../types';

export const DailyLogging: React.FC = () => {
    const { modalities, locations, contrastTypes, addActivityLog, saveContrastRecord, contrastRecords } = useAppContext();

    const [activeTab, setActiveTab] = useState<'activity' | 'contrast'>('activity');
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

    const initItems = () => contrastTypes.map(c => ({ contrastTypeId: c.id, additionalStock: 0, amountConsumed: 0 }));
    const defaultShift = (): ShiftRecord => ({ items: initItems(), handedOverTo: '', calculatedBy: '', isVerified: false });

    const [shifts, setShifts] = useState({
        morning: defaultShift(),
        afternoon: defaultShift(),
        night: defaultShift()
    });

    useEffect(() => {
        const existing = contrastRecords.find(r => r.date === contrastDate);
        if (existing) {
            setShifts({
                morning: { ...existing.morning },
                afternoon: { ...existing.afternoon },
                night: { ...existing.night }
            });
        } else {
            setShifts({ morning: defaultShift(), afternoon: defaultShift(), night: defaultShift() });
        }
    }, [contrastDate, contrastRecords, contrastTypes]);

    const updateShiftItem = (shiftName: 'morning' | 'afternoon' | 'night', typeId: string, field: 'additionalStock' | 'amountConsumed', value: number) => {
        setShifts(prev => {
            const currentShift = prev[shiftName];
            // Ensure backwards compatibility if types were added
            let newItems = currentShift.items;
            if (!newItems.find(i => i.contrastTypeId === typeId)) {
                newItems = [...newItems, { contrastTypeId: typeId, additionalStock: 0, amountConsumed: 0 }];
            }
            newItems = newItems.map(item =>
                item.contrastTypeId === typeId ? { ...item, [field]: value } : item
            );
            return { ...prev, [shiftName]: { ...currentShift, items: newItems } };
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
        const morning = shifts.morning.items.reduce((s, i) => s + (i.amountConsumed || 0), 0);
        const afternoon = shifts.afternoon.items.reduce((s, i) => s + (i.amountConsumed || 0), 0);
        const night = shifts.night.items.reduce((s, i) => s + (i.amountConsumed || 0), 0);

        return [
            { name: 'Morning', value: morning, fill: '#31A5F5' },
            { name: 'Afternoon', value: afternoon, fill: '#f59e0b' },
            { name: 'Night', value: night, fill: '#8b5cf6' }
        ].filter(d => d.value > 0);
    }, [shifts]);

    const inputClasses = "w-full bg-background border-none rounded-xl px-4 py-3 text-text-primary focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-inner";

    const renderShiftAccordion = (shiftName: 'morning' | 'afternoon' | 'night', title: string) => {
        const isExpanded = expandedShift === shiftName;
        const shiftData = shifts[shiftName];

        return (
            <div className={`bg-surface rounded-2xl border ${isExpanded ? 'border-primary-200' : 'border-surface-hover'} overflow-hidden shadow-sm transition-all mb-4`}>
                <button
                    type="button"
                    onClick={() => setExpandedShift(isExpanded ? null : shiftName)}
                    className="w-full flex justify-between items-center p-5 bg-background/50 hover:bg-surface-hover/50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${shiftName === 'morning' ? 'bg-primary-500' : shiftName === 'afternoon' ? 'bg-amber-500' : 'bg-purple-500'}`} />
                        <h4 className="font-bold text-text-primary uppercase tracking-wide">{title} Shift</h4>
                    </div>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-text-secondary" /> : <ChevronDown className="w-5 h-5 text-text-secondary" />}
                </button>

                {isExpanded && (
                    <div className="p-6 border-t border-surface-hover/50 space-y-6">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="text-text-secondary border-b border-surface-hover">
                                    <tr>
                                        <th className="pb-3 font-semibold">Contrast Type</th>
                                        <th className="pb-3 font-semibold text-center">Added / Received (ML)</th>
                                        <th className="pb-3 font-semibold text-center">Consumed (ML)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-surface-hover/30 text-text-primary">
                                    {contrastTypes.map(c => {
                                        const item = shiftData.items.find(i => i.contrastTypeId === c.id) || { additionalStock: 0, amountConsumed: 0 };
                                        return (
                                            <tr key={c.id}>
                                                <td className="py-3 font-semibold">{c.name}</td>
                                                <td className="py-3 text-center">
                                                    <input
                                                        type="number" min="0" placeholder="0"
                                                        value={item.additionalStock || ''}
                                                        onChange={e => updateShiftItem(shiftName, c.id, 'additionalStock', Number(e.target.value))}
                                                        className="w-24 bg-background border border-surface-hover rounded-lg px-3 py-1.5 text-center focus:ring-2 focus:ring-primary-500 outline-none"
                                                    />
                                                </td>
                                                <td className="py-3 text-center">
                                                    <input
                                                        type="number" min="0" placeholder="0"
                                                        value={item.amountConsumed || ''}
                                                        onChange={e => updateShiftItem(shiftName, c.id, 'amountConsumed', Number(e.target.value))}
                                                        className="w-24 bg-background border border-surface-hover rounded-lg px-3 py-1.5 text-center focus:ring-2 focus:ring-primary-500 outline-none"
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-background p-4 rounded-xl border border-surface-hover/30">
                            <div>
                                <label className="text-xs font-semibold text-text-secondary block mb-1">Handed Over To</label>
                                <input type="text" placeholder="Name" value={shiftData.handedOverTo} onChange={e => updateShiftDetails(shiftName, 'handedOverTo', e.target.value)} className="w-full bg-surface border border-surface-hover rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary-500" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-text-secondary block mb-1">Calculated By</label>
                                <input type="text" placeholder="Name" value={shiftData.calculatedBy} onChange={e => updateShiftDetails(shiftName, 'calculatedBy', e.target.value)} className="w-full bg-surface border border-surface-hover rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary-500" />
                            </div>
                            <div className="flex items-center gap-3 md:pt-6">
                                <input type="checkbox" checked={shiftData.isVerified} onChange={e => updateShiftDetails(shiftName, 'isVerified', e.target.checked)} className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500" />
                                <span className="text-sm font-semibold text-text-primary">Verify Shift Values</span>
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

            <div className="flex space-x-2 border-b border-surface-hover/50">
                <button
                    onClick={() => setActiveTab('activity')}
                    className={`flex items-center gap-2 px-6 py-4 font-semibold transition-colors border-b-2 ${activeTab === 'activity' ? 'border-primary-500 text-primary-600 bg-primary-50/50 rounded-t-xl' : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-hover/30 rounded-t-xl'
                        }`}
                >
                    <Activity className="w-5 h-5" />
                    Activity Log
                </button>
                <button
                    onClick={() => setActiveTab('contrast')}
                    className={`flex items-center gap-2 px-6 py-4 font-semibold transition-colors border-b-2 ${activeTab === 'contrast' ? 'border-primary-500 text-primary-600 bg-primary-50/50 rounded-t-xl' : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-hover/30 rounded-t-xl'
                        }`}
                >
                    <Droplets className="w-5 h-5" />
                    Current Contrast Tracker
                </button>
            </div>

            {activeTab === 'activity' && (
                <form onSubmit={handleActivitySubmit} className="space-y-8 animate-in fade-in relative">
                    {/* General Information */}
                    <div className="bg-surface rounded-3xl p-8 shadow-sm">
                        <h3 className="text-xl font-semibold mb-6 flex items-center gap-2 text-text-primary">
                            <FileText className="w-6 h-6 text-primary-500" />
                            General Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    <div className="bg-surface rounded-3xl p-8 shadow-sm">
                        <h3 className="text-xl font-semibold mb-6 text-text-primary">Investigations & Film Usage</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-surface p-6 rounded-3xl shadow-sm border border-surface-hover/30 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                                <FileText className="w-5 h-5 text-secondary-500" /> Log Shift Consumption
                            </h3>
                            <input type="date" value={contrastDate} onChange={e => setContrastDate(e.target.value)} className={`${inputClasses} w-auto py-2 font-medium`} />
                        </div>

                        <div>
                            {renderShiftAccordion('morning', 'Morning')}
                            {renderShiftAccordion('afternoon', 'Afternoon')}
                            {renderShiftAccordion('night', 'Night')}
                        </div>

                        <div className="pt-2">
                            <button onClick={handleContrastSubmit} className="flex justify-center items-center gap-2 w-full bg-secondary-500 hover:bg-secondary-600 text-white px-10 py-4 rounded-2xl font-bold text-lg transition-all duration-300 shadow-lg shadow-secondary-500/30 hover:shadow-secondary-500/50 hover:-translate-y-1">
                                <Save className="w-5 h-5" /> Save Daily Contrast Records
                            </button>
                        </div>
                    </div>

                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-surface p-8 rounded-3xl shadow-sm border border-surface-hover/30 h-fit">
                            <h3 className="text-xl font-bold text-text-primary flex items-center gap-2 mb-6 pb-4 border-b border-surface-hover/50">
                                <PieChartIcon className="w-5 h-5 text-primary-500" /> Daily Summary
                            </h3>

                            {donutData.length === 0 ? (
                                <div className="text-center py-12 text-text-secondary">
                                    <Droplets className="w-12 h-12 mx-auto mb-3 text-surface-hover" />
                                    <p className="font-semibold text-text-primary">No consumption logged yet</p>
                                    <p className="text-sm">Log contrast amounts to view chart.</p>
                                </div>
                            ) : (
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={donutData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {donutData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip
                                                contentStyle={{ backgroundColor: '#ffffff', border: 'none', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: '#0F172A' }}
                                                itemStyle={{ color: '#0F172A', fontWeight: 'bold' }}
                                            />
                                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            )}

                            <div className="mt-6 pt-6 border-t border-surface-hover/50">
                                <div className="flex justify-between items-center text-sm font-bold text-text-secondary mb-2">
                                    <span>Total Day Consumption:</span>
                                    <span className="text-xl text-primary-600">
                                        {donutData.reduce((s, d) => s + d.value, 0)} <span className="text-xs text-text-secondary font-medium">ML</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

