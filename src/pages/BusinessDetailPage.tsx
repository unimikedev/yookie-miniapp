/**
 * BusinessDetailPage — Merchant/Salon profile.
 * Modern dark theme: hero cover, info block, chip tabs, services,
 * specialists, reviews, fixed CTA.
 *
 * Booking flow: select service(s) → pick master per service → pick date → pick time → confirm
 */

import { useParams, useNavigate } from 'react-router-dom'
import { useState, useMemo, useEffect, useRef } from 'react'
import { Skeleton, EmptyState, Badge, Rating } from '@/shared/ui'
import {
  ServiceCard,
  ReviewCard,
  SpecialistCard,
  MasterChip,
  Chip,
  InfoCard,
  StickyCTA,
  ContactInfo,
} from '@/components/features'
import { useBusiness } from '@/hooks/useBusiness'
import { useSlots } from '@/hooks/useSlots'
import { useBookingStore } from '@/stores/bookingStore'
import { useAuthStore } from '@/stores/authStore'
import { useTelegramBackButton } from '@/hooks/useTelegramBackButton'
import { createBooking } from '@/lib/api/bookings'
import { CATEGORY_LABELS } from '@/lib/api/types'
import type { Master, TimeSlot } from '@/lib/api/types'
import { getMockBusinessImage, getMockMasterImage } from '@/lib/utils/mockImages'
import { FavoriteButton, PhotoSwipe } from '@/components/features'
import { formatPhoneMask, isPhoneComplete, stripDigits, getCleanPhone } from '@/lib/utils/phone'
import { toLocalYMD } from '@/lib/utils/date'
import { fetchBusinessReviews } from '@/lib/api/reviews'
import { TELEGRAM_BOT_URL } from '@/shared/constants'
import styles from './BusinessDetailPage.module.css'

const TABS = ['Услуги', 'О нас', 'Специалисты']

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

