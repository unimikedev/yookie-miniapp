import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import styles from './Skeleton.module.css';
const toPx = (v) => typeof v === 'number' ? `${v}px` : v;
export const Skeleton = ({ variant = 'text', width = '100%', height, count = 1, className, }) => {
    const resolvedHeight = height ?? (variant === 'circle' ? 40 : variant === 'text' ? 16 : 200);
    const items = Array.from({ length: count });
    return (_jsx(_Fragment, { children: items.map((_, i) => (_jsx("div", { className: [styles.root, styles[variant], className ?? ''].filter(Boolean).join(' '), style: {
                '--sk-w': toPx(width),
                '--sk-h': toPx(resolvedHeight),
            }, role: "status", "aria-label": "Loading" }, i))) }));
};
//# sourceMappingURL=Skeleton.js.map