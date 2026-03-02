import React from 'react';
import { Card } from '@/components/ui';
import { Settings2 } from 'lucide-react';

export const SettingsEquipment: React.FC = () => {
    return (
        <Card className="p-8 relative overflow-hidden bg-slate-50/50">
            {/* Visual overlay for "Coming Soon" */}
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center">
                <div className="bg-white px-6 py-4 rounded-2xl shadow-xl border border-black/5 text-center transform -translate-y-4">
                    <h4 className="font-extrabold text-xl text-text-primary mb-1">Equipment Downtime Tracking</h4>
                    <span className="text-sm font-bold text-primary tracking-widest uppercase">Coming Soon (Phase 8)</span>
                </div>
            </div>

            <div className="opacity-40 pointer-events-none filter blur-[1px]">
                <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
                    <h3 className="text-2xl font-bold text-text-primary flex items-center gap-3">
                        <Settings2 className="w-6 h-6 text-slate-500" />
                        Preventative Maintenance
                    </h3>
                </div>

                <div className="space-y-4">
                    <div className="h-12 bg-white border border-border rounded-xl"></div>
                    <div className="h-32 bg-white border border-border rounded-xl"></div>
                </div>
            </div>
        </Card>
    );
};
