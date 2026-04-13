import React from 'react';
import { Booking } from '@/lib/api/types';
interface BookingCardProps {
    booking: Booking & {
        businessName?: string;
        serviceName?: string;
        masterName?: string;
    };
    onCancel?: (booking: Booking) => void;
    onReview?: (booking: Booking) => void;
}
export declare const BookingCard: React.FC<BookingCardProps>;
export {};
//# sourceMappingURL=BookingCard.d.ts.map