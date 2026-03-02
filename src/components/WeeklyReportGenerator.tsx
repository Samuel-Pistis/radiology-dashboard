import React, { useState, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { FileDown, Printer, CalendarRange, FileBarChart, Activity } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Badge } from '@/components/ui';

export const WeeklyReportGenerator: React.FC = () => {
    const { weeklyOpsLogs, modalities, contrastTypes } = useAppContext();
    const [selectedLogId, setSelectedLogId] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);
    const reportRef = useRef<HTMLDivElement>(null);

    const activeLog = weeklyOpsLogs.find(log => log.id === selectedLogId);

    const handleExportPDF = async () => {
        if (!reportRef.current || !activeLog) return;
        setIsGenerating(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 100)); // Allow ref paint
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
            pdf.save(`RadPadi-Weekly-Report-${activeLog.weekStartDate}-${activeLog.weekEndDate}.pdf`);
        } catch (error) {
            console.error("Error generating PDF", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    // Derived logic directly from the log itself, not filtering other tables
    const totalWeeklyInvestigations = activeLog?.investigations
        ? Object.values(activeLog.investigations).reduce((a: any, b: any) => a + (Number(b) || 0), 0)
        : 0;

    const totalWeeklyRevenue = activeLog?.revenue?.reduce((sum, rev) => sum + rev.amount, 0) || 0;

    const total10x12 = activeLog?.films
        ? Object.values(activeLog.films).reduce((acc: number, curr: any) => acc + (curr.f10x12 || 0), 0)
        : 0;

    const total14x17 = activeLog?.films
        ? Object.values(activeLog.films).reduce((acc: number, curr: any) => acc + (curr.f14x17 || 0), 0)
        : 0;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Filter Section (Don't print this part) */}
            <div className="print:hidden flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/40 p-6 rounded-[2rem] border border-white/60 shadow-sm backdrop-blur-md">
                <div className="space-y-1 w-full md:w-1/2">
                    <label className="text-[10px] font-bold tracking-widest text-text-secondary flex items-center gap-2">
                        <CalendarRange className="w-4 h-4 text-mint stroke-[3]" /> Select Weekly Period
                    </label>
                    <select
                        value={selectedLogId}
                        onChange={(e) => setSelectedLogId(e.target.value)}
                        className="w-full bg-white/50 border border-white/60 rounded-xl px-4 py-3 text-text-primary font-semibold focus:border-black/20 focus:bg-white outline-none transition-all shadow-sm backdrop-blur-md cursor-pointer"
                    >
                        <option value="">-- Choose a Saved Report --</option>
                        {weeklyOpsLogs.map(log => (
                            <option key={log.id} value={log.id}>
                                {log.weekStartDate} to {log.weekEndDate}
                            </option>
                        ))}
                    </select>
                </div>

                {activeLog && (
                    <div className="flex gap-3 w-full md:w-auto">
                        <button
                            onClick={handlePrint}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white border border-black/10 hover:bg-black/5 text-text-primary font-bold shadow-sm transition-all"
                        >
                            <Printer className="w-5 h-5 stroke-[2.5]" />
                            Print
                        </button>
                        <button
                            onClick={handleExportPDF}
                            disabled={isGenerating}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-black hover:bg-black/80 text-white font-bold shadow-xl shadow-black/20 transition-all hover:-translate-y-1 disabled:opacity-50"
                        >
                            <FileDown className="w-5 h-5 stroke-[2.5]" />
                            {isGenerating ? 'Generating...' : 'Export PDF'}
                        </button>
                    </div>
                )}
            </div>

            {!activeLog ? (
                <div className="text-center py-16 text-text-muted bg-white/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/60 shadow-sm print:hidden">
                    <FileBarChart className="w-16 h-16 mx-auto mb-6 text-black/20 stroke-[1.5]" />
                    <p className="font-bold text-2xl text-text-primary tracking-tight mb-2">Select a Saved Report</p>
                    <p className="font-semibold text-sm">Use the dropdown above to load a finalized weekly report.</p>
                </div>
            ) : (
                <div
                    ref={reportRef}
                    className="bg-white p-10 md:p-14 rounded-[2.5rem] shadow-sm border border-black/10 mt-4 overflow-x-auto max-w-4xl mx-auto print:shadow-none print:border-none print:p-0 print:m-0"
                >
                    {/* Official Letterhead Header */}
                    <div className="text-center mb-12 border-b-2 border-primary/20 pb-8">
                        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl text-primary mb-4">
                            <Activity className="w-10 h-10 stroke-[2.5]" />
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-text-primary mb-2">RadPadi Facility</h1>
                        <h2 className="text-2xl font-bold tracking-tight text-text-secondary">Official Weekly Report</h2>
                        <div className="mt-6 flex items-center justify-center gap-2">
                            <Badge variant="success" className="text-sm px-4 py-1.5">
                                {activeLog.weekStartDate} to {activeLog.weekEndDate}
                            </Badge>
                        </div>
                    </div>

                    {/* Executive Summary Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                        <div className="bg-black/[0.03] rounded-2xl p-5 text-center border-l-4 border-indigo-500">
                            <div className="text-[10px] font-bold tracking-widest text-text-secondary uppercase mb-1">Total Scans</div>
                            <div className="text-3xl font-bold text-text-primary">{Number(totalWeeklyInvestigations)}</div>
                        </div>
                        <div className="bg-black/[0.03] rounded-2xl p-5 text-center border-l-4 border-success">
                            <div className="text-[10px] font-bold tracking-widest text-text-secondary uppercase mb-1">Revenue</div>
                            <div className="text-2xl font-bold text-success truncate" title={`₦${totalWeeklyRevenue.toLocaleString()}`}>
                                ₦{(totalWeeklyRevenue / 1000).toFixed(0)}k
                            </div>
                        </div>
                        <div className="bg-black/[0.03] rounded-2xl p-5 text-center border-l-4 border-amber-500">
                            <div className="text-[10px] font-bold tracking-widest text-text-secondary uppercase mb-1">10x12 Films</div>
                            <div className="text-3xl font-bold text-text-primary">{total10x12}</div>
                        </div>
                        <div className="bg-black/[0.03] rounded-2xl p-5 text-center border-l-4 border-pink-500">
                            <div className="text-[10px] font-bold tracking-widest text-text-secondary uppercase mb-1">14x17 Films</div>
                            <div className="text-3xl font-bold text-text-primary">{total14x17}</div>
                        </div>
                    </div>

                    {/* Full Breakdown Tables */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">

                        {/* Modality Breakdown */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-text-primary border-b border-black/10 pb-2">Modality Breakdown</h3>
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="text-text-secondary">
                                        <th className="pb-3 font-bold">Modality</th>
                                        <th className="pb-3 font-bold text-center">Inv.</th>
                                        <th className="pb-3 font-bold text-right">Revenue (₦)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-black/5">
                                    {modalities.map(m => {
                                        const inv = activeLog.investigations?.[m.id] || 0;
                                        const rev = activeLog.revenue?.find(r => r.modalityId === m.id)?.amount || 0;
                                        if (inv === 0 && rev === 0) return null;
                                        return (
                                            <tr key={m.id} className="text-text-primary">
                                                <td className="py-3 font-semibold">{m.name}</td>
                                                <td className="py-3 text-center">{inv}</td>
                                                <td className="py-3 text-right font-bold">₦{rev.toLocaleString()}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Contrast Consumption */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-text-primary border-b border-black/10 pb-2">Contrast Usage</h3>
                            {(!activeLog.contrast || Object.keys(activeLog.contrast).length === 0) ? (
                                <p className="text-sm text-text-muted py-4">No contrast recorded.</p>
                            ) : (
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="text-text-secondary">
                                            <th className="pb-3 font-bold">Contrast Type</th>
                                            <th className="pb-3 font-bold text-right">Consumed (ML)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-black/5">
                                        {contrastTypes.map(c => {
                                            const ml = activeLog.contrast?.[c.id] || 0;
                                            if (ml === 0) return null;
                                            return (
                                                <tr key={c.id} className="text-text-primary">
                                                    <td className="py-3 font-semibold">{c.name}</td>
                                                    <td className="py-3 text-right font-bold">{ml}</td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {/* Operational Feedback */}
                    {(activeLog.challenges || activeLog.resolutions) && (
                        <div className="border border-black/10 rounded-2xl overflow-hidden mb-8">
                            <div className="bg-black/5 px-6 py-3 border-b border-black/10">
                                <h3 className="text-sm font-bold tracking-widest text-text-secondary uppercase">Operational Feedback</h3>
                            </div>
                            <div className="p-6 space-y-6">
                                {activeLog.challenges && (
                                    <div>
                                        <h4 className="text-sm font-bold text-peach mb-2 flex items-center gap-2">Challenges Faced</h4>
                                        <p className="text-text-primary text-sm leading-relaxed">{activeLog.challenges}</p>
                                    </div>
                                )}
                                {activeLog.resolutions && (
                                    <div>
                                        <h4 className="text-sm font-bold text-success mb-2 flex items-center gap-2">Resolutions</h4>
                                        <p className="text-text-primary text-sm leading-relaxed">{activeLog.resolutions}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="text-center pt-8 border-t border-black/10 text-[10px] tracking-widest font-bold text-text-muted">
                        Generated securely by RadPadi on {new Date().toLocaleDateString()}
                    </div>
                </div>
            )}
        </div>
    );
};
