import { useState, useEffect } from 'react';
import { useBusinessStore } from '@/stores/businessStore';

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
  
  // Get data from businessStore which syncs B2B and B2C
  const currentMerchant = useBusinessStore(state => state.currentMerchant);
  const merchantServices = useBusinessStore(state => state.merchantServices);
  const merchantStaff = useBusinessStore(state => state.merchantStaff);
  const merchantAvailability = useBusinessStore(state => state.merchantAvailability);

  useEffect(() => {
    if (!merchantId) {
      setIsValidated(false);
      setValidationErrors(['Мерчант не выбран']);
      setCompletionPercentage(0);
      return;
    }

    const validate = () => {
      const errors: string[] = [];
      let score = 0;
      const maxScore = 5;

      // Get current data from store
      const merchant = currentMerchant;
      const services = merchantServices;
      const staff = merchantStaff;
      const availability = merchantAvailability;

      // 1. Проверка основных данных (название, категория, город)
      if (!merchant?.business_name || !merchant?.category || !merchant?.city) {
        errors.push('Заполните основную информацию о бизнесе');
      } else {
        score++;
      }

      // 2. Проверка наличия услуг
      if (!services || services.length === 0) {
        errors.push('Добавьте хотя бы одну услугу');
      } else {
        score++;
      }

      // 3. Проверка наличия мастеров
      if (!staff || staff.length === 0) {
        errors.push('Добавьте хотя бы одного мастера');
      } else {
        score++;
      }

      // 4. Проверка графика работы
      if (!availability || availability.filter(a => a.is_open).length === 0) {
        errors.push('Настройте график работы');
      } else {
        score++;
      }

      // 5. Проверка фото (рекомендация, не блокирует)
      if (merchant?.photo_url) {
        score++;
      } else {
        errors.push('Загрузите фото для лучшего восприятия (не обязательно)');
      }

      const percentage = Math.round((score / maxScore) * 100);
      
      setCompletionPercentage(percentage);
      setValidationErrors(errors);
      // Consider validated if all critical checks pass (first 4)
      // Photo is optional, so we allow 4/5 score
      const criticalErrors = errors.filter(e => !e.includes('фото'));
      setIsValidated(criticalErrors.length === 0);
    };

    validate();
  }, [merchantId, currentMerchant, merchantServices, merchantStaff, merchantAvailability]);

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
  const currentMerchant = useBusinessStore.getState().currentMerchant;
  const merchantServices = useBusinessStore.getState().merchantServices;
  const merchantStaff = useBusinessStore.getState().merchantStaff;
  const merchantAvailability = useBusinessStore.getState().merchantAvailability;

  return [
    {
      id: 'profile',
      title: 'Заполните профиль',
      description: 'Название, категория, город, описание',
      isCompleted: !!(currentMerchant?.business_name && currentMerchant?.category && currentMerchant?.city),
      actionUrl: '/pro/settings',
    },
    {
      id: 'services',
      title: 'Добавьте услуги',
      description: 'Минимум 1 услуга с ценой и длительностью',
      isCompleted: merchantServices.length > 0,
      actionUrl: '/pro/services',
    },
    {
      id: 'staff',
      title: 'Добавьте мастеров',
      description: 'Минимум 1 мастер с именем и специализацией',
      isCompleted: merchantStaff.length > 0,
      actionUrl: '/pro/staff',
    },
    {
      id: 'schedule',
      title: 'Настройте график',
      description: 'Укажите рабочие дни и часы',
      isCompleted: merchantAvailability.filter(a => a.is_open).length > 0,
      actionUrl: '/pro/schedule',
    },
    {
      id: 'photo',
      title: 'Загрузите фото',
      description: 'Фото салона или рабочего места',
      isCompleted: !!currentMerchant?.photo_url,
      actionUrl: '/pro/settings',
    },
  ];
}
