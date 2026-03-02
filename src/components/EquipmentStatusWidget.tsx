import React, { useMemo, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { DowntimeModal } from './DowntimeModal';
import { Activity, Clock, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EquipmentLog } from '@/types';

type ModalityStatus = 'operational' | 'down' | 'recently_resolved';

interface ModalityStatusInfo {
    status: ModalityStatus;
    activeLog?: EquipmentLog;
    recentLogs: EquipmentLog[];
}

const STATUS_CONFIG: Record<ModalityStatus, { label: string; dot: string; text: string; bg: string }> = {
    operational: {
        label: 'Operational',
        dot: 'bg-green-500',
        text: 'text-green-700',
        bg: 'bg-green-50 border-green-100',
    },
    down: {
        label: 'Down',
        dot: 'bg-red-500 animate-pulse',
        text: 'text-red-700',
        bg: 'bg-red-50 border-red-200',
    },
    recently_resolved: {
        label: 'Recently Resolved',
        dot: 'bg-amber-400',
        text: 'text-amber-700',
        bg: 'bg-amber-50 border-amber-100',
    },
};

function getStatus(modalityId: string, logs: EquipmentLog[]): ModalityStatusInfo {
    const modalityLogs = logs
        .filter(l => l.modality_id === modalityId)
        .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

    const activeLog = modalityLogs.find(l => l.is_ongoing);
    if (activeLog) return { status: 'down', activeLog, recentLogs: modalityLogs.slice(0, 5) };

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentResolved = modalityLogs.find(l =>
        !l.is_ongoing && l.end_time && new Date(l.end_time) > twentyFourHoursAgo
    );
    if (recentResolved) return { status: 'recently_resolved', recentLogs: modalityLogs.slice(0, 5) };

    return { status: 'operational', recentLogs: modalityLogs.slice(0, 5) };
}

function durationLabel(log: EquipmentLog): string {
    const start = new Date(log.start_time);
    const end = log.end_time ? new Date(log.end_time) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.floor(diffMs / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
}

export const EquipmentStatusWidget: React.FC = () => {
    const { modalities, equipmentLogs } = useAppContext();
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [defaultModality, setDefaultModality] = useState<string | undefined>();

    const statusMap = useMemo(() => {
        const map: Record<string, ModalityStatusInfo> = {};
        modalities.forEach(m => { map[m.id] = getStatus(m.id, equipmentLogs); });
        return map;
    }, [modalities, equipmentLogs]);

    const downCount = Object.values(statusMap).filter(s => s.status === 'down').length;

    const handleReportForModality = (id: string) => {
        setDefaultModality(id);
        setModalOpen(true);
    };

    return (
        <>
            <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            'w-10 h-10 rounded-xl flex items-center justify-center',
                            downCount > 0 ? 'bg-red-100 text-danger' : 'bg-green-100 text-success'
                        )}>
                            <Activity className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-text-primary">Equipment Status</h3>
                            {downCount > 0
                                ? <p className="text-xs text-danger font-bold mt-0.5">{downCount} modality currently offline</p>
                                : <p className="text-xs text-success font-bold mt-0.5">All modalities operational</p>
                            }
                        </div>
                    </div>
                    <button
                        onClick={() => { setDefaultModality(undefined); setModalOpen(true); }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-danger/10 hover:bg-danger/20 text-danger text-sm font-bold transition-colors border border-danger/20 shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        Report Downtime
                    </button>
                </div>

                {/* Modality Rows */}
                <div className="divide-y divide-border">
                    {modalities.map(m => {
                        const info = statusMap[m.id];
                        const config = STATUS_CONFIG[info.status];
                        const isExpanded = expandedId === m.id;

                        return (
                            <div key={m.id}>
                                <div className={cn(
                                    'flex items-center gap-4 px-6 py-4 cursor-pointer transition-colors hover:bg-surface/30',
                                    isExpanded && 'bg-surface/20'
                                )}
                                    onClick={() => setExpandedId(isExpanded ? null : m.id)}
                                >
                                    {/* Status dot */}
                                    <div className={cn('w-3 h-3 rounded-full shrink-0', config.dot)} />

                                    {/* Name */}
                                    <span className="font-semibold text-text-primary flex-1">{m.name}</span>

                                    {/* Badge */}
                                    <span className={cn(
                                        'text-xs font-bold px-3 py-1 rounded-full border',
                                        config.bg, config.text
                                    )}>
                                        {config.label}
                                    </span>

                                    {/* Active downtime duration */}
                                    {info.status === 'down' && info.activeLog && (
                                        <span className="text-xs font-bold text-danger flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5" />
                                            {durationLabel(info.activeLog)}
                                        </span>
                                    )}

                                    {/* Expand */}
                                    {info.recentLogs.length > 0 && (
                                        isExpanded
                                            ? <ChevronUp className="w-4 h-4 text-text-muted shrink-0" />
                                            : <ChevronDown className="w-4 h-4 text-text-muted shrink-0" />
                                    )}

                                    {/* Quick report button */}
                                    <button
                                        onClick={e => { e.stopPropagation(); handleReportForModality(m.id); }}
                                        className="shrink-0 text-xs font-bold text-text-muted hover:text-danger px-2 py-1 rounded-lg hover:bg-danger/10 transition-colors"
                                    >
                                        + Log
                                    </button>
                                </div>

                                {/* Expanded History */}
                                {isExpanded && info.recentLogs.length > 0 && (
                                    <div className="px-6 pb-4 bg-surface/10 border-t border-border">
                                        <p className="text-xs font-semibold text-text-muted uppercase tracking-wide pt-3 pb-2">Recent Events</p>
                                        <div className="space-y-2">
                                            {info.recentLogs.map(log => (
                                                <div key={log.id} className="flex items-start gap-3 bg-white rounded-xl px-4 py-3 border border-border text-sm">
                                                    <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', log.is_ongoing ? 'bg-red-500' : 'bg-green-500')} />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="font-semibold text-text-primary">{log.reason_category}</span>
                                                            <span className="text-xs text-text-muted">· {durationLabel(log)}</span>
                                                            {log.is_ongoing && <span className="text-xs font-bold text-danger">Ongoing</span>}
                                                        </div>
                                                        {log.description && <p className="text-xs text-text-muted mt-0.5 truncate">{log.description}</p>}
                                                    </div>
                                                    <span className="text-xs text-text-muted shrink-0">
                                                        {new Date(log.start_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <DowntimeModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                defaultModalityId={defaultModality}
            />
        </>
    );
};
