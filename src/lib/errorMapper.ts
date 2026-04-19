/**
 * Маппинг кодов ошибок API на понятные пользователю сообщения
 */

export type ErrorCode = 
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR'
  | 'SERVER_ERROR'
  | 'BOOKING_CONFLICT'
  | 'SLOT_UNAVAILABLE'
  | 'INVALID_SCHEDULE'
  | 'IMAGE_TOO_LARGE'
  | 'UNKNOWN_ERROR';

export interface ErrorMapping {
  title: string;
  message: string;
  suggestion?: string;
}

export const errorMessages: Record<ErrorCode, ErrorMapping> = {
  VALIDATION_ERROR: {
    title: 'Ошибка валидации',
    message: 'Проверьте правильность заполнения полей',
    suggestion: 'Исправьте ошибки и попробуйте снова',
  },
  UNAUTHORIZED: {
    title: 'Требуется авторизация',
    message: 'Вы не вошли в систему или сессия истекла',
    suggestion: 'Войдите в аккаунт еще раз',
  },
  FORBIDDEN: {
    title: 'Доступ запрещен',
    message: 'У вас нет прав для выполнения этого действия',
  },
  NOT_FOUND: {
    title: 'Не найдено',
    message: 'Запрашиваемый ресурс не существует',
  },
  CONFLICT: {
    title: 'Конфликт данных',
    message: 'Произошел конфликт при сохранении данных',
  },
  BOOKING_CONFLICT: {
    title: 'Время уже занято',
    message: 'Это время только что забронировали',
    suggestion: 'Выберите другое время или дату',
  },
  SLOT_UNAVAILABLE: {
    title: 'Слот недоступен',
    message: 'Выбранное время больше недоступно',
    suggestion: 'Посмотрите другие доступные слоты',
  },
  INVALID_SCHEDULE: {
    title: 'Некорректный график',
    message: 'Проверьте настройки графика работы',
    suggestion: 'Время закрытия должно быть позже времени открытия',
  },
  NETWORK_ERROR: {
    title: 'Проблемы с соединением',
    message: 'Нет связи с сервером',
    suggestion: 'Проверьте подключение к интернету',
  },
  TIMEOUT_ERROR: {
    title: 'Превышено время ожидания',
    message: 'Сервер долго не отвечает',
    suggestion: 'Попробуйте еще раз через несколько секунд',
  },
  SERVER_ERROR: {
    title: 'Ошибка сервера',
    message: 'На нашей стороне произошла ошибка',
    suggestion: 'Попробуйте позже или обратитесь в поддержку',
  },
  IMAGE_TOO_LARGE: {
    title: 'Изображение слишком большое',
    message: 'Максимальный размер файла — 5 МБ',
    suggestion: 'Выберите изображение меньшего размера',
  },
  UNKNOWN_ERROR: {
    title: 'Неизвестная ошибка',
    message: 'Что-то пошло не так',
    suggestion: 'Попробуйте обновить страницу',
  },
};

/**
 * Получить понятное сообщение об ошибке по коду
 */
export function getErrorMessage(code: ErrorCode | string): ErrorMapping {
  if (code in errorMessages) {
    return errorMessages[code as ErrorCode];
  }
  
  // Пытаемся найти по частичному совпадению
  const normalizedCode = code.toUpperCase().replace(/[^A-Z_]/g, '') as ErrorCode;
  if (normalizedCode in errorMessages) {
    return errorMessages[normalizedCode];
  }
  
  return errorMessages.UNKNOWN_ERROR;
}

/**
 * Получить сообщение об ошибке из ApiError
 */
export function getErrorFromApiError(error: unknown): ErrorMapping {
  if (!error || typeof error !== 'object') {
    return errorMessages.UNKNOWN_ERROR;
  }

  const err = error as Record<string, unknown>;
  
  // Проверяем код ошибки
  if (err.code && typeof err.code === 'string') {
    return getErrorMessage(err.code);
  }
  
  // Проверяем статус
  if (err.status) {
    const status = Number(err.status);
    
    if (status === 401) return errorMessages.UNAUTHORIZED;
    if (status === 403) return errorMessages.FORBIDDEN;
    if (status === 404) return errorMessages.NOT_FOUND;
    if (status === 409) return errorMessages.BOOKING_CONFLICT;
    if (status === 422) return errorMessages.VALIDATION_ERROR;
    if (status >= 500) return errorMessages.SERVER_ERROR;
  }
  
  // Проверяем сообщение
  if (err.message && typeof err.message === 'string') {
    const msg = err.message.toLowerCase();
    
    if (msg.includes('network') || msg.includes('fetch')) {
      return errorMessages.NETWORK_ERROR;
    }
    if (msg.includes('timeout')) {
      return errorMessages.TIMEOUT_ERROR;
    }
    if (msg.includes('slot') || msg.includes('время')) {
      return errorMessages.SLOT_UNAVAILABLE;
    }
    if (msg.includes('booking') || msg.includes('брон')) {
      return errorMessages.BOOKING_CONFLICT;
    }
    if (msg.includes('schedule') || msg.includes('график')) {
      return errorMessages.INVALID_SCHEDULE;
    }
    if (msg.includes('image') || msg.includes('фото')) {
      return errorMessages.IMAGE_TOO_LARGE;
    }
  }
  
  return errorMessages.UNKNOWN_ERROR;
}
