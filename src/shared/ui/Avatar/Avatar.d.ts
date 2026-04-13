/**
 * Avatar — shared/ui wrapper
 * HeroUI ref: heroui-native-main/src/components/avatar
 * Variants: default | soft   Sizes: sm | md | lg
 * Colors: accent | default | success | warning | danger
 */
import React from 'react';
export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';
export type AvatarVariant = 'default' | 'soft';
export type AvatarColor = 'accent' | 'default' | 'success' | 'warning' | 'danger';
export interface AvatarProps {
    src?: string;
    name?: string;
    size?: AvatarSize;
    variant?: AvatarVariant;
    color?: AvatarColor;
    alt?: string;
    className?: string;
}
export declare const Avatar: React.FC<AvatarProps>;
//# sourceMappingURL=Avatar.d.ts.map