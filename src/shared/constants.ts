/**
 * Shared constants used across frontend.
 * Single source of truth for categories, external URLs, etc.
 */

import type { CategoryEnum } from '@/lib/api/types';

export const TELEGRAM_BOT_URL = 'https://t.me/yookie_bot';

export const CATEGORIES: { key: CategoryEnum; label: string; emoji: string }[] = [
  { key: 'hair', label: 'Волосы', emoji: '💇‍♀️' },
  { key: 'nail', label: 'Ногти', emoji: '💅' },
  { key: 'brow_lash', label: 'Брови и ресницы', emoji: '👁️' },
  { key: 'makeup', label: 'Макияж', emoji: '💄' },
  { key: 'spa_massage', label: 'СПА и массаж', emoji: '🧖' },
  { key: 'epilation', label: 'Эпиляция', emoji: '🪒' },
  { key: 'cosmetology', label: 'Косметология', emoji: '✨' },
  { key: 'barber', label: 'Барбершоп', emoji: '✂️' },
  { key: 'tattoo', label: 'Тату', emoji: '🖊️' },
  { key: 'piercing', label: 'Пирсинг', emoji: '👂' },
  { key: 'yoga', label: 'Йога', emoji: '🧘' },
  { key: 'fitness', label: 'Фитнес', emoji: '🏋️‍♂️' },
];

export const CATEGORY_EMOJI: Record<CategoryEnum, string> = {
  hair: '💇‍♀️',
  nail: '💅',
  brow_lash: '👁️',
  makeup: '💄',
  spa_massage: '🧖',
  epilation: '🪒',
  cosmetology: '✨',
  barber: '✂️',
  tattoo: '🖊️',
  piercing: '👂',
  yoga: '🧘',
  fitness: '🏋️‍♂️',
  other: '📋',
};
