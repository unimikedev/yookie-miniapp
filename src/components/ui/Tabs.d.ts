import React from 'react';
interface Tab {
    key: string;
    label: string;
}
interface TabsProps {
    tabs: Tab[];
    activeKey: string;
    onChange: (key: string) => void;
    'aria-label'?: string;
}
export declare const Tabs: React.FC<TabsProps>;
export {};
//# sourceMappingURL=Tabs.d.ts.map