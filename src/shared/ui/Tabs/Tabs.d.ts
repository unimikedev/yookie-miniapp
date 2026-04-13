/**
 * Tabs — shared/ui wrapper
 * HeroUI ref: heroui-native-main/src/components/tabs
 * Flat API: tabs[], activeKey, onChange
 */
import React from 'react';
export interface TabItem {
    key: string;
    label: string;
}
export interface TabsProps {
    tabs: TabItem[];
    activeKey: string;
    onChange: (key: string) => void;
    variant?: 'primary' | 'secondary';
    className?: string;
    'aria-label'?: string;
}
export declare const Tabs: React.FC<TabsProps>;
//# sourceMappingURL=Tabs.d.ts.map