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
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                <p className="text-text-secondary mt-1">Manage system configurations and options.</p>
            </div>

            <div className="bg-surface rounded-xl border border-surface-hover p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-4 border-b border-surface-hover pb-3">Modality Management</h3>

                <form onSubmit={handleAddModality} className="flex flex-col sm:flex-row gap-3 mb-6">
                    <input
                        type="text"
                        value={newModalityName}
                        onChange={(e) => setNewModalityName(e.target.value)}
                        placeholder="New Modality Name..."
                        className="flex-1 bg-background border border-surface-hover rounded-lg px-4 py-3 sm:py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-text-secondary transition-all"
                    />
                    <button
                        type="submit"
                        disabled={!newModalityName.trim()}
                        className="justify-center bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-3 sm:py-2 rounded-lg font-medium flex items-center gap-2 transition-colors duration-200"
                    >
                        <Plus className="w-5 h-5" />
                        Add Modality
                    </button>
                </form>

                <div className="space-y-3">
                    {modalities.length === 0 ? (
                        <p className="text-text-secondary text-center py-4">No modalities defined.</p>
                    ) : (
                        modalities.map(modality => (
                            <div key={modality.id} className="flex items-center justify-between bg-background border border-surface-hover p-4 rounded-lg group hover:border-primary-500 transition-colors">
                                <span className="font-medium">{modality.name}</span>
                                <button
                                    onClick={() => removeModality(modality.id)}
                                    className="text-text-secondary hover:text-red-500 p-2 rounded-md hover:bg-red-500/10 transition-colors"
                                    title="Remove Modality"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
