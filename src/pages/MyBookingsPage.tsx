import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBookings } from '@/hooks/useBookings'
import { Skeleton, EmptyState } from '@/shared/ui'
import { cancelBooking, rescheduleBooking } from '@/lib/api/bookings'
import { getMockBusinessImage } from '@/lib/utils/mockImages'
import ReviewForm from '@/components/features/ReviewForm'
import RescheduleBottomSheet from '@/components/features/RescheduleBottomSheet'
import { useAuthStore } from '@/stores/authStore'
import { useOverlayStore } from '@/stores/overlayStore'
import styles from './MyBookingsPage.module.css'

const CalendarIcon = () => (
  <svg width="14" height="15" viewBox="0 0 14 15" fill="none">
    <path d="M1 5.75H13M4 1.25V3.25M10 1.25V3.25M3.5 1.25H10.5C11.88 1.25 13 2.37 13 3.75V11.75C13 13.13 11.88 14.25 10.5 14.25H3.5C2.12 14.25 1 13.13 1 11.75V3.75C1 2.37 2.12 1.25 3.5 1.25Z" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const PersonIcon = () => (
  <svg width="13" height="14" viewBox="0 0 13 14" fill="none">
    <path d="M6.5 7C8.16 7 9.5 5.66 9.5 4C9.5 2.34 8.16 1 6.5 1C4.84 1 3.5 2.34 3.5 4C3.5 5.66 4.84 7 6.5 7ZM6.5 8.5C4.5 8.5 0.5 9.5 0.5 11.5V13H12.5V11.5C12.5 9.5 8.5 8.5 6.5 8.5Z" fill="#9CA3AF"/>
  </svg>
)

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="6.5" stroke="#9CA3AF" strokeWidth="1.5"/>
    <path d="M8 4.5V8L10.5 9.5" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending:   { label: 'ОЖИДАЕТ',   className: 'statusPending' },
  confirmed: { label: 'ПОДТВЕРЖДЕНО', className: 'statusConfirmed' },
  completed: { label: 'ЗАВЕРШЕНО',  className: 'statusCompleted' },
  cancelled: { label: 'ОТМЕНЕНО',  className: 'statusCancelled' },
  no_show:   { label: 'НЕ ПРИШЁЛ', className: 'statusCancelled' },
}

