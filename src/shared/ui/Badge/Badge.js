import { jsx as _jsx } from "react/jsx-runtime";
import styles from './Badge.module.css';
export const Badge = ({ variant = 'neutral', children, className, }) => (_jsx("span", { className: [styles.root, styles[`variant-${variant}`], className ?? ''].filter(Boolean).join(' '), role: "status", children: children }));
//# sourceMappingURL=Badge.js.map