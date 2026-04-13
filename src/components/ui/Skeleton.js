import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import React from 'react';
import styles from './Skeleton.module.css';
export const Skeleton = ({ variant = 'text', width = '100%', height = variant === 'circle' ? 40 : variant === 'text' ? 16 : 200, count = 1, className, }) => {
    const skeletons = Array.from({ length: count });
    const style = {
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
    };
    return (_jsx(_Fragment, { children: skeletons.map((_, index) => (_jsx("div", { className: `${styles.skeleton} ${styles[variant]} ${className || ''}`, style: style, role: "status", "aria-label": "Loading" }, index))) }));
};
//# sourceMappingURL=Skeleton.js.map