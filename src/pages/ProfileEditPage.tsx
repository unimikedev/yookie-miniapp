/**
 * ProfileEditPage — edit name, phone, gender.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import styles from './ProfileEditPage.module.css'

type Gender = 'male' | 'female' | 'other' | ''

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Мужской' },
  { value: 'female', label: 'Женский' },
  { value: 'other', label: 'Другой' },
]

export default function ProfileEditPage() {
  const navigate = useNavigate()
  const { name, phone, setName, setPhone, loadFromStorage } = useAuthStore()

  const [displayName, setDisplayName] = useState(name || '')
  const [displayPhone, setDisplayPhone] = useState(phone || '')
  const [gender, setGender] = useState<Gender>('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (name) setDisplayName(name)
    if (phone) setDisplayPhone(phone)
    // Load gender from localStorage
    try {
      const stored = localStorage.getItem('yookie_user_gender')
      if (stored) setGender(stored as Gender)
    } catch { /* noop */ }
  }, [])

  const handleSave = () => {
    setName(displayName.trim())
    setPhone(displayPhone.trim())
    try {
      localStorage.setItem('yookie_user_gender', gender)
    } catch { /* noop */ }
    // Also update the full user object in storage
    try {
      const userJson = localStorage.getItem('yookie_auth_user')
      if (userJson) {
        const user = JSON.parse(userJson)
        user.name = displayName.trim()
        user.phone = displayPhone.trim()
        localStorage.setItem('yookie_auth_user', JSON.stringify(user))
      }
    } catch { /* noop */ }
    setSaved(true)
    setTimeout(() => {
      navigate('/account')
    }, 800)
  }

  const handlePhoneInput = (value: string) => {
    // Only allow digits, +, -, (, ), spaces
    const cleaned = value.replace(/[^\d+\-() ]/g, '')
    setDisplayPhone(cleaned)
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3.83 9L9.43 14.6L8 16L0 8L8 0L9.43 1.4L3.83 7H16V9H3.83Z" fill="currentColor" />
          </svg>
        </button>
        <h1 className={styles.headerTitle}>Редактировать профиль</h1>
        <div style={{ width: 40 }} />
      </header>

      <div className={styles.content}>
        {/* Name */}
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Имя</label>
          <input
            className={styles.fieldInput}
            type="text"
            placeholder="Ваше имя"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
          />
        </div>

        {/* Phone */}
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Телефон</label>
          <input
            className={styles.fieldInput}
            type="tel"
            placeholder="+998 90 123 45 67"
            value={displayPhone}
            onChange={e => handlePhoneInput(e.target.value)}
          />
        </div>

        {/* Gender */}
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Пол</label>
          <div className={styles.genderRow}>
            {GENDER_OPTIONS.map(opt => (
              <button
                key={opt.value}
                className={`${styles.genderChip} ${gender === opt.value ? styles.genderChipActive : ''}`}
                onClick={() => setGender(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Save */}
        <button
          className={styles.saveBtn}
          onClick={handleSave}
          disabled={!displayName.trim() || !displayPhone.trim()}
        >
          {saved ? '✓ Сохранено' : 'Сохранить'}
        </button>
      </div>
    </div>
  )
}
