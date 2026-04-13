import React from 'react';
import { TimeSlot } from '@/lib/api/types';
interface SlotGridProps {
    slots: TimeSlot[];
    selectedSlot: string | null;
    onSelect: (slot: TimeSlot) => void;
}
export declare const SlotGrid: React.FC<SlotGridProps>;
export {};
//# sourceMappingURL=SlotGrid.d.ts.map