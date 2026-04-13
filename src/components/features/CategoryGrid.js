import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { CATEGORY_LABELS } from '@/lib/api/types';
import styles from './CategoryGrid.module.css';
const FEATURED_CATEGORIES = [
    'beauty_salon',
    'barber',
    'nail',
    'brow_lash',
    'spa_massage',
    'fitness',
    'cosmetology',
    'yoga',
];
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
export const CategoryGrid = ({ onSelect }) => {
    const handleSelect = (category) => {
        onSelect(category);
    };
    return (_jsx("div", { className: styles.grid, children: FEATURED_CATEGORIES.map((category) => {
            const emoji = getCategoryEmoji(category);
            const label = CATEGORY_LABELS[category];
            return (_jsxs("button", { className: styles.card, onClick: () => handleSelect(category), "aria-label": label, children: [_jsx("div", { className: styles.emoji, children: emoji }), _jsx("div", { className: styles.label, children: label })] }, category));
        }) }));
};
//# sourceMappingURL=CategoryGrid.js.map