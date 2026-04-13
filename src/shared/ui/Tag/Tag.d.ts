/**
 * Tag — shared/ui wrapper
 * HeroUI ref: tag-group (standalone tag chip)
 */
import React, { ReactNode } from 'react';
export interface TagProps {
    active?: boolean;
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    children: ReactNode;
    icon?: ReactNode;
    className?: string;
    'aria-label'?: string;
    'aria-pressed'?: boolean;
}
export declare const Tag: React.FC<TagProps>;
//# sourceMappingURL=Tag.d.ts.map