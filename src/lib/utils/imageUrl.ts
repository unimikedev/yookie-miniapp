/**
 * Image URL optimizer — wraps Supabase Storage images with Transform API params.
 * For images NOT in Supabase Storage (external CDNs, mocks), returns the URL as-is.
 *
 * Supabase Transform format:
 * https://<ref>.supabase.co/storage/v1/render/image/public/<bucket>/<path>?width=N&quality=N&format=webp
 */

const SUPABASE_OBJECT_RE = /^(https?:\/\/[^/]+\.supabase\.co\/storage\/v1)\/object\/public\/(.+)$/

export interface ImageTransformOptions {
  width: number
  height?: number
  quality?: number
  resize?: 'cover' | 'contain' | 'fill'
}

export function getOptimizedUrl(
  url: string | null | undefined,
  opts: ImageTransformOptions
): string {
  if (!url) return ''
  const match = url.match(SUPABASE_OBJECT_RE)
  if (!match) return url  // external or mock — return unchanged

  const [, base, pathAndQuery] = match
  // Strip any existing query params from the path
  const path = pathAndQuery.split('?')[0]

  const params = new URLSearchParams({
    width: String(opts.width),
    quality: String(opts.quality ?? 82),
    format: 'webp',
    resize: opts.resize ?? 'cover',
  })
  if (opts.height) params.set('height', String(opts.height))

  return `${base}/render/image/public/${path}?${params}`
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
