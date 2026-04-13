/**
 * Skeleton — shared/ui wrapper
 * HeroUI ref: heroui-native-main/src/components/skeleton
 * Dynamic width/height passed via CSS custom properties on the element.
 */
import React from 'react';
export type SkeletonVariant = 'text' | 'circle' | 'rect';
export interface SkeletonProps {
    variant?: SkeletonVariant;
    width?: string | number;
    height?: string | number;
    count?: number;
    className?: string;
}
export declare const Skeleton: React.FC<SkeletonProps>;
//# sourceMappingURL=Skeleton.d.ts.map