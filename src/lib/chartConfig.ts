/**
 * Shared Recharts configuration helpers.
 * Import from here instead of defining inline in each chart file.
 */

export const CHART_COLORS = {
    primary: '#0D9488',
    indigo: '#6366F1',
    amber: '#F59E0B',
    pink: '#EC4899',
    purple: '#8B5CF6',
    emerald: '#10B981',
    slate: '#94A3B8',
    red: '#EF4444',
} as const;

/** Ordered palette for multi-series charts (use index % length). */
export const CHART_PALETTE = [
    CHART_COLORS.primary,
    CHART_COLORS.indigo,
    CHART_COLORS.amber,
    CHART_COLORS.pink,
    CHART_COLORS.purple,
    CHART_COLORS.emerald,
    CHART_COLORS.red,
] as const;

/** Standard axis tick style. Spread onto <XAxis> and <YAxis>. */
export const AXIS_TICK_PROPS = {
    tick: { fontSize: 12, fill: '#6B7280' },
    tickLine: false,
    axisLine: false,
} as const;

/** Standard <Tooltip> contentStyle. */
export const TOOLTIP_CONTENT_STYLE: React.CSSProperties = {
    borderRadius: '12px',
    border: 'none',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
};

export const TOOLTIP_LABEL_STYLE: React.CSSProperties = {
    color: '#6B7280',
    fontWeight: 'bold',
    marginBottom: '4px',
};

/** Standard <Legend> wrapperStyle. */
export const LEGEND_WRAPPER_STYLE: React.CSSProperties = {
    paddingTop: '20px',
};

/** Standard CartesianGrid props. */
export const GRID_PROPS = {
    strokeDasharray: '3 3',
    vertical: false,
    stroke: '#E5E7EB',
} as const;

// Needed so CSSProperties import resolves in TS strict mode
import type React from 'react';
