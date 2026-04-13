import React, { ReactNode } from 'react';
interface TagProps {
    active?: boolean;
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    children: ReactNode;
    icon?: ReactNode;
    'aria-label'?: string;
    'aria-pressed'?: boolean;
}
export declare const Tag: React.FC<TagProps>;
export {};
//# sourceMappingURL=Tag.d.ts.map