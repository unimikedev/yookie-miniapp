import { jsx as _jsx } from "react/jsx-runtime";
import styles from './Avatar.module.css';
const getInitials = (name) => name
    .split(' ')
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');
export const Avatar = ({ src, name = 'User', size = 'md', variant = 'default', color = 'accent', alt, className, }) => {
    const rootClass = [
        styles.root,
        styles[`size-${size}`],
        styles[`variant-${variant}`],
        styles[`color-${color}`],
        className ?? '',
    ]
        .filter(Boolean)
        .join(' ');
    return (_jsx("div", { className: rootClass, "aria-label": alt ?? name, role: "img", children: src ? (_jsx("img", { src: src, alt: alt ?? name, className: styles.image })) : (_jsx("span", { className: styles.initials, "aria-hidden": "true", children: getInitials(name) })) }));
};
//# sourceMappingURL=Avatar.js.map