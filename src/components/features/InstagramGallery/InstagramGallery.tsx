import { useRef, useEffect, useState, useCallback } from 'react'
import styles from './InstagramGallery.module.css'

interface InstagramGalleryProps {
  username?: string
  postUrls?: string[]
  className?: string
}

const CARD_GRADIENTS = [
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

function InstagramCard({
  url,
  username,
  index,
}: {
  url: string
  username: string
  index: number
}) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { rootMargin: '80px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const shortcode = parseShortcode(url)
  const isPost = !!shortcode
  const thumbUrl = isPost
    ? `https://www.instagram.com/p/${shortcode}/media/?size=m`
    : null

  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length]

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    window.open(url, '_blank', 'noopener,noreferrer')
  }, [url])

  return (
    <a
      ref={ref}
      href={url}
      className={styles.card}
      onClick={handleClick}
      rel="noopener noreferrer"
      aria-label={`Открыть пост @${username} в Instagram`}
    >
      <div className={styles.cardInner} style={{ background: gradient }}>
        {visible && thumbUrl && (
          <img
            src={thumbUrl}
            alt=""
            className={styles.cardImg}
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        )}
        <div className={styles.cardOverlay}>
          <InstagramIcon />
        </div>
        <div className={styles.cardCaption}>
          <span>@{username}</span>
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M3 11L11 3M11 3H5M11 3V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </a>
  )
}

function InstagramIcon() {
  return (
    <svg
      className={styles.igIcon}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect x="2" y="2" width="20" height="20" rx="6" stroke="white" strokeWidth="1.8"/>
      <circle cx="12" cy="12" r="4.5" stroke="white" strokeWidth="1.8"/>
      <circle cx="17.5" cy="6.5" r="1.2" fill="white"/>
    </svg>
  )
}

export default function InstagramGallery({ username, postUrls, className }: InstagramGalleryProps) {
  if (!username) return null

  const profileUrl = `https://www.instagram.com/${username}/`
  const cleanUsername = username.replace(/^@/, '')

  // Use provided post URLs (up to 6), or generate 3 profile-link placeholders
  const cards = postUrls && postUrls.length > 0
    ? postUrls.slice(0, 6)
    : Array.from({ length: 3 }, () => profileUrl)

  if (cards.length === 0) return null

  return (
    <section className={`${styles.root} ${className ?? ''}`}>
      <div className={styles.header}>
        <h2 className={styles.title}>Работы</h2>
        <a
          href={profileUrl}
          className={styles.profileLink}
          onClick={(e) => { e.preventDefault(); window.open(profileUrl, '_blank', 'noopener,noreferrer') }}
          rel="noopener noreferrer"
          aria-label={`Instagram @${cleanUsername}`}
        >
          <span>@{cleanUsername}</span>
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M3 11L11 3M11 3H5M11 3V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </a>
      </div>

      <div className={styles.scroll}>
        {cards.map((url, i) => (
          <InstagramCard key={`${url}-${i}`} url={url} username={cleanUsername} index={i} />
        ))}
      </div>
    </section>
  )
}
