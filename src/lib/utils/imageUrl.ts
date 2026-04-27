/**
 * Image URL optimizer.
 * Images are already resized + converted to WebP by sharp on upload, so the
 * raw Supabase /object/public/ URL is served directly.
 * Supabase Transform API (/render/image/public/) requires a Pro plan —
 * re-enable if the project is upgraded.
 */

export interface ImageTransformOptions {
  width: number
  height?: number
  quality?: number
  resize?: 'cover' | 'contain' | 'fill'
}

export function getOptimizedUrl(
  url: string | null | undefined,
  _opts: ImageTransformOptions
): string {
  return url ?? ''
}

// Preset helpers — use these instead of calling getOptimizedUrl directly

/** Small square (for master chips, list avatars) */
export const thumbUrl = (url: string | null | undefined) =>
  getOptimizedUrl(url, { width: 120, height: 120, quality: 80, resize: 'cover' })

/** Medium square (for home cards, search results) */
export const cardAvatarUrl = (url: string | null | undefined) =>
  getOptimizedUrl(url, { width: 256, height: 256, quality: 82, resize: 'cover' })

/** Wide card cover (for business cards) */
export const cardCoverUrl = (url: string | null | undefined) =>
  getOptimizedUrl(url, { width: 600, height: 400, quality: 82, resize: 'cover' })

/** Full-width hero / detail page cover */
export const heroCoverUrl = (url: string | null | undefined) =>
  getOptimizedUrl(url, { width: 1200, height: 900, quality: 85, resize: 'cover' })

/** Gallery full view (portrait or landscape) */
export const galleryFullUrl = (url: string | null | undefined) =>
  getOptimizedUrl(url, { width: 1200, height: 1600, quality: 85, resize: 'contain' })

/** Tiny thumbnail strip (gallery bottom row) */
export const galleryThumbUrl = (url: string | null | undefined) =>
  getOptimizedUrl(url, { width: 160, height: 160, quality: 75, resize: 'cover' })
