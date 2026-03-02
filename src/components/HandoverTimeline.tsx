import React, { useMemo, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, CheckCircle, Clock, StickyNote } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORY_COLORS: Record<string, string> = {
    'Equipment issue': 'bg-red-100 text-red-700 border-red-200',
    'Pending procedure': 'bg-blue-100 text-blue-700 border-blue-200',
    'Low stock': 'bg-orange-100 text-orange-700 border-orange-200',
    'Patient follow-up': 'bg-purple-100 text-purple-700 border-purple-200',
    'Other': 'bg-slate-100 text-slate-700 border-slate-200',
};

type FilterMode = 'all' | 'pending' | 'acknowledged';

export const HandoverTimeline: React.FC = () => {
    const { handoverNotes } = useAppContext();
    const { user } = useAuth();
    const [filter, setFilter] = useState<FilterMode>('all');

    // Only show to admin
    if (user?.role !== 'admin') return null;

    const filtered = useMemo(() => {
        const sorted = [...handoverNotes].sort((a, b) =>
            new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
        );
        if (filter === 'pending') return sorted.filter(n => !n.acknowledged).slice(0, 20);
        if (filter === 'acknowledged') return sorted.filter(n => n.acknowledged).slice(0, 20);
        return sorted.slice(0, 20);
    }, [handoverNotes, filter]);

    const pendingCount = handoverNotes.filter(n => !n.acknowledged).length;

    return (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border-b border-border">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                        <StickyNote className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-text-primary">Handover Timeline</h3>
                        {pendingCount > 0 && (
                            <p className="text-xs text-amber-600 font-bold mt-0.5">
                                {pendingCount} unacknowledged {pendingCount === 1 ? 'note' : 'notes'}
                            </p>
                        )}
                    </div>
                </div>

                {/* Filter Toggle */}
                <div className="flex items-center gap-1 p-1 bg-surface-hover rounded-xl w-fit">
                    {(['all', 'pending', 'acknowledged'] as FilterMode[]).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={cn(
                                'px-4 py-1.5 rounded-lg text-xs font-bold transition-all capitalize',
                                filter === f
                                    ? 'bg-white text-text-primary shadow-sm'
                                    : 'text-text-muted hover:text-text-primary'
                            )}
                        >
                            {f}
                            {f === 'pending' && pendingCount > 0 && (
                                <span className="ml-1.5 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                    {pendingCount}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Timeline */}
            {filtered.length === 0 ? (
                <div className="py-16 text-center">
                    <CheckCircle className="w-10 h-10 text-success mx-auto mb-3 opacity-50" />
                    <p className="text-text-muted font-medium text-sm">
                        {filter === 'pending' ? 'No pending handover notes' : 'No handover notes yet'}
                    </p>
                </div>
            ) : (
                <div className="divide-y divide-border">
                    {filtered.map(note => (
                        <div key={note.id} className="flex items-start gap-4 px-6 py-4 hover:bg-surface/30 transition-colors">
                            {/* Status Indicator */}
                            <div className="shrink-0 mt-1">
                                {note.acknowledged ? (
                                    <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                                        <CheckCircle className="w-4 h-4" />
                                    </div>
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <span className={cn(
                                        'text-xs font-bold px-2.5 py-0.5 rounded-lg border',
                                        CATEGORY_COLORS[note.category || 'Other'] || CATEGORY_COLORS['Other']
                                    )}>
                                        {note.category || 'Note'}
                                    </span>

                                    {/* Shift transition */}
                                    <span className="flex items-center gap-1 text-xs font-semibold text-text-muted">
                                        {note.from_shift}
                                        <ArrowRight className="w-3 h-3" />
                                        {note.to_shift}
                                    </span>
                                </div>

                                <p className="text-sm font-medium text-text-primary leading-relaxed">
                                    {note.message}
                                </p>

                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-text-muted font-medium">
                                    <span>
                                        Flagged by <span className="text-text-secondary font-bold">{note.flagged_by_name}</span>
                                    </span>
                                    {note.created_at && (
                                        <span>
                                            {new Date(note.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            {' · '}
                                            {new Date(note.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    )}
                                    {note.acknowledged && note.acknowledged_by && (
                                        <span className="text-green-600 font-semibold">
                                            ✓ Acknowledged
                                            {note.acknowledged_at && (
                                                <> · {new Date(note.acknowledged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>
                                            )}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
