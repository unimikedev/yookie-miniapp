import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { CATEGORY_LABELS } from '@/lib/api/types';
import { Badge, Rating } from '@/components/ui';
import { FavoriteButton } from './FavoriteButton';
import styles from './BusinessCard.module.css';
const getCategoryEmoji = (category) => {
    const emojiMap = {
        beauty_salon: '💄',
        barber: '✂️',
        nail: '💅',
        brow_lash: '👁️',
        spa_massage: '🧖',
        fitness: '💪',
        yoga: '🧘',
        tattoo: '🎨',
        cosmetology: '✨',
        pet_grooming: '🐕',
        dentist: '🦷',
        photographer: '📸',
        tutor: '📚',
        other: '🏪',
    };
    return emojiMap[category] || '🏪';
};
const getCategoryGradient = (category) => {
    const gradients = {
        beauty_salon: 'linear-gradient(135deg, #ffc0d0 0%, #ffb3c1 100%)',
        barber: 'linear-gradient(135deg, #c8e6f5 0%, #b3d9f5 100%)',
        nail: 'linear-gradient(135deg, #f5d0ff 0%, #e6b3ff 100%)',
        brow_lash: 'linear-gradient(135deg, #fff5cc 0%, #ffe6a3 100%)',
        spa_massage: 'linear-gradient(135deg, #d0fff0 0%, #a3ffe6 100%)',
        fitness: 'linear-gradient(135deg, #ffcccc 0%, #ffb3b3 100%)',
        yoga: 'linear-gradient(135deg, #d9f5ff 0%, #b3e5ff 100%)',
        tattoo: 'linear-gradient(135deg, #e6d9ff 0%, #d9ccff 100%)',
        cosmetology: 'linear-gradient(135deg, #fff0cc 0%, #ffe6a3 100%)',
        pet_grooming: 'linear-gradient(135deg, #e6f5d0 0%, #d9f0b3 100%)',
        dentist: 'linear-gradient(135deg, #e6f5f0 0%, #b3f0d9 100%)',
        photographer: 'linear-gradient(135deg, #f0e6ff 0%, #e6d9ff 100%)',
        tutor: 'linear-gradient(135deg, #fff9cc 0%, #fff0a3 100%)',
        other: 'linear-gradient(135deg, #f5f5f5 0%, #e6e6e6 100%)',
    };
    return gradients[category] || gradients.other;
};
export const BusinessCard = ({ business, onClick }) => {
    const categoryLabel = CATEGORY_LABELS[business.category];
    const emoji = getCategoryEmoji(business.category);
    const gradient = getCategoryGradient(business.category);
    const handleClick = () => {
        if (onClick) {
            onClick(business);
        }
    };
    return (_jsxs("div", { className: styles.card, onClick: handleClick, children: [_jsxs("div", { className: styles.header, children: [_jsx("div", { className: styles.photoPlaceholder, style: { background: gradient }, children: _jsx("span", { className: styles.categoryEmoji, children: emoji }) }), _jsx("div", { className: styles.favoriteButton, children: _jsx(FavoriteButton, { businessId: business.id, size: "sm" }) })] }), _jsxs("div", { className: styles.content, children: [_jsx("h3", { className: styles.name, children: business.name }), _jsx("div", { className: styles.categoryBadge, children: _jsx(Badge, { variant: "neutral", children: categoryLabel }) }), business.rating !== undefined && (_jsx("div", { className: styles.ratingRow, children: _jsx(Rating, { value: business.rating, count: 0, size: "sm" }) })), _jsx("p", { className: styles.address, children: business.address }), _jsx("div", { className: styles.priceRange, children: _jsx("span", { className: styles.priceIndicator, children: "\uD83D\uDCB0\uD83D\uDCB0" }) })] })] }));
};
//# sourceMappingURL=BusinessCard.js.map