/**
 * Rating — shared/ui wrapper
 * App-custom component (no HeroUI native equivalent).
 * Supports read-only display with star count and review count label.
 */
import React from 'react';
export interface RatingProps {
    value: number;
    max?: number;
    size?: 'sm' | 'md' | 'lg';
    readOnly?: boolean;
    count?: number;
    onChange?: (value: number) => void;
    className?: string;
}
export declare const Rating: React.FC<RatingProps>;
//# sourceMappingURL=Rating.d.ts.map