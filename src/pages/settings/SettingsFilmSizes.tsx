import React from 'react';
import { SimpleSettingsList } from '@/components/ui/SimpleSettingsList';
import { useCentreSettingsCollection } from '@/hooks/useCentreSettingsCollection';
import { useAppContext } from '../../context/AppContext';
import { LayoutPanelTop } from 'lucide-react';

interface FilmSize {
    id: string;
    name: string;
}

export const SettingsFilmSizes: React.FC = () => {
    const { filmSizes: defaultFilmSizes } = useAppContext();
    const { items, add, remove } = useCentreSettingsCollection<FilmSize>(
        'film_sizes',
        defaultFilmSizes
    );

    return (
        <SimpleSettingsList
            title="Film Sizes"
            icon={LayoutPanelTop}
            iconClassName="text-pink-500"
            items={items}
            onAdd={async (name) => add({ id: Date.now().toString(), name })}
            onRemove={remove}
            placeholder="E.g., 8x10"
            addLabel="Add Film Size"
            entityLabel="film size"
            gridCols={3}
        />
    );
};
