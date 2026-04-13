/**
 * NotFoundPage — 404 screen with "Go Home" button.
 * Shown for any unmatched route.
 */

import { useNavigate } from 'react-router-dom'
import styles from './NotFoundPage.module.css'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.code}>404</div>
        <h1 className={styles.title}>Страница не найдена</h1>
        <p className={styles.sub}>
          Такой страницы не существует или она была перемещена.
          Не переживайте — всегда можно вернуться на главную.
        </p>
        <div className={styles.actions}>
          <button className={styles.primaryBtn} onClick={() => navigate('/')}>
            На главную
          </button>
          <button className={styles.secondaryBtn} onClick={() => navigate(-1)}>
            Назад
          </button>
        </div>
      </div>
    </div>
  )
}
