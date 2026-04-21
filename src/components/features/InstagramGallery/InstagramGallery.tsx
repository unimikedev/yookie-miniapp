import { useRef, useEffect, useState } from 'react'
import styles from './InstagramGallery.module.css'

interface InstagramGalleryProps {
  username?: string
  postUrls?: string[]
  className?: string
}

const GRADIENTS = [
  'linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)',
  'linear-gradient(135deg, #405de6 0%, #5851db 40%, #833ab4 100%)',
  'linear-gradient(135deg, #fcb045 0%, #fd1d1d 50%, #833ab4 100%)',
  'linear-gradient(135deg, #6a1b9a 0%, #e040fb 50%, #ff4081 100%)',
  'linear-gradient(135deg, #1565c0 0%, #42a5f5 50%, #00bcd4 100%)',
  'linear-gradient(135deg, #f57c00 0%, #ffee58 40%, #ef5350 100%)',
]

function parseShortcode(url: string): string | null {
  const m = url.match(/instagram\.com\/(?:p|reel)\/([A-Za-z0-9_-]+)/)
  return m ? m[1] : null
}

function PostCard({ url, username, index }: { url: string; username: string; index: number }) {
  const [inView, setInView]     = useState(false)
  const [loaded, setLoaded]     = useState(false)
  const containerRef            = useRef<HTMLDivElement>(null)
  const timerRef                = useRef<ReturnType<typeof setTimeout> | null>(null)

  const shortcode = parseShortcode(url)
  const postUrl   = shortcode ? `https://www.instagram.com/p/${shortcode}/` : url
  const embedUrl  = shortcode ? `https://www.instagram.com/p/${shortcode}/embed/` : null

  // Lazy: load iframe only when card scrolls into view
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect() } },
      { rootMargin: '120px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Fade in after iframe fires onLoad; also set a 3s timeout in case onLoad fires late
  const handleLoad = () => {
    timerRef.current = setTimeout(() => setLoaded(true), 400)
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const openPost = () => window.open(postUrl, '_blank', 'noopener,noreferrer')

  return (
    <div ref={containerRef} className={styles.card} onClick={openPost} role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && openPost()}
      aria-label={`Открыть пост @${username} в Instagram`}
    >
      {/* Gradient placeholder — always underneath */}
      <div
        className={styles.placeholder}
        style={{
          background: GRADIENTS[index % GRADIENTS.length],
          opacity: loaded ? 0 : 1,
        }}
      >
        <IgIcon />
      </div>

      {/* iframe — lazy, scaled to fit 200×200 card */}
      {inView && embedUrl && (
        <div className={styles.iframeWrap} style={{ opacity: loaded ? 1 : 0 }}>
          <iframe
            src={embedUrl}
            className={styles.iframe}
            frameBorder="0"
            scrolling="no"
            onLoad={handleLoad}
            title={`Instagram пост @${username}`}
          />
        </div>
      )}

      {/* Invisible tap target overlay + caption */}
      <div className={styles.tapOverlay}>
        <span className={styles.tapLabel}>Открыть в Instagram ↗</span>
      </div>
    </div>
  )
}

/* Profile-only card (no specific post URL) */
function ProfileCard({ username, index }: { username: string; index: number }) {
  const profileUrl = `https://www.instagram.com/${username}/`
  const openProfile = () => window.open(profileUrl, '_blank', 'noopener,noreferrer')

  return (
    <div
      className={`${styles.card} ${styles.profileCard}`}
      onClick={openProfile}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && openProfile()}
      aria-label={`Открыть Instagram @${username}`}
      style={{ background: GRADIENTS[index % GRADIENTS.length] }}
    >
      <IgIcon />
      <div className={styles.profileCardCaption}>
        <span className={styles.profileCardUser}>@{username}</span>
        <span className={styles.profileCardCta}>Смотреть работы ↗</span>
      </div>
    </div>
  )
}

function IgIcon() {
  return (
    <svg className={styles.igIcon} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="6" stroke="white" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4.5" stroke="white" strokeWidth="1.8" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="white" />
    </svg>
  )
}

export default function InstagramGallery({ username, postUrls, className }: InstagramGalleryProps) {
  if (!username) return null

  const cleanUsername = username.replace(/^@/, '')
  const profileUrl    = `https://www.instagram.com/${cleanUsername}/`

  const hasPostUrls = postUrls && postUrls.length > 0
  const validPosts  = hasPostUrls ? postUrls.filter(u => parseShortcode(u)) : []

  return (
    <section className={`${styles.root} ${className ?? ''}`}>
      <div className={styles.header}>
        <h2 className={styles.title}>Работы</h2>
        <a
          href={profileUrl}
          className={styles.profileLink}
          onClick={e => { e.preventDefault(); window.open(profileUrl, '_blank', 'noopener,noreferrer') }}
          rel="noopener noreferrer"
        >
          @{cleanUsername}
          <svg width="11" height="11" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M3 11L11 3M11 3H5M11 3V9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>

      <div className={styles.scroll}>
        {validPosts.length > 0
          ? validPosts.slice(0, 6).map((url, i) => (
              <PostCard key={`${url}-${i}`} url={url} username={cleanUsername} index={i} />
            ))
          : /* Fallback when no post URLs — show CTA cards */
            Array.from({ length: 3 }, (_, i) => (
              <ProfileCard key={i} username={cleanUsername} index={i} />
            ))
        }
      </div>
    </section>
  )
}
