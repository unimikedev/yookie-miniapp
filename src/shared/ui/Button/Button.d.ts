/**
 * Button — shared/ui wrapper
 *
 * Wraps HeroUI Button pattern for the web.
 * Customise via Button.module.css tokens — never add inline styles.
 *
 * HeroUI ref: heroui-native-main/src/components/button
 */
import React from 'react';
export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'outline' | 'ghost' | 'danger' | 'danger-soft';
export type ButtonSize = 'sm' | 'md' | 'lg';
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isIconOnly?: boolean;
    isDisabled?: boolean;
    loading?: boolean;
    fullWidth?: boolean;
}
export declare const Button: React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement>>;
//# sourceMappingURL=Button.d.ts.map