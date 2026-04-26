import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useBookingStore } from '@/stores/bookingStore'
import { useAuthStore } from '@/stores/authStore'
import { useBusiness } from '@/hooks/useBusiness'
import { createBooking, createBookingBatch } from '@/lib/api/bookings'
import { syncBookingToMerchant } from '@/lib/syncBookingToMerchant'
import { getErrorFromApiError } from '@/lib/errorMapper'
import { useAlternativeSlots } from '@/hooks/useAlternativeSlots'
import { formatPhoneMask, isPhoneComplete, stripDigits, getCleanPhone } from '@/lib/utils/phone'
import styles from './BookingFlowPage.module.css'

export default function BookingFlowPage() {
  const navigate = useNavigate()
  const bookingStore = useBookingStore()
  const authStore = useAuthStore()
  const { masters } = useBusiness(bookingStore.selectedBusiness?.id)

  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successState, setSuccessState] = useState(false)
  const [bookedCount, setBookedCount] = useState(0)
  const [showAlternativeSlots, setShowAlternativeSlots] = useState(false)
  const [conflictSlotInfo, setConflictSlotInfo] = useState<{ serviceId: string; masterId: string; dateTime: string } | null>(null)

  // Hook для альтернативных слотов (используется при конфликте)
  const { slots: alternativeSlots, isLoading: isLoadingAlternatives } = useAlternativeSlots(
    conflictSlotInfo?.serviceId || '',
    conflictSlotInfo?.masterId || '',
    conflictSlotInfo?.dateTime || ''
  )

  // Check if we have valid booking data
  const hasValidData = () => {
    if (!bookingStore.selectedBusiness || !bookingStore.selectedDate || !bookingStore.selectedSlot) return false
    // Multi-service mode (primary flow)
    if (bookingStore.selectedServices.length > 0) {
      return bookingStore.selectedServices.every((s) => s.masterId !== null)
    }
    // Legacy single mode: selectedMaster set from MasterDetailPage
    return bookingStore.selectedMaster !== null
  }

  // Redirect if no selections
  useEffect(() => {
    if (!hasValidData()) {
      navigate('/')
    }
  }, [])

  // Pre-fill from authStore (only on mount for authenticated users)
  useEffect(() => {
    if (authStore.isAuthenticated) {
      if (authStore.phone && !clientPhone) setClientPhone(authStore.phone)
      if (authStore.name && !clientName) setClientName(authStore.name)
    }
  }, [])

  // Use auth phone for booking creation when authenticated
  const effectivePhone = authStore.isAuthenticated && authStore.phone
    ? getCleanPhone(authStore.phone)
    : getCleanPhone(clientPhone)

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('ru-RU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const handleConfirm = async () => {
    // Validate name (no digits)
    if (!clientName.trim()) {
      setError('Введите ваше имя')
      return
    }
    if (/\d/.test(clientName)) {
      setError('Имя не должно содержать цифр')
      return
    }
    // Validate phone
    if (!effectivePhone || effectivePhone.length < 10) {
      setError('Введите номер телефона')
      return
    }
    if (!authStore.isAuthenticated && !isPhoneComplete(clientPhone)) {
      setError('Введите полный номер телефона (+998 XX XXX-XX-XX)')
      return
    }

    setIsLoading(true)
    setError(null)

    let startsAt = ''
    let services = bookingStore.selectedServices

    try {
      if (!bookingStore.selectedBusiness || !bookingStore.selectedDate || !bookingStore.selectedSlot) {
        throw new Error('Missing booking data')
      }

      startsAt = bookingStore.selectedSlot.id
        ?? `${bookingStore.selectedDate}T${bookingStore.selectedSlot.start}:00`

      services = bookingStore.selectedServices
      if (services.length === 0) {
        throw new Error('No services selected')
      }

      let bookedList: import('@/lib/api/types').Booking[]

      if (services.length > 1) {
        // Batch endpoint: one admin notification for all services
        bookedList = await createBookingBatch({
          businessId: bookingStore.selectedBusiness!.id,
          startsAt,
          clientPhone: effectivePhone,
          clientName,
          notes: notes || undefined,
          services: services.map((svc) => ({
            serviceId: svc.service.id,
            masterId: svc.masterId!,
          })),
        })
      } else {
        // Single booking
        const booking = await createBooking({
          businessId: bookingStore.selectedBusiness!.id,
          masterId: services[0].masterId!,
          serviceId: services[0].service.id,
          startsAt,
          clientPhone: effectivePhone,
          clientName,
          notes: notes || undefined,
        })
        bookedList = [booking]
      }

      bookedList.forEach((b) => syncBookingToMerchant(b));

      setBookedCount(services.length)
      setSuccessState(true)
      bookingStore.reset()

      setTimeout(() => {
        navigate('/my-bookings')
      }, 2000)
    } catch (err: any) {
      // Use centralized error mapping from errorMapper
      const isConflictError = err?.status === 409 || 
                              err?.code === 'BOOKING_CONFLICT' || 
                              err?.code === 'SLOT_UNAVAILABLE' ||
                              err?.message?.includes('BOOKING_CONFLICT') || 
                              err?.message?.includes('SLOT_UNAVAILABLE');
      
      if (isConflictError && services.length > 0) {
        // Show modal with alternative slots for first service
        const firstService = services[0];
        setConflictSlotInfo({
          serviceId: firstService.service.id,
          masterId: firstService.masterId!,
          dateTime: startsAt
        });
        setShowAlternativeSlots(true);
        setError('Выбранное время только что заняли. Пожалуйста, выберите другое время.');
      } else {
        const errorMapping = getErrorFromApiError(err);
        setError(errorMapping.message);
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!hasValidData()) {
    return null
  }

  if (successState) {
    const multiCount = bookedCount || 1;
    return (
      <div className={styles.container}>
        <div className={styles.successContainer}>
          <div className={styles.successCheckmark}>✓</div>
          <h2 className={styles.successTitle}>
            {multiCount > 1 ? `${multiCount} записи созданы!` : 'Запись подтверждена!'}
          </h2>
          <p className={styles.successMessage}>
            {multiCount > 1
              ? `Создано ${multiCount} отдельных записей для каждой услуги. Вы можете просмотреть их в разделе «Мои записи»`
              : 'Вы можете просмотреть детали в разделе «Мои записи»'}
          </p>
          <p className={styles.successSubtext}>Перенаправление...</p>
        </div>
      </div>
    )
  }

  // Determine which services to show
  const servicesToShow = bookingStore.selectedServices.length > 0
    ? bookingStore.selectedServices
    : []

  const totalPrice = servicesToShow.reduce((sum, s) => sum + (s.service.price || 0), 0)
  const totalDuration = servicesToShow.reduce((sum, s) => sum + (s.service.duration_min || 30), 0)

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Подтверждение записи</h1>
      </div>

      <div className={styles.content}>
        {/* Summary card — unified with input fields */}
        <section className={styles.section}>
          {(() => {
            // Group services by master
            const mGroups = new Map<string, { name: string; specialization: string; services: typeof servicesToShow }>()
            for (const item of servicesToShow) {
              const mid = item.masterId || '_'
              const master = masters?.find(m => m.id === item.masterId)
              const mName = master?.name || '—'
              const mSpec = master?.specialization || ''
              if (!mGroups.has(mid)) mGroups.set(mid, { name: mName, specialization: mSpec, services: [] })
              mGroups.get(mid)!.services.push(item)
            }

            const fmtDur = (min: number) => min >= 60 ? `${Math.floor(min / 60)} час` : `${min} мин`
            const shortDate = bookingStore.selectedDate
              ? new Date(bookingStore.selectedDate + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
              : ''
            const slot = bookingStore.selectedSlot
            const endTime = slot?.end ? ` - ~${slot.end}` : ''
            const dateTimeStr = `${shortDate} • ${slot?.start ?? ''}${endTime}`

            return (
              <div className={styles.summaryCard}>
                {/* Business name + count */}
                <div>
                  <h3 className={styles.summaryBizName}>{bookingStore.selectedBusiness?.name}</h3>
                  <p className={styles.summaryCount}>{servicesToShow.length} {servicesToShow.length === 1 ? 'услуга' : 'услуги'}</p>
                </div>

                {/* Master groups */}
                <div className={styles.summaryMasterList}>
                  {Array.from(mGroups.values()).map((mg, mi) => (
                    <div key={mi} className={styles.summaryMasterGroup}>
                      <div className={styles.summaryMasterHeader}>
                        <span className={styles.summaryMasterName}>{mg.name}</span>
                        {mg.specialization && (
                          <span className={styles.summarySpecBadge}>{mg.specialization}</span>
                        )}
                      </div>
                      {mg.services.map((item) => {
                        const dur = item.service.duration_min
                        return (
                          <div key={item.service.id} className={styles.summaryServiceRow}>
                            <span className={styles.summaryServiceName}>
                              {item.service.name}{dur ? ` ~ ${fmtDur(dur)}` : ''}
                            </span>
                            <span className={styles.summaryServicePrice}>
                              {(item.service.price || 0).toLocaleString('ru')} {'сум'}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>

                {/* Date + time */}
                <div className={styles.summaryDateTime}>{dateTimeStr}</div>

                {/* Total */}
                <div className={styles.summaryTotal}>{totalPrice.toLocaleString('ru')} сум</div>

                {/* Input fields */}
                <div className={styles.summaryInputs}>
                  <input
                    type="text"
                    className={styles.summaryInput}
                    placeholder="Имя"
                    value={clientName}
                    onChange={(e) => setClientName(stripDigits(e.target.value))}
                    disabled={isLoading}
                  />
                  <input
                    type="tel"
                    className={styles.summaryInput}
                    placeholder="+998 (XX) XXX-XX-XX"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(formatPhoneMask(e.target.value))}
                    disabled={isLoading || authStore.isAuthenticated}
                  />
                </div>
              </div>
            )
          })()}
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Комментарий к записи</h2>
          <textarea
            className={styles.textarea}
            placeholder="Добавьте комментарий или пожелания (опционально)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isLoading}
            rows={3}
          />
        </section>

        <section className={styles.section}>
          <div className={styles.infoBox}>
            <p>
              <strong>Отмена:</strong> Вы можете отменить запись за 24 часа до услуги
            </p>
            <p>
              <strong>Уведомление:</strong> Вы получите напоминание за час до записи
            </p>
            <p>
              <strong>Подтверждение:</strong> Запись активируется после подтверждения
            </p>
          </div>
        </section>

        {error && <div className={styles.errorBox}>{error}</div>}
      </div>

      {/* Модалка с альтернативными слотами */}
      {showAlternativeSlots && (
        <div className={styles.modalOverlay} onClick={() => setShowAlternativeSlots(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Выбранное время занято</h3>
            <p className={styles.modalDescription}>Попробуйте одно из этих времен:</p>
            
            {isLoadingAlternatives ? (
              <div className={styles.loadingAlternatives}>Загрузка вариантов...</div>
            ) : alternativeSlots.length > 0 ? (
              <div className={styles.slotsList}>
                {alternativeSlots.map((slot, index) => {
                  const startTime = new Date(slot.starts_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                  return (
                    <button
                      key={index}
                      className={styles.slotButton}
                      onClick={() => {
                        // Update selected slot in bookingStore with the alternative slot
                        const selectedDate = bookingStore.selectedDate;
                        if (selectedDate) {
                          // Parse the starts_at to get time
                          const startDate = new Date(slot.starts_at);
                          const hours = startDate.getHours().toString().padStart(2, '0');
                          const minutes = startDate.getMinutes().toString().padStart(2, '0');
                          
                          // Create a new slot object matching the expected format
                          const newSlot = {
                            id: slot.starts_at,
                            start: `${hours}:${minutes}`,
                            end: slot.ends_at ? new Date(slot.ends_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '',
                            is_available: true,
                          };
                          
                          bookingStore.setSlot(newSlot);
                        }
                        setShowAlternativeSlots(false);
                        setError(null);
                        setConflictSlotInfo(null);
                      }}
                    >
                      {startTime}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className={styles.noAlternatives}>К сожалению, нет доступных альтернатив на сегодня.</div>
            )}
            
            <button
              className={styles.closeModalButton}
              onClick={() => setShowAlternativeSlots(false)}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      <div className={styles.footer}>
        <button
          className={`${styles.confirmButton} ${isLoading ? styles.loading : ''}`}
          onClick={handleConfirm}
          disabled={isLoading}
        >
          {isLoading ? 'Подтверждение...' : 'Подтвердить запись'}
        </button>
      </div>
    </div>
  )
}
