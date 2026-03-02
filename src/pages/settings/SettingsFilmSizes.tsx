import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, Input, Button } from '@/components/ui';
import { LayoutPanelTop, Plus, Trash2 } from 'lucide-react';

export const SettingsFilmSizes: React.FC = () => {
    // Same concept: we will pull from centreSettings if exists, otherwise fallback to app default
    const { filmSizes: defaultFilmSizes, updateCentreSettings, centreSettings } = useAppContext();
    const [newSizeName, setNewSizeName] = useState('');

    const mergedFilms = Object.values(centreSettings?.film_sizes || {}).length > 0
        ? Object.values(centreSettings!.film_sizes as Record<string, any>)
        : defaultFilmSizes;

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSizeName.trim()) return;

        const newSize = {
            id: Date.now().toString(),
            name: newSizeName.trim()
        };

        const newSettings = { ...(centreSettings?.film_sizes || {}), [newSize.id]: newSize };
        await updateCentreSettings({ film_sizes: newSettings });

        alert('Added new film size to Centre Settings.');
        setNewSizeName('');
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to remove the ${name} film size?`)) return;

        const newSettings = { ...(centreSettings?.film_sizes || {}) };
        delete newSettings[id];
        await updateCentreSettings({ film_sizes: newSettings });
    };

    return (
        <Card className="p-8">
            <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
                <h3 className="text-2xl font-bold text-text-primary flex items-center gap-3">
                    <LayoutPanelTop className="w-6 h-6 text-pink-500" />
                    Film Sizes
                </h3>
            </div>

            <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <Input
                    type="text"
                    value={newSizeName}
                    onChange={(e) => setNewSizeName(e.target.value)}
                    placeholder="E.g., 8x10"
                    className="flex-1"
                />
                <Button type="submit" disabled={!newSizeName.trim()} icon={Plus}>
                    Add Film Size
                </Button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {mergedFilms.length === 0 ? (
                    <p className="text-text-secondary py-4 col-span-full">No film sizes defined.</p>
                ) : (
                    mergedFilms.map(film => (
                        <div key={film.id} className="flex items-center justify-between bg-white border border-border p-4 rounded-xl hover:border-border/80 transition-all shadow-sm group">
                            <span className="font-bold text-text-primary">{film.name}</span>
                            <button
                                onClick={() => handleDelete(film.id, film.name)}
                                className="text-text-muted hover:text-danger p-2 rounded-full hover:bg-danger/10 transition-colors"
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
