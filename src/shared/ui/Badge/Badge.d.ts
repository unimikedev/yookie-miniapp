/**
 * Badge — shared/ui wrapper
 * App-custom status badge (no direct HeroUI native equivalent).
 * Maps to HeroUI Chip semantics internally.
 */
import React, { ReactNode } from 'react';
export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';
export interface BadgeProps {
    variant?: BadgeVariant;
    children: ReactNode;
    className?: string;
}
export declare const Badge: React.FC<BadgeProps>;
//# sourceMappingURL=Badge.d.ts.map