/**
 * shared/ui — Yookie UI component library
 *
 * All exports from this barrel.
 * ⚠️  App code must ONLY import from here — never from individual files
 *     or from external UI libraries directly.
 *
 * Components marked 🔲 in HEROUI_INDEX.md are pending — add here on first use.
 */

// ─── Actions ──────────────────────────────────────────────────────────────────
export { Button } from './Button/Button';
export type { ButtonProps } from './Button/Button';

// ─── Form ──────────────────────────────────────────────────────────────────────
export { SearchField } from './SearchField/SearchField';
export type { SearchFieldProps } from './SearchField/SearchField';

// ─── Display ───────────────────────────────────────────────────────────────────
export { Avatar } from './Avatar/Avatar';
export type { AvatarProps } from './Avatar/Avatar';

export { Badge } from './Badge/Badge';
export type { BadgeProps } from './Badge/Badge';

export { Card, CardHeader, CardBody, CardFooter, CardTitle, CardDescription } from './Card/Card';
export type { CardProps, CardHeaderProps, CardBodyProps, CardFooterProps, CardTitleProps, CardDescriptionProps } from './Card/Card';

export { Rating } from './Rating/Rating';
export type { RatingProps } from './Rating/Rating';

export { Skeleton } from './Skeleton/Skeleton';
export type { SkeletonProps } from './Skeleton/Skeleton';

export { Tag } from './Tag/Tag';
export type { TagProps } from './Tag/Tag';

// ─── Navigation ────────────────────────────────────────────────────────────────
export { Tabs } from './Tabs/Tabs';
export type { TabsProps, TabItem } from './Tabs/Tabs';

export { BottomNav } from './BottomNav/BottomNav';
export type { BottomNavProps } from './BottomNav/BottomNav';

// ─── Overlay / Feedback ────────────────────────────────────────────────────────
export { BottomSheet } from './BottomSheet/BottomSheet';
export type { BottomSheetProps } from './BottomSheet/BottomSheet';

export { EmptyState } from './EmptyState/EmptyState';
export type { EmptyStateProps } from './EmptyState/EmptyState';
