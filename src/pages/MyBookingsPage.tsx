import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useBookings } from '@/hooks/useBookings'
import { LoadingState } from '@/components/ui'
import { cancelBooking, rescheduleBooking } from '@/lib/api/bookings'
import { syncBookingCancellationToMerchant, syncBookingRescheduleToMerchant } from '@/lib/syncBookingToMerchant'
import { formatMasterName } from '@/lib/utils/name'
import { formatRelativeDate } from '@/lib/utils/date'
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

const STATUS_KEY_MAP: Record<string, { key: string; className: string }> = {
  pending:   { key: 'bookings.statusPending',   className: 'statusPending' },
  confirmed: { key: 'bookings.statusConfirmed', className: 'statusConfirmed' },
  completed: { key: 'bookings.statusCompleted', className: 'statusCompleted' },
  cancelled: { key: 'bookings.statusCancelled', className: 'statusCancelled' },
  no_show:   { key: 'bookings.statusNoShow',    className: 'statusCancelled' },
}

export default function MyBookingsPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [tab, setTab] = useState<'active' | 'completed'>('active')
  const { bookings, isLoading, error, refetch } = useBookings()

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
  const [rescheduleSuccess, setRescheduleSuccess] = useState(false)
  const [cancelConfirmGroup, setCancelConfirmGroup] = useState<typeof bookings | null>(null)
  const [expandedPastId, setExpandedPastId] = useState<string | null>(null)
  const authStore = useAuthStore()
  const { close: closeOverlay } = useOverlayStore()

  // Use the same phone logic as useBookings for consistency
  const getFallbackPhone = (): string | null => {
    try { return localStorage.getItem('yookie_booking_phone'); } catch { return null; }
  };
  const phone = authStore.phone || getFallbackPhone() || '+998'

  // Group by booking_group_id when present; fallback to business_id+starts_at for legacy rows
  const groupBookings = (list: typeof bookings) => {
    const groups: Map<string, typeof bookings> = new Map()
    for (const b of list) {
      const key = b.booking_group_id ?? `${b.business_id}__${b.starts_at}`
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(b)
    }
    return Array.from(groups.values())
  }

  const allGroups = groupBookings(bookings)
  // Active: at least one booking in the group is still open (handles partial cancellations)
  const activeGroups = allGroups.filter(g => g.some(b => b.status === 'pending' || b.status === 'confirmed'))
  // Past: every booking in the group has reached a terminal state
  const pastGroups = allGroups.filter(g => g.every(b => b.status === 'completed' || b.status === 'cancelled' || b.status === 'no_show'))

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
    const merchantId = group[0].business_id
    setCancelLoading(firstId)
    setCancelError(null)
    try {
      // Cancel all bookings in the group in parallel
      await Promise.all(group.map(b => cancelBooking(b.id, phone)))
      // Sync cancellation to merchant store
      group.forEach(b => syncBookingCancellationToMerchant(b.id, merchantId))
      refetch()
    } catch {
      setCancelError(t('bookings.cancelError'))
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
    const merchantId = rescheduleGroupIds.length > 0 
      ? bookings.find(b => b.id === rescheduleGroupIds[0])?.business_id || ''
      : ''
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
      // Sync reschedule to merchant store
      rescheduleGroupIds.forEach(id => 
        syncBookingRescheduleToMerchant(id, merchantId, newStartsAt, newMasterId)
      )
      setRescheduleBookingId(null)
      setRescheduleGroupIds([])
      closeOverlay()
      refetch()
      setRescheduleSuccess(true)
      setTimeout(() => setRescheduleSuccess(false), 3500)
    } catch (err) {
      setRescheduleError(err instanceof Error ? err.message : t('bookings.rescheduleError'))
    } finally {
      setRescheduleLoading(false)
    }
  }

  const handleDetails = (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId)
    if (booking?.business_id) {
      navigate(`/business/${booking.business_id}`)
    }
  }

  const buildMapUrl = (group: typeof bookings): string | null => {
    const biz = group[0].businesses as { lat?: number | null; lng?: number | null; address?: string | null } | null
    if (biz?.lat != null && biz?.lng != null) {
      return `https://yandex.com/maps/?pt=${biz.lng},${biz.lat}&z=17&l=map`
    }
    if (biz?.address) {
      return `https://yandex.com/maps/?text=${encodeURIComponent(biz.address)}`
    }
    return null
  }

  const buildGoogleCalendarUrl = (group: typeof bookings) => {
    const first = group[0]
    const businessName = (first.businesses as { name?: string } | null)?.name ?? 'Запись'
    const address = (first.businesses as { address?: string } | null)?.address ?? ''
    const serviceNames = group.map(b => (b.services as { name?: string } | null)?.name ?? '').filter(Boolean).join(', ')

    const start = new Date(first.starts_at)
    const end = first.ends_at ? new Date(first.ends_at) : new Date(start.getTime() + 60 * 60000)

    const fmt = (d: Date) =>
      d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `${serviceNames} — ${businessName}`,
      dates: `${fmt(start)}/${fmt(end)}`,
      details: serviceNames,
      location: address,
    })
    return `https://calendar.google.com/calendar/render?${params.toString()}`
  }

  // Find the booking being rescheduled
  const rescheduleBookingData = rescheduleBookingId
    ? bookings.find(b => b.id === rescheduleBookingId)
    : null

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.tabs}>
          <button className={`${styles.tabBtn} ${tab === 'active' ? styles.tabActive : ''}`} onClick={() => setTab('active')}>
            {t('bookings.tabActive')}
          </button>
          <button className={`${styles.tabBtn} ${tab === 'completed' ? styles.tabActive : ''}`} onClick={() => setTab('completed')}>
            {t('bookings.tabCompleted')}
          </button>
        </div>

        <LoadingState
          isLoading={isLoading}
          error={error?.message ?? null}
          hasData={tab === 'active' ? activeGroups.length > 0 : pastGroups.length > 0}
          skeletonType="list"
          count={3}
          emptyTitle={tab === 'active' ? t('bookings.noActive') : t('bookings.noCompleted')}
          emptyDescription={tab === 'active' ? t('bookings.noActiveDesc') : t('bookings.noCompletedDesc')}
          emptyAction={tab === 'active' ? <button className={styles.actionBtn} onClick={() => navigate('/')}>{t('bookings.findMaster')}</button> : undefined}
        >
          {tab === 'active' ? (
            <>
                <p className={styles.sectionLabel}>{t('bookings.sectionActive', { count: activeGroups.length })}</p>
                {activeGroups.map((group, gi) => {
                  const first = group[0]
                  const businessName = (first.businesses as { name?: string } | null)?.name || t('bookings.business')
                  const isCancelling = cancelLoading === first.id
                  const timeRange = formatTimeRange(first.starts_at, first.ends_at)
                  // Aggregate status across all masters in this booking group
                  const gn = group.length
                  const gConfirmed = group.filter(b => b.status === 'confirmed').length
                  const gCancelled = group.filter(b => b.status === 'cancelled' || b.status === 'no_show').length
                  let aggregateLabel: string
                  let aggClass: string
                  if (gn === 1) {
                    const st0 = STATUS_KEY_MAP[first.status] ?? { key: '', className: 'statusPending' }
                    aggregateLabel = st0.key ? t(st0.key) : first.status
                    aggClass = st0.className
                  } else if (gCancelled > 0 && gCancelled === gn) {
                    aggregateLabel = 'Отменено'; aggClass = 'statusCancelled'
                  } else if (gCancelled > 0) {
                    aggregateLabel = `${gCancelled} отменено`; aggClass = 'statusCancelled'
                  } else if (gConfirmed === gn) {
                    aggregateLabel = `Подтверждено ${gConfirmed}/${gn}`; aggClass = 'statusConfirmed'
                  } else if (gConfirmed > 0) {
                    aggregateLabel = `Подтверждено ${gConfirmed}/${gn}`; aggClass = 'statusPending'
                  } else {
                    aggregateLabel = 'Ожидает'; aggClass = 'statusPending'
                  }

                  const totalPrice = group.reduce((sum, b) => sum + ((b.services as { price?: number } | null)?.price ?? 0), 0)

                  // Group services by master
                  const masterGroups = new Map<string, { name: string; specialization: string; items: typeof group }>()
                  for (const b of group) {
                    const mid = b.master_id || '_'
                    const mName = formatMasterName((b.masters as { name?: string } | null)?.name || '')
                    const mSpec = (b.masters as { specialization?: string } | null)?.specialization || ''
                    if (!masterGroups.has(mid)) masterGroups.set(mid, { name: mName, specialization: mSpec, items: [] })
                    masterGroups.get(mid)!.items.push(b)
                  }

                  const fmtDuration = (min: number) => min >= 60 ? `${Math.floor(min / 60)} час` : `${min} мин`

                  return (
                    <div key={`ag-${gi}`} className={styles.bookingCard}>
                      {/* Header: name + status */}
                      <div className={styles.cardTop}>
                        <div className={styles.cardInfo}>
                          <div className={styles.cardNameRow}>
                            <span className={styles.businessName}>{businessName}</span>
                            <div className={styles.badgeRow}>
                              {first.rescheduled && (
                                <span className={`${styles.statusBadge} ${styles.statusRescheduled}`}>{t('bookings.statusRescheduled')}</span>
                              )}
                              <span className={`${styles.statusBadge} ${styles[aggClass as keyof typeof styles]}`}>{aggregateLabel}</span>
                            </div>
                          </div>
                          <span className={styles.serviceCountBadge}>{t('bookings.services_count', { count: group.length })}</span>
                        </div>
                      </div>

                      {/* Services grouped by master */}
                      <div className={styles.masterGroupsList}>
                        {Array.from(masterGroups.values()).map((mg, mi) => {
                          // Per-master status only shown when there are multiple masters
                          const ms = masterGroups.size > 1
                            ? (mg.items.some(b => b.status === 'cancelled' || b.status === 'no_show') ? 'cancelled'
                              : mg.items.some(b => b.status === 'pending') ? 'pending' : 'confirmed')
                            : null
                          return (
                            <div key={mi} className={styles.masterGroup}>
                              <div className={styles.masterGroupHeader}>
                                <span className={styles.masterGroupName}>{mg.name}</span>
                                {mg.specialization && (
                                  <span className={styles.masterSpecBadge}>{mg.specialization}</span>
                                )}
                                {ms && (
                                  <span className={`${styles.masterStatusBadge} ${ms === 'confirmed' ? styles.masterStatusConfirmed : ms === 'cancelled' ? styles.masterStatusCancelled : styles.masterStatusPending}`}>
                                    {ms === 'confirmed' ? 'Подтв.' : ms === 'cancelled' ? 'Отменено' : 'Ожидает'}
                                  </span>
                                )}
                              </div>
                              {mg.items.map((b) => {
                                const svcName = (b.services as { name?: string } | null)?.name || t('bookings.service')
                                const svcDur = (b.services as { duration_min?: number } | null)?.duration_min
                                const svcPrice = (b.services as { price?: number } | null)?.price ?? 0
                                return (
                                  <div key={b.id} className={styles.masterServiceRow}>
                                    <span className={styles.masterServiceName}>
                                      {svcName}{svcDur ? ` ~ ${fmtDuration(svcDur)}` : ''}
                                    </span>
                                    <span className={styles.masterServicePrice}>{svcPrice.toLocaleString('ru')} {t('common.currency')}</span>
                                  </div>
                                )
                              })}
                            </div>
                          )
                        })}
                      </div>

                      {/* Date + time */}
                      <div className={styles.bookingDateTime}>
                        {formatDate(first.starts_at)} • {timeRange}
                      </div>

                      {/* Total */}
                      <div className={styles.bookingTotal}>
                        {totalPrice.toLocaleString('ru')} {t('common.currency')}
                      </div>

                      {cancelError && <div className={styles.cancelError}>{cancelError}</div>}
                      {rescheduleError && rescheduleBookingId === first.id && (
                        <div className={styles.cancelError}>{rescheduleError}</div>
                      )}

                      {/* Actions: row1 reschedule+cancel, row2 calendar+map */}
                      <div className={styles.cardActionsCol}>
                        <div className={styles.cardActionsRow}>
                          <button
                            className={styles.btnSecondary}
                            disabled={rescheduleLoading}
                            onClick={() => handleRescheduleOpen(group)}
                          >
                            {t('bookings.reschedule')}
                          </button>
                          <button
                            className={styles.btnCancel}
                            disabled={isCancelling || rescheduleLoading}
                            onClick={() => setCancelConfirmGroup(group)}
                          >
                            {isCancelling ? t('bookings.cancelLoading') : t('bookings.cancelBtn')}
                          </button>
                        </div>
                        {group.every(b => b.status === 'confirmed') && (
                          <div className={styles.cardActionsRow}>
                            <a
                              className={styles.btnCalendarHalf}
                              href={buildGoogleCalendarUrl(group)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {t('bookings.calendar')}
                            </a>
                            {buildMapUrl(group) && (
                              <a
                                className={styles.btnMapHalf}
                                href={buildMapUrl(group)!}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Показать на карте
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </>
          ) : (
            <>
              <p className={styles.sectionLabel}>{t('bookings.sectionPast', { count: pastGroups.length })}</p>
              {pastGroups.map((group, gi) => {
                const first = group[0]
                const st = STATUS_KEY_MAP[first.status] ?? { key: '', className: 'statusCancelled' }
                const businessName = (first.businesses as { name?: string } | null)?.name || t('bookings.business')
                const totalPrice = group.reduce((sum, b) => sum + ((b.services as { price?: number } | null)?.price ?? 0), 0)
                const serviceNames = group.map(b => (b.services as { name?: string } | null)?.name ?? t('bookings.service')).filter(Boolean).join(' • ')
                const groupKey = first.booking_group_id ?? first.id
                const isExpanded = expandedPastId === groupKey
                const isCompleted = group.every(b => b.status === 'completed')

                return (
                  <div key={`pg-${gi}`} className={styles.pastCard}>
                    <button
                      className={styles.pastCardHeader}
                      onClick={() => setExpandedPastId(isExpanded ? null : groupKey)}
                    >
                      <div className={styles.pastCardLeft}>
                        <span className={styles.pastCardBiz}>{businessName}</span>
                        <span className={styles.pastCardDate}>{formatRelativeDate(first.starts_at)} • {new Date(first.starts_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className={styles.pastCardServices}>{serviceNames}</span>
                      </div>
                      <div className={styles.pastCardRight}>
                        <span className={`${styles.statusBadge} ${styles[st.className as keyof typeof styles]}`}>{st.key ? t(st.key) : first.status}</span>
                        <span className={styles.pastCardPrice}>{totalPrice.toLocaleString('ru')} {t('common.currency')}</span>
                        <span className={`${styles.pastCardChevron} ${isExpanded ? styles.pastCardChevronOpen : ''}`}>›</span>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className={styles.pastCardBody}>
                        {group.map(b => {
                          const svc = b.services as { name?: string; duration_min?: number; price?: number } | null
                          const mst = b.masters as { name?: string } | null
                          return (
                            <div key={b.id} className={styles.pastCardRow}>
                              <span className={styles.pastCardRowName}>{svc?.name ?? '—'}{mst?.name ? ` · ${mst.name}` : ''}</span>
                              <span className={styles.pastCardRowPrice}>{(svc?.price ?? 0).toLocaleString('ru')} {t('common.currency')}</span>
                            </div>
                          )
                        })}
                        <div className={styles.pastCardActions}>
                          <button
                            className={styles.pastCardRebook}
                            onClick={() => navigate(`/business/${first.business_id}`)}
                          >
                            Записаться снова
                          </button>
                          {isCompleted && (
                            <button
                              className={styles.reviewBtn}
                              onClick={() => setReviewBooking(first)}
                            >
                              {t('bookings.review')}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </>
          )}
        </LoadingState>
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
          <span>{t('bookings.reviewSuccess')}</span>
        </div>
      )}

      {rescheduleSuccess && (
        <div className={styles.reviewSuccess}>
          <span className={styles.reviewSuccessIcon}>✓</span>
          <span>Запись перенесена! Ожидает подтверждения мастера.</span>
        </div>
      )}

      {cancelConfirmGroup && (
        <div className={styles.confirmOverlay} onClick={() => setCancelConfirmGroup(null)}>
          <div className={styles.confirmModal} onClick={e => e.stopPropagation()}>
            <p className={styles.confirmTitle}>Отменить запись?</p>
            <p className={styles.confirmText}>
              {(cancelConfirmGroup[0].businesses as { name?: string } | null)?.name ?? 'Запись'} · {formatDate(cancelConfirmGroup[0].starts_at)}
            </p>
            <div className={styles.confirmButtons}>
              <button className={styles.confirmNo} onClick={() => setCancelConfirmGroup(null)}>
                Нет
              </button>
              <button
                className={styles.confirmYes}
                onClick={() => { handleCancelGroup(cancelConfirmGroup); setCancelConfirmGroup(null) }}
              >
                Да, отменить
              </button>
            </div>
          </div>
        </div>
      )}

      <RescheduleBottomSheet
        open={!!rescheduleBookingId && !!rescheduleBookingData}
        onClose={() => { setRescheduleBookingId(null); setRescheduleGroupIds([]); setRescheduleError(null); }}
        error={rescheduleError}
        businessId={rescheduleBookingData?.business_id ?? ''}
        masterId={rescheduleBookingData?.master_id ?? ''}
        currentStartsAt={rescheduleBookingData?.starts_at ?? ''}
        onConfirm={handleRescheduleConfirm}
        loading={rescheduleLoading}
        serviceId={(rescheduleBookingData?.services as { id?: string } | null)?.id}
        serviceDurationMin={(() => {
          if (!rescheduleBookingData) return undefined
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
    </div>
  )
}
