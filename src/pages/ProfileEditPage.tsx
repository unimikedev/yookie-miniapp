import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'
import { useCityStore } from '@/stores/cityStore'
import CitySelector from '@/components/features/CitySelector'
import LanguageSwitcher from '@/components/features/LanguageSwitcher'
import { Toast } from '@/components/ui/Toast'
import styles from './ProfileEditPage.module.css'
import { api } from '@/lib/api/client'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'

export default function ProfileEditPage() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { name, phone, user, updateProfile } = useAuthStore()
  const { city } = useCityStore()

  const [displayName, setDisplayName] = useState(name || '')
  const [displayPhone, setDisplayPhone] = useState(phone || '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [saving, setSaving] = useState(false)
  const [citySelectorOpen, setCitySelectorOpen] = useState(false)
  const [toast, setToast] = useState<{ msg: string; key: number } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

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
    if (user?.avatarUrl) setAvatarUrl(user.avatarUrl)
  }, [])

  useEffect(() => {
    initial.current.city = city.id
  }, [city.id])

  useEffect(() => {
    initial.current.lang = i18n.language
  }, [i18n.language])

  const handleAvatarClick = () => fileInputRef.current?.click()

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setUploadingAvatar(true)
    try {
      const token = localStorage.getItem('yookie_auth_token')
      const formData = new FormData()
      formData.append('image', file)
      const res = await fetch(`${API_BASE}/auth/upload-avatar`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Upload failed')
      }
      const json = await res.json()
      const url: string = json?.data?.url ?? json?.url
      setAvatarUrl(url)
      updateProfile(displayName.trim() || name || '', displayPhone.trim() || phone || '', url)
      setToast({ msg: 'Фото обновлено', key: Date.now() })
    } catch (err) {
      setToast({ msg: err instanceof Error ? err.message : 'Ошибка загрузки фото', key: Date.now() })
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSave = async () => {
    if (!displayName.trim() || !displayPhone.trim()) return
    setSaving(true)
    try {
      await api.patch('/auth/me', { name: displayName.trim(), phone: displayPhone.trim() })
      updateProfile(displayName.trim(), displayPhone.trim(), avatarUrl || undefined)
      initial.current.name = displayName.trim()
      initial.current.phone = displayPhone.trim()
      setToast({ msg: t('profile.saved', 'Изменения сохранены'), key: Date.now() })
      setTimeout(() => navigate('/account'), 1200)
    } catch (err) {
      setToast({ msg: err instanceof Error ? err.message : 'Ошибка сохранения', key: Date.now() })
    } finally {
      setSaving(false)
    }
  }

  const handlePhoneInput = (value: string) => {
    const cleaned = value.replace(/[^\d+\-() ]/g, '')
    setDisplayPhone(cleaned)
  }

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        {/* Avatar */}
        <div className={styles.avatarSection}>
          <button className={styles.avatarBtn} onClick={handleAvatarClick} disabled={uploadingAvatar}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" className={styles.avatarImg} />
            ) : (
              <div className={styles.avatarPlaceholder}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M12 12C14.7 12 17 9.7 17 7C17 4.3 14.7 2 12 2C9.3 2 7 4.3 7 7C7 9.7 9.3 12 12 12ZM12 14C8.7 14 2 15.7 2 19V21H22V19C22 15.7 15.3 14 12 14Z" fill="currentColor"/>
                </svg>
              </div>
            )}
            <div className={styles.avatarOverlay}>
              {uploadingAvatar ? (
                <span className={styles.avatarLoading} />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M9 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V15M21 3L12 12M21 3H15M21 3V9" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              )}
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            style={{ display: 'none' }}
            onChange={handleAvatarChange}
          />
        </div>

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
          disabled={!hasChanged || !displayName.trim() || !displayPhone.trim() || saving}
        >
          {saving ? '...' : t('profile.save', 'Сохранить')}
        </button>
      </div>

      <CitySelector open={citySelectorOpen} onClose={() => setCitySelectorOpen(false)} />
      {toast && <Toast key={toast.key} message={toast.msg} onDone={() => setToast(null)} />}
    </div>
  )
}
