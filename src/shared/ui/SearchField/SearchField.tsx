/**
 * SearchField — shared/ui wrapper
 * HeroUI ref: heroui-native-main/src/components/search-field
 * Flat API: value, onChange, onClear, placeholder, autoFocus
 */
import React, { useRef, useEffect } from 'react';
import styles from './SearchField.module.css';

export interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  'aria-label'?: string;
}

export const SearchField: React.FC<SearchFieldProps> = ({
  value,
  onChange,
  onClear,
  placeholder = 'Поиск...',
  autoFocus = false,
  className,
  'aria-label': ariaLabel,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const handleClear = () => {
    onChange('');
    onClear?.();
    inputRef.current?.focus();
  };

  return (
    <div className={[styles.root, className ?? ''].filter(Boolean).join(' ')}>
      <span className={styles.icon} aria-hidden="true">🔍</span>
      <input
        ref={inputRef}
        type="text"
        className={styles.input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        autoComplete="off"
        spellCheck={false}
      />
      {value && (
        <button
          type="button"
          className={styles.clearButton}
          onClick={handleClear}
          aria-label="Очистить"
        >
          ✕
        </button>
      )}
    </div>
  );
};
