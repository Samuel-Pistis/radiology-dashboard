import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Calendar, Activity, Droplet, FileBarChart, Spline } from 'lucide-react';
import { WeeklyReportGenerator } from '../components/WeeklyReportGenerator';
import { WeeklyComparison } from '../components/WeeklyComparison';

export const Reports: React.FC = () => {
    const { activityLogs, contrastRecords, modalities, contrastTypes } = useAppContext();
    const [activeTab, setActiveTab] = useState<'activity' | 'contrast' | 'generator' | 'comparison'>('activity');
    const [filterDate, setFilterDate] = useState('');

    const filteredActivity = filterDate
        ? activityLogs.filter(log => log.date === filterDate)
        : activityLogs;

    const filteredContrast = filterDate
        ? contrastRecords.filter(log => log.date === filterDate)
        : contrastRecords;

    const flatContrastReports = filteredContrast.flatMap(record => {
        return contrastTypes.map(cType => {
            const mEntry = record.morning.items.find(i => i.contrastTypeId === cType.id) || { additionalStockMls: 0, amountConsumedMls: 0 };
            const aEntry = record.afternoon.items.find(i => i.contrastTypeId === cType.id) || { additionalStockMls: 0, amountConsumedMls: 0 };
            const nEntry = record.night.items.find(i => i.contrastTypeId === cType.id) || { additionalStockMls: 0, amountConsumedMls: 0 };

            const totalReceived = mEntry.additionalStockMls + aEntry.additionalStockMls + nEntry.additionalStockMls;
            const totalConsumed = mEntry.amountConsumedMls + aEntry.amountConsumedMls + nEntry.amountConsumedMls;

            if (totalReceived > 0 || totalConsumed > 0) {
                return {
                    id: `${record.id}-${cType.id}`,
                    date: record.date,
                    typeName: cType.name,
                    received: totalReceived,
                    consumed: totalConsumed
                };
            }
            return null;
        }).filter(Boolean);
    });

    const getModalityName = (id: string) => modalities.find(m => m.id === id)?.name || 'Unknown';

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-text-primary">Reports</h2>
                    <p className="text-text-secondary font-semibold mt-1">Review historical activity, contrast usage, and generate summaries.</p>
                </div>
                {activeTab !== 'generator' && activeTab !== 'comparison' && ( // Hide date filter when using generator/comparison as they have their own
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full md:w-auto">
                        <label className="text-[10px] font-bold tracking-widest text-text-secondary flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-mint stroke-[3]" /> Filter
                        </label>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <input
                                type="date"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                className="rad-input w-full sm:w-auto"
                            />
                            {filterDate && (
                                <button onClick={() => setFilterDate('')} className="text-sm font-bold text-text-muted hover:text-text-primary transition-colors whitespace-nowrap px-2">
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex overflow-x-auto hide-scrollbar space-x-2 border-b-2 border-border mb-8 pb-px">
                <button
                    onClick={() => setActiveTab('activity')}
                    className={`flex items-center gap-2 px-6 md:px-8 py-4 font-bold transition-colors rounded-t-2xl whitespace-nowrap border-b-2 -mb-[2px] ${activeTab === 'activity' ? 'border-primary text-text-primary bg-surface shadow-sm' : 'border-transparent text-text-muted hover:text-text-primary hover:bg-surface-hover/50'
                        }`}
                >
                    <Activity className={`w-5 h-5 ${activeTab === 'activity' ? 'stroke-[3]' : ''}`} />
                    Activity Reports
                </button>
                <button
                    onClick={() => setActiveTab('contrast')}
                    className={`flex items-center gap-2 px-6 md:px-8 py-4 font-bold transition-colors rounded-t-2xl whitespace-nowrap border-b-2 -mb-[2px] ${activeTab === 'contrast' ? 'border-primary text-text-primary bg-surface shadow-sm' : 'border-transparent text-text-muted hover:text-text-primary hover:bg-surface-hover/50'
                        }`}
                >
                    <Droplet className={`w-5 h-5 ${activeTab === 'contrast' ? 'stroke-[3]' : ''}`} />
                    Contrast Reports
                </button>
                <button
                    onClick={() => setActiveTab('generator')}
                    className={`flex items-center gap-2 px-6 md:px-8 py-4 font-bold transition-colors rounded-t-2xl whitespace-nowrap border-b-2 -mb-[2px] ${activeTab === 'generator' ? 'border-primary text-text-primary bg-surface shadow-sm' : 'border-transparent text-text-muted hover:text-text-primary hover:bg-surface-hover/50'
                        }`}
                >
                    <FileBarChart className={`w-5 h-5 ${activeTab === 'generator' ? 'stroke-[3]' : ''}`} />
                    Generate Weekly Report
                </button>
                <button
                    onClick={() => setActiveTab('comparison')}
                    className={`flex items-center gap-2 px-6 md:px-8 py-4 font-bold transition-colors rounded-t-2xl whitespace-nowrap border-b-2 -mb-[2px] ${activeTab === 'comparison' ? 'border-primary text-text-primary bg-surface shadow-sm' : 'border-transparent text-text-muted hover:text-text-primary hover:bg-surface-hover/50'
                        }`}
                >
                    <Spline className={`w-5 h-5 ${activeTab === 'comparison' ? 'stroke-[3]' : ''}`} />
                    Performance Comparison
                </button>
            </div>

            <div className="w-full">
                {activeTab === 'activity' ? (
                    <div className="rad-card p-0 overflow-hidden">
                        {filteredActivity.length === 0 ? (
                            <div className="p-8 md:p-16 text-center text-text-muted">
                                <Activity className="w-16 h-16 mx-auto mb-6 text-black/20 stroke-[1.5]" />
                                <p className="font-bold text-2xl text-text-primary tracking-tight mb-2">No activity logs found</p>
                                <p className="font-semibold">Try adjusting your date requirements.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-surface-hover text-text-secondary border-b border-border">
                                            <th className="p-6 font-bold text-[10px] tracking-widest">Date</th>
                                            <th className="p-6 font-bold text-[10px] tracking-widest">Modality</th>
                                            <th className="p-6 font-bold text-[10px] tracking-widest text-center">Investigations</th>
                                            <th className="p-6 font-bold text-[10px] tracking-widest text-center">10x12 Film</th>
                                            <th className="p-6 font-bold text-[10px] tracking-widest text-center">14x17 Film</th>
                                            <th className="p-6 font-bold text-[10px] tracking-widest text-right">Revenue (₦)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border text-sm">
                                        {filteredActivity.map(log => (
                                            <tr key={log.id} className="hover:bg-surface-hover/50 transition-colors">
                                                <td className="p-6 whitespace-nowrap font-semibold text-text-primary">{log.date}</td>
                                                <td className="p-6"><span className="bg-surface border border-border text-text-primary px-4 py-2 rounded-full text-xs font-bold shadow-sm">{getModalityName(log.modalityId)}</span></td>
                                                <td className="p-6 text-center font-bold text-text-primary text-lg">{log.totalInvestigations}</td>
                                                <td className="p-6 text-center text-text-secondary font-semibold">{log.film10x12Used}</td>
                                                <td className="p-6 text-center text-text-secondary font-semibold">{log.film14x17Used}</td>
                                                <td className="p-6 text-right font-bold text-text-primary text-lg">₦{log.revenueAmount?.toLocaleString() || 0}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ) : activeTab === 'contrast' ? (
                    <div className="rad-card p-0 overflow-hidden">
                        {flatContrastReports.length === 0 ? (
                            <div className="p-16 text-center text-text-muted">
                                <Droplet className="w-16 h-16 mx-auto mb-6 text-black/20 stroke-[1.5]" />
                                <p className="font-bold text-2xl text-text-primary tracking-tight mb-2">No contrast logs found</p>
                                <p className="font-semibold">Try adjusting your date requirements.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-surface-hover text-text-secondary border-b border-border">
                                            <th className="p-6 font-bold text-[10px] tracking-widest">Date</th>
                                            <th className="p-6 font-bold text-[10px] tracking-widest">Contrast Type</th>
                                            <th className="p-6 font-bold text-[10px] tracking-widest text-center">Total Received (ML)</th>
                                            <th className="p-6 font-bold text-[10px] tracking-widest text-right">Total Consumed (ML)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border text-sm">
                                        {flatContrastReports.map((log: any) => (
                                            <tr key={log.id} className="hover:bg-surface-hover/50 transition-colors">
                                                <td className="p-6 whitespace-nowrap font-semibold text-text-primary">{log.date}</td>
                                                <td className="p-6"><span className="bg-surface border border-border text-text-primary px-4 py-2 rounded-full text-xs font-bold shadow-sm">{log.typeName}</span></td>
                                                <td className="p-6 text-center text-text-secondary font-semibold">{log.received} ml</td>
                                                <td className="p-6 text-right font-bold text-text-primary text-lg">{log.consumed} ml</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ) : activeTab === 'generator' ? (
                    <WeeklyReportGenerator />
                ) : (
                    <WeeklyComparison />
                )}
            </div>
        </div>
    );
};
