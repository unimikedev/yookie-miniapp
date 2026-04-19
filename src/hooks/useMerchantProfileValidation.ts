import { useState, useEffect } from 'react';

/**
 * Хук для проверки полноты профиля мерчанта
 * 
 * Проверяет минимальные требования для публикации бизнеса в B2C:
 * - Заполнены основные данные (название, категория, город)
 * - Добавлена хотя бы 1 услуга
 * - Добавлен хотя бы 1 мастер
 * - Настроен график работы (хотя бы 1 день)
 * - Загружено фото (опционально, но рекомендуется)
 */
export function useMerchantProfileValidation(merchantId: string | null) {
  const [isValidated, setIsValidated] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  useEffect(() => {
    if (!merchantId) {
      setIsValidated(false);
      setValidationErrors(['Мерчант не выбран']);
      setCompletionPercentage(0);
      return;
    }

    // В реальности здесь будет запрос к API для получения полного профиля
    // const { data } = await api.get(`/merchants/${merchantId}/validation`);
    
    // Пока эмулируем проверку на основе данных из merchantStore
    const validate = () => {
      const errors: string[] = [];
      let score = 0;
      const maxScore = 5;

      // TODO: Интегрировать с реальным merchantStore
      // const merchant = useMerchantStore.getState().getMerchantById(merchantId);
      
      // 1. Проверка основных данных (название, категория, город)
      // if (!merchant?.name || !merchant?.category || !merchant?.city) {
      //   errors.push('Заполните основную информацию о бизнесе');
      // } else {
      //   score++;
      // }

      // 2. Проверка наличия услуг
      // if (!merchant?.services || merchant.services.length === 0) {
      //   errors.push('Добавьте хотя бы одну услугу');
      // } else {
      //   score++;
      // }

      // 3. Проверка наличия мастеров
      // if (!merchant?.staff || merchant.staff.length === 0) {
      //   errors.push('Добавьте хотя бы одного мастера');
      // } else {
      //   score++;
      // }

      // 4. Проверка графика работы
      // if (!merchant?.schedule || Object.keys(merchant.schedule).length === 0) {
      //   errors.push('Настройте график работы');
      // } else {
      //   score++;
      // }

      // 5. Проверка фото (рекомендация, не блокирует)
      // if (merchant?.photo_url) {
      //   score++;
      // } else {
      //   errors.push('Загрузите фото для лучшего восприятия (не обязательно)');
      // }

      // Эмуляция для демонстрации
      score = 3; // Допустим, заполнено 3 из 5
      if (score < maxScore) {
        errors.push('Профиль заполнен не полностью');
      }

      const percentage = Math.round((score / maxScore) * 100);
      
      setCompletionPercentage(percentage);
      setValidationErrors(errors);
      setIsValidated(errors.length === 0 || (errors.length === 1 && errors[0].includes('фото')));
    };

    validate();
  }, [merchantId]);

  return {
    isValidated,
    validationErrors,
    completionPercentage,
    isReadyForB2C: isValidated,
  };
}

/**
 * Компонент чеклиста онбординга для мерчанта
 */
export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  actionUrl?: string;
}

export function getOnboardingSteps(merchantId: string | null): OnboardingStep[] {
  return [
    {
      id: 'profile',
      title: 'Заполните профиль',
      description: 'Название, категория, город, описание',
      isCompleted: false, // TODO: проверить merchantStore
      actionUrl: '/pro/settings',
    },
    {
      id: 'services',
      title: 'Добавьте услуги',
      description: 'Минимум 1 услуга с ценой и длительностью',
      isCompleted: false,
      actionUrl: '/pro/services',
    },
    {
      id: 'staff',
      title: 'Добавьте мастеров',
      description: 'Минимум 1 мастер с именем и специализацией',
      isCompleted: false,
      actionUrl: '/pro/staff',
    },
    {
      id: 'schedule',
      title: 'Настройте график',
      description: 'Укажите рабочие дни и часы',
      isCompleted: false,
      actionUrl: '/pro/schedule',
    },
    {
      id: 'photo',
      title: 'Загрузите фото',
      description: 'Фото салона или рабочего места',
      isCompleted: false,
      actionUrl: '/pro/settings',
    },
  ];
}
