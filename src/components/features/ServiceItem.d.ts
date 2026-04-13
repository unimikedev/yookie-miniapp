import React from 'react';
import { Service } from '@/lib/api/types';
interface ServiceItemProps {
    service: Service;
    selected?: boolean;
    onSelect?: (service: Service) => void;
}
export declare const ServiceItem: React.FC<ServiceItemProps>;
export {};
//# sourceMappingURL=ServiceItem.d.ts.map