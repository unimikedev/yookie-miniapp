/**
 * MasterDetailPage — Specialist profile.
 * Modern dark theme: hero photo, info, portfolio, services, reviews, fixed CTA.
 */

import { useParams, useNavigate } from 'react-router-dom'
import { useState, useMemo, useEffect, useRef } from 'react'
import { Skeleton, EmptyState } from '@/shared/ui'
import { ServiceCard, ReviewCard, StickyCTA, ContactInfo, PhotoSwipe } from '@/components/features'
import { useSlots } from '@/hooks/useSlots'
import { useBusiness } from '@/hooks/useBusiness'
import { useBookingStore } from '@/stores/bookingStore'
import { useAuthStore } from '@/stores/authStore'
import { createBooking } from '@/lib/api/bookings'
import { TimeSlot } from '@/lib/api/types'
import { getMockMasterImage } from '@/lib/utils/mockImages'
import { FavoriteButton } from '@/components/features'
import { formatPhoneMask, isPhoneComplete, stripDigits, getCleanPhone } from '@/lib/utils/phone'
import { fetchBusinessReviews } from '@/lib/api/reviews'
import { TELEGRAM_BOT_URL } from '@/shared/constants'
import styles from './MasterDetailPage.module.css'

interface ReviewItem {
  id: string
  name: string
  rating: number
  comment?: string
  date: string
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return dateStr
  }
}

