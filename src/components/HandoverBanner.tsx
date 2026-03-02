import React, { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HandoverNote } from '@/types';

const CATEGORY_COLORS: Record<string, string> = {
    'Equipment issue': 'bg-red-100 text-red-700 border-red-200',
    'Pending procedure': 'bg-blue-100 text-blue-700 border-blue-200',
    'Low stock': 'bg-orange-100 text-orange-700 border-orange-200',
    'Patient follow-up': 'bg-purple-100 text-purple-700 border-purple-200',
    'Other': 'bg-slate-100 text-slate-700 border-slate-200',
};


function getPreviousShift(currentShift: string): string {
    if (currentShift === 'Morning') return 'Night';
    if (currentShift === 'Afternoon') return 'Morning';
    return 'Afternoon';
}

function getCurrentShift(): string {
    const hour = new Date().getHours();
    if (hour >= 8 && hour < 16) return 'Morning';
    if (hour >= 16) return 'Afternoon';
    return 'Night';
}

interface HandoverBannerProps {
    currentShift?: string;
}

export const HandoverBanner: React.FC<HandoverBannerProps> = ({
    currentShift = getCurrentShift(),
}) => {
    const { handoverNotes, acknowledgeHandoverNote } = useAppContext();
    const { user } = useAuth();

    const previousShift = getPreviousShift(currentShift);

    // Find unacknowledged notes targeting this shift (from the previous shift, today or yesterday)
    const pendingNotes: HandoverNote[] = useMemo(() => {
        return handoverNotes.filter(note =>
            !note.acknowledged &&
            note.to_shift === currentShift
        );
    }, [handoverNotes, currentShift]);

    if (pendingNotes.length === 0) return null;

    const handleAcknowledge = async (id: string) => {
        await acknowledgeHandoverNote(id, user?.id || 'unknown');
    };

    const handleAcknowledgeAll = async () => {
        await Promise.all(pendingNotes.map(n => acknowledgeHandoverNote(n.id, user?.id || 'unknown')));
    };

    return (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-500">
            {/* Banner Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-amber-100/70 border-b border-amber-200">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-amber-900 text-sm">
                            {pendingNotes.length} Handover {pendingNotes.length === 1 ? 'Note' : 'Notes'} from {previousShift} Shift
                        </h4>
                        <p className="text-xs text-amber-700 font-medium mt-0.5">
                            Please review and acknowledge before proceeding
                        </p>
                    </div>
                </div>
                {pendingNotes.length > 1 && (
                    <button
                        onClick={handleAcknowledgeAll}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors shadow-sm shrink-0"
                    >
                        <CheckCheck className="w-4 h-4" />
                        Acknowledge All
                    </button>
                )}
            </div>

            {/* Notes List */}
            <div className="p-4 space-y-2">
                {pendingNotes.map(note => (
                    <div
                        key={note.id}
                        className="flex items-start gap-3 bg-white rounded-xl px-4 py-3 border border-amber-200/70 shadow-sm"
                    >
                        <span className={cn(
                            'text-xs font-bold px-2.5 py-1 rounded-lg border shrink-0 mt-0.5',
                            CATEGORY_COLORS[note.category || 'Other'] || CATEGORY_COLORS['Other']
                        )}>
                            {note.category || 'Note'}
                        </span>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-primary leading-relaxed">
                                {note.message}
                            </p>
                            <p className="text-xs text-text-muted mt-1 font-medium">
                                Flagged by <span className="text-text-secondary font-bold">{note.flagged_by_name}</span>
                                {note.created_at && (
                                    <> · {new Date(note.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>
                                )}
                            </p>
                        </div>
                        <button
                            onClick={() => handleAcknowledge(note.id)}
                            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-100 hover:bg-green-500 text-green-700 hover:text-white text-xs font-bold transition-all border border-green-200 hover:border-green-500"
                        >
                            <Check className="w-3 h-3" />
                            Ack
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
