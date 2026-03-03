import React, { useState } from 'react';
import { Card, Input, Button } from '@/components/ui';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToast } from '@/context/ToastContext';
import { Plus, Trash2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NamedItem {
    id: string;
    name: string;
}

interface SimpleSettingsListProps<T extends NamedItem> {
    title: string;
    icon: LucideIcon;
    iconClassName?: string;
    items: T[];
    onAdd: (name: string) => Promise<void>;
    onRemove: (id: string) => Promise<void>;
    placeholder?: string;
    addLabel?: string;
    entityLabel?: string; // used in confirm message, e.g. "modality"
    emptyMessage?: string;
    gridCols?: 1 | 2 | 3 | 4;
}

const GRID_CLASSES: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
};

/**
 * Generic settings list used for simple name-only collections
 * (Modalities, Film Sizes, etc.). Handles the add-form, item grid,
 * confirm-delete flow, and toast feedback.
 */
export function SimpleSettingsList<T extends NamedItem>({
    title,
    icon,
    iconClassName,
    items,
    onAdd,
    onRemove,
    placeholder = 'New item',
    addLabel = 'Add',
    entityLabel = 'item',
    emptyMessage,
    gridCols = 2,
}: SimpleSettingsListProps<T>) {
    const [newName, setNewName] = useState('');
    const [loading, setLoading] = useState(false);
    const [confirmId, setConfirmId] = useState<string | null>(null);
    const { showToast } = useToast();

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;
        try {
            setLoading(true);
            await onAdd(newName.trim());
            setNewName('');
            showToast(`${newName.trim()} added successfully.`, 'success');
        } catch {
            showToast(`Failed to add ${entityLabel}.`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!confirmId) return;
        try {
            await onRemove(confirmId);
            showToast(`${entityLabel.charAt(0).toUpperCase() + entityLabel.slice(1)} removed.`, 'success');
        } catch {
            showToast(`Failed to remove ${entityLabel}.`, 'error');
        }
        setConfirmId(null);
    };

    const confirmTarget = items.find(i => i.id === confirmId);

    return (
        <>
            <Card className="p-8">
                <SectionHeader title={title} icon={icon} iconClassName={iconClassName} />

                <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <Input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder={placeholder}
                        className="flex-1"
                    />
                    <Button type="submit" disabled={!newName.trim()} loading={loading} icon={Plus}>
                        {addLabel}
                    </Button>
                </form>

                <div className={`grid gap-4 ${GRID_CLASSES[gridCols]}`}>
                    {items.length === 0 ? (
                        <p className="text-text-secondary py-4 col-span-full">
                            {emptyMessage ?? `No ${entityLabel}s defined.`}
                        </p>
                    ) : (
                        items.map(item => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between bg-white border border-border p-4 rounded-xl hover:border-border/80 transition-all shadow-sm group"
                            >
                                <span className="font-bold text-text-primary">{item.name}</span>
                                <button
                                    onClick={() => setConfirmId(item.id)}
                                    className="text-text-muted hover:text-danger p-2 rounded-full hover:bg-danger/10 transition-colors"
                                    title={`Remove ${entityLabel}`}
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </Card>

            <ConfirmModal
                isOpen={!!confirmId}
                onClose={() => setConfirmId(null)}
                onConfirm={handleConfirmDelete}
                title={`Remove ${entityLabel}?`}
                message={`Are you sure you want to remove "${confirmTarget?.name}"? This may affect related records.`}
                confirmLabel="Remove"
            />
        </>
    );
}
