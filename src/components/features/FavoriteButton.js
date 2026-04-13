import { jsx as _jsx } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { useFavoritesStore } from '@/stores/favoritesStore';
import styles from './FavoriteButton.module.css';
export const FavoriteButton = ({ businessId, size = 'md', }) => {
    const { isFavorite, toggle } = useFavoritesStore();
    const [isLiked, setIsLiked] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    // Sync with store on mount and when businessId changes
    useEffect(() => {
        setIsLiked(isFavorite(businessId));
    }, [businessId, isFavorite]);
    const handleClick = (e) => {
        e.stopPropagation();
        setIsAnimating(true);
        toggle(businessId);
        setIsLiked(!isLiked);
        // Reset animation state after animation completes
        setTimeout(() => {
            setIsAnimating(false);
        }, 300);
    };
    return (_jsx("button", { className: `${styles.button} ${styles[size]} ${isLiked ? styles.liked : ''} ${isAnimating ? styles.animating : ''}`, onClick: handleClick, "aria-label": isLiked ? 'Remove from favorites' : 'Add to favorites', "aria-pressed": isLiked, type: "button", children: _jsx("span", { className: styles.heart, "aria-hidden": "true", children: "\u2665" }) }));
};
//# sourceMappingURL=FavoriteButton.js.map