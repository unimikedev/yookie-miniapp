import React from 'react';
interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    onClear?: () => void;
    placeholder?: string;
    autoFocus?: boolean;
    'aria-label'?: string;
}
export declare const SearchInput: React.FC<SearchInputProps>;
export {};
//# sourceMappingURL=SearchInput.d.ts.map