import React from 'react';
interface BottomNavItem {
    path: string;
    label: string;
    icon: React.ReactNode;
    activeIcon?: React.ReactNode;
    ariaLabel?: string;
    end?: boolean;
}
interface BottomNavProps {
    items?: BottomNavItem[];
}
export declare const BottomNav: React.FC<BottomNavProps>;
export {};
//# sourceMappingURL=BottomNav.d.ts.map