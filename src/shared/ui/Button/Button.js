import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Button — shared/ui wrapper
 *
 * Wraps HeroUI Button pattern for the web.
 * Customise via Button.module.css tokens — never add inline styles.
 *
 * HeroUI ref: heroui-native-main/src/components/button
 */
import { forwardRef } from 'react';
import styles from './Button.module.css';
export const Button = forwardRef(({ variant = 'primary', size = 'md', isIconOnly = false, isDisabled = false, loading = false, fullWidth = false, className, children, disabled, ...rest }, ref) => {
    const isActuallyDisabled = isDisabled || disabled || loading;
    const rootClass = [
        styles.root,
        styles[`variant-${variant}`],
        styles[`size-${size}`],
        isIconOnly ? styles.iconOnly : '',
        fullWidth ? styles.fullWidth : '',
        isActuallyDisabled ? styles.disabled : '',
        className ?? '',
    ]
        .filter(Boolean)
        .join(' ');
    return (_jsxs("button", { ref: ref, className: rootClass, disabled: isActuallyDisabled, "aria-busy": loading, "aria-disabled": isActuallyDisabled, ...rest, children: [loading && _jsx("span", { className: styles.spinner, "aria-hidden": "true" }), children] }));
});
Button.displayName = 'Button';
//# sourceMappingURL=Button.js.map