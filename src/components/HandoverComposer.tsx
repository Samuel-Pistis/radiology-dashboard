import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, X, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PendingNote {
    category: string;
    message: string;
}

const HANDOVER_CATEGORIES = [
    'Equipment issue',
    'Pending procedure',
    'Low stock',
    'Patient follow-up',
    'Other',
] as const;

const CATEGORY_COLORS: Record<string, string> = {
    'Equipment issue': 'bg-red-100 text-red-700 border-red-200',
    'Pending procedure': 'bg-blue-100 text-blue-700 border-blue-200',
    'Low stock': 'bg-orange-100 text-orange-700 border-orange-200',
    'Patient follow-up': 'bg-purple-100 text-purple-700 border-purple-200',
    'Other': 'bg-slate-100 text-slate-700 border-slate-200',
};

interface HandoverComposerProps {
    onNotesChange: (notes: PendingNote[]) => void;
    shift: string;
}

export const HandoverComposer: React.FC<HandoverComposerProps> = ({
    onNotesChange,
    shift,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [category, setCategory] = useState<string>(HANDOVER_CATEGORIES[0]);
    const [message, setMessage] = useState('');
    const [pendingNotes, setPendingNotes] = useState<PendingNote[]>([]);

    const handleAddNote = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        const newNotes = [...pendingNotes, { category, message: message.trim() }];
        setPendingNotes(newNotes);
        onNotesChange(newNotes);
        setMessage('');
    };

    const handleRemoveNote = (index: number) => {
        const newNotes = pendingNotes.filter((_, i) => i !== index);
        setPendingNotes(newNotes);
        onNotesChange(newNotes);
    };

    const nextShift = shift === 'Morning' ? 'Afternoon' : shift === 'Afternoon' ? 'Night' : 'Morning';

    return (
        <div className={cn(
            'rounded-2xl border transition-all duration-300 overflow-hidden',
            isExpanded
                ? 'border-amber-200 bg-amber-50/60'
                : 'border-border bg-surface/30 hover:border-amber-200/60'
        )}>
            {/* Toggle Header */}
            <button
                type="button"
                onClick={() => setIsExpanded(p => !p)}
                className="w-full flex items-center justify-between px-6 py-4 text-left"
            >
                <div className="flex items-center gap-3">
                    <div className={cn(
                        'w-8 h-8 rounded-xl flex items-center justify-center transition-colors',
                        isExpanded ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-600'
                    )}>
                        <Bell className="w-4 h-4" />
                    </div>
                    <div>
                        <span className="text-sm font-bold text-text-primary">
                            Flag items for {nextShift} shift
                        </span>
                        {pendingNotes.length > 0 && (
                            <span className="ml-2 text-xs font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">
                                {pendingNotes.length}
                            </span>
                        )}
                        <p className="text-xs text-text-muted mt-0.5">
                            Optional — handover notes for the incoming shift
                        </p>
                    </div>
                </div>
                {isExpanded
                    ? <ChevronUp className="w-5 h-5 text-amber-500 shrink-0" />
                    : <ChevronDown className="w-5 h-5 text-text-muted shrink-0" />
                }
            </button>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="px-6 pb-6 space-y-4 border-t border-amber-200/60">
                    <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                        <div>
                            <label className="text-xs font-semibold text-text-secondary mb-1.5 block uppercase tracking-wide">
                                Category
                            </label>
                            <select
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm font-medium text-text-primary outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                            >
                                {HANDOVER_CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div className="sm:col-span-2">
                            <label className="text-xs font-semibold text-text-secondary mb-1.5 block uppercase tracking-wide">
                                Note
                            </label>
                            <div className="flex gap-2">
                                <textarea
                                    value={message}
                                    onChange={e => setMessage(e.target.value.slice(0, 300))}
                                    placeholder="Describe what the next shift needs to know..."
                                    rows={2}
                                    className="flex-1 rounded-xl border border-border bg-white px-3 py-2.5 text-sm font-medium text-text-primary outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all resize-none placeholder:text-text-muted"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddNote}
                                    disabled={!message.trim()}
                                    className="shrink-0 h-fit self-end px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add
                                </button>
                            </div>
                            {message.length > 250 && (
                                <p className="text-xs text-text-muted mt-1 text-right">{message.length}/300</p>
                            )}
                        </div>
                    </div>

                    {/* Pending Notes List */}
                    {pendingNotes.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-amber-200/60">
                            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                                Will be sent to {nextShift} shift on save
                            </p>
                            {pendingNotes.map((note, index) => (
                                <div
                                    key={index}
                                    className="flex items-start gap-3 bg-white rounded-xl px-4 py-3 border border-amber-200/60 group"
                                >
                                    <span className={cn(
                                        'text-xs font-bold px-2.5 py-1 rounded-lg border shrink-0 mt-0.5',
                                        CATEGORY_COLORS[note.category] || CATEGORY_COLORS['Other']
                                    )}>
                                        {note.category}
                                    </span>
                                    <p className="flex-1 text-sm text-text-primary font-medium leading-relaxed">
                                        {note.message}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveNote(index)}
                                        className="shrink-0 text-text-muted hover:text-danger p-1 rounded-lg hover:bg-danger/10 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
