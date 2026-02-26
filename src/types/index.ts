export type UserRole = 'admin' | 'radiology_user';

export interface User {
    id: string;
    name: string;
    role: UserRole;
    email?: string;
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
}

export interface AppState {
    modalities: Modality[];
    locations: Location[];
    filmSizes: FilmSize[];
    contrastTypes: ContrastType[];
    activityLogs: DailyActivityLog[];
    contrastRecords: DailyContrastRecord[];
    weeklyOpsLogs: WeeklyOperationsLog[];
}
