import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, Input, Button } from '@/components/ui';
import { Building2, Save } from 'lucide-react';

export const SettingsCentreProfile: React.FC = () => {
    const { centreSettings, updateCentreSettings } = useAppContext();
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [contactInfo, setContactInfo] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Load straight from the global settings row
    useEffect(() => {
        if (centreSettings) {
            setName(centreSettings.name || '');
            setAddress(centreSettings.address || '');
            setContactInfo(centreSettings.contact_info || '');
        }
    }, [centreSettings]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await updateCentreSettings({ name, address, contact_info: contactInfo });
            alert('Settings Profile updated successfully!');
        } catch (error) {
            console.error(error);
            alert('Failed to update profile.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card className="p-8">
            <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
                <h3 className="text-2xl font-bold text-text-primary flex items-center gap-3">
                    <Building2 className="w-6 h-6 text-primary" />
                    Centre Profile
                </h3>
            </div>
            <form onSubmit={handleSave} className="space-y-5 max-w-2xl">
                <Input
                    label="Facility Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
                <Input
                    label="Full Physical Address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                />
                <Input
                    label="Contact Information (Phone / Email)"
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                />
                <div className="pt-4">
                    <Button type="submit" disabled={isSaving || !name} icon={Save}>
                        {isSaving ? 'Saving...' : 'Save Profile'}
                    </Button>
                </div>
            </form>
        </Card>
    );
};
