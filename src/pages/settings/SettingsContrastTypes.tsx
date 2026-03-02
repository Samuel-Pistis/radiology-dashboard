import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, Input, Button, DataTable } from '@/components/ui';
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
    const { contrastTypes, updateCentreSettings, centreSettings } = useAppContext();

    const [name, setName] = useState('');
    const [volume, setVolume] = useState('');
    const [cost, setCost] = useState('');
    const [alertLevel, setAlertLevel] = useState('');

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        const newType = {
            id: Date.now().toString(),
            name: name.trim(),
            defaultVolumeMls: Number(volume) || 0,
            unitCost: Number(cost) || 0,
            minStockAlert: Number(alertLevel) || 0
        };

        const newSettings = { ...centreSettings?.contrast_types, [newType.id]: newType };
        await updateCentreSettings({ contrast_types: newSettings });

        alert("Added contrast type. (Refresh to view if Context isn't synced)");

        setName('');
        setVolume('');
        setCost('');
        setAlertLevel('');
    };

    // To properly respect the prompt: "All settings save to centre_settings + centres tables".
    // I will read from `centreSettings?.contrast_types` directly rather than the generic seeded table if it exists.

    // Fallback mixing AppContext generic contrasts + Setting specific contrasts
    const mergedContrasts = Object.values(centreSettings?.contrast_types || {}).length > 0
        ? Object.values(centreSettings!.contrast_types as Record<string, any>)
        : contrastTypes;

    const handleDelete = async (id: string, currentName: string) => {
        if (!confirm(`Are you sure you want to remove ${currentName}?`)) return;
        const newSettings = { ...(centreSettings?.contrast_types || {}) };
        delete newSettings[id];
        await updateCentreSettings({ contrast_types: newSettings });
    };

    const columns: Column<ContrastEntry>[] = [
        { header: 'Contrast Name', accessorKey: 'name', sortable: true },
        { header: 'Bottle Vol (mL)', accessorKey: (row: ContrastEntry) => row.defaultVolumeMls ?? 'N/A' },
        { header: 'Unit Cost (₦)', accessorKey: (row: ContrastEntry) => row.unitCost ? `₦${row.unitCost.toLocaleString()}` : 'N/A' },
        { header: 'Low Stock Alert (Bottles)', accessorKey: (row: ContrastEntry) => row.minStockAlert ?? 'N/A', align: 'center' as const },
        {
            header: '',
            accessorKey: (row: ContrastEntry) => (
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
                    <Droplet className="w-6 h-6 text-sky-500" />
                    Contrast Types & Inventory Alerts
                </h3>
            </div>

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
                    <Button type="submit" icon={Plus}>Add Type</Button>
                </div>
            </form>

            <div className="overflow-hidden rounded-xl border border-border">
                <DataTable<ContrastEntry> columns={columns} data={mergedContrasts} />
            </div>
        </Card>
    );
};
