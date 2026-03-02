import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { AlertTriangle } from 'lucide-react';
import type { EquipmentLog } from '@/types';

const REASON_CATEGORIES = [
    'Power failure',
    'Equipment fault',
    'Software error',
    'Planned maintenance',
    'Network issue',
    'Other',
] as const;

interface DowntimeModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaultModalityId?: string;
}

function toLocalDatetimeString(date: Date): string {
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
}

export const DowntimeModal: React.FC<DowntimeModalProps> = ({
    isOpen,
    onClose,
    defaultModalityId,
}) => {
    const { modalities, centreSettings, addEquipmentLog } = useAppContext();
    const { user } = useAuth();

    const nowStr = toLocalDatetimeString(new Date());

    const [modalityId, setModalityId] = useState(defaultModalityId || modalities[0]?.id || '');
    const [reasonCategory, setReasonCategory] = useState<string>(REASON_CATEGORIES[0]);
    const [startTime, setStartTime] = useState(nowStr);
    const [endTime, setEndTime] = useState('');
    const [isOngoing, setIsOngoing] = useState(true);
    const [description, setDescription] = useState('');
    const [resolution, setResolution] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const selectedModality = modalities.find(m => m.id === modalityId);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!modalityId || !startTime) return;

        setIsSaving(true);
        try {
            const log: EquipmentLog = {
                id: `eq-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                centre_id: centreSettings?.centre_id || 'default-centre',
                modality_id: modalityId,
                modality_name: selectedModality?.name || modalityId,
                reason_category: reasonCategory,
                description: description.trim() || undefined,
                resolution: (!isOngoing && resolution.trim()) ? resolution.trim() : undefined,
                start_time: new Date(startTime).toISOString(),
                end_time: (!isOngoing && endTime) ? new Date(endTime).toISOString() : undefined,
                is_ongoing: isOngoing,
                logged_by: user?.id || 'unknown',
                logged_by_name: user?.name || 'Unknown User',
            };
            await addEquipmentLog(log);
            // Reset form
            setDescription('');
            setResolution('');
            setStartTime(toLocalDatetimeString(new Date()));
            setEndTime('');
            setIsOngoing(true);
            onClose();
        } catch (err) {
            console.error('Error logging downtime:', err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-red-100 text-danger flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <span>Report Equipment Downtime</span>
                </div>
            }
            maxWidth="lg"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={isSaving}>Cancel</Button>
                    <Button onClick={handleSubmit as any} disabled={isSaving || !modalityId}>
                        {isSaving ? 'Saving...' : 'Log Downtime'}
                    </Button>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Modality */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
                            Modality *
                        </label>
                        <select
                            value={modalityId}
                            onChange={e => setModalityId(e.target.value)}
                            required
                            className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm font-medium text-text-primary outline-none focus:border-danger focus:ring-2 focus:ring-danger/20 transition-all"
                        >
                            {modalities.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
                            Reason Category *
                        </label>
                        <select
                            value={reasonCategory}
                            onChange={e => setReasonCategory(e.target.value)}
                            className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm font-medium text-text-primary outline-none focus:border-danger focus:ring-2 focus:ring-danger/20 transition-all"
                        >
                            {REASON_CATEGORIES.map(r => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Still Down Toggle */}
                <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-surface/40">
                    <button
                        type="button"
                        onClick={() => setIsOngoing(p => !p)}
                        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${isOngoing ? 'bg-danger' : 'bg-gray-300'}`}
                    >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isOngoing ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                    <div>
                        <p className="text-sm font-bold text-text-primary">Still Down</p>
                        <p className="text-xs text-text-muted">Equipment is currently offline — no end time recorded</p>
                    </div>
                </div>

                {/* Time fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
                            Downtime Started *
                        </label>
                        <input
                            type="datetime-local"
                            value={startTime}
                            onChange={e => setStartTime(e.target.value)}
                            required
                            className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm font-medium text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                    </div>
                    {!isOngoing && (
                        <div>
                            <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
                                Resolved At
                            </label>
                            <input
                                type="datetime-local"
                                value={endTime}
                                min={startTime}
                                onChange={e => setEndTime(e.target.value)}
                                className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm font-medium text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>
                    )}
                </div>

                {/* Description */}
                <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
                        Description <span className="font-normal normal-case text-text-muted">(optional)</span>
                    </label>
                    <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        rows={2}
                        placeholder="Describe the issue or symptoms..."
                        className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm font-medium text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none placeholder:text-text-muted"
                    />
                </div>

                {/* Resolution — only if not ongoing */}
                {!isOngoing && (
                    <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
                            Resolution / Fix Applied <span className="font-normal normal-case text-text-muted">(optional)</span>
                        </label>
                        <textarea
                            value={resolution}
                            onChange={e => setResolution(e.target.value)}
                            rows={2}
                            placeholder="e.g. Replaced fuse, called engineer, restarted system..."
                            className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm font-medium text-text-primary outline-none focus:border-success focus:ring-2 focus:ring-success/20 transition-all resize-none placeholder:text-text-muted"
                        />
                    </div>
                )}
            </form>
        </Modal>
    );
};
