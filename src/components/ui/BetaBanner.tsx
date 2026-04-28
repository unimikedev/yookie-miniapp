import { useState } from 'react'
import styles from './BetaBanner.module.css'

const DISMISSED_KEY = 'yookie_beta_banner_dismissed'

export function BetaBanner() {
  const [visible, setVisible] = useState(() => !sessionStorage.getItem(DISMISSED_KEY))
  const [hiding, setHiding] = useState(false)

  const dismiss = () => {
    setHiding(true)
    setTimeout(() => {
      sessionStorage.setItem(DISMISSED_KEY, '1')
      setVisible(false)
    }, 280)
  }

  if (!visible) return null

  return (
    <div className={`${styles.banner} ${hiding ? styles.hiding : styles.visible}`}>
      <span className={styles.icon}>🚀</span>
      <div className={styles.text}>
        <strong className={styles.title}>Yookie ещё не запущен</strong>
        <span className={styles.sub}>Пока здесь учебные данные — скоро откроемся для всех!</span>
      </div>
      <button className={styles.close} onClick={dismiss} aria-label="Закрыть">✕</button>
    </div>
  )
}
