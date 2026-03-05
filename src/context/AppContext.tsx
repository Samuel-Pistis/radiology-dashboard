import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Modality, DailyActivityLog, DailyContrastRecord, WeeklyOperationsLog, AppState, StaffLog, EquipmentLog, HandoverNote, ActivityLog, ContrastLog, CentreSettings, UserRole } from '../types';
import { useToast } from './ToastContext';
import { supabase } from '../lib/supabase';

interface AppContextType extends AppState {
    isLoading: boolean;
    addModality: (modality: Modality) => Promise<void>;
    removeModality: (id: string) => Promise<void>;
    addActivityLog: (log: DailyActivityLog) => Promise<void>;
    saveShiftActivityLog: (log: ActivityLog) => Promise<void>;
    saveShiftContrastLog: (log: ContrastLog) => Promise<void>;
    saveContrastRecord: (record: DailyContrastRecord) => Promise<void>;
    addWeeklyOpsLog: (log: WeeklyOperationsLog) => Promise<void>;
    deleteWeeklyOpsLog: (id: string) => Promise<void>;
    addStaffLog: (log: StaffLog) => Promise<void>;
    addEquipmentLog: (log: EquipmentLog) => Promise<void>;
    updateEquipmentLog: (id: string, updates: Partial<EquipmentLog>) => Promise<void>;
    addHandoverNote: (note: HandoverNote) => Promise<void>;
    acknowledgeHandoverNote: (id: string, userId: string) => Promise<void>;
    updateCentreSettings: (updates: Partial<CentreSettings>) => Promise<void>;
    updateStaffRole: (profileId: string, role: UserRole) => Promise<void>;
    inviteUser: (email: string) => Promise<void>;
}

