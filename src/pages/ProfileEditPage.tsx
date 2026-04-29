import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'
import { useCityStore } from '@/stores/cityStore'
import CitySelector from '@/components/features/CitySelector'
import LanguageSwitcher from '@/components/features/LanguageSwitcher'
import { Toast } from '@/components/ui/Toast'
import styles from './ProfileEditPage.module.css'

export default function ProfileEditPage() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { name, phone, updateProfile } = useAuthStore()
  const { city } = useCityStore()

  const [displayName, setDisplayName] = useState(name || '')
  const [displayPhone, setDisplayPhone] = useState(phone || '')
  const [citySelectorOpen, setCitySelectorOpen] = useState(false)
  const [toast, setToast] = useState<{ msg: string; key: number } | null>(null)

  // Track initial values to detect any change
  const initial = useRef({ name: name || '', phone: phone || '', city: city.id, lang: i18n.language })

  const hasChanged =
    displayName.trim() !== initial.current.name ||
    displayPhone.trim() !== initial.current.phone ||
    city.id !== initial.current.city ||
    i18n.language !== initial.current.lang

  useEffect(() => {
    if (name) setDisplayName(name)
    if (phone) setDisplayPhone(phone)
  }, [])

  // Re-arm initial when city or language changes (they save immediately via their own stores)
  // so we track if name/phone also changed independently
  useEffect(() => {
    initial.current.city = city.id
  }, [city.id])

  useEffect(() => {
    initial.current.lang = i18n.language
  }, [i18n.language])

  const handleSave = () => {
    if (!displayName.trim() || !displayPhone.trim()) return
    updateProfile(displayName.trim(), displayPhone.trim())
    initial.current.name = displayName.trim()
    initial.current.phone = displayPhone.trim()
    setToast({ msg: t('profile.saved', 'Изменения сохранены'), key: Date.now() })
    setTimeout(() => navigate('/account'), 1200)
  }

  const handlePhoneInput = (value: string) => {
    const cleaned = value.replace(/[^\d+\-() ]/g, '')
    setDisplayPhone(cleaned)
  }

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        {/* Name */}
        <div className={styles.field}>
          <label className={styles.fieldLabel}>{t('profile.name', 'Имя')}</label>
          <input
            className={styles.fieldInput}
            type="text"
            placeholder={t('profile.namePlaceholder', 'Ваше имя')}
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
          />
        </div>

        {/* Phone */}
        <div className={styles.field}>
          <label className={styles.fieldLabel}>{t('profile.phone', 'Телефон')}</label>
          <input
            className={styles.fieldInput}
            type="tel"
            placeholder="+998 90 123 45 67"
            value={displayPhone}
            onChange={e => handlePhoneInput(e.target.value)}
          />
        </div>

        {/* City */}
        <div className={styles.field}>
          <label className={styles.fieldLabel}>{t('account.city', 'Город')}</label>
          <button
            className={styles.fieldSelectBtn}
            onClick={() => setCitySelectorOpen(true)}
          >
            <span>{city.name}</span>
            <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
              <path d="M4.6 6L0 1.4L1.4 0L7.4 6L1.4 12L0 10.6L4.6 6Z" fill="currentColor"/>
            </svg>
          </button>
        </div>

        {/* Language */}
        <div className={styles.field}>
          <label className={styles.fieldLabel}>{t('account.language', 'Язык')}</label>
          <div className={styles.fieldLangRow}>
            <LanguageSwitcher compact />
          </div>
        </div>

        {/* Save */}
        <button
          className={styles.saveBtn}
          onClick={handleSave}
          disabled={!hasChanged || !displayName.trim() || !displayPhone.trim()}
        >
          {t('profile.save', 'Сохранить')}
        </button>
      </div>

      <CitySelector open={citySelectorOpen} onClose={() => setCitySelectorOpen(false)} />
      {toast && <Toast key={toast.key} message={toast.msg} onDone={() => setToast(null)} />}
    </div>
  )
}
