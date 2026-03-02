import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, Input, Button, DataTable } from '@/components/ui';
import { Clock, Plus, Trash2 } from 'lucide-react';
import type { Column } from '@/components/ui/DataTable';

interface ShiftEntry {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
}

export const SettingsShifts: React.FC = () => {
    const { updateCentreSettings, centreSettings } = useAppContext();

    // Default fallback Shifts if none exist in settings
    const defaultShifts = [
        { id: '1', name: 'Morning', startTime: '08:00', endTime: '16:00' },
        { id: '2', name: 'Afternoon', startTime: '16:00', endTime: '00:00' },
        { id: '3', name: 'Night', startTime: '00:00', endTime: '08:00' }
    ];

    const mergedShifts = Object.values(centreSettings?.shifts || {}).length > 0
        ? Object.values(centreSettings!.shifts as Record<string, any>)
        : defaultShifts;

    const [name, setName] = useState('');
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !start || !end) return;

        const newShift = {
            id: Date.now().toString(),
            name: name.trim(),
            startTime: start,
            endTime: end
        };

        // Initialize from defaults if centreSettings.shifts is empty but they want to add
        let baseShifts = centreSettings?.shifts;
        if (!baseShifts || Object.keys(baseShifts).length === 0) {
            baseShifts = Object.fromEntries(defaultShifts.map(s => [s.id, s]));
        }

        const newSettings = { ...baseShifts, [newShift.id]: newShift };
        await updateCentreSettings({ shifts: newSettings });

        alert('Added new Shift configuration.');
        setName('');
        setStart('');
        setEnd('');
    };

    const handleDelete = async (id: string, currentName: string) => {
        if (!confirm(`Remove the ${currentName} shift block?`)) return;

        let baseShifts = centreSettings?.shifts;
        if (!baseShifts || Object.keys(baseShifts).length === 0) {
            baseShifts = Object.fromEntries(defaultShifts.map(s => [s.id, s]));
        }

        const newSettings = { ...baseShifts };
        delete newSettings[id];
        await updateCentreSettings({ shifts: newSettings });
    };

    const columns: Column<ShiftEntry>[] = [
        { header: 'Shift Name', accessorKey: 'name', sortable: true },
        { header: 'Start Time', accessorKey: 'startTime', align: 'center' as const },
        { header: 'End Time', accessorKey: 'endTime', align: 'center' as const },
        {
            header: '',
            accessorKey: (row: ShiftEntry) => (
                <button onClick={() => handleDelete(row.id, row.name)} className="text-text-muted hover:text-danger flex ml-auto">
                    <Trash2 className="w-4 h-4" />
                </button>
            ),
            align: 'right' as const
        }
    ];

    return (
        <Card className="p-8">
            <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
                <h3 className="text-2xl font-bold text-text-primary flex items-center gap-3">
                    <Clock className="w-6 h-6 text-amber-500" />
                    Shift Configurations
                </h3>
            </div>

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
                    <Button type="submit" icon={Plus}>Add Shift Block</Button>
                </div>
            </form>

            <div className="overflow-hidden rounded-xl border border-border">
                <DataTable columns={columns} data={mergedShifts} />
            </div>
        </Card>
    );
};