const defaultState: AppState = {
    modalities: [
        { id: '1', name: 'MRI' },
        { id: '2', name: 'Computed Tomography (CT)' },
        { id: '3', name: 'X-Ray' },
        { id: '4', name: 'Fluoroscopy' },
        { id: '5', name: 'Mammography' },
        { id: '6', name: 'Ultrasound' },
    ],
    locations: [
        { id: '1', name: 'Upstairs' },
        { id: '2', name: 'Downstairs BT' },
        { id: '3', name: 'Ayinke' },
    ],
    filmSizes: [
        { id: '1', name: '10x12' },
        { id: '2', name: '14x17' },
    ],
    contrastTypes: [
        { id: '1', name: 'Jodascan 300' },
        { id: '2', name: 'Hexopack 350' },
        { id: '3', name: 'Gastrolux' },
        { id: '4', name: 'MRI Contrast' },
    ],
    activityLogs: [],
    shiftActivityLogs: [],
    shiftContrastLogs: [],
    contrastRecords: [],
    centreSettings: null,
    weeklyOpsLogs: [],
    staffLogs: [],
    equipmentLogs: [],
    handoverNotes: [],
    staffProfiles: [],
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AppState>(defaultState);
    const [isLoading, setIsLoading] = useState(false);
    const { showToast } = useToast();

    // Defined outside useEffect so it can be called from anywhere in the component
    const fetchInitialData = async () => {
        try {
            const [
                modalitiesRes,
                locationsRes,
                contrastTypesRes,
                activityLogsRes,
                shiftActivityLogsRes,
                shiftContrastLogsRes,
                contrastRecordsRes,
                centreSettingsRes,
                weeklyOpsLogsRes,
                staffLogsRes,
                equipmentLogsRes,
                handoverNotesRes,
                profilesRes
            ] = await Promise.all([
                supabase.from('modalities').select('*'),
                supabase.from('locations').select('*'),
                supabase.from('contrast_types').select('*'),
                supabase.from('daily_activity_logs').select('*'),
                supabase.from('activity_logs').select('*'),
                supabase.from('contrast_logs').select('*'),
                supabase.from('daily_contrast_records').select('*'),
                supabase.from('centre_settings').select('*').maybeSingle(),
                supabase.from('weekly_operations_logs').select('*'),
                supabase.from('staff_logs').select('*'),
                supabase.from('equipment_logs').select('id, modality_id, modality_name, reason_category, description, resolution, start_time, end_time, is_ongoing, logged_by, logged_by_name, created_at'),
                supabase.from('handover_notes').select('*'),
                supabase.from('profiles').select('id, email, display_name, role, created_at, updated_at')
            ]);

            const modalities = modalitiesRes?.data || [];
            const locations = locationsRes?.data || [];
            const contrastTypes = contrastTypesRes?.data || [];
            const activityLogs = activityLogsRes?.data || [];
            const shiftActivityLogs = shiftActivityLogsRes?.data || [];
            const shiftContrastLogs = shiftContrastLogsRes?.data || [];
            const contrastRecords = contrastRecordsRes?.data || [];
            const centreSettings = centreSettingsRes?.data || null;
            const weeklyOpsLogs = weeklyOpsLogsRes?.data || [];
            const staffLogs = staffLogsRes?.data || [];
            const equipmentLogs = equipmentLogsRes?.data || [];
            const handoverNotes = handoverNotesRes?.data || [];
            const profiles = profilesRes?.data || [];

            const mappedActivityLogs = (activityLogs || []).map((log: any) => ({
                id: log.id,
                date: log.date,
                modalityId: log.modality_id,
                locationId: log.location_id,
                totalInvestigations: log.total_investigations,
                film10x12Used: log.film_10x12_used,
                film14x17Used: log.film_14x17_used,
                revenueAmount: Number(log.revenue_amount)
            }));

            const mappedWeeklyOpsLogs = (weeklyOpsLogs || []).map((log: any) => ({
                id: log.id,
                weekStartDate: log.week_start_date,
                weekEndDate: log.week_end_date,
                challenges: log.challenges,
                resolutions: log.resolutions,
                revenue: log.revenue,
                investigations: log.investigations,
                films: log.films,
                contrast: log.contrast
            }));

            const finalContrastTypes = (contrastTypes && contrastTypes.length > 0)
                ? [...contrastTypes, ...defaultState.contrastTypes.filter(d => !contrastTypes.some((c: any) => c.name === d.name))]
                : defaultState.contrastTypes;

            const parsedSettings = centreSettings ? {
                ...centreSettings,
                contrast_types: (centreSettings.contrast_types && centreSettings.contrast_types.length > 0) ? centreSettings.contrast_types : finalContrastTypes,
                film_sizes: (centreSettings.film_sizes && centreSettings.film_sizes.length > 0) ? centreSettings.film_sizes : defaultState.filmSizes,
                shifts: (centreSettings.shifts && centreSettings.shifts.length > 0) ? centreSettings.shifts : [
                    { name: 'Morning', start_time: '08:00', end_time: '16:00' },
                    { name: 'Afternoon', start_time: '16:00', end_time: '00:00' },
                    { name: 'Night', start_time: '00:00', end_time: '08:00' }
                ],
                contrast_alerts: centreSettings.contrast_alerts || { min_ml: 100, min_bottles: 5 }
            } : null;

            setState({
                modalities: (modalities && modalities.length > 0) ? modalities : defaultState.modalities,
                locations: (locations && locations.length > 0) ? locations : defaultState.locations,
                filmSizes: defaultState.filmSizes,
                contrastTypes: finalContrastTypes,
                activityLogs: mappedActivityLogs,
                shiftActivityLogs: shiftActivityLogs || [],
                shiftContrastLogs: shiftContrastLogs || [],
                contrastRecords: contrastRecords || [],
                centreSettings: parsedSettings,
                weeklyOpsLogs: mappedWeeklyOpsLogs,
                staffLogs: staffLogs || [],
                equipmentLogs: equipmentLogs || [],
                handoverNotes: handoverNotes || [],
                staffProfiles: profiles || [],
            });
        } catch (error) {
            console.error('Error fetching data from Supabase:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Only fetch data once a valid Supabase session exists.
        // This prevents hanging on the loading screen when Supabase RLS
        // blocks unauthenticated table reads.
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                setIsLoading(true);
                await fetchInitialData();
            } else {
                setState(defaultState);
                setIsLoading(false);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const addModality = async (modality: Modality) => {
        try {
            const { error } = await supabase.from('modalities').insert([
                { id: modality.id, name: modality.name }
            ]);
            if (error) throw error;
            setState(prev => ({ ...prev, modalities: [...prev.modalities, modality] }));
        } catch (error) {
            console.error('Error adding modality:', error);
            showToast('Failed to add modality. Please try again.', 'error');
            throw error;
        }
    };

    const removeModality = async (id: string) => {
        try {
            const { error } = await supabase.from('modalities').delete().eq('id', id);
            if (error) throw error;
            setState(prev => ({ ...prev, modalities: prev.modalities.filter(m => m.id !== id) }));
        } catch (error) {
            console.error('Error removing modality:', error);
            showToast('Failed to remove modality. Please try again.', 'error');
            throw error;
        }
    };

    const addActivityLog = async (log: DailyActivityLog) => {
        try {
            const { error } = await supabase.from('daily_activity_logs').insert([{
                id: log.id,
                date: log.date,
                modality_id: log.modalityId,
                location_id: log.locationId,
                total_investigations: log.totalInvestigations,
                film_10x12_used: log.film10x12Used,
                film_14x17_used: log.film14x17Used,
                revenue_amount: log.revenueAmount
            }]);
            if (error) throw error;
            setState(prev => ({ ...prev, activityLogs: [...prev.activityLogs, log] }));
        } catch (error) {
            console.error('Error adding activity log:', error);
            showToast('Failed to save activity log. Please try again.', 'error');
            throw error;
        }
    };

    const saveShiftActivityLog = async (log: ActivityLog) => {
        try {
            const { error } = await supabase.from('activity_logs').upsert([{
                id: log.id,
                date: log.date,
                shift: log.shift,
                logged_by: log.logged_by,
                logged_by_name: log.logged_by_name,
                investigations: log.investigations,
                films: log.films,
                challenges: log.challenges,
                resolutions: log.resolutions
            }], { onConflict: 'date,shift' });

            if (error) throw error;

            setState(prev => {
                const existingIndex = prev.shiftActivityLogs.findIndex(
                    r => r.date === log.date && r.shift === log.shift
                );
                if (existingIndex >= 0) {
                    const newLogs = [...prev.shiftActivityLogs];
                    newLogs[existingIndex] = log;
                    return { ...prev, shiftActivityLogs: newLogs };
                }
                return { ...prev, shiftActivityLogs: [...prev.shiftActivityLogs, log] };
            });
        } catch (error) {
            console.error('Error saving shift activity log:', error);
            showToast('Failed to save activity log. Check your connection.', 'error');
            throw error;
        }
    };

    const saveShiftContrastLog = async (log: ContrastLog) => {
        try {
            const { error } = await supabase.from('contrast_logs').upsert([{
                id: log.id,
                date: log.date,
                shift: log.shift,
                logged_by: log.logged_by,
                logged_by_name: log.logged_by_name,
                entries: log.entries
            }], { onConflict: 'date,shift' });

            if (error) throw error;

            setState(prev => {
                const existingIndex = prev.shiftContrastLogs.findIndex(
                    r => r.date === log.date && r.shift === log.shift
                );
                if (existingIndex >= 0) {
                    const newLogs = [...prev.shiftContrastLogs];
                    newLogs[existingIndex] = log;
                    return { ...prev, shiftContrastLogs: newLogs };
                }
                return { ...prev, shiftContrastLogs: [...prev.shiftContrastLogs, log] };
            });
        } catch (error) {
            console.error('Error saving shift contrast log:', error);
            showToast('Failed to save contrast log. Check your connection.', 'error');
            throw error;
        }
    };

    const saveContrastRecord = async (record: DailyContrastRecord) => {
        try {
            const { error } = await supabase.from('daily_contrast_records').upsert([{
                id: record.id,
                date: record.date,
                morning: record.morning as any,
                afternoon: record.afternoon as any,
                night: record.night as any
            }], { onConflict: 'date' });

            if (error) throw error;

            setState(prev => {
                const existingIndex = prev.contrastRecords.findIndex(r => r.date === record.date);
                if (existingIndex >= 0) {
                    const newRecords = [...prev.contrastRecords];
                    newRecords[existingIndex] = record;
                    return { ...prev, contrastRecords: newRecords };
                }
                return { ...prev, contrastRecords: [...prev.contrastRecords, record] };
            });
        } catch (error) {
            console.error('Error saving contrast record:', error);
            showToast('Failed to save contrast record. Please try again.', 'error');
            throw error;
        }
    };

    const addWeeklyOpsLog = async (log: WeeklyOperationsLog) => {
        try {
            const { error } = await supabase.from('weekly_operations_logs').upsert([{
                id: log.id,
                week_start_date: log.weekStartDate,
                week_end_date: log.weekEndDate,
                challenges: log.challenges,
                resolutions: log.resolutions,
                revenue: log.revenue as any,
                investigations: log.investigations,
                films: log.films,
                contrast: log.contrast
            }], { onConflict: 'id' });
            if (error) throw error;

            setState(prev => {
                const existingIndex = prev.weeklyOpsLogs.findIndex(r => r.id === log.id);
                if (existingIndex >= 0) {
                    const newLogs = [...prev.weeklyOpsLogs];
                    newLogs[existingIndex] = log;
                    return { ...prev, weeklyOpsLogs: newLogs };
                }
                return { ...prev, weeklyOpsLogs: [...prev.weeklyOpsLogs, log] };
            });
        } catch (error) {
            console.error('Error adding/updating weekly ops log:', error);
            showToast('Failed to save weekly log. Please try again.', 'error');
            throw error;
        }
    };

    const deleteWeeklyOpsLog = async (id: string) => {
        try {
            const { error } = await supabase.from('weekly_operations_logs').delete().eq('id', id);
            if (error) throw error;
            setState(prev => ({ ...prev, weeklyOpsLogs: prev.weeklyOpsLogs.filter(log => log.id !== id) }));
        } catch (error) {
            console.error('Error deleting weekly ops log:', error);
            showToast('Failed to delete log. Please try again.', 'error');
            throw error;
        }
    };

    const addStaffLog = async (log: StaffLog) => {
        try {
            const { error } = await supabase.from('staff_logs').insert([log]);
            if (error) throw error;
            setState(prev => ({ ...prev, staffLogs: [...prev.staffLogs, log] }));
        } catch (error) {
            console.error('Error adding staff log:', error);
            showToast('Failed to save staff log. Please try again.', 'error');
            throw error;
        }
    };

    const addEquipmentLog = async (log: EquipmentLog) => {
        try {
            const { error } = await supabase.from('equipment_logs').insert([log]);
            if (error) throw error;
            setState(prev => ({ ...prev, equipmentLogs: [...prev.equipmentLogs, log] }));
        } catch (error) {
            console.error('Error adding equipment log:', error);
            showToast('Failed to log equipment downtime. Please try again.', 'error');
            throw error;
        }
    };

    const updateEquipmentLog = async (id: string, updates: Partial<EquipmentLog>) => {
        try {
            const { error } = await supabase.from('equipment_logs').update(updates).eq('id', id);
            if (error) throw error;
            setState(prev => ({
                ...prev,
                equipmentLogs: prev.equipmentLogs.map(log => log.id === id ? { ...log, ...updates } : log)
            }));
        } catch (error) {
            console.error('Error updating equipment log:', error);
            showToast('Failed to update equipment log. Please try again.', 'error');
            throw error;
        }
    };

    const addHandoverNote = async (note: HandoverNote) => {
        try {
            const { error } = await supabase.from('handover_notes').insert([note]);
            if (error) throw error;
            setState(prev => ({ ...prev, handoverNotes: [...prev.handoverNotes, note] }));
        } catch (error) {
            console.error('Error adding handover note:', error);
            showToast('Failed to save handover note. Please try again.', 'error');
            throw error;
        }
    };

    const acknowledgeHandoverNote = async (id: string, userId: string) => {
        try {
            const now = new Date().toISOString();
            const { error } = await supabase.from('handover_notes')
                .update({ acknowledged: true, acknowledged_by: userId, acknowledged_at: now })
                .eq('id', id);
            if (error) throw error;
            setState(prev => ({
                ...prev,
                handoverNotes: prev.handoverNotes.map(note =>
                    note.id === id
                        ? { ...note, acknowledged: true, acknowledged_by: userId, acknowledged_at: now }
                        : note
                )
            }));
        } catch (error) {
            console.error('Error acknowledging handover note:', error);
            showToast('Failed to acknowledge note. Please try again.', 'error');
            throw error;
        }
    };



    const updateCentreSettings = async (updates: Partial<CentreSettings>) => {
        try {
            if (state.centreSettings) {
                const { error } = await supabase
                    .from('centre_settings')
                    .update(updates)
                    .eq('id', state.centreSettings.id);
                if (error) throw error;
                setState(prev => ({ ...prev, centreSettings: { ...prev.centreSettings!, ...updates } }));
            } else {
                // If there are no settings at all, insert the first row
                const { data, error } = await supabase
                    .from('centre_settings')
                    .insert([updates])
                    .select()
                    .single();
                if (error) throw error;
                setState(prev => ({ ...prev, centreSettings: data as CentreSettings }));
            }
        } catch (error) {
            console.error('Error updating settings:', error);
            showToast('Failed to save settings. Please try again.', 'error');
            throw error;
        }
    };

    const updateStaffRole = async (profileId: string, role: UserRole) => {
        try {
            const { error } = await supabase.from('profiles').update({ role }).eq('id', profileId);
            if (error) throw error;
            setState(prev => ({
                ...prev,
                staffProfiles: prev.staffProfiles.map(p => p.id === profileId ? { ...p, role } : p)
            }));
        } catch (error) {
            console.error('Error updating role:', error);
            showToast('Failed to update staff role. Please try again.', 'error');
            throw error;
        }
    };

    const inviteUser = async (email: string) => {
        console.log(`Invite link requested for ${email}`);
        return Promise.resolve();
    };

    return (
        <AppContext.Provider value={{
            ...state,
            isLoading,
            addModality,
            removeModality,
            addActivityLog,
            saveShiftActivityLog,
            saveShiftContrastLog,
            saveContrastRecord,
            addWeeklyOpsLog,
            deleteWeeklyOpsLog,
            addStaffLog,
            addEquipmentLog,
            updateEquipmentLog,
            addHandoverNote,
            acknowledgeHandoverNote,
            updateCentreSettings,
            updateStaffRole,
            inviteUser,
        }}>
            {children}
        </AppContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
