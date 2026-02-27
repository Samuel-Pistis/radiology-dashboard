import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Modality, DailyActivityLog, DailyContrastRecord, WeeklyOperationsLog, AppState } from '../types';

interface AppContextType extends AppState {
    isLoading: boolean;
    addModality: (modality: Modality) => Promise<void>;
    removeModality: (id: string) => Promise<void>;
    addActivityLog: (log: DailyActivityLog) => Promise<void>;
    saveContrastRecord: (record: DailyContrastRecord) => Promise<void>;
    addWeeklyOpsLog: (log: WeeklyOperationsLog) => Promise<void>;
}

const defaultState: AppState = {
    modalities: [
        { id: '1', name: 'MRI' },
        { id: '2', name: 'CT SCAN' },
        { id: '3', name: 'X-RAY' },
        { id: '4', name: 'FLUORO' },
        { id: '5', name: 'MAMMO' },
        { id: '6', name: 'ULTRASOUND' },
        { id: '7', name: 'DOPPLER' },
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
    contrastRecords: [],
    weeklyOpsLogs: [],
};

const AppContext = createContext<AppContextType | undefined>(undefined);

import { supabase } from '../lib/supabase';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AppState>(defaultState);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [
                    { data: modalities },
                    { data: locations },
                    { data: contrastTypes },
                    { data: activityLogs },
                    { data: contrastRecords },
                    { data: weeklyOpsLogs }
                ] = await Promise.all([
                    supabase.from('modalities').select('*'),
                    supabase.from('locations').select('*'),
                    supabase.from('contrast_types').select('*'),
                    supabase.from('daily_activity_logs').select('*'),
                    supabase.from('daily_contrast_records').select('*'),
                    supabase.from('weekly_operations_logs').select('*')
                ]);

                // Map database columns back to camelCase frontend models
                const mappedActivityLogs = (activityLogs || []).map(log => ({
                    id: log.id,
                    date: log.date,
                    modalityId: log.modality_id,
                    locationId: log.location_id,
                    totalInvestigations: log.total_investigations,
                    film10x12Used: log.film_10x12_used,
                    film14x17Used: log.film_14x17_used,
                    revenueAmount: Number(log.revenue_amount)
                }));

                const mappedWeeklyOpsLogs = (weeklyOpsLogs || []).map(log => ({
                    id: log.id,
                    weekStartDate: log.week_start_date,
                    weekEndDate: log.week_end_date,
                    challenges: log.challenges,
                    resolutions: log.resolutions,
                    revenue: log.revenue
                }));

                const finalContrastTypes = (contrastTypes && contrastTypes.length > 0)
                    ? [...contrastTypes, ...defaultState.contrastTypes.filter(d => !contrastTypes.some(c => c.name === d.name))]
                    : defaultState.contrastTypes;

                setState({
                    modalities: (modalities && modalities.length > 0) ? modalities : defaultState.modalities,
                    locations: (locations && locations.length > 0) ? locations : defaultState.locations,
                    filmSizes: defaultState.filmSizes, // Static in frontend for now
                    contrastTypes: finalContrastTypes,
                    activityLogs: mappedActivityLogs,
                    contrastRecords: contrastRecords || [],
                    weeklyOpsLogs: mappedWeeklyOpsLogs,
                });
            } catch (error) {
                console.error('Error fetching data from Supabase:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();
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
            throw error; // Let UI handle error toast if needed
        }
    };

    const removeModality = async (id: string) => {
        try {
            const { error } = await supabase.from('modalities').delete().eq('id', id);
            if (error) throw error;
            setState(prev => ({ ...prev, modalities: prev.modalities.filter(m => m.id !== id) }));
        } catch (error) {
            console.error('Error removing modality:', error);
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
            throw error;
        }
    };

    const addWeeklyOpsLog = async (log: WeeklyOperationsLog) => {
        try {
            const { error } = await supabase.from('weekly_operations_logs').insert([{
                id: log.id,
                week_start_date: log.weekStartDate,
                week_end_date: log.weekEndDate,
                challenges: log.challenges,
                resolutions: log.resolutions,
                revenue: log.revenue as any
            }]);
            if (error) throw error;
            setState(prev => ({ ...prev, weeklyOpsLogs: [...prev.weeklyOpsLogs, log] }));
        } catch (error) {
            console.error('Error adding weekly ops log:', error);
            throw error;
        }
    };

    return (
        <AppContext.Provider value={{
            ...state,
            isLoading,
            addModality,
            removeModality,
            addActivityLog,
            saveContrastRecord,
            addWeeklyOpsLog,
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
