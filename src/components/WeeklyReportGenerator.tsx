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
                const morningSum = record.morning.items.find(i => i.contrastTypeId === c.id)?.amountConsumedMls || 0;
                const afternoonSum = record.afternoon.items.find(i => i.contrastTypeId === c.id)?.amountConsumedMls || 0;
                const nightSum = record.night.items.find(i => i.contrastTypeId === c.id)?.amountConsumedMls || 0;
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
            const m = record.morning.items.find(i => i.contrastTypeId === c.id)?.amountConsumedMls || 0;
            const a = record.afternoon.items.find(i => i.contrastTypeId === c.id)?.amountConsumedMls || 0;
            const n = record.night.items.find(i => i.contrastTypeId === c.id)?.amountConsumedMls || 0;
            return sum + m + a + n;
        }, 0);
        return {
            name: c.name,
            ml
        };
    }).filter(s => s.ml > 0);



    const totalPeriodRevenue = modalityStats.reduce((sum, s) => sum + s.revenue, 0);

    const inputClasses = "w-full bg-white/50 border border-white/60 rounded-full px-5 py-3 text-black font-semibold focus:border-black/20 focus:bg-white outline-none transition-all shadow-sm backdrop-blur-md";

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/40 backdrop-blur-3xl p-8 rounded-[2.5rem] shadow-sm border border-white/60">
                <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-black/60 flex items-center gap-2">
                        <CalendarRange className="w-4 h-4 text-mint stroke-[3]" /> Start Date
                    </label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className={inputClasses}
                    />
                </div>
                <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-black/60 flex items-center gap-2">
                        <CalendarRange className="w-4 h-4 text-mint stroke-[3]" /> End Date
                    </label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className={inputClasses}
                    />
                </div>
            </div>

            <div className="flex justify-end gap-4 border-b border-black/5 pb-8 mb-8">
                <button
                    onClick={handleExportCSV}
                    disabled={!isDataAvailable}
                    className="flex items-center gap-2 px-8 py-4 rounded-full bg-white/50 border border-white/60 hover:bg-white text-black font-bold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-md"
                >
                    <FileText className="w-5 h-5 stroke-[2.5]" />
                    Export CSV
                </button>
                <button
                    onClick={handleExportPDF}
                    disabled={!isDataAvailable || isGenerating}
                    className="flex items-center gap-2 px-8 py-4 rounded-full bg-black hover:bg-black/80 text-white font-bold shadow-xl shadow-black/20 transition-all hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                >
                    <FileDown className="w-5 h-5 stroke-[2.5]" />
                    {isGenerating ? 'Generating...' : 'Export PDF'}
                </button>
            </div>

            {!isDataAvailable ? (
                <div className="text-center py-16 text-black/50 bg-white/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/60 shadow-sm">
                    <FileBarChart className="w-16 h-16 mx-auto mb-6 text-black/20 stroke-[1.5]" />
                    <p className="font-bold text-2xl text-black tracking-tight mb-2">No data available for the selected dates</p>
                    <p className="font-semibold">Change the start and end dates to see report data.</p>
                </div>
            ) : (
                <div className="bg-white/40 backdrop-blur-3xl p-10 rounded-[2.5rem] shadow-sm border border-white/60 mt-4 overflow-x-auto" ref={reportRef}>
                    <div className="text-center mb-10 border-b border-black/5 pb-8">
                        <h2 className="text-3xl font-bold tracking-tight text-black">Weekly Operations Summary</h2>
                        <p className="text-black/60 mt-2 font-semibold bg-white/50 inline-block px-4 py-1.5 rounded-full border border-white/60">
                            {startDate ? new Date(startDate).toLocaleDateString() : 'Start'} to {endDate ? new Date(endDate).toLocaleDateString() : 'End'}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                        {/* Modality Stats */}
                        <div className="bg-white/50 rounded-[2rem] p-8 border border-white/60 shadow-sm">
                            <h3 className="text-xl font-bold mb-6 text-black tracking-tight">Investigations & Revenue</h3>
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-black/5 text-black/60">
                                        <th className="pb-4 font-bold uppercase tracking-widest text-[10px]">Modality</th>
                                        <th className="pb-4 font-bold uppercase tracking-widest text-[10px] text-center">Inv.</th>
                                        <th className="pb-4 font-bold uppercase tracking-widest text-[10px] text-right">Revenue (₦)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-black/5">
                                    {modalityStats.map(stat => (
                                        <tr key={stat.name} className="text-black">
                                            <td className="py-5 font-bold text-black">{stat.name}</td>
                                            <td className="py-5 text-center font-semibold">{stat.investigations}</td>
                                            <td className="py-5 text-right font-bold text-black">₦{stat.revenue.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    <tr className="font-bold text-black bg-mint/20">
                                        <td className="py-5 px-4 rounded-l-full">Total</td>
                                        <td className="py-5 text-center px-4">{modalityStats.reduce((sum, s) => sum + s.investigations, 0)}</td>
                                        <td className="py-5 text-right px-4 text-black rounded-r-full">₦{totalPeriodRevenue.toLocaleString()}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Film & Contrast */}
                        <div className="space-y-8">
                            <div className="bg-white/50 rounded-[2rem] p-8 border border-white/60 shadow-sm">
                                <h3 className="text-xl font-bold mb-6 text-black tracking-tight">Film Consumption</h3>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="bg-white/60 border border-white rounded-[1.5rem] p-6 text-center shadow-sm">
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-black/60 mb-2">10x12 Used</div>
                                        <div className="text-4xl font-bold text-black tracking-tighter">{modalityStats.reduce((sum, s) => sum + s.film10x12, 0)}</div>
                                    </div>
                                    <div className="bg-white/60 border border-white rounded-[1.5rem] p-6 text-center shadow-sm">
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-black/60 mb-2">14x17 Used</div>
                                        <div className="text-4xl font-bold text-black tracking-tighter">{modalityStats.reduce((sum, s) => sum + s.film14x17, 0)}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/50 rounded-[2rem] p-8 border border-white/60 shadow-sm">
                                <h3 className="text-xl font-bold mb-6 text-black tracking-tight">Total Contrast Used (ML)</h3>
                                {contrastStats.length === 0 ? (
                                    <p className="text-sm font-semibold text-black/50">No contrast data.</p>
                                ) : (
                                    <div className="flex flex-wrap gap-3">
                                        {contrastStats.map(c => (
                                            <div key={c.name} className="bg-white/60 border border-white px-5 py-3 rounded-full flex items-center gap-3 shadow-sm">
                                                <span className="text-sm font-semibold text-black/60">{c.name}:</span>
                                                <span className="text-lg font-bold text-black">{c.ml}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                        {/* Challenges & Resolutions */}
                        <div className="bg-white/50 rounded-[2rem] p-8 border border-white/60 lg:col-span-3 flex flex-col shadow-sm">
                            <h3 className="text-xl font-bold mb-6 text-black tracking-tight">Challenges & Resolutions</h3>
                            <div className="flex-1 space-y-4 overflow-y-auto max-h-64 pr-2">
                                {periodWeeklyLogs.filter(log => log.challenges || log.resolutions).length === 0 ? (
                                    <p className="text-sm font-semibold text-black/50 py-4">No operational challenges recorded for this period.</p>
                                ) : (
                                    periodWeeklyLogs.map(log => (
                                        (log.challenges || log.resolutions) && (
                                            <div key={log.id} className="p-6 bg-white/60 border border-white rounded-[1.5rem] text-sm shadow-sm">
                                                <div className="inline-block bg-black/5 px-4 py-1.5 rounded-full text-[10px] text-black/70 mb-4 font-bold uppercase tracking-widest">{log.weekStartDate} to {log.weekEndDate}</div>
                                                {log.challenges && (
                                                    <div className="mb-4 bg-peach/30 p-4 rounded-xl">
                                                        <span className="font-bold text-peach tracking-widest uppercase text-[10px] block mb-2">Issue:</span>
                                                        <p className="text-black font-semibold text-base leading-relaxed">{log.challenges}</p>
                                                    </div>
                                                )}
                                                {log.resolutions && (
                                                    <div className="bg-mint/30 p-4 rounded-xl">
                                                        <span className="font-bold text-black/60 tracking-widest uppercase text-[10px] block mb-2">Resolution:</span>
                                                        <p className="text-black font-semibold text-base leading-relaxed">{log.resolutions}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="text-center pt-8 border-t border-black/5 text-[10px] uppercase tracking-widest font-bold text-black/40">
                        Generated by MediControl Management System on {new Date().toLocaleDateString()}
                    </div>
                </div>
            )}
        </div>
    );
};