export default function BusinessDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // Telegram native BackButton
  useTelegramBackButton(true)

  const [activeTab, setActiveTab] = useState(0)
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)

  // Booking flow state
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)
  const timeSlotsRef = useRef<HTMLDivElement>(null)
  const dateRef = useRef<HTMLDivElement>(null)
  const confirmationRef = useRef<HTMLDivElement>(null)

  const authStore = useAuthStore()

  // Pre-fill client info from auth store
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')

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

  const { business, masters, services, isLoading, error } = useBusiness(id)
  const selectedServices = useBookingStore((s) => s.selectedServices)
  const toggleService = useBookingStore((s) => s.toggleService)
  const assignMasterToService = useBookingStore((s) => s.assignMasterToService)
  const setMaster = useBookingStore((s) => s.setMaster)
  const setBusiness = useBookingStore((s) => s.setBusiness)

  // Compute activeMasterId BEFORE useSlots call
  const activeMasterId = selectedServices.find(s => s.masterId !== null)?.masterId ?? undefined
  // Pass first selected service's ID so backend uses correct service duration for slot generation
  const activeServiceId = selectedServices.length > 0 ? selectedServices[0].service.id : undefined
  // Sum durations across all selected services for multi-service bookings.
  // Backend uses this so slots leave enough room for the whole booking.
  const totalDuration = selectedServices.reduce((sum, s) => sum + (s.service.duration_min || 30), 0) || undefined
  const { slots, isLoading: slotsLoading, refetch: refetchSlots } = useSlots(
    id,
    activeMasterId,
    selectedDate ?? undefined,
    activeServiceId,
    totalDuration,
  )

  useEffect(() => {
    if (business) setBusiness(business)
  }, [business])

  // Auto-select first master when a NEW service is added (pre-select only)
  useEffect(() => {
    if (masters.length === 0) return
    const unassigned = selectedServices.filter(s => s.masterId === null)
    if (unassigned.length > 0) {
      // Use the most recently added service's assignment
      const lastUnassigned = unassigned[unassigned.length - 1]
      // If other services have a common master, use that; otherwise first master
      const assignedMasters = selectedServices.filter(s => s.masterId !== null).map(s => s.masterId)
      const commonMaster = assignedMasters.length > 0
        ? assignedMasters.find((m, _, arr) => arr.every(x => x === m))
        : null
      assignMasterToService(lastUnassigned.service.id, commonMaster ?? masters[0].id)
    }
  }, [selectedServices.length])

  // NOTE: we intentionally do NOT auto-advance the selected date when a day
  // has no slots. The previous implementation hijacked the user's choice and
  // made some dates impossible to select. The empty state now explains the
  // situation and lets the user pick another date themselves.

  // CTA flow states
  const hasServices = selectedServices.length > 0
  const allAssigned = selectedServices.length > 0 && selectedServices.every(s => s.masterId !== null)
  const hasTime = !!selectedSlot
  const canBook = hasServices && allAssigned && hasTime

  // Compute total booking duration and how many slots it occupies
  const totalServiceDuration = selectedServices.reduce((sum, s) => sum + (s.service.duration_min || 30), 0)
  const slotDuration = business?.slot_duration_min ?? 30
  const slotsOccupied = Math.max(1, Math.ceil(totalServiceDuration / slotDuration))

  const handleServiceToggle = (service: typeof services[0]) => {
    toggleService(service)
    setSelectedSlot(null)
  }

  // Per-service master selection — only affects THIS service
  const handleMasterSelectForService = (serviceId: string, masterId: string) => {
    assignMasterToService(serviceId, masterId)
    setSelectedSlot(null)
  }

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot)
    // Auto-scroll to confirmation after picking time
    setTimeout(() => {
      confirmationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
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
    if (!business || !selectedSlot) return

    setBookingLoading(true)
    setBookingError(null)
    try {
      const startsAt = selectedSlot.id ?? `${selectedDate}T${selectedSlot.start}:00`

      // Create a separate booking for each selected service (parallel masters)
      if (selectedServices.length > 1) {
        const results = await Promise.allSettled(
          selectedServices.map((svc) =>
            createBooking({
              businessId: business.id,
              masterId: svc.masterId!,
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
        // Single service booking
        const svc = selectedServices[0]
        await createBooking({
          businessId: business.id,
          masterId: svc.masterId!,
          serviceId: svc.service.id,
          startsAt,
          clientPhone: effectivePhone,
          clientName,
        })
      }

      navigate('/my-bookings')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка при создании записи'
      setBookingError(message)
      // Conflict / slot taken: drop selection and refetch so user sees current state.
      if (/занято|Conflict|409/i.test(message)) {
        setSelectedSlot(null)
        refetchSlots()
      }
      setTimeout(() => {
        confirmationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    } finally {
      setBookingLoading(false)
    }
  }

  // CTA click handler — context-aware
  const handleCTAClick = () => {
    if (canBook) {
      // All set — submit booking
      handleConfirmBooking()
      return
    }
    if (hasServices && allAssigned && !selectedDate) {
      // Services + master selected, no date — scroll to date picker
      dateRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    if (hasServices && allAssigned && !hasTime) {
      // Services + master + date selected, no time — scroll to time slots
      timeSlotsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    if (hasServices && !allAssigned) {
      // Services selected, no master — scroll to services
      const firstService = document.querySelector('[data-service-id]')
      firstService?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    // No services yet — scroll to services section
    const servicesSection = document.querySelector('.serviceList')
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleDateSelect = (date: string) => {
    setSelectedDate(date)
    setSelectedSlot(null)
    // Auto-scroll to time slots after date selection
    setTimeout(() => {
      timeSlotsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

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

  const todayHours = useMemo(() => {
    if (!business?.working_hours) return null
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dayName = days[new Date().getDay()]
    const hours = (business.working_hours as Record<string, { open: string; close: string }>)[dayName]
    return hours ? `${hours.open} - ${hours.close}` : null
  }, [business])

  const handleMasterClick = (masterId: string) => {
    const master = masters.find((m) => m.id === masterId)
    if (master) {
      setMaster(master)
      navigate(`/business/${id}/master/${masterId}`)
    }
  }

  const coverImage = business ? getMockBusinessImage(business.category, business.id) : null
  const coverPhotos = coverImage ? [coverImage, coverImage, coverImage] : []

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.coverFallback} />
        <div className={styles.errorContent}>
          <div className={styles.errorIcon}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="22" stroke="#6B7280" strokeWidth="2" />
              <path d="M24 14V28" stroke="#6B7280" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="24" cy="34" r="1.5" fill="#6B7280" />
            </svg>
          </div>
          <h2 className={styles.errorTitle}>Не удалось загрузить</h2>
          <p className={styles.errorDescription}>Информация о заведении недоступна. Попробуйте позже.</p>
          <div className={styles.errorActions}>
            <button className={styles.errorPrimaryBtn} onClick={() => navigate('/')}>На главную</button>
            <button className={styles.errorSecondaryBtn} onClick={() => navigate(-1)}>Назад</button>
          </div>
        </div>
      </div>
    )
  }

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
          {isLoading ? <Skeleton width="60%" height="18px" /> : business?.name}
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
          {id && !isLoading && (
            <FavoriteButton businessId={id} size="sm" />
          )}
        </div>
      </div>

      {/* Spacer for fixed header */}
      <div className={styles.pageHeaderSpacer} />

      {/* Hero cover */}
      <div className={styles.coverWrap}>
        {isLoading ? (
          <div className={styles.coverSkeleton} />
        ) : coverPhotos.length > 0 ? (
          <PhotoSwipe photos={coverPhotos} alt={business?.name ?? ''} height={240} />
        ) : (
          <div className={styles.coverFallback} />
        )}
      </div>

      {/* Info block */}
      {!isLoading && business && (
        <div className={styles.infoBlock}>
          <div className={styles.infoTop}>
            <div className={styles.infoTitleWrap}>
              <h1 className={styles.infoTitle}>{business.name}</h1>
              {business.category && (
                <span className={styles.infoCategory}>{CATEGORY_LABELS[business.category]}</span>
              )}
            </div>
            {(business.rating != null || (business as any).review_count != null) && (
              <div className={styles.infoRating}>
                <span className={styles.infoRatingValue}>
                  {Number(business.rating).toFixed(1)}
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 0L8.63 4.79L13.64 5.46L10 8.97L10.88 13.96L7 11.42L3.12 13.96L4 8.97L0.36 5.46L5.37 4.79L7 0Z" fill="#6BCEFF" />
                  </svg>
                </span>
                <span className={styles.infoRatingCount}>{(business as any).review_count ?? 0} отзывов</span>
              </div>
            )}
          </div>
          {business.address && (
            <div className={styles.infoAddress}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 0C4.24 0 2 2.24 2 5C2 8.5 7 14 7 14S12 8.5 12 5C12 2.24 9.76 0 7 0ZM7 7C5.9 7 5 6.1 5 5C5 3.9 5.9 3 7 3C8.1 3 9 3.9 9 5C9 6.1 8.1 7 7 7Z" fill="#6B7280" />
              </svg>
              <span>{business.address}</span>
            </div>
          )}
        </div>
      )}

      {/* Tabs (chips) */}
      <div className={styles.chipRow}>
        {TABS.map((tab, i) => (
          <Chip key={tab} label={tab} active={activeTab === i} onClick={() => setActiveTab(i)} />
        ))}
      </div>

      {/* Content area */}
      <div className={styles.content}>
        {/* Services tab */}
        {activeTab === 0 && (
          <>
            {/* Services list */}
            <section className={styles.section}>
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle}>Услуги</h2>
              </div>
              {isLoading ? (
                <div className={styles.skeletonList}>
                  {[1, 2, 3].map(i => <Skeleton key={i} variant="rect" height={80} />)}
                </div>
              ) : services.length > 0 ? (
                <div className={styles.serviceList}>
                  {services.slice(0, 6).map((service) => {
                    const isSelected = selectedServices.some((s) => s.service.id === service.id)
                    const svcAssignment = selectedServices.find(s => s.service.id === service.id)
                    const assignedMasterId = svcAssignment?.masterId
                    return (
                      <div key={service.id} data-service-id={service.id}>
                        <ServiceCard
                          service={service}
                          selected={isSelected}
                          onSelect={handleServiceToggle}
                        />
                        {/* Master chips below selected service — per-service selection */}
                        {isSelected && masters.length > 0 && (
                          <div className={styles.masterChipRow}>
                            {masters.map((master) => (
                              <MasterChip
                                key={master.id}
                                master={master}
                                selected={master.id === assignedMasterId}
                                onClick={() => handleMasterSelectForService(service.id, master.id)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <EmptyState title="Услуги не найдены" description="Заведение ещё не добавило услуги" />
              )}
            </section>

            {/* Date & Time slots — visible when ANY service is selected */}
            {hasServices && (
              <div ref={timeSlotsRef}>
                <section className={styles.section} ref={dateRef}>
                  <h2 className={styles.sectionTitle}>Выберите дату</h2>
                  <div className={styles.dateRow}>
                    {Array.from({ length: 7 }).map((_, i) => {
                      const d = new Date()
                      d.setDate(d.getDate() + i)
                      const dateStr = toLocalYMD(d)
                      const dayNum = d.getDate()
                      const dayName = d.toLocaleDateString('ru-RU', { weekday: 'short' })
                      const isSel = dateStr === selectedDate
                      return (
                        <button
                          key={dateStr}
                          className={`${styles.dateChip} ${isSel ? styles.dateChipActive : ''}`}
                          onClick={() => handleDateSelect(dateStr)}
                        >
                          <span className={styles.dateChipDay}>{dayName}</span>
                          <span className={styles.dateChipNum}>{dayNum}</span>
                        </button>
                      )
                    })}
                  </div>
                </section>

                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Выберите время</h2>
                  {!activeMasterId ? (
                    <EmptyState
                      title="Выберите мастера"
                      description="Выберите специалиста для каждой услуги"
                    />
                  ) : slotsLoading ? (
                    <div className={styles.slotsSkeleton}>
                      {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} variant="rect" height={40} />
                      ))}
                    </div>
                  ) : slots.length > 0 ? (
                    <div className={styles.slotsGrid}>
                      {slots.map((slot, idx) => {
                        const isSelected = selectedSlot?.id === slot.id
                        // Compute if this slot is within the occupied range
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
              </div>
            )}

            {/* Confirmation — appears automatically when service + master + time selected */}
            {canBook && (
              <div ref={confirmationRef} className={styles.confirmationSection}>
                <h2 className={styles.confirmationTitle}>Подтверждение записи</h2>

                {/* Client info */}
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

                {/* Summary */}
                <div className={styles.confirmationSummary}>
                  <div className={styles.confirmationBusiness}>{business?.name}</div>
                  {selectedServices.map((s) => (
                    <div key={s.service.id} className={styles.confirmationService}>
                      <span>{s.service.name}</span>
                      <span>{s.service.price.toLocaleString('ru')} сўм</span>
                    </div>
                  ))}
                  {/* Show per-service master when multiple services have different masters */}
                  {selectedServices.length > 1 ? (
                    selectedServices.map((s) => (
                      <div key={`master-${s.service.id}`} className={styles.confirmationDetail}>
                        <span>{s.service.name}:</span>
                        <span>{masters.find(m => m.id === s.masterId)?.name ?? '—'}</span>
                      </div>
                    ))
                  ) : (
                    <div className={styles.confirmationDetail}>
                      <span>Мастер:</span>
                      <span>{masters.find(m => m.id === activeMasterId)?.name}</span>
                    </div>
                  )}
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
              {reviewsLoading ? (
                <div className={styles.skeletonList}>
                  {[1, 2].map(i => <Skeleton key={i} variant="rect" height={100} />)}
                </div>
              ) : reviews.length > 0 ? (
                <>
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
                </>
              ) : (
                <EmptyState title="Отзывов пока нет" description="Будьте первым, кто оставит отзыв" />
              )}
            </section>

            {/* Contact Info — after Reviews */}
            <section className={styles.section}>
              <ContactInfo
                phone={business?.phone}
                instagram={business?.instagram}
                telegramUsername={business?.telegram_username}
              />
            </section>
          </>
        )}

        {/* About tab */}
        {activeTab === 1 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Испытайте совершенство</h2>
            <p className={styles.aboutText}>
              {business?.description ?? 'Мы предлагаем широкий спектр beauty-услуг высочайшего качества. Наши мастера — профессионалы с многолетним опытом. Приходите и убедитесь сами!'}
            </p>

            <div className={styles.infoCardsRow}>
              {todayHours && (
                <InfoCard
                  icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="#6BCEFF" strokeWidth="1.5" /><path d="M10 5V10L13 13" stroke="#6BCEFF" strokeWidth="1.5" strokeLinecap="round" /></svg>}
                  label="Работает до"
                  value={todayHours.split('-')[1]?.trim()}
                />
              )}
              <InfoCard
                icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="#6BCEFF" strokeWidth="1.5" /><path d="M7 10L9 12L13 8" stroke="#6BCEFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                label="Занятость"
                value="Есть слоты"
              />
            </div>
          </section>
        )}

        {/* Specialists tab */}
        {activeTab === 2 && (
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Специалисты</h2>
            </div>
            {isLoading ? (
              <div className={styles.skeletonList}>
                {[1, 2].map(i => <Skeleton key={i} variant="rect" height={200} />)}
              </div>
            ) : masters.length > 0 ? (
              <div className={styles.specialistsScroll}>
                {masters.map((master) => (
                  <SpecialistCard
                    key={master.id}
                    name={master.name}
                    role={master.specialization ?? ''}
                    rating={Number(master.rating) ?? 0}
                    photoUrl={master.photo_url}
                    onClick={() => handleMasterClick(master.id)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState title="Мастера не найдены" description="Мастера ещё не добавлены" />
            )}
          </section>
        )}

      </div>

      {/* Sticky CTA — always visible */}
      <StickyCTA
        label={
          bookingLoading
            ? 'Отправка...'
            : canBook
              ? 'Записаться'
              : hasServices && allAssigned && !hasTime
                ? 'Выбрать время'
                : hasServices && allAssigned && !selectedDate
                  ? 'Выбрать дату'
                  : hasServices && !allAssigned
                    ? 'Выбрать мастера'
                    : 'Выбрать услугу'
        }
        onClick={handleCTAClick}
        disabled={bookingLoading}
      />
    </div>
  )
}
