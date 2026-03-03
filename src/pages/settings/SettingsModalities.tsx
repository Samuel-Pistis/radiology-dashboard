import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { SimpleSettingsList } from '@/components/ui/SimpleSettingsList';
import { Activity } from 'lucide-react';

export const SettingsModalities: React.FC = () => {
    const { modalities, addModality, removeModality } = useAppContext();

    const handleAdd = async (name: string) => {
        addModality({ id: Date.now().toString(), name });
    };

    const handleRemove = async (id: string) => {
        removeModality(id);
    };

    return (
        <SimpleSettingsList
            title="Active Modalities"
            icon={Activity}
            iconClassName="text-indigo-500"
            items={modalities}
            onAdd={handleAdd}
            onRemove={handleRemove}
            placeholder="E.g., PET SCAN"
            addLabel="Add Modality"
            entityLabel="modality"
            gridCols={2}
        />
    );
};
