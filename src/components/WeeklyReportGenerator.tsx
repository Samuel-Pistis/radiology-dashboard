import React, { useState, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { FileDown, FileText, CalendarRange, FileBarChart } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const WeeklyReportGenerator: React.FC = () => {
    const { activityLogs, contrastRecords, weeklyOpsLogs, modalities, contrastTypes } = useAppContext();
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const reportRef = useRef<HTMLDivElement>(null);

    const handleExportPDF = async () => {
        if (!reportRef.current) return;
        setIsGenerating(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 100));
            const canvas = await html2canvas(reportRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();

            const margin = 10;
            const contentWidth = pdfWidth - (margin * 2);
            const contentHeight = (canvas.height * contentWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, contentHeight);
            pdf.save(`Weekly_Report_${startDate}_${endDate}.pdf`);
        } catch (error) {
            console.error("Error generating PDF", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleExportCSV = () => {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += `Weekly Operations Report (${startDate} to ${endDate})\n\n`;

        csvContent += "Investigations by Modality\nModality,Total Investigations,10x12 Film,14x17 Film,Revenue (N)\n";
        modalities.forEach(m => {
            const mLogs = periodActivityLogs.filter(log => log.modalityId === m.id);
            const inv = mLogs.reduce((sum, log) => sum + (log.totalInvestigations || 0), 0);
            const f10 = mLogs.reduce((sum, log) => sum + (log.film10x12Used || 0), 0);
            const f14 = mLogs.reduce((sum, log) => sum + (log.film14x17Used || 0), 0);
            const rev = mLogs.reduce((sum, log) => sum + (log.revenueAmount || 0), 0);
            csvContent += `${m.name},${inv},${f10},${f14},${rev}\n`;
        });

        csvContent += "\nContrast Usage\nType,Total ML\n";
        contrastTypes.forEach(c => {
            const ml = periodContrastRecords.reduce((sum, record) => {
                const morningSum = record.morning.items.find(i => i.contrastTypeId === c.id)?.amountConsumed || 0;
                const afternoonSum = record.afternoon.items.find(i => i.contrastTypeId === c.id)?.amountConsumed || 0;
                const nightSum = record.night.items.find(i => i.contrastTypeId === c.id)?.amountConsumed || 0;
                return sum + morningSum + afternoonSum + nightSum;
            }, 0);
            if (ml > 0) csvContent += `${c.name},${ml}\n`;
        });



        csvContent += "\nChallenges & Resolutions\nDate Range,Challenges,Resolutions\n";
        periodWeeklyLogs.forEach(log => {
            csvContent += `"${log.weekStartDate} to ${log.weekEndDate}","${(log.challenges || '').replace(/"/g, '""')}","${(log.resolutions || '').replace(/"/g, '""')}"\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Weekly_Report_${startDate}_${endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const periodActivityLogs = activityLogs.filter(log => (!startDate || log.date >= startDate) && (!endDate || log.date <= endDate));
    const periodContrastRecords = contrastRecords.filter(log => (!startDate || log.date >= startDate) && (!endDate || log.date <= endDate));

    const periodWeeklyLogs = weeklyOpsLogs.filter(log => {
        if (!startDate && !endDate) return true;
        if (startDate && log.weekEndDate < startDate) return false;
        if (endDate && log.weekStartDate > endDate) return false;
        return true;
    });

    const isDataAvailable = periodActivityLogs.length > 0 || periodContrastRecords.length > 0 || periodWeeklyLogs.length > 0;

    const modalityStats = modalities.map(m => {
        const logs = periodActivityLogs.filter(log => log.modalityId === m.id);
        return {
            name: m.name,
            investigations: logs.reduce((sum, log) => sum + (log.totalInvestigations || 0), 0),
            film10x12: logs.reduce((sum, log) => sum + (log.film10x12Used || 0), 0),
            film14x17: logs.reduce((sum, log) => sum + (log.film14x17Used || 0), 0),
            revenue: logs.reduce((sum, log) => sum + (log.revenueAmount || 0), 0),
        };
    }).filter(s => s.investigations > 0 || s.film10x12 > 0 || s.film14x17 > 0 || s.revenue > 0);

    const contrastStats = contrastTypes.map(c => {
        const ml = periodContrastRecords.reduce((sum, record) => {
            const m = record.morning.items.find(i => i.contrastTypeId === c.id)?.amountConsumed || 0;
            const a = record.afternoon.items.find(i => i.contrastTypeId === c.id)?.amountConsumed || 0;
            const n = record.night.items.find(i => i.contrastTypeId === c.id)?.amountConsumed || 0;
            return sum + m + a + n;
        }, 0);
        return {
            name: c.name,
            ml
        };
    }).filter(s => s.ml > 0);



    const totalPeriodRevenue = modalityStats.reduce((sum, s) => sum + s.revenue, 0);

    const inputClasses = "w-full bg-background border-none rounded-xl px-4 py-3 text-text-primary focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-inner";

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface p-8 rounded-3xl shadow-sm">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-text-primary flex items-center gap-2">
                        <CalendarRange className="w-5 h-5 text-primary-500" /> Start Date
                    </label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className={inputClasses}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-text-primary flex items-center gap-2">
                        <CalendarRange className="w-5 h-5 text-primary-500" /> End Date
                    </label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className={inputClasses}
                    />
                </div>
            </div>

            <div className="flex justify-end gap-4 border-b border-surface-hover/50 pb-8 mb-8">
                <button
                    onClick={handleExportCSV}
                    disabled={!isDataAvailable}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-surface hover:bg-surface-hover text-text-primary font-bold shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <FileText className="w-5 h-5" />
                    Export CSV
                </button>
                <button
                    onClick={handleExportPDF}
                    disabled={!isDataAvailable || isGenerating}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary-500 hover:bg-primary-600 text-white font-bold shadow-lg shadow-primary-500/30 transition-all hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                >
                    <FileDown className="w-5 h-5" />
                    {isGenerating ? 'Generating...' : 'Export PDF'}
                </button>
            </div>

            {!isDataAvailable ? (
                <div className="text-center py-16 text-text-secondary bg-surface rounded-3xl shadow-sm">
                    <FileBarChart className="w-12 h-12 mx-auto mb-4 text-surface-hover" />
                    <p className="font-semibold text-lg text-text-primary">No data available for the selected dates</p>
                    <p>Change the start and end dates to see report data.</p>
                </div>
            ) : (
                <div className="bg-surface p-10 rounded-3xl shadow-sm mt-4 overflow-x-auto" ref={reportRef}>
                    <div className="text-center mb-10 border-b border-surface-hover/50 pb-8">
                        <h2 className="text-3xl font-bold tracking-tight text-text-primary">Weekly Operations Summary</h2>
                        <p className="text-text-secondary mt-2 font-medium">
                            {startDate ? new Date(startDate).toLocaleDateString() : 'Start'} to {endDate ? new Date(endDate).toLocaleDateString() : 'End'}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                        {/* Modality Stats */}
                        <div className="bg-background rounded-2xl p-6 border border-surface-hover/30">
                            <h3 className="text-xl font-bold mb-6 text-text-primary">Investigations & Revenue</h3>
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-surface-hover/50 text-text-secondary">
                                        <th className="pb-3 font-semibold uppercase tracking-wider text-xs">Modality</th>
                                        <th className="pb-3 font-semibold uppercase tracking-wider text-xs text-center">Inv.</th>
                                        <th className="pb-3 font-semibold uppercase tracking-wider text-xs text-right">Revenue (₦)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-surface-hover/30">
                                    {modalityStats.map(stat => (
                                        <tr key={stat.name} className="text-text-primary">
                                            <td className="py-4 font-bold text-primary-600">{stat.name}</td>
                                            <td className="py-4 text-center font-medium">{stat.investigations}</td>
                                            <td className="py-4 text-right font-bold text-green-600">₦{stat.revenue.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    <tr className="font-bold text-text-primary bg-primary-50/50">
                                        <td className="py-4 px-3 rounded-l-xl">Total</td>
                                        <td className="py-4 text-center px-3">{modalityStats.reduce((sum, s) => sum + s.investigations, 0)}</td>
                                        <td className="py-4 text-right px-3 text-green-600 rounded-r-xl">₦{totalPeriodRevenue.toLocaleString()}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Film & Contrast */}
                        <div className="space-y-8">
                            <div className="bg-background rounded-2xl p-6 border border-surface-hover/30">
                                <h3 className="text-xl font-bold mb-6 text-text-primary">Film Consumption</h3>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="bg-surface border border-surface-hover rounded-2xl p-5 text-center shadow-sm">
                                        <div className="text-sm font-medium text-text-secondary mb-2">10x12 Used</div>
                                        <div className="text-3xl font-bold text-primary-500">{modalityStats.reduce((sum, s) => sum + s.film10x12, 0)}</div>
                                    </div>
                                    <div className="bg-surface border border-surface-hover rounded-2xl p-5 text-center shadow-sm">
                                        <div className="text-sm font-medium text-text-secondary mb-2">14x17 Used</div>
                                        <div className="text-3xl font-bold text-secondary-500">{modalityStats.reduce((sum, s) => sum + s.film14x17, 0)}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-background rounded-2xl p-6 border border-surface-hover/30">
                                <h3 className="text-xl font-bold mb-6 text-text-primary">Total Contrast Used (ML)</h3>
                                {contrastStats.length === 0 ? (
                                    <p className="text-sm text-text-secondary">No contrast data.</p>
                                ) : (
                                    <div className="flex flex-wrap gap-3">
                                        {contrastStats.map(c => (
                                            <div key={c.name} className="bg-surface border border-surface-hover px-4 py-2.5 rounded-xl flex items-center gap-3 shadow-sm">
                                                <span className="text-sm font-medium text-text-secondary">{c.name}:</span>
                                                <span className="text-base font-bold text-secondary-600">{c.ml}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                        {/* Challenges & Resolutions */}
                        <div className="bg-background rounded-2xl p-6 border border-surface-hover/30 lg:col-span-3 flex flex-col">
                            <h3 className="text-xl font-bold mb-6 text-text-primary">Challenges & Resolutions</h3>
                            <div className="flex-1 space-y-4 overflow-y-auto max-h-64 pr-2">
                                {periodWeeklyLogs.filter(log => log.challenges || log.resolutions).length === 0 ? (
                                    <p className="text-sm text-text-secondary py-4">No operational challenges recorded for this period.</p>
                                ) : (
                                    periodWeeklyLogs.map(log => (
                                        (log.challenges || log.resolutions) && (
                                            <div key={log.id} className="p-5 bg-surface border border-surface-hover rounded-2xl text-sm shadow-sm">
                                                <div className="text-xs text-primary-500 mb-3 font-bold uppercase tracking-wider">{log.weekStartDate} to {log.weekEndDate}</div>
                                                {log.challenges && (
                                                    <div className="mb-3">
                                                        <span className="font-bold text-amber-600 block mb-1">Issue:</span>
                                                        <p className="text-text-primary font-medium">{log.challenges}</p>
                                                    </div>
                                                )}
                                                {log.resolutions && (
                                                    <div>
                                                        <span className="font-bold text-secondary-600 block mb-1">Resolution:</span>
                                                        <p className="text-text-primary font-medium">{log.resolutions}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="text-center pt-8 border-t border-surface-hover/50 text-xs font-semibold text-text-secondary">
                        Generated by MediControl Management System on {new Date().toLocaleDateString()}
                    </div>
                </div>
            )}
        </div>
    );
};
