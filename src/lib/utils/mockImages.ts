/**
 * Mock image utilities
 *
 * Maps business categories and master slots to local public assets.
 * Used in dev/demo mode when the real API doesn't return photos.
 * All paths resolve to /public/ (served as static assets by Vite).
 */

const CATEGORY_IMAGES: Record<string, string[]> = {
  hair: [
    '/mock-images/merchants/beauty-salons/1.webp',
    '/mock-images/merchants/beauty-salons/2.webp',
    '/mock-images/merchants/beauty-salons/4.webp',
    '/mock-images/merchants/beauty-salons/6.webp',
  ],
  beauty_salon: [
    '/mock-images/merchants/beauty-salons/1.webp',
    '/mock-images/merchants/beauty-salons/2.webp',
    '/mock-images/merchants/beauty-salons/4.webp',
    '/mock-images/merchants/beauty-salons/6.webp',
  ],
  barber: [
    '/mock-images/merchants/barbers/7.webp',
    '/mock-images/merchants/barbers/8.webp',
    '/mock-images/merchants/barbers/12.webp',
  ],
  nail: [
    '/mock-images/merchants/nail-studios/3.webp',
    '/mock-images/merchants/nail-studios/5.webp',
  ],
  spa_massage: [
    '/mock-images/merchants/spa/9.jpg',
    '/mock-images/merchants/spa/10.jpg',
    '/mock-images/merchants/spa/11.jpg',
  ],
  brow_lash: [
    '/mock-images/merchants/beauty-salons/1.webp',
    '/mock-images/merchants/beauty-salons/4.webp',
    '/mock-images/merchants/beauty-salons/6.webp',
  ],
  cosmetology: [
    '/mock-images/merchants/beauty-salons/2.webp',
    '/mock-images/merchants/beauty-salons/1.webp',
    '/mock-images/merchants/spa/9.jpg',
  ],
  fitness: [
    '/mock-images/merchants/spa/10.jpg',
    '/mock-images/merchants/spa/11.jpg',
    '/mock-images/merchants/spa/9.jpg',
  ],
  tattoo: [
    '/mock-images/portfolios/42.jpg',
    '/mock-images/portfolios/43.jpg',
    '/mock-images/portfolios/44.webp',
    '/mock-images/portfolios/45.jpg',
  ],
};

const INDIVIDUAL_IMAGES: string[] = [
  '/mock-images/individuals/20.jpg',
  '/mock-images/individuals/21.jpg',
  '/mock-images/individuals/22.jpg',
  '/mock-images/individuals/23.jpg',
  '/mock-images/individuals/24.webp',
];

export const PORTFOLIO_IMAGES: string[] = [
  '/mock-images/portfolios/42.jpg',
  '/mock-images/portfolios/43.jpg',
  '/mock-images/portfolios/44.webp',
  '/mock-images/portfolios/45.jpg',
  '/mock-images/portfolios/47.png',
  '/mock-images/portfolios/48.jpg',
];

/** Deterministic index based on a string seed (business/master id) */
function seedIndex(seed: string, length: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash % length;
}

/**
 * Returns a mock cover image path for a business.
 * Falls back to null for categories without photos (triggers gradient fallback in UI).
 */
export function getMockBusinessImage(category: string, seed: string): string | null {
  const images = CATEGORY_IMAGES[category];
  if (!images || images.length === 0) return null;
  return images[seedIndex(seed, images.length)];
}

/**
 * Returns a mock avatar image path for a master/individual.
 */
export function getMockMasterImage(seed: string): string {
  return INDIVIDUAL_IMAGES[seedIndex(seed, INDIVIDUAL_IMAGES.length)];
}
