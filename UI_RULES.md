# UI Rules — Yookie Mini-App

Enforced for all UI work. No exceptions without a documented reason.

---

## 1. Import Rule

All UI components **must** be imported from `@/shared/ui`.

```ts
// ✅
import { Button, Avatar, Chip } from '@/shared/ui';

// ❌ — direct HeroUI import
import { Button } from '@heroui/react';

// ❌ — old path
import { Button } from '../components/ui/Button';

// ❌ — internal file
import { Button } from '@/shared/ui/Button/Button';
```

---

## 2. Styling Rule

**CSS Modules only.** No exceptions.

```tsx
// ✅
import styles from './MyComponent.module.css';
<div className={styles.wrapper}>...</div>

// ❌ — inline style
<div style={{ color: 'red' }}>...</div>

// ❌ — Tailwind class string (unless Tailwind is added as a deliberate dependency)
<div className="flex items-center gap-2">...</div>
```

All colors, spacing, and radii must reference design tokens from `tokens.css`:

```css
/* ✅ */
.button { background-color: var(--color-accent); }

/* ❌ */
.button { background-color: #6a91e0; }
```

---

## 3. Component Existence Rule

**If a component exists in `shared/ui` — use it. Never re-implement.**

Before writing any UI element, check `HEROUI_INDEX.md` status column.
If the component is `🔲 Pending`, create the wrapper in `shared/ui` and mark it `✅ Done`.

---

## 4. Composition Rule

**Composition over custom markup.**

```tsx
// ✅ — compose from shared primitives
<Card>
  <Card.Header>
    <Avatar name="Anna" size="sm" />
    <Chip variant="soft" color="success">Active</Chip>
  </Card.Header>
  <Card.Body>...</Card.Body>
</Card>

// ❌ — raw divs that duplicate a component
<div className={styles.card}>
  <div className={styles.avatar}>A</div>
  <span className={styles.badge}>Active</span>
</div>
```

---

## 5. Minimize Raw HTML

Allowed raw elements inside `shared/ui` wrappers: `button`, `input`, `img`, `span`, `p`, `h1–h6`, `ul/li`, `a`.

App-level code (pages, features) must **never** use raw HTML for UI — always use `shared/ui` components.

---

## 6. Wrapper Pattern

Every new component in `shared/ui` follows this structure:

```
shared/ui/
  ComponentName/
    ComponentName.tsx        ← component + exported types
    ComponentName.module.css ← styles via tokens only
```

### Component template

```tsx
import React, { forwardRef } from 'react';
import styles from './ComponentName.module.css';

export type ComponentNameVariant = 'primary' | 'secondary';

export interface ComponentNameProps {
  variant?: ComponentNameVariant;
  // ... other props
  className?: string;
}

export const ComponentName = forwardRef<HTMLElement, ComponentNameProps>(
  ({ variant = 'primary', className, ...rest }, ref) => {
    const rootClass = [
      styles.root,
      styles[`variant-${variant}`],
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ');

    return <element ref={ref} className={rootClass} {...rest} />;
  }
);

ComponentName.displayName = 'ComponentName';
```

### CSS Module template

```css
/* All values reference design tokens */
.root { }

.variant-primary { background-color: var(--color-accent); color: var(--color-accent-foreground); }
.variant-secondary { background-color: var(--color-default); color: var(--color-default-foreground); }
```

---

## 7. Customisation Rule

To change the visual style of any component:

1. Override a CSS token at `:root` or on a scoped selector — **preferred**
2. Pass `className` to the component to merge additional CSS Module classes
3. **Never** fork a component just to change a color

```css
/* ✅ — retheme accent color globally */
:root { --color-accent: oklch(0.65 0.18 200); }

/* ✅ — scoped override */
.mySection .button { --color-accent: var(--color-success); }
```

---

## 8. Compound Component Rule

Components with sub-parts use the compound pattern:

```tsx
// ✅
<Card>
  <Card.Header>Title</Card.Header>
  <Card.Body>Content</Card.Body>
</Card>

// ❌ — spread props instead of composition
<Card title="Title" body="Content" />
```

---

## 9. Adding a New Component

1. Check `HEROUI_INDEX.md` — does it exist?
2. If `🔲 Pending`: create `shared/ui/ComponentName/` with `.tsx` + `.module.css`
3. Export from `shared/ui/index.ts`
4. Mark `✅ Done` in `HEROUI_INDEX.md`
5. If it's app-custom (🚫 N/A in HEROUI_INDEX): still wraps in `shared/ui`, document as custom

---

## 10. File Locations

| What | Where |
|---|---|
| Design tokens | `src/shared/ui/tokens.css` |
| Component wrappers | `src/shared/ui/ComponentName/` |
| Barrel export | `src/shared/ui/index.ts` |
| Component catalog | `HEROUI_INDEX.md` (repo root of mini-app) |
| Feature components | `src/components/features/` |
| Pages | `src/pages/` |

Feature and page code **imports** from `shared/ui`. It never defines UI primitives.
