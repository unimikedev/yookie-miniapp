import { useState, useEffect, useCallback } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  lastOnlineTime: Date | null;
  lastOfflineTime: Date | null;
}

export interface QueuedAction {
  id: string;
  type: string;
  payload: unknown;
  timestamp: number;
  retryCount: number;
}

/**
 * Hook для управления офлайн-режимом
 * - Отслеживание статуса сети
 * - Очередь действий для синхронизации при восстановлении соединения
 * - Индикация офлайн-режима
 */
export function useOfflineMode() {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    lastOnlineTime: navigator.onLine ? new Date() : null,
    lastOfflineTime: navigator.onLine ? null : new Date(),
  });

  const [queue, setQueue] = useState<QueuedAction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Обработчики изменения статуса сети
  const handleOnline = useCallback(() => {
    console.log('[OfflineMode] Сеть восстановлена');
    setStatus((prev) => ({
      ...prev,
      isOnline: true,
      lastOnlineTime: new Date(),
    }));
    
    // Автоматическая синхронизация очереди при восстановлении соединения
    syncQueue();
  }, []);

  const handleOffline = useCallback(() => {
    console.log('[OfflineMode] Потеря соединения');
    setStatus((prev) => ({
      ...prev,
      isOnline: false,
      lastOfflineTime: new Date(),
    }));
  }, []);

  // Подписка на события сети
  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  // Добавление действия в очередь
  const enqueueAction = useCallback((type: string, payload: unknown): string => {
    const action: QueuedAction = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
    };

    setQueue((prev) => [...prev, action]);
    console.log(`[OfflineMode] Действие добавлено в очередь: ${type}`, action.id);
    
    return action.id;
  }, []);

  // Удаление действия из очереди
  const dequeueAction = useCallback((id: string) => {
    setQueue((prev) => prev.filter((action) => action.id !== id));
  }, []);

  // Синхронизация очереди с сервером
  const syncQueue = useCallback(async () => {
    if (!status.isOnline || isSyncing || queue.length === 0) {
      return;
    }

    setIsSyncing(true);
    console.log(`[OfflineMode] Начало синхронизации ${queue.length} действий`);

    const failedActions: QueuedAction[] = [];

    for (const action of queue) {
      try {
        // Здесь должна быть логика отправки на сервер
        // В зависимости от типа действия вызывается соответствующий API метод
        await executeAction(action);
        console.log(`[OfflineMode] Действие выполнено: ${action.id}`);
      } catch (error) {
        console.error(`[OfflineMode] Ошибка выполнения действия ${action.id}:`, error);
        
        // Увеличиваем счетчик попыток
        const updatedAction = {
          ...action,
          retryCount: action.retryCount + 1,
        };

        // Если меньше 3 попыток, оставляем в очереди
        if (updatedAction.retryCount < 3) {
          failedActions.push(updatedAction);
        } else {
          console.error(`[OfflineMode] Действие ${action.id} не выполнено после 3 попыток`);
          // Здесь можно вызвать callback для уведомления пользователя
        }
      }
    }

    setQueue(failedActions);
    setIsSyncing(false);
    console.log(`[OfflineMode] Синхронизация завершена. Осталось в очереди: ${failedActions.length}`);
  }, [status.isOnline, isSyncing, queue]);

  // Функция выполнения действия (должна быть переопределена в компоненте)
  const executeAction = useCallback(async (action: QueuedAction): Promise<void> => {
    // Заглушка - реальная реализация зависит от типа действия
    // Пример:
    // switch (action.type) {
    //   case 'CREATE_BOOKING':
    //     await api.post('/bookings', action.payload);
    //     break;
    //   case 'UPDATE_PROFILE':
    //     await api.patch('/profile', action.payload);
    //     break;
    // }
    
    // Имитация задержки
    await new Promise((resolve) => setTimeout(resolve, 500));
  }, []);

  // Принудительная синхронизация
  const forceSync = useCallback(() => {
    if (status.isOnline) {
      syncQueue();
    }
  }, [status.isOnline, syncQueue]);

  // Очистка очереди
  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  // Получение статистики очереди
  const queueStats = useCallback(() => {
    return {
      total: queue.length,
      oldest: queue.length > 0 ? new Date(queue[0].timestamp) : null,
      newest: queue.length > 0 ? new Date(queue[queue.length - 1].timestamp) : null,
    };
  }, [queue]);

  return {
    isOnline: status.isOnline,
    lastOnlineTime: status.lastOnlineTime,
    lastOfflineTime: status.lastOfflineTime,
    queue,
    queueLength: queue.length,
    isSyncing,
    enqueueAction,
    dequeueAction,
    forceSync,
    clearQueue,
    queueStats,
  };
}
