import { useTranslation } from 'react-i18next'
import { setLanguage, type AppLanguage } from '@/i18n'
import styles from './LanguageSwitcher.module.css'

const LANGS: { key: AppLanguage; label: string }[] = [
  { key: 'ru', label: 'RU' },
  { key: 'uz', label: 'UZ' },
  { key: 'en', label: 'EN' },
]

interface Props {
  compact?: boolean
}

export default function LanguageSwitcher({ compact }: Props) {
  const { i18n } = useTranslation()
  const current = i18n.language as AppLanguage

  return (
    <div className={`${styles.wrap} ${compact ? styles.compact : ''}`}>
      {LANGS.map(lang => (
        <button
          key={lang.key}
          className={`${styles.btn} ${current === lang.key ? styles.active : ''}`}
          onClick={() => setLanguage(lang.key)}
        >
          {lang.label}
        </button>
      ))}
    </div>
  )
}
