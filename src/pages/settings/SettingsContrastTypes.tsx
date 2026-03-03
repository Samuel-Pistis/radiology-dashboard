import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useCentreSettingsCollection } from '@/hooks/useCentreSettingsCollection';
import { Card, Input, Button, DataTable } from '@/components/ui';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToast } from '@/context/ToastContext';
import { Droplet, Plus, Trash2 } from 'lucide-react';
import type { Column } from '@/components/ui/DataTable';

interface ContrastEntry {
    id: string;
    name: string;
    defaultVolumeMls?: number;
    unitCost?: number;
    minStockAlert?: number;
}

export const SettingsContrastTypes: React.FC = () => {
    const { contrastTypes } = useAppContext();
    const { items: mergedContrasts, add, remove } = useCentreSettingsCollection<ContrastEntry>(
        'contrast_types',
        contrastTypes
    );
    const { showToast } = useToast();

    const [name, setName] = useState('');
    const [volume, setVolume] = useState('');
    const [cost, setCost] = useState('');
    const [alertLevel, setAlertLevel] = useState('');
    const [loading, setLoading] = useState(false);
    const [confirmId, setConfirmId] = useState<string | null>(null);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        try {
            setLoading(true);
            await add({
                id: Date.now().toString(),
                name: name.trim(),
                defaultVolumeMls: Number(volume) || 0,
                unitCost: Number(cost) || 0,
                minStockAlert: Number(alertLevel) || 0,
            });
            showToast(`${name.trim()} added.`, 'success');
            setName(''); setVolume(''); setCost(''); setAlertLevel('');
        } catch {
            showToast('Failed to add contrast type.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!confirmId) return;
        try {
            await remove(confirmId);
            showToast('Contrast type removed.', 'success');
        } catch {
            showToast('Failed to remove contrast type.', 'error');
        }
        setConfirmId(null);
    };

    const confirmTarget = mergedContrasts.find(c => c.id === confirmId);

    const columns: Column<ContrastEntry>[] = [
        { header: 'Contrast Name', accessorKey: 'name', sortable: true },
        { header: 'Bottle Vol (mL)', accessorKey: (row) => row.defaultVolumeMls ?? 'N/A' },
        { header: 'Unit Cost (₦)', accessorKey: (row) => row.unitCost ? `₦${row.unitCost.toLocaleString()}` : 'N/A' },
        { header: 'Low Stock Alert (Bottles)', accessorKey: (row) => row.minStockAlert ?? 'N/A', align: 'center' as const },
        {
            header: '',
            accessorKey: (row) => (
                <button onClick={() => setConfirmId(row.id)} className="text-text-muted hover:text-danger flex ml-auto">
                    <Trash2 className="w-4 h-4" />
                </button>
            ),
            align: 'right' as const,
        },
    ];

    return (
        <>
            <Card className="p-8">
                <SectionHeader title="Contrast Types & Inventory Alerts" icon={Droplet} iconClassName="text-sky-500" />

                <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100 items-end">
                    <div className="sm:col-span-2">
                        <Input label="Name" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Iohexol 300" />
                    </div>
                    <div>
                        <Input label="Vol (mL)" type="number" value={volume} onChange={e => setVolume(e.target.value)} placeholder="50" />
                    </div>
                    <div>
                        <Input label="Cost (₦)" type="number" value={cost} onChange={e => setCost(e.target.value)} placeholder="15000" />
                    </div>
                    <div>
                        <Input label="Alert Target" type="number" value={alertLevel} onChange={e => setAlertLevel(e.target.value)} placeholder="10" />
                    </div>
                    <div className="sm:col-span-5 text-right mt-2">
                        <Button type="submit" icon={Plus} loading={loading}>Add Type</Button>
                    </div>
                </form>

                <div className="overflow-hidden rounded-xl border border-border">
                    <DataTable<ContrastEntry> columns={columns} data={mergedContrasts} />
                </div>
            </Card>

            <ConfirmModal
                isOpen={!!confirmId}
                onClose={() => setConfirmId(null)}
                onConfirm={handleConfirmDelete}
                title="Remove contrast type?"
                message={`Are you sure you want to remove "${confirmTarget?.name}"?`}
                confirmLabel="Remove"
            />
        </>
    );
};
