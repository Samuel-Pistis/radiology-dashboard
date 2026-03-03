import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
    title: string;
    icon: LucideIcon;
    iconClassName?: string;
    children?: React.ReactNode; // optional right-side actions
}

/**
 * Reusable section header used inside Settings cards.
 * Replaces the repeated:
 *   <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
 *     <h3 className="text-2xl font-bold text-text-primary flex items-center gap-3">
 *       <Icon className="w-6 h-6 text-*-500" /> Title
 *     </h3>
 *   </div>
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
    title,
    icon: Icon,
    iconClassName = 'text-primary',
    children,
}) => (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 border-b border-border pb-4 gap-4">
        <h3 className="text-2xl font-bold text-text-primary flex items-center gap-3">
            <Icon className={`w-6 h-6 ${iconClassName}`} />
            {title}
        </h3>
        {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
);
