/**
 * Shared constants used across frontend.
 * Single source of truth for categories, external URLs, etc.
 */

import type { CategoryEnum } from '@/lib/api/types';

export const TELEGRAM_BOT_URL = 'https://t.me/yookie_bot';
export const TELEGRAM_BOT_USERNAME = 'yookie_bot';

export function getMerchantShareLink(businessId: string, restricted = false): string {
  const param = restricted ? `b_${businessId}_r` : `b_${businessId}`;
  return `https://t.me/${TELEGRAM_BOT_USERNAME}?startapp=${param}`;
}

export function getTelegramShareUrl(link: string, businessName: string): string {
  return `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(`Запишитесь в ${businessName} через Yookie — удобно и быстро!`)}`;
}

// Map category keys to their PNG icon filenames
export const CATEGORY_ICONS: Record<CategoryEnum | 'brow_lash' | 'makeup' | 'spa_massage' | 'epilation' | 'other', string> = {
  hair: '/categories/hair.png',
  nail: '/categories/nail.png',
  brow_lash: '/categories/brows.png',
  makeup: '/categories/cosmetology.png',
  spa_massage: '/categories/massage.png',
  epilation: '/categories/hair-removal.png',
  cosmetology: '/categories/cosmetology.png',
  barber: '/categories/barber.png',
  tattoo: '/categories/tattoo.png',
  piercing: '/categories/piercing.png',
  yoga: '/categories/yoga.png',
  fitness: '/categories/fitness.png',
  other: '/categories/cosmetology.png',
};

export const CATEGORIES: { key: CategoryEnum; label: string; icon: string }[] = [
  { key: 'hair', label: 'Волосы', icon: CATEGORY_ICONS['hair'] },
  { key: 'nail', label: 'Ногти', icon: CATEGORY_ICONS['nail'] },
  { key: 'brow_lash', label: 'Брови и ресницы', icon: CATEGORY_ICONS['brow_lash'] },
  { key: 'makeup', label: 'Макияж', icon: CATEGORY_ICONS['makeup'] },
  { key: 'spa_massage', label: 'СПА и массаж', icon: CATEGORY_ICONS['spa_massage'] },
  { key: 'epilation', label: 'Эпиляция', icon: CATEGORY_ICONS['epilation'] },
  { key: 'cosmetology', label: 'Косметология', icon: CATEGORY_ICONS['cosmetology'] },
  { key: 'barber', label: 'Барбершоп', icon: CATEGORY_ICONS['barber'] },
  { key: 'tattoo', label: 'Тату', icon: CATEGORY_ICONS['tattoo'] },
  { key: 'piercing', label: 'Пирсинг', icon: CATEGORY_ICONS['piercing'] },
  { key: 'yoga', label: 'Йога', icon: CATEGORY_ICONS['yoga'] },
  { key: 'fitness', label: 'Фитнес', icon: CATEGORY_ICONS['fitness'] },
];