export default function MasterDetailPage() {
  const { id, masterId } = useParams<{ id: string; masterId: string }>()
  const navigate = useNavigate()

  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)

  // Confirmation state
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)
  const confirmationRef = useRef<HTMLDivElement>(null)
  const timeSlotsRef = useRef<HTMLDivElement>(null)
  const dateRef = useRef<HTMLDivElement>(null)
  const servicesRef = useRef<HTMLDivElement>(null)

  const authStore = useAuthStore()

  // Pre-fill client info from auth store (only on mount)
  useEffect(() => {
    if (authStore.isAuthenticated) {
      if (authStore.name && !clientName) setClientName(authStore.name)
      if (authStore.phone && !clientPhone) setClientPhone(authStore.phone)
    }
  }, [])

  // Use auth phone for booking creation when authenticated
  const effectivePhone = authStore.isAuthenticated && authStore.phone
    ? getCleanPhone(authStore.phone)
    : getCleanPhone(clientPhone)

  const { services, masters, business, isLoading: businessLoading } = useBusiness(id)

  const selectedServices = useBookingStore((s) => s.selectedServices)
  const selectedSlot = useBookingStore((s) => s.selectedSlot)
  const toggleService = useBookingStore((s) => s.toggleService)
  const setSlot = useBookingStore((s) => s.setSlot)
  const setMaster = useBookingStore((s) => s.setMaster)
  const setDate = useBookingStore((s) => s.setDate)

  // Pass first selected service's ID so backend uses correct service duration
  const activeServiceId = selectedServices.length > 0 ? selectedServices[0].service.id : undefined
  const { slots, isLoading: slotsLoading, error: slotsError } = useSlots(id, masterId, selectedDate ?? undefined, activeServiceId)

  const currentMaster = useMemo(
    () => masters.find((m) => m.id === masterId),
    [masters, masterId]
  )

  // Load reviews from API
  useEffect(() => {
    if (!id || reviews.length > 0 || reviewsLoading) return
    let cancelled = false
    setReviewsLoading(true)

    fetchBusinessReviews(id, 1, 5)
      .then((res) => {
        if (cancelled) return
        const mapped: ReviewItem[] = (res.data ?? []).map((r) => ({
          id: r.id,
          name: r.clients?.name ?? r.masters?.name ?? 'Аноним',
          rating: r.rating,
          comment: r.comment ?? undefined,
          date: formatDate(r.created_at),
        }))
        setReviews(mapped)
        setReviewsLoading(false)
      })
      .catch(() => {
        if (!cancelled) setReviewsLoading(false)
      })

    return () => { cancelled = true }
  }, [id])

  const handleDateSelect = (date: string) => {
    setSelectedDate(date)
    setDate(date)
    setSlot(null)
    // Auto-scroll to time slots after date selection
    setTimeout(() => {
      timeSlotsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const handleSlotSelect = (slot: TimeSlot) => {
    setSlot(slot)
    // Auto-scroll to confirmation after picking time
    setTimeout(() => {
      confirmationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }

  // CTA click handler — context-aware
  const handleCTAClick = () => {
    if (canBook) {
      handleConfirmBooking()
      return
    }
    if (selectedServices.length > 0 && selectedDate && !hasTime) {
      // Date selected, no time — scroll to time slots
      timeSlotsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    if (selectedServices.length > 0 && !selectedDate) {
      // No date — scroll to date picker
      dateRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    // No services yet — scroll to services section
    servicesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleConfirmBooking = async () => {
    // Validate name (no digits)
    if (!clientName.trim()) {
      setBookingError('Введите ваше имя')
      return
    }
    if (/\d/.test(clientName)) {
      setBookingError('Имя не должно содержать цифр')
      return
    }
    // Validate phone
    if (!effectivePhone || effectivePhone.length < 10) {
      setBookingError('Введите номер телефона')
      return
    }
    if (!authStore.isAuthenticated && !isPhoneComplete(clientPhone)) {
      setBookingError('Введите полный номер телефона (+998 XX XXX-XX-XX)')
      return
    }
    if (!business || !currentMaster || !selectedSlot) return

    setBookingLoading(true)
    setBookingError(null)
    try {
      const startsAt = selectedSlot.id ?? `${selectedDate}T${selectedSlot.start}:00`

      // Create a booking for each selected service (all use this master)
      if (selectedServices.length > 1) {
        const results = await Promise.allSettled(
          selectedServices.map((svc) =>
            createBooking({
              businessId: business.id,
              masterId: currentMaster.id,
              serviceId: svc.service.id,
              startsAt,
              clientPhone: effectivePhone,
              clientName,
            })
          )
        )
        const failures = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[]
        if (failures.length > 0) {
          const err = failures[0].reason
          throw err instanceof Error ? err : new Error('Ошибка при создании одной из записей')
        }
      } else {
        await createBooking({
          businessId: business.id,
          masterId: currentMaster.id,
          serviceId: selectedServices[0].service.id,
          startsAt,
          clientPhone: effectivePhone,
          clientName,
        })
      }

      navigate('/my-bookings')
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'Ошибка при создании записи')
      setTimeout(() => {
        confirmationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    } finally {
      setBookingLoading(false)
    }
  }

  const hasTime = !!selectedSlot
  const canBook = selectedServices.length > 0 && selectedSlot

  // Compute total booking duration and how many slots it occupies
  const totalServiceDuration = selectedServices.reduce((sum, s) => sum + (s.service.duration_min || 30), 0)
  const slotDuration = business?.slot_duration_min ?? 30
  const slotsOccupied = Math.max(1, Math.ceil(totalServiceDuration / slotDuration))

  // Auto-assign current master to selected services
  useEffect(() => {
    if (!currentMaster || selectedServices.length === 0) return
    const unassigned = selectedServices.filter(s => s.masterId === null)
    if (unassigned.length > 0) {
      for (const svc of unassigned) {
        const sa = selectedServices.find(s => s.service.id === svc.service.id)
        if (sa && !sa.masterId) {
          useBookingStore.getState().assignMasterToService(svc.service.id, currentMaster.id)
        }
      }
    }
  }, [selectedServices.length, currentMaster?.id])

  if (businessLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.coverHeader}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M13 4L7 10L13 16" stroke="#F9FAFB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span className={styles.coverTitle}>Специалист</span>
          <div style={{ width: 36 }} />
        </div>
        <div className={styles.content}>
          <Skeleton variant="rect" height={300} />
        </div>
      </div>
    )
  }

  if (!currentMaster) {
    return (
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M13 4L7 10L13 16" stroke="#F9FAFB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span className={styles.pageHeaderTitle}>Специалист</span>
          <div style={{ width: 36 }} />
        </div>
        <div className={styles.pageHeaderSpacer} />
        <div className={styles.errorContent}>
          <div className={styles.errorIcon}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="22" stroke="#6B7280" strokeWidth="2" />
              <path d="M24 14V28" stroke="#6B7280" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="24" cy="34" r="1.5" fill="#6B7280" />
            </svg>
          </div>
          <h2 className={styles.errorTitle}>Мастер не найден</h2>
          <p className={styles.errorDescription}>Информация о мастере недоступна. Попробуйте позже.</p>
          <div className={styles.errorActions}>
            <button className={styles.errorPrimaryBtn} onClick={() => navigate('/')}>На главную</button>
            <button className={styles.errorSecondaryBtn} onClick={() => navigate(-1)}>Назад</button>
          </div>
        </div>
      </div>
    )
  }

  const photoUrl = currentMaster.photo_url ?? getMockMasterImage(currentMaster.id)
  const masterPhotos = photoUrl ? [photoUrl, photoUrl, photoUrl] : []

  return (
    <div className={styles.page}>
      {/* Navigation header (fixed, above content) */}
      <div className={styles.pageHeader}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M13 4L7 10L13 16" stroke="#F9FAFB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className={styles.pageHeaderTitle}>
          {currentMaster.name}
        </span>
        <div className={styles.coverActions}>
          <button
            className={styles.coverActionBtn}
            aria-label="Поделиться"
            onClick={() => window.open(TELEGRAM_BOT_URL, '_blank')}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#F9FAFB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="14" cy="3" r="2" />
              <circle cx="4" cy="9" r="2" />
              <circle cx="14" cy="15" r="2" />
              <path d="M6 10L12 14M6 8L12 4" />
            </svg>
          </button>
          {id && (
            <FavoriteButton businessId={id} size="sm" />
          )}
        </div>
      </div>

      {/* Spacer for fixed header */}
      <div className={styles.pageHeaderSpacer} />

      {/* Hero photo */}
      <div className={styles.heroPhoto}>
        {masterPhotos.length > 0 ? (
          <PhotoSwipe photos={masterPhotos} alt={currentMaster.name} height={300} />
        ) : (
          <div className={styles.heroFallback}>
            <span>{currentMaster.name.charAt(0)}</span>
          </div>
        )}
      </div>

      <div className={styles.content}>
        {/* Master info */}
        <div className={styles.masterInfo}>
          <div className={styles.masterTop}>
            <div className={styles.masterTextInfo}>
              <h1 className={styles.masterName}>{currentMaster.name}</h1>
              <p className={styles.masterRole}>
                {currentMaster.specialization}
                {id && <> • Салон</>}
              </p>
            </div>
            <div className={styles.masterRating}>
              <span className={styles.masterRatingValue}>
                {Number(currentMaster.rating).toFixed(1)}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 0L8.63 4.79L13.64 5.46L10 8.97L10.88 13.96L7 11.42L3.12 13.96L4 8.97L0.36 5.46L5.37 4.79L7 0Z" fill="#9AD240" />
                </svg>
              </span>
              <span className={styles.masterRatingCount}>{currentMaster.review_count ?? 0} отзывов</span>
            </div>
          </div>
          {currentMaster.bio && (
            <p className={styles.masterBio}>{currentMaster.bio}</p>
          )}
        </div>

        {/* Popular Services */}
        <section className={styles.section} ref={servicesRef}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Популярные услуги</h2>
          </div>
          {services.length > 0 ? (
            <div className={styles.serviceList}>
              {services.slice(0, 3).map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  selected={selectedServices.some((s) => s.service.id === service.id)}
                  onSelect={(s) => toggleService(s)}
                />
              ))}
            </div>
          ) : (
            <EmptyState title="Нет услуг" description="Услуги не найдены" />
          )}
        </section>

        {/* Date Picker */}
        <section className={styles.section} ref={dateRef}>
          <h2 className={styles.sectionTitle}>Выберите дату</h2>
          <div className={styles.dateRow}>
            {Array.from({ length: 7 }).map((_, i) => {
              const d = new Date()
              d.setDate(d.getDate() + i)
              const dateStr = d.toISOString().split('T')[0]
              const dayNum = d.getDate()
              const dayName = d.toLocaleDateString('ru-RU', { weekday: 'short' })
              const isSelected = dateStr === selectedDate
              return (
                <button
                  key={dateStr}
                  className={`${styles.dateChip} ${isSelected ? styles.dateChipActive : ''}`}
                  onClick={() => handleDateSelect(dateStr)}
                >
                  <span className={styles.dateChipDay}>{dayName}</span>
                  <span className={styles.dateChipNum}>{dayNum}</span>
                </button>
              )
            })}
          </div>
        </section>

        {/* Time Slots */}
        <section className={styles.section} ref={timeSlotsRef}>
          <h2 className={styles.sectionTitle}>Выберите время</h2>
          {slotsLoading ? (
            <div className={styles.slotsSkeleton}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} variant="rect" height={40} />
              ))}
            </div>
          ) : slotsError ? (
            <EmptyState title="Ошибка" description="Не удалось загрузить слоты" />
          ) : slots.length > 0 ? (
            <div className={styles.slotsGrid}>
              {slots.map((slot, idx) => {
                const isSelected = selectedSlot?.id === slot.id
                const selectedIdx = selectedSlot ? slots.findIndex(s => s.id === selectedSlot.id) : -1
                const isInOccupiedRange = selectedIdx >= 0 && idx > selectedIdx && idx < selectedIdx + slotsOccupied
                return (
                  <button
                    key={slot.id}
                    className={`${styles.slotBtn} ${isSelected ? styles.slotBtnActive : ''} ${isInOccupiedRange ? styles.slotBtnOccupied : ''}`}
                    onClick={() => handleSlotSelect(slot)}
                    disabled={!slot.is_available}
                  >
                    {slot.start}
                  </button>
                )
              })}
            </div>
          ) : (
            <EmptyState
              title="Нет времени"
              description="На эту дату нет свободного времени. Выберите другую дату."
            />
          )}
        </section>

        {/* Confirmation — appears automatically when service + time selected */}
        {canBook && currentMaster && (
          <div ref={confirmationRef} className={styles.confirmationSection}>
            <h2 className={styles.confirmationTitle}>Подтверждение записи</h2>
            <div className={styles.confirmationForm}>
              <input
                className={styles.confirmationInput}
                placeholder="Ваше имя"
                value={clientName}
                onChange={(e) => setClientName(stripDigits(e.target.value))}
              />
              <input
                className={styles.confirmationInput}
                placeholder="+998 XX XXX-XX-XX"
                value={clientPhone}
                onChange={(e) => setClientPhone(formatPhoneMask(e.target.value))}
                type="tel"
                disabled={authStore.isAuthenticated}
              />
            </div>
            <div className={styles.confirmationSummary}>
              <div className={styles.confirmationBusiness}>{business?.name}</div>
              <div className={styles.confirmationMaster}>{currentMaster.name}</div>
              {selectedServices.map((s) => (
                <div key={s.service.id} className={styles.confirmationService}>
                  <span>{s.service.name}</span>
                  <span>{s.service.price.toLocaleString('ru')} сўм</span>
                </div>
              ))}
              <div className={styles.confirmationDetail}>
                <span>Дата:</span>
                <span>{new Date(selectedDate + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</span>
              </div>
              <div className={styles.confirmationDetail}>
                <span>Время:</span>
                <span>{selectedSlot?.start}</span>
              </div>
              <div className={styles.confirmationTotal}>
                <span>Итого:</span>
                <span className={styles.confirmationTotalPrice}>
                  {selectedServices.reduce((sum, s) => sum + s.service.price, 0).toLocaleString('ru')} сўм
                </span>
              </div>
            </div>
            {bookingError && <div className={styles.confirmationError}>{bookingError}</div>}
          </div>
        )}

        {/* Reviews — last section, after booking confirmation */}
        <section className={`${styles.section} ${styles.reviewsSection}`}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Отзывы</h2>
          </div>
          <div className={styles.reviewsList}>
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                name={review.name}
                rating={review.rating}
                date={review.date}
                comment={review.comment}
              />
            ))}
          </div>
          <button className={styles.readAllBtn} onClick={() => {
            const el = document.querySelector('.reviewsSection')
            el?.scrollIntoView({ behavior: 'smooth' })
          }}>Читать все отзывы →</button>
        </section>

        {/* Contact Info — after Reviews */}
        <section className={styles.section}>
          <ContactInfo
            phone={business?.phone}
            instagram={business?.instagram}
            telegramUsername={business?.telegram_username}
          />
        </section>
      </div>

      {/* Sticky CTA — always visible */}
      <StickyCTA
        label={
          bookingLoading
            ? 'Отправка...'
            : canBook
              ? 'Записаться'
              : selectedServices.length > 0 && selectedDate && !hasTime
                ? 'Выбрать время'
                : selectedServices.length > 0 && !selectedDate
                  ? 'Выбрать дату'
                  : 'Выберите услугу'
        }
        onClick={handleCTAClick}
        disabled={bookingLoading}
      />
    </div>
  )
}
