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
                    <p className="text-text-secondary mt-1">Review historical activity, contrast usage, and generate summaries.</p>
                </div>
                {activeTab !== 'generator' && activeTab !== 'comparison' && ( // Hide date filter when using generator/comparison as they have their own
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full md:w-auto">
                        <label className="text-sm font-semibold text-text-primary flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary-500" /> Filter
                        </label>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <input
                                type="date"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                className="bg-background border-none rounded-xl px-4 py-2 text-text-primary focus:ring-2 focus:ring-primary-500 outline-none shadow-inner w-full sm:w-auto"
                            />
                            {filterDate && (
                                <button onClick={() => setFilterDate('')} className="text-sm font-bold text-primary-500 hover:text-primary-600 transition-colors whitespace-nowrap">
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex overflow-x-auto hide-scrollbar space-x-2 border-b border-surface-hover/50 mb-8 pb-px">
                <button
                    onClick={() => setActiveTab('activity')}
                    className={`flex items-center gap-2 px-4 md:px-6 py-3 md:py-4 font-semibold transition-colors border-b-2 whitespace-nowrap ${activeTab === 'activity' ? 'border-primary-500 text-primary-600 bg-primary-50/50 rounded-t-xl' : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-hover/30 rounded-t-xl'
                        }`}
                >
                    <Activity className="w-5 h-5" />
                    Activity Reports
                </button>
                <button
                    onClick={() => setActiveTab('contrast')}
                    className={`flex items-center gap-2 px-4 md:px-6 py-3 md:py-4 font-semibold transition-colors border-b-2 whitespace-nowrap ${activeTab === 'contrast' ? 'border-primary-500 text-primary-600 bg-primary-50/50 rounded-t-xl' : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-hover/30 rounded-t-xl'
                        }`}
                >
                    <Droplet className="w-5 h-5" />
                    Contrast Reports
                </button>
                <button
                    onClick={() => setActiveTab('generator')}
                    className={`flex items-center gap-2 px-4 md:px-6 py-3 md:py-4 font-semibold transition-colors border-b-2 whitespace-nowrap ${activeTab === 'generator' ? 'border-primary-500 text-primary-600 bg-primary-50/50 rounded-t-xl' : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-hover/30 rounded-t-xl'
                        }`}
                >
                    <FileBarChart className="w-5 h-5" />
                    Generate Weekly Report
                </button>
                <button
                    onClick={() => setActiveTab('comparison')}
                    className={`flex items-center gap-2 px-4 md:px-6 py-3 md:py-4 font-semibold transition-colors border-b-2 whitespace-nowrap ${activeTab === 'comparison' ? 'border-primary-500 text-primary-600 bg-primary-50/50 rounded-t-xl' : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-hover/30 rounded-t-xl'
                        }`}
                >
                    <Spline className="w-5 h-5" />
                    Performance Comparison
                </button>
            </div>

            <div className="w-full">
                {activeTab === 'activity' ? (
                    <div className="bg-surface rounded-3xl overflow-hidden shadow-sm">
                        {filteredActivity.length === 0 ? (
                            <div className="p-8 md:p-16 text-center text-text-secondary">
                                <Activity className="w-12 h-12 mx-auto mb-4 text-surface-hover" />
                                <p className="font-semibold text-lg text-text-primary">No activity logs found</p>
                                <p>Try adjusting your date requirements.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-background text-text-secondary border-b border-surface-hover/50">
                                            <th className="p-5 font-bold text-xs uppercase tracking-wider">Date</th>
                                            <th className="p-5 font-bold text-xs uppercase tracking-wider">Modality</th>
                                            <th className="p-5 font-bold text-xs uppercase tracking-wider text-center">Investigations</th>
                                            <th className="p-5 font-bold text-xs uppercase tracking-wider text-center">10x12 Film</th>
                                            <th className="p-5 font-bold text-xs uppercase tracking-wider text-center">14x17 Film</th>
                                            <th className="p-5 font-bold text-xs uppercase tracking-wider text-right">Revenue (₦)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-surface-hover/50 text-sm">
                                        {filteredActivity.map(log => (
                                            <tr key={log.id} className="hover:bg-surface-hover/30 transition-colors">
                                                <td className="p-5 whitespace-nowrap font-medium text-text-primary">{log.date}</td>
                                                <td className="p-5"><span className="bg-primary-50 text-primary-600 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">{getModalityName(log.modalityId)}</span></td>
                                                <td className="p-5 text-center font-semibold text-text-primary">{log.totalInvestigations}</td>
                                                <td className="p-5 text-center text-text-secondary font-medium">{log.film10x12Used}</td>
                                                <td className="p-5 text-center text-text-secondary font-medium">{log.film14x17Used}</td>
                                                <td className="p-5 text-right font-bold text-green-600">{log.revenueAmount?.toLocaleString() || 0}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ) : activeTab === 'contrast' ? (
                    <div className="bg-surface rounded-3xl overflow-hidden shadow-sm">
                        {flatContrastReports.length === 0 ? (
                            <div className="p-16 text-center text-text-secondary">
                                <Droplet className="w-12 h-12 mx-auto mb-4 text-surface-hover" />
                                <p className="font-semibold text-lg text-text-primary">No contrast logs found</p>
                                <p>Try adjusting your date requirements.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-background text-text-secondary border-b border-surface-hover/50">
                                            <th className="p-5 font-bold text-xs uppercase tracking-wider">Date</th>
                                            <th className="p-5 font-bold text-xs uppercase tracking-wider">Contrast Type</th>
                                            <th className="p-5 font-bold text-xs uppercase tracking-wider text-center">Total Received (ML)</th>
                                            <th className="p-5 font-bold text-xs uppercase tracking-wider text-right">Total Consumed (ML)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-surface-hover/50 text-sm">
                                        {flatContrastReports.map((log: any) => (
                                            <tr key={log.id} className="hover:bg-surface-hover/30 transition-colors">
                                                <td className="p-5 whitespace-nowrap font-medium text-text-primary">{log.date}</td>
                                                <td className="p-5"><span className="bg-primary-50 text-primary-600 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">{log.typeName}</span></td>
                                                <td className="p-5 text-center text-text-secondary font-medium">{log.received} ml</td>
                                                <td className="p-5 text-right font-bold text-secondary-600">{log.consumed} ml</td>
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
