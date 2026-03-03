import React, { useState } from 'react';
import { useCentreSettingsCollection } from '@/hooks/useCentreSettingsCollection';
import { Card, Input, Button, DataTable } from '@/components/ui';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToast } from '@/context/ToastContext';
import { Clock, Plus, Trash2 } from 'lucide-react';
import type { Column } from '@/components/ui/DataTable';

interface ShiftEntry {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
}

const DEFAULT_SHIFTS: ShiftEntry[] = [
    { id: '1', name: 'Morning', startTime: '08:00', endTime: '16:00' },
    { id: '2', name: 'Afternoon', startTime: '16:00', endTime: '00:00' },
    { id: '3', name: 'Night', startTime: '00:00', endTime: '08:00' },
];

export const SettingsShifts: React.FC = () => {
    const { items: mergedShifts, add, remove } = useCentreSettingsCollection<ShiftEntry>(
        'shifts',
        DEFAULT_SHIFTS
    );
    const { showToast } = useToast();

    const [name, setName] = useState('');
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');
    const [loading, setLoading] = useState(false);
    const [confirmId, setConfirmId] = useState<string | null>(null);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !start || !end) return;
        try {
            setLoading(true);
            await add({ id: Date.now().toString(), name: name.trim(), startTime: start, endTime: end });
            showToast(`${name.trim()} shift added.`, 'success');
            setName(''); setStart(''); setEnd('');
        } catch {
            showToast('Failed to add shift.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!confirmId) return;
        try {
            await remove(confirmId);
            showToast('Shift removed.', 'success');
        } catch {
            showToast('Failed to remove shift.', 'error');
        }
        setConfirmId(null);
    };

    const confirmTarget = mergedShifts.find(s => s.id === confirmId);

    const columns: Column<ShiftEntry>[] = [
        { header: 'Shift Name', accessorKey: 'name', sortable: true },
        { header: 'Start Time', accessorKey: 'startTime', align: 'center' as const },
        { header: 'End Time', accessorKey: 'endTime', align: 'center' as const },
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
                <SectionHeader title="Shift Configurations" icon={Clock} iconClassName="text-amber-500" />

                <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100 items-end">
                    <div className="sm:col-span-2">
                        <Input label="Name" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Weekend Swap" />
                    </div>
                    <div>
                        <Input label="Start" type="time" value={start} onChange={e => setStart(e.target.value)} required />
                    </div>
                    <div>
                        <Input label="End" type="time" value={end} onChange={e => setEnd(e.target.value)} required />
                    </div>
                    <div className="sm:col-span-4 text-right mt-2">
                        <Button type="submit" icon={Plus} loading={loading}>Add Shift Block</Button>
                    </div>
                </form>

                <div className="overflow-hidden rounded-xl border border-border">
                    <DataTable columns={columns} data={mergedShifts} />
                </div>
            </Card>

            <ConfirmModal
                isOpen={!!confirmId}
                onClose={() => setConfirmId(null)}
                onConfirm={handleConfirmDelete}
                title="Remove shift?"
                message={`Are you sure you want to remove the "${confirmTarget?.name}" shift block?`}
                confirmLabel="Remove"
            />
        </>
    );
};
