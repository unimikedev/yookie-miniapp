import { useState, useEffect } from 'react';

interface AlternativeSlot {
  starts_at: string;
  ends_at: string;
  available: boolean;
}

/**
 * Хук для получения альтернативных слотов при конфликте бронирования (409)
 * 
 * Используется после получения ошибки BOOKING_CONFLICT или SLOT_UNAVAILABLE
 * Автоматически запрашивает 3 ближайших доступных слота
 */
export function useAlternativeSlots(
  serviceId: string,
  masterId: string,
  requestedDateTime: string
) {
  const [slots, setSlots] = useState<AlternativeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAlternatives = async () => {
    if (!serviceId || !masterId || !requestedDateTime) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Временная эмуляция - в реальности будет вызов API
      // const { data } = await api.post('/slots/suggest', { ... });
      
      // Mock данных для демонстрации UX
      const mockSlots: AlternativeSlot[] = [
        {
          starts_at: new Date(new Date(requestedDateTime).getTime() + 30 * 60000).toISOString(),
          ends_at: new Date(new Date(requestedDateTime).getTime() + 90 * 60000).toISOString(),
          available: true,
        },
        {
          starts_at: new Date(new Date(requestedDateTime).getTime() + 60 * 60000).toISOString(),
          ends_at: new Date(new Date(requestedDateTime).getTime() + 120 * 60000).toISOString(),
          available: true,
        },
        {
          starts_at: new Date(new Date(requestedDateTime).getTime() + 120 * 60000).toISOString(),
          ends_at: new Date(new Date(requestedDateTime).getTime() + 180 * 60000).toISOString(),
          available: true,
        },
      ];
      
      setSlots(mockSlots);
    } catch (err) {
      setError('Не удалось загрузить альтернативные слоты');
      console.error('[useAlternativeSlots] Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Авто-запрос при изменении параметров
  useEffect(() => {
    fetchAlternatives();
  }, [serviceId, masterId, requestedDateTime]);

  return {
    slots,
    isLoading,
    error,
    refetch: fetchAlternatives,
  };
}
