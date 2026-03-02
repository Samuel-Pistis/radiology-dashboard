import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, Input, Button } from '@/components/ui';
import { Activity, Plus, Trash2 } from 'lucide-react';

export const SettingsModalities: React.FC = () => {
    const { modalities, addModality, removeModality } = useAppContext();
    const [newModalityName, setNewModalityName] = useState('');

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newModalityName.trim()) return;
        addModality({ id: Date.now().toString(), name: newModalityName.trim() });
        setNewModalityName('');
    };

    const handleDelete = (id: string, name: string) => {
        if (confirm(`Are you sure you want to remove the ${name} modality? This may affect logging forms.`)) {
            removeModality(id);
        }
    };

    return (
        <Card className="p-8">
            <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
                <h3 className="text-2xl font-bold text-text-primary flex items-center gap-3">
                    <Activity className="w-6 h-6 text-indigo-500" />
                    Active Modalities
                </h3>
            </div>

            <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <Input
                    type="text"
                    value={newModalityName}
                    onChange={(e) => setNewModalityName(e.target.value)}
                    placeholder="E.g., PET SCAN"
                    className="flex-1"
                />
                <Button type="submit" disabled={!newModalityName.trim()} icon={Plus}>
                    Add Modality
                </Button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {modalities.length === 0 ? (
                    <p className="text-text-secondary py-4 col-span-full">No modalities defined.</p>
                ) : (
                    modalities.map(modality => (
                        <div key={modality.id} className="flex items-center justify-between bg-white border border-border p-4 rounded-xl hover:border-border/80 transition-all shadow-sm group">
                            <span className="font-bold text-text-primary">{modality.name}</span>
                            <button
                                onClick={() => handleDelete(modality.id, modality.name)}
                                className="text-text-muted hover:text-danger p-2 rounded-full hover:bg-danger/10 transition-colors"
                                title="Remove Modality"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </Card>
    );
};
