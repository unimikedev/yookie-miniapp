import React from 'react';
import { Skeleton } from './Skeleton';
import { EmptyState } from './EmptyState';
import styles from './LoadingState.module.css';

export type LoadingVariant = 'skeleton' | 'spinner' | 'empty';

export interface LoadingStateProps {
  /** Что загружается: список, карточка, профиль и т.д. */
  variant?: LoadingVariant;
  /** Для skeleton: тип контента */
  skeletonType?: 'list' | 'card' | 'profile' | 'text';
  /** Количество элементов для скелетона */
  count?: number;
  /** Текст для empty state */
  emptyTitle?: string;
  /** Описание для empty state */
  emptyDescription?: string;
  /** Действие для empty state */
  emptyAction?: React.ReactNode;
  /** Состояние загрузки */
  isLoading?: boolean;
  /** Ошибка загрузки */
  error?: string | null;
  /** Есть ли данные (для empty state) */
  hasData?: boolean;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Универсальный компонент состояний загрузки/пустого состояния/ошибки
 * 
 * Использование:
 * - Загрузка: <LoadingState isLoading skeletonType="list" count={5} />
 * - Пусто: <LoadingState hasData={false} emptyTitle="Нет записей" emptyDescription="Создайте первую запись" />
 * - Ошибка: <LoadingState error="Ошибка загрузки" />
 * - Контент: <LoadingState isLoading={isLoading} error={error} hasData={data.length > 0}><List /></LoadingState>
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
  variant = 'skeleton',
  skeletonType = 'text',
  count = 3,
  emptyTitle = 'Ничего не найдено',
  emptyDescription,
  emptyAction,
  isLoading = false,
  error = null,
  hasData = true,
  children,
  className,
}) => {
  // Ошибка имеет наивысший приоритет
  if (error) {
    return (
      <div className={`${styles.container} ${className || ''}`} role="alert">
        <EmptyState
          icon="⚠️"
          title="Ошибка загрузки"
          description={error}
          action={emptyAction}
        />
      </div>
    );
  }

  // Загрузка
  if (isLoading) {
    return (
      <div className={`${styles.container} ${className || ''}`} role="status" aria-label="Загрузка">
        {variant === 'spinner' ? (
          <div className={styles.spinnerContainer}>
            <div className={styles.spinner} />
            <p className={styles.loadingText}>Загрузка...</p>
          </div>
        ) : (
          <div className={styles.skeletonContainer}>
            {skeletonType === 'list' && (
              <>
                {Array.from({ length: count }).map((_, i) => (
                  <div key={i} className={styles.skeletonListItem}>
                    <Skeleton variant="rect" height={80} />
                  </div>
                ))}
              </>
            )}
            {skeletonType === 'card' && (
              <>
                {Array.from({ length: count }).map((_, i) => (
                  <div key={i} className={styles.skeletonCard}>
                    <Skeleton variant="rect" height={160} />
                    <Skeleton variant="text" height={20} />
                    <Skeleton variant="text" height={16} />
                  </div>
                ))}
              </>
            )}
            {skeletonType === 'profile' && (
              <div className={styles.skeletonProfile}>
                <Skeleton variant="circle" width={80} height={80} />
                <Skeleton variant="text" height={24} />
                <Skeleton variant="text" height={16} />
                <Skeleton variant="text" height={16} />
              </div>
            )}
            {skeletonType === 'text' && (
              <>
                {Array.from({ length: count }).map((_, i) => (
                  <Skeleton key={i} variant="text" height={16} />
                ))}
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  // Пустое состояние
  if (!hasData) {
    return (
      <div className={`${styles.container} ${className || ''}`} role="status">
        <EmptyState
          icon="📭"
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      </div>
    );
  }

  // Контент
  return <>{children}</>;
};
