/**
 * EmptyState — shared/ui wrapper
 * App-custom component (no HeroUI native equivalent).
 */
import React, { ReactNode } from 'react';
export interface EmptyStateProps {
    icon?: string;
    title: string;
    description?: string;
    action?: ReactNode;
}
export declare const EmptyState: React.FC<EmptyStateProps>;
//# sourceMappingURL=EmptyState.d.ts.map