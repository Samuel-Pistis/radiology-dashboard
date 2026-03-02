export type UserRole = 'admin' | 'radiology_user';

export interface User {
    id: string;
    name: string;
    role: UserRole;
    email?: string;
    centre_id?: string;
}

export interface Modality {
    id: string;
    name: string;
}

export interface Location {
    id: string;
    name: string;
}

export interface FilmSize {
    id: string;
    name: string; /* e.g. "10x12", "14x17" */
}

export interface ContrastType {
    id: string;
    name: string;
    defaultVolumeMls?: number;
    unitCost?: number;
    minStockAlert?: number;
}

export interface Shift {
    id: string;
    name: string;
    startTime: string; // "08:00"
    endTime: string;   // "16:00"
}

export interface DailyActivityLog {
    id: string;
    date: string; // ISO date string YYYY-MM-DD
    modalityId: string;
    totalInvestigations: number;
    film10x12Used: number;
    film14x17Used: number;
    locationId?: string; // Optional
    revenueAmount?: number; // Calculated or manually entered
}

export interface ContrastItemData {
    contrastTypeId: string;
    totalReceivedMls: number;
    totalReceivedBottles: number;
    additionalStockMls: number;
    additionalStockBottles: number;
    amountConsumedMls: number;
    amountConsumedBottles: number;
    outstandingMls: number;
    outstandingBottles: number;
}

export interface ShiftRecord {
    items: ContrastItemData[];
    handedOverTo: string;
    calculatedBy: string;
    isVerified: boolean;
}

export interface DailyContrastRecord {
    id: string;
    date: string;
    morning: ShiftRecord;
    afternoon: ShiftRecord;
    night: ShiftRecord;
}
export interface ModalityRevenue {
    modalityId: string;
    amount: number;
}

export interface WeeklyOperationsLog {
    id: string;
    weekStartDate: string;
    weekEndDate: string;
    challenges: string;
    resolutions: string;
    revenue: ModalityRevenue[]; // New revenue tracking
    investigations?: any;
    films?: any;
    contrast?: any;
}

export interface AppState {
    modalities: Modality[];
    locations: Location[];
    filmSizes: FilmSize[];
    contrastTypes: ContrastType[];
    activityLogs: DailyActivityLog[];
    shiftActivityLogs: ActivityLog[];
    shiftContrastLogs: ContrastLog[];
    contrastRecords: DailyContrastRecord[];
    centreSettings: CentreSettings | null;
    weeklyOpsLogs: WeeklyOperationsLog[];
    staffLogs: StaffLog[];
    equipmentLogs: EquipmentLog[];
    handoverNotes: HandoverNote[];
    staffProfiles: Profile[];
}

export interface Centre {
    id: string;
    name: string;
    address?: string;
    contact_info?: string;
    created_at?: string;
    updated_at?: string;
}

export interface Profile {
    id: string;
    email: string;
    display_name: string;
    role: UserRole;
    centre_id?: string;
    created_at?: string;
    updated_at?: string;
}

export interface CentreSettings {
    id: string;
    centre_id: string;
    modalities: any;
    contrast_types: any;
    film_sizes: any;
    shifts: any;
    contrast_alerts: any;
    created_at?: string;
    updated_at?: string;
}

export interface ActivityLog {
    id: string;
    centre_id: string;
    date: string;
    shift: string;
    logged_by: string;
    logged_by_name: string;
    investigations: any;
    films: any;
    challenges?: string;
    resolutions?: string;
    created_at?: string;
    updated_at?: string;
}

export interface ContrastLog {
    id: string;
    centre_id: string;
    date: string;
    shift: string;
    logged_by: string;
    logged_by_name: string;
    entries: any;
    created_at?: string;
    updated_at?: string;
}

export interface WeeklyLog {
    id: string;
    centre_id: string;
    start_date: string;
    end_date: string;
    logged_by: string;
    investigations_summary: any;
    films_summary: any;
    contrast_summary: any;
    revenue_summary: any;
    challenges?: string;
    resolutions?: string;
    created_at?: string;
    updated_at?: string;
}

export interface StaffLog {
    id: string;
    centre_id: string;
    date: string;
    staff_id: string;
    staff_name: string;
    shift: string;
    procedures_performed: any;
    total_procedures: number;
    repeats: any;
    total_repeats: number;
    repeat_rate: number;
    contrast_administered: any;
    films_printed: number;
    issues_encountered?: string;
    issues_resolved?: string;
    notes?: string;
    created_at?: string;
    updated_at?: string;
}

export interface EquipmentLog {
    id: string;
    centre_id: string;
    modality_id: string;
    modality_name: string;
    reason_category: string;
    description?: string;
    resolution?: string;
    start_time: string;
    end_time?: string;
    is_ongoing: boolean;
    logged_by: string;
    logged_by_name: string;
    created_at?: string;
}

export interface HandoverNote {
    id: string;
    centre_id: string;
    date: string;
    from_shift: string;
    to_shift: string;
    flagged_by: string;
    flagged_by_name: string;
    category?: string;
    message: string;
    acknowledged: boolean;
    acknowledged_by?: string;
    acknowledged_at?: string;
    created_at?: string;
}
