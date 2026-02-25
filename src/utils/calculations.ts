import type { DailyActivityLog, DailyContrastRecord } from '../types';

export const calculateTotalRevenue = (logs: DailyActivityLog[]) => {
    return logs.reduce((sum, log) => sum + (log.revenueAmount || 0), 0);
};

export const calculateTotalInvestigations = (logs: DailyActivityLog[]) => {
    return logs.reduce((sum, log) => sum + log.totalInvestigations, 0);
};

export const calculateTotalFilms10x12 = (logs: DailyActivityLog[]) => {
    return logs.reduce((sum, log) => sum + log.film10x12Used, 0);
};

export const calculateTotalFilms14x17 = (logs: DailyActivityLog[]) => {
    return logs.reduce((sum, log) => sum + log.film14x17Used, 0);
};

export const calculateTotalContrastML = (records: DailyContrastRecord[]) => {
    return records.reduce((sum, record) => {
        const morningSum = record.morning.items.reduce((acc, item) => acc + (item.amountConsumed || 0), 0);
        const afternoonSum = record.afternoon.items.reduce((acc, item) => acc + (item.amountConsumed || 0), 0);
        const nightSum = record.night.items.reduce((acc, item) => acc + (item.amountConsumed || 0), 0);
        return sum + morningSum + afternoonSum + nightSum;
    }, 0);
};

export const calculateTotalContrastMLByType = (records: DailyContrastRecord[], contrastTypeId: string) => {
    return records.reduce((sum, record) => {
        const morningSum = record.morning.items.find(i => i.contrastTypeId === contrastTypeId)?.amountConsumed || 0;
        const afternoonSum = record.afternoon.items.find(i => i.contrastTypeId === contrastTypeId)?.amountConsumed || 0;
        const nightSum = record.night.items.find(i => i.contrastTypeId === contrastTypeId)?.amountConsumed || 0;
        return sum + morningSum + afternoonSum + nightSum;
    }, 0);
};

export const filterLogsByDateRange = <T extends { date: string }>(logs: T[], startDate: string, endDate: string) => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    return logs.filter(log => {
        const time = new Date(log.date).getTime();
        return time >= start && time <= end;
    });
};
