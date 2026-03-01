import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Trash2, Plus } from 'lucide-react';

export const Settings: React.FC = () => {
    const { modalities, addModality, removeModality } = useAppContext();
    const [newModalityName, setNewModalityName] = useState('');

    const handleAddModality = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newModalityName.trim()) return;
        addModality({ id: Date.now().toString(), name: newModalityName.trim() });
        setNewModalityName('');
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-3xl font-semibold tracking-tight">Settings</h2>
                <p className="text-text-secondary mt-1">Manage system configurations and options.</p>
            </div>

            <div className="rad-card p-8">
                <h3 className="text-2xl font-bold mb-6 text-text-primary tracking-tight">Modality Management</h3>

                <form onSubmit={handleAddModality} className="flex flex-col sm:flex-row gap-3 mb-6">
                    <input
                        type="text"
                        value={newModalityName}
                        onChange={(e) => setNewModalityName(e.target.value)}
                        placeholder="New Modality Name..."
                        className="rad-input flex-1 px-6 py-4"
                    />
                    <button
                        type="submit"
                        disabled={!newModalityName.trim()}
                        className="justify-center rad-btn-primary px-8 py-4 flex items-center gap-2 transition-all duration-300 shadow-md hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Plus className="w-5 h-5 stroke-[3]" />
                        Add Modality
                    </button>
                </form>

                <div className="space-y-3">
                    {modalities.length === 0 ? (
                        <p className="text-text-secondary text-center py-4">No modalities defined.</p>
                    ) : (
                        modalities.map(modality => (
                            <div key={modality.id} className="flex items-center justify-between bg-surface border border-border p-5 rounded-2xl group hover:border-border/80 transition-all shadow-sm">
                                <span className="font-semibold text-text-primary text-lg">{modality.name}</span>
                                <button
                                    onClick={() => removeModality(modality.id)}
                                    className="text-text-muted hover:text-red-500 p-2 rounded-full hover:bg-red-500/10 transition-colors"
                                    title="Remove Modality"
                                >
                                    <Trash2 className="w-5 h-5 stroke-[2.5]" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
