import { useState, useEffect } from 'react';

/**
 * Хук для поиска по клиентам и записям в B2B
 * 
 * Поддерживает поиск по:
 * - Имени клиента
 * - Телефону
 * - Названию услуги
 * - Мастеру
 */
export function useMerchantSearch<T extends { id: string }>(
  items: T[],
  searchFields: (keyof T)[],
  placeholder = 'Поиск...'
) {
  const [query, setQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<T[]>(items);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setFilteredItems(items);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const lowerQuery = query.toLowerCase().trim();

    const filtered = items.filter((item) =>
      searchFields.some((field) => {
        const value = item[field];
        if (value === null || value === undefined) return false;
        
        // Обрабатываем разные типы данных
        if (typeof value === 'string') {
          return value.toLowerCase().includes(lowerQuery);
        }
        
        // Если поле - объект (например, client: { name, phone })
        if (typeof value === 'object') {
          return Object.values(value).some(
            (v) => typeof v === 'string' && v.toLowerCase().includes(lowerQuery)
          );
        }
        
        return false;
      })
    );

    setFilteredItems(filtered);
    
    // Небольшая задержка для UX
    const timer = setTimeout(() => setIsSearching(false), 200);
    return () => clearTimeout(timer);
  }, [query, items, searchFields]);

  return {
    query,
    setQuery,
    filteredItems,
    isSearching,
    hasResults: filteredItems.length > 0,
    resultsCount: filteredItems.length,
    totalItems: items.length,
    placeholder,
  };
}

/**
 * Готовые конфигурации поиска для разных сущностей
 */
export const searchPresets = {
  clients: {
    fields: ['name', 'phone'] as const,
    placeholder: 'Поиск по имени или телефону...',
  },
  bookings: {
    fields: ['client_name', 'client_phone', 'service_name'] as const,
    placeholder: 'Поиск по клиенту, телефону или услуге...',
  },
  staff: {
    fields: ['name', 'specialization'] as const,
    placeholder: 'Поиск по имени или специализации...',
  },
};
