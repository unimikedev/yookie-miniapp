import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBookings } from '@/hooks/useBookings'
import { Skeleton, EmptyState } from '@/shared/ui'
import { cancelBooking, rescheduleBooking } from '@/lib/api/bookings'
import { getMockBusinessImage } from '@/lib/utils/mockImages'
import { formatMasterName } from '@/lib/utils/name'
import ReviewForm from '@/components/features/ReviewForm'
import RescheduleBottomSheet from '@/components/features/RescheduleBottomSheet'
import { useAuthStore } from '@/stores/authStore'
import { useOverlayStore } from '@/stores/overlayStore'
import { useTelegramBackButton } from '@/hooks/useTelegramBackButton'
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
  // Telegram native BackButton (replaces inline back arrow)
  useTelegramBackButton(true)

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

  // Group bookings by business_id + starts_at (same session = multiple services)
  const groupBookings = (list: typeof bookings) => {
    const groups: Map<string, typeof bookings> = new Map()
    for (const b of list) {
      const key = `${b.business_id}__${b.starts_at}`
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(b)
    }
    return Array.from(groups.values())
  }

  const activeGroups = groupBookings(active)
  const pastGroups = groupBookings(past)

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

  // Cancel all bookings in a group (multi-service = multiple booking IDs)
  const handleCancelGroup = async (group: typeof bookings) => {
    if (!phone) return
    const firstId = group[0].id
    setCancelLoading(firstId)
    setCancelError(null)
    try {
      // Cancel all bookings in the group in parallel
      await Promise.all(group.map(b => cancelBooking(b.id, phone)))
      refetch()
    } catch {
      setCancelError('Не удалось отменить запись. Попробуйте позже.')
    } finally {
      setCancelLoading(null)
    }
  }

  // Store the full group of booking IDs being rescheduled
  const [rescheduleGroupIds, setRescheduleGroupIds] = useState<string[]>([])

  const handleRescheduleOpen = (group: typeof bookings) => {
    setRescheduleBookingId(group[0].id)
    setRescheduleGroupIds(group.map(b => b.id))
    setRescheduleError(null)
  }

  const handleRescheduleConfirm = async (newStartsAt: string, newMasterId: string) => {
    if (!rescheduleBookingId || !phone) return
    setRescheduleLoading(true)
    setRescheduleError(null)
    try {
      // Reschedule all bookings in the group to the same new time
      await Promise.all(
        rescheduleGroupIds.map(id =>
          rescheduleBooking(id, {
            phone,
            startsAt: newStartsAt,
            masterId: newMasterId,
          })
        )
      )
      setRescheduleBookingId(null)
      setRescheduleGroupIds([])
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
        <span className={styles.headerTitle}>Мои записи</span>
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
                <p className={styles.sectionLabel}>Активные ({activeGroups.length})</p>
                {activeGroups.map((group, gi) => {
                  const first = group[0]
                  const st = STATUS_LABELS[first.status] ?? { label: first.status.toUpperCase(), className: 'statusPending' }
                  const businessName = (first.businesses as { name?: string } | null)?.name || 'Заведение'
                  const masterName = formatMasterName((first.masters as { name?: string } | null)?.name || 'Мастер')
                  const businessCategory = (first.businesses as { category?: string } | null)?.category
                  const bizLogo = businessCategory ? getMockBusinessImage(businessCategory, first.business_id) : null
                  const isCancelling = cancelLoading === first.id
                  const timeRange = formatTimeRange(first.starts_at, first.ends_at)

                  // Sum up all services in the group
                  const totalPrice = group.reduce((sum, b) => sum + ((b.services as { price?: number } | null)?.price ?? 0), 0)
                  const totalDuration = group.reduce((sum, b) => {
                    const dur = (b.services as { duration_min?: number } | null)?.duration_min ?? 0
                    return sum + (dur || Math.round((new Date(b.ends_at).getTime() - new Date(b.starts_at).getTime()) / 60000))
                  }, 0)

                  return (
                    <div key={`ag-${gi}`} className={styles.bookingCard}>
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
                          {group.length > 1 && (
                            <span className={styles.serviceCountBadge}>{group.length} услуги</span>
                          )}
                        </div>
                      </div>

                      {/* Services list */}
                      <div className={styles.servicesList}>
                        {group.map((b) => {
                          const serviceName = (b.services as { name?: string } | null)?.name || 'Услуга'
                          const serviceDuration = (b.services as { duration_min?: number } | null)?.duration_min
                          const masterForService = (b.masters as { name?: string } | null)?.name || 'Мастер'
                          return (
                            <div key={b.id} className={styles.serviceRow}>
                              <span className={styles.serviceName}>{serviceName}</span>
                              <span className={styles.serviceDuration}>{serviceDuration ?? '?'} мин</span>
                              <span className={styles.serviceMaster}>{masterForService}</span>
                            </div>
                          )
                        })}
                      </div>

                      <div className={styles.cardMeta}>
                        <div className={styles.metaRow}>
                          <CalendarIcon />
                          <span>{formatDate(first.starts_at)}</span>
                        </div>
                        <div className={styles.metaRow}>
                          <ClockIcon />
                          <span>{timeRange} • {totalDuration} мин</span>
                        </div>
                        <div className={styles.metaRow}>
                          <PersonIcon />
                          <span>{masterName}</span>
                        </div>
                        <div className={styles.metaRow}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="4" width="20" height="16" rx="2" />
                            <path d="M2 10h20" />
                          </svg>
                          <span className={styles.totalPrice}>{totalPrice.toLocaleString('ru')} сўм</span>
                        </div>
                      </div>

                      {/* Total price */}
                      <div className={styles.totalPriceRow}>
                        <span className={styles.totalLabel}>Итого:</span>
                        <span className={styles.totalValue}>
                          {totalPrice.toLocaleString('ru')} сўм
                        </span>
                      </div>

                      {cancelError && <div className={styles.cancelError}>{cancelError}</div>}
                      {rescheduleError && rescheduleBookingId === first.id && (
                        <div className={styles.cancelError}>{rescheduleError}</div>
                      )}
                      <div className={styles.cardActions}>
                        <button
                          className={styles.btnCancel}
                          disabled={isCancelling || rescheduleLoading}
                          onClick={() => handleCancelGroup(group)}
                        >
                          {isCancelling ? 'Отмена...' : 'Отменить'}
                        </button>
                        <button
                          className={styles.btnSecondary}
                          disabled={rescheduleLoading}
                          onClick={() => handleRescheduleOpen(group)}
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
                <p className={styles.sectionLabel}>Прошедшие ({pastGroups.length})</p>
                <div className={styles.pastList}>
                  {pastGroups.map((group, gi) => {
                    const first = group[0]
                    const st = STATUS_LABELS[first.status] ?? { label: first.status.toUpperCase(), className: 'statusCancelled' }
                    const businessName = (first.businesses as { name?: string } | null)?.name || 'Заведение'
                    const totalPrice = group.reduce((sum, b) => sum + ((b.services as { price?: number } | null)?.price ?? 0), 0)
                    const serviceNames = group.map(b => (b.services as { name?: string } | null)?.name ?? 'Услуга').join(', ')
                    return (
                      <div key={`pg-${gi}`} className={styles.pastRow}>
                        <div className={styles.pastLogo} />
                        <div className={styles.pastInfo}>
                          <span className={styles.pastName}>{businessName}</span>
                          <span className={styles.pastMeta}>
                            {formatDate(first.starts_at)}
                          </span>
                          <span className={styles.pastServices}>{serviceNames}</span>
                          <span className={styles.pastPrice}>{totalPrice.toLocaleString('ru')} сўм</span>
                        </div>
                        {first.status === 'completed' ? (
                          <button
                            className={styles.reviewBtn}
                            onClick={() => setReviewBooking(first)}
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
          onClose={() => { setRescheduleBookingId(null); setRescheduleGroupIds([]); }}
          businessId={rescheduleBookingData.business_id}
          masterId={rescheduleBookingData.master_id}
          currentStartsAt={rescheduleBookingData.starts_at}
          onConfirm={handleRescheduleConfirm}
          loading={rescheduleLoading}
          serviceId={(rescheduleBookingData.services as { id?: string } | null)?.id}
          serviceDurationMin={(() => {
            // Sum total duration of ALL bookings in the group being rescheduled
            const groupBookings = bookings.filter(b => rescheduleGroupIds.includes(b.id))
            if (groupBookings.length > 1) {
              return groupBookings.reduce((sum, b) => {
                const dur = (b.services as { duration_min?: number } | null)?.duration_min
                return sum + (dur || Math.round((new Date(b.ends_at).getTime() - new Date(b.starts_at).getTime()) / 60000))
              }, 0)
            }
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
