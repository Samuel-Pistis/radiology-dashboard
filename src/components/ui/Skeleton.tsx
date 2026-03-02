import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Height and width via className, e.g. "h-10 w-48" */
}

/** A single shimmer line/block. Compose multiples for card skeletons. */
export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => (
    <div
        className={cn('animate-pulse rounded-lg bg-gray-200', className)}
        aria-hidden="true"
        {...props}
    />
);

/** Pre-built skeleton for a stat card */
export const StatCardSkeleton: React.FC = () => (
    <div className="bg-white rounded-xl border border-border shadow-sm p-5 border-l-4 border-l-gray-200">
        <Skeleton className="h-3 w-24 mb-3" />
        <Skeleton className="h-8 w-16 mb-2" />
        <Skeleton className="h-3 w-20" />
    </div>
);

/** Pre-built skeleton for a generic card */
export const CardSkeleton: React.FC<{ rows?: number }> = ({ rows = 3 }) => (
    <div className="bg-white rounded-xl border border-border shadow-sm p-6">
        <Skeleton className="h-5 w-36 mb-6" />
        {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} className={cn('h-10 w-full mb-3', i === rows - 1 && 'mb-0')} />
        ))}
    </div>
);

/** Full-page skeleton for lazy-loaded routes */
export const PageSkeleton: React.FC = () => (
    <div className="space-y-8 animate-in fade-in pb-12">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <StatCardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CardSkeleton rows={5} />
            <CardSkeleton rows={5} />
        </div>
    </div>
);
