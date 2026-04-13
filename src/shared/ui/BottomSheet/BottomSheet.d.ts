import React, { ReactNode } from 'react';
export interface BottomSheetProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    'aria-label'?: string;
}
export declare const BottomSheet: React.FC<BottomSheetProps>;
//# sourceMappingURL=BottomSheet.d.ts.map