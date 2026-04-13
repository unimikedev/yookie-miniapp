import React, { ReactNode } from 'react';
interface BottomSheetProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    'aria-label'?: string;
}
export declare const BottomSheet: React.FC<BottomSheetProps>;
export {};
//# sourceMappingURL=BottomSheet.d.ts.map