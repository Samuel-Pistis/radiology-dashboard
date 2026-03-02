import React, { useState } from 'react';
import { Activity, Droplet, FileBarChart, Spline, Wrench } from 'lucide-react';
import { PageHeader, Tabs } from '@/components/ui';

// Sub-components for each report type
import { ActivityReportTab } from './reports/ActivityReportTab';
import { ContrastReportTab } from './reports/ContrastReportTab';
import { WeeklyReportGenerator } from '../components/WeeklyReportGenerator';
import { PerformanceComparisonTab } from './reports/PerformanceComparisonTab';
import { EquipmentReportTab } from './reports/EquipmentReportTab';

export const Reports: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'activity' | 'contrast' | 'generator' | 'comparison' | 'equipment'>('activity');

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <PageHeader
                title="Reports & Analytics"
                description="Review historical activity trends, contrast stock fluctuations, and generate customized operational reports."
            />

            <Tabs
                items={[
                    { label: 'Activity Reports', value: 'activity', icon: <Activity className="w-5 h-5 stroke-[2.5]" /> },
                    { label: 'Contrast Reports', value: 'contrast', icon: <Droplet className="w-5 h-5 stroke-[2.5]" /> },
                    { label: 'Generate Weekly Report', value: 'generator', icon: <FileBarChart className="w-5 h-5 stroke-[2.5]" /> },
                    { label: 'Performance Comparison', value: 'comparison', icon: <Spline className="w-5 h-5 stroke-[2.5]" /> },
                    { label: 'Equipment', value: 'equipment', icon: <Wrench className="w-5 h-5 stroke-[2.5]" /> }
                ]}
                activeValue={activeTab}
                onChange={(value) => setActiveTab(value as any)}
            />

            <div className="w-full mt-8">
                {activeTab === 'activity' && <ActivityReportTab />}
                {activeTab === 'contrast' && <ContrastReportTab />}
                {activeTab === 'generator' && <WeeklyReportGenerator />}
                {activeTab === 'comparison' && <PerformanceComparisonTab />}
                {activeTab === 'equipment' && <EquipmentReportTab />}
            </div>
        </div>
    );
};
