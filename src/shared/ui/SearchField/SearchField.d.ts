/**
 * SearchField — shared/ui wrapper
 * HeroUI ref: heroui-native-main/src/components/search-field
 * Flat API: value, onChange, onClear, placeholder, autoFocus
 */
import React from 'react';
export interface SearchFieldProps {
    value: string;
    onChange: (value: string) => void;
    onClear?: () => void;
    placeholder?: string;
    autoFocus?: boolean;
    className?: string;
    'aria-label'?: string;
}
export declare const SearchField: React.FC<SearchFieldProps>;
//# sourceMappingURL=SearchField.d.ts.map