export default function MyBookingsPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'active' | 'completed'>('active')
  const { bookings, isLoading, refetch } = useBookings()

  // Refetch on mount to get latest bookings (e.g., after creating one on another page)
  useEffect(() => {
    refetch()
  }, [])
  const [reviewBooking, setReviewBooking] = useState<typeof bookings[0] | null>(null)
  const [reviewSuccess, setReviewSuccess] = useState(false)
  const [cancelLoading, setCancelLoading] = useState<string | null>(null)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [rescheduleBookingId, setRescheduleBookingId] = useState<string | null>(null)
  const [rescheduleLoading, setRescheduleLoading] = useState(false)
  const [rescheduleError, setRescheduleError] = useState<string | null>(null)
  const authStore = useAuthStore()
  const { close: closeOverlay } = useOverlayStore()

  // Use the same phone logic as useBookings for consistency
  const getFallbackPhone = (): string | null => {
    try { return localStorage.getItem('yookie_booking_phone'); } catch { return null; }
  };
  const phone = authStore.phone || getFallbackPhone() || '+998'

  const active = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed')
  const past   = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled' || b.status === 'no_show')

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
  }

  const formatTimeRange = (startsAt: string, endsAt: string) => {
    const start = new Date(startsAt)
    const end = endsAt ? new Date(endsAt) : null
    const startStr = start.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    if (!end) return startStr
    const endStr = end.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    return `${startStr}–${endStr}`
  }

  const handleCancel = async (bookingId: string) => {
    if (!phone) return
    setCancelLoading(bookingId)
    setCancelError(null)
    try {
      await cancelBooking(bookingId, phone)
      refetch()
    } catch {
      setCancelError('Не удалось отменить запись. Попробуйте позже.')
    } finally {
      setCancelLoading(null)
    }
  }

  const handleRescheduleOpen = (bookingId: string) => {
    setRescheduleBookingId(bookingId)
    setRescheduleError(null)
  }

  const handleRescheduleConfirm = async (newStartsAt: string, newMasterId: string) => {
    if (!rescheduleBookingId || !phone) return
    setRescheduleLoading(true)
    setRescheduleError(null)
    try {
      await rescheduleBooking(rescheduleBookingId, {
        phone,
        startsAt: newStartsAt,
        masterId: newMasterId,
      })
      setRescheduleBookingId(null)
      closeOverlay()
      refetch()
    } catch (err) {
      setRescheduleError(err instanceof Error ? err.message : 'Ошибка при переносе')
    } finally {
      setRescheduleLoading(false)
    }
  }

  const handleDetails = (bookingId: string) => {
    // Navigate to business detail page
    const booking = bookings.find(b => b.id === bookingId)
    if (booking?.business_id) {
      navigate(`/business/${booking.business_id}`)
    }
  }

  // Find the booking being rescheduled
  const rescheduleBookingData = rescheduleBookingId
    ? bookings.find(b => b.id === rescheduleBookingId)
    : null

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3.83 9L9.43 14.6L8 16L0 8L8 0L9.43 1.4L3.83 7H16V9H3.83Z" fill="#F9FAFB"/></svg>
        </button>
        <span className={styles.headerTitle}>Мои записи</span>
        <div style={{ width: 40 }} />
      </header>

      <div className={styles.content}>
        <div className={styles.tabs}>
          <button className={`${styles.tabBtn} ${tab === 'active' ? styles.tabActive : ''}`} onClick={() => setTab('active')}>
            Активные
          </button>
          <button className={`${styles.tabBtn} ${tab === 'completed' ? styles.tabActive : ''}`} onClick={() => setTab('completed')}>
            Завершенные
          </button>
        </div>

        {isLoading ? (
          <div className={styles.list}>
            {[1, 2].map(i => <div key={i} className={styles.skeletonCard}><Skeleton variant="rect" height={180} /></div>)}
          </div>
        ) : tab === 'active' ? (
          <div className={styles.list}>
            {active.length === 0 ? (
              <EmptyState title="Нет активных записей" description="Запишитесь к мастеру прямо сейчас" action={<button className={styles.actionBtn} onClick={() => navigate('/')}>Найти мастера</button>} />
            ) : (
              <>
                <p className={styles.sectionLabel}>Активные ({active.length})</p>
                {active.map(booking => {
                  const st = STATUS_LABELS[booking.status] ?? { label: booking.status.toUpperCase(), className: 'statusPending' }
                  const businessName = (booking.businesses as { name?: string } | null)?.name || 'Заведение'
                  const serviceName = (booking.services as { name?: string } | null)?.name || 'Услуга'
                  const serviceDuration = (booking.services as { duration_min?: number } | null)?.duration_min
                  const masterName = (booking.masters as { name?: string } | null)?.name || 'Мастер'
                  const businessCategory = (booking.businesses as { category?: string } | null)?.category
                  const bizLogo = businessCategory ? getMockBusinessImage(businessCategory, booking.business_id) : null
                  const isCancelling = cancelLoading === booking.id
                  // Compute time range from starts_at and ends_at
                  const timeRange = formatTimeRange(booking.starts_at, booking.ends_at)
                  // Compute duration from starts_at and ends_at if not available from service
                  let durationMin = serviceDuration ?? 0
                  if (!durationMin && booking.ends_at) {
                    durationMin = Math.round((new Date(booking.ends_at).getTime() - new Date(booking.starts_at).getTime()) / 60000)
                  }
                  return (
                    <div key={booking.id} className={styles.bookingCard}>
                      <div className={styles.cardTop}>
                        {bizLogo
                          ? <img className={styles.businessLogo} src={bizLogo} alt={businessName} />
                          : <div className={styles.businessLogo} />
                        }
                        <div className={styles.cardInfo}>
                          <div className={styles.cardNameRow}>
                            <span className={styles.businessName}>{businessName}</span>
                            <span className={`${styles.statusBadge} ${styles[st.className]}`}>{st.label}</span>
                          </div>
                        </div>
                      </div>

                      {/* Services list */}
                      <div className={styles.servicesList}>
                        <div className={styles.serviceRow}>
                          <span className={styles.serviceName}>{serviceName}</span>
                          {durationMin > 0 && (
                            <span className={styles.serviceDuration}>{durationMin} мин</span>
                          )}
                        </div>
                      </div>

                      <div className={styles.cardMeta}>
                        <div className={styles.metaRow}>
                          <CalendarIcon />
                          <span>{formatDate(booking.starts_at)}</span>
                        </div>
                        <div className={styles.metaRow}>
                          <ClockIcon />
                          <span>{timeRange}</span>
                        </div>
                        <div className={styles.metaRow}>
                          <PersonIcon />
                          <span>{masterName}</span>
                        </div>
                      </div>

                      {/* Total price */}
                      <div className={styles.totalPriceRow}>
                        <span className={styles.totalLabel}>Итого:</span>
                        <span className={styles.totalValue}>
                          {(booking.price ?? 0).toLocaleString('ru')} сўм
                        </span>
                      </div>

                      {cancelError && <div className={styles.cancelError}>{cancelError}</div>}
                      {rescheduleError && rescheduleBookingId === booking.id && (
                        <div className={styles.cancelError}>{rescheduleError}</div>
                      )}
                      <div className={styles.cardActions}>
                        <button
                          className={styles.btnCancel}
                          disabled={isCancelling || rescheduleLoading}
                          onClick={() => handleCancel(booking.id)}
                        >
                          {isCancelling ? 'Отмена...' : 'Отменить'}
                        </button>
                        <button
                          className={styles.btnSecondary}
                          disabled={rescheduleLoading}
                          onClick={() => handleRescheduleOpen(booking.id)}
                        >
                          Перенести
                        </button>
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        ) : (
          <div className={styles.list}>
            {past.length === 0 ? (
              <EmptyState title="Нет завершенных записей" description="Здесь будет история ваших посещений" />
            ) : (
              <>
                <p className={styles.sectionLabel}>Прошедшие</p>
                <div className={styles.pastList}>
                  {past.map(booking => {
                    const st = STATUS_LABELS[booking.status] ?? { label: booking.status.toUpperCase(), className: 'statusCancelled' }
                    const businessName = (booking.businesses as { name?: string } | null)?.name || 'Заведение'
                    return (
                      <div key={booking.id} className={styles.pastRow}>
                        <div className={styles.pastLogo} />
                        <div className={styles.pastInfo}>
                          <span className={styles.pastName}>{businessName}</span>
                          <span className={styles.pastMeta}>
                            {formatDate(booking.starts_at)}
                          </span>
                        </div>
                        {booking.status === 'completed' ? (
                          <button
                            className={styles.reviewBtn}
                            onClick={() => setReviewBooking(booking)}
                          >
                            Отзыв
                          </button>
                        ) : (
                          <span className={`${styles.statusBadge} ${styles[st.className]}`}>{st.label}</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {reviewBooking && (
        <ReviewForm
          booking={reviewBooking}
          onClose={() => setReviewBooking(null)}
          onSuccess={() => {
            setReviewBooking(null)
            setReviewSuccess(true)
            refetch?.()
            setTimeout(() => setReviewSuccess(false), 3000)
          }}
        />
      )}

      {reviewSuccess && (
        <div className={styles.reviewSuccess}>
          <span className={styles.reviewSuccessIcon}>✓</span>
          <span>Отзыв успешно отправлен!</span>
        </div>
      )}

      {rescheduleBookingData && (
        <RescheduleBottomSheet
          open={!!rescheduleBookingId}
          onClose={() => setRescheduleBookingId(null)}
          businessId={rescheduleBookingData.business_id}
          masterId={rescheduleBookingData.master_id}
          currentStartsAt={rescheduleBookingData.starts_at}
          onConfirm={handleRescheduleConfirm}
          loading={rescheduleLoading}
          serviceDurationMin={(() => {
            const svc = rescheduleBookingData.services as { duration_min?: number } | null
            if (svc?.duration_min) return svc.duration_min
            if (rescheduleBookingData.ends_at) {
              return Math.round((new Date(rescheduleBookingData.ends_at).getTime() - new Date(rescheduleBookingData.starts_at).getTime()) / 60000)
            }
            return undefined
          })()}
        />
      )}
    </div>
  )
}
