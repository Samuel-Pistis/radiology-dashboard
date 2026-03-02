import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { PageHeader, Tabs } from '@/components/ui';
import type { TabItem } from '@/components/ui/Tabs';
import { Lock } from 'lucide-react';

// Subcomponents
import { SettingsCentreProfile } from './settings/SettingsCentreProfile';
import { SettingsModalities } from './settings/SettingsModalities';
import { SettingsContrastTypes } from './settings/SettingsContrastTypes';
import { SettingsFilmSizes } from './settings/SettingsFilmSizes';
import { SettingsShifts } from './settings/SettingsShifts';
import { SettingsStaff } from './settings/SettingsStaff';
import { SettingsEquipment } from './settings/SettingsEquipment';

export const Settings: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('centre');

    if (user?.role !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in duration-500">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
                    <Lock className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-text-primary mb-2">Access Restricted</h2>
                <p className="text-text-secondary max-w-md">
                    You do not have the required administrative permissions to view or modify system settings. Please contact your system administrator.
                </p>
            </div>
        );
    }

    const tabItems: TabItem[] = [
        { value: 'centre', label: 'Centre Profile' },
        { value: 'modalities', label: 'Modalities' },
        { value: 'contrast', label: 'Contrast Types' },
        { value: 'films', label: 'Film Sizes' },
        { value: 'shifts', label: 'Shifts' },
        { value: 'staff', label: 'Staff Management' },
        { value: 'equipment', label: 'Equipment Tracking' },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'centre': return <SettingsCentreProfile />;
            case 'modalities': return <SettingsModalities />;
            case 'contrast': return <SettingsContrastTypes />;
            case 'films': return <SettingsFilmSizes />;
            case 'shifts': return <SettingsShifts />;
            case 'staff': return <SettingsStaff />;
            case 'equipment': return <SettingsEquipment />;
            default: return null;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PageHeader
                title="System Settings"
                description="Manage your facility's configurations, inventory alerts, and staff access."
            />

            <div className="bg-white rounded-2xl shadow-sm border border-border p-2">
                <Tabs
                    items={tabItems}
                    activeValue={activeTab}
                    onChange={setActiveTab}
                />
                <div className="p-4">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};
