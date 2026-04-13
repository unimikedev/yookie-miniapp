import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useBookingStore } from '@/stores/bookingStore'
import { useAuthStore } from '@/stores/authStore'
import { useBusiness } from '@/hooks/useBusiness'
import { createBooking } from '@/lib/api/bookings'
import { ApiError } from '@/lib/api/types'
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

    try {
      if (!bookingStore.selectedBusiness || !bookingStore.selectedDate || !bookingStore.selectedSlot) {
        throw new Error('Missing booking data')
      }

      const startsAt = bookingStore.selectedSlot.id
        ?? `${bookingStore.selectedDate}T${bookingStore.selectedSlot.start}:00`

      // Create a separate booking for each selected service
      // All services start at the same time (different masters work in parallel)
      const services = bookingStore.selectedServices
      if (services.length === 0) {
        throw new Error('No services selected')
      }

      const results = await Promise.allSettled(
        services.map((svc) =>
          createBooking({
            businessId: bookingStore.selectedBusiness!.id,
            masterId: svc.masterId!,
            serviceId: svc.service.id,
            startsAt,
            clientPhone: effectivePhone,
            clientName,
            notes: notes || undefined,
          })
        )
      );

      // Check for failures
      const failures = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];
      if (failures.length > 0) {
        const err = failures[0].reason;
        throw err instanceof Error ? err : new Error('Ошибка при создании одной из записей');
      }

      setBookedCount(services.length)
      setSuccessState(true)
      bookingStore.reset()

      setTimeout(() => {
        navigate('/my-bookings')
      }, 2000)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Ошибка при создании записи'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!hasValidData()) {
    return null
  }

  // Store the count before reset (for success message)
  const [bookedCount, setBookedCount] = useState(0)

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
        <button className={styles.backButton} onClick={() => navigate(-1)} disabled={isLoading}>
          ←
        </button>
        <h1 className={styles.title}>Подтверждение записи</h1>
      </div>

      <div className={styles.content}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Данные записи</h2>
          <div className={styles.summaryCard}>
            <div className={styles.summaryHeader}>
              <div>
                <h3 className={styles.businessName}>{bookingStore.selectedBusiness?.name}</h3>
                {servicesToShow.length > 1 && (
                  <p className={styles.serviceCount}>{servicesToShow.length} услуги</p>
                )}
                {servicesToShow.map((item) => (
                  <p key={item.service.id} className={styles.serviceName}>
                    {item.service.name}
                    {item.masterId && bookingStore.selectedBusiness && (
                      <span className={styles.serviceMaster}>
                        {' '}(мастер: {masters?.find(m => m.id === item.masterId)?.name || '—'})
                      </span>
                    )}
                  </p>
                ))}
              </div>
              <div className={styles.priceTag}>{totalPrice.toLocaleString('ru')} сўм</div>
            </div>

            <div className={styles.detailsGrid}>
              {servicesToShow.length === 1 && servicesToShow[0].masterId && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Мастер</span>
                  <span className={styles.detailValue}>
                    {masters?.find(m => m.id === servicesToShow[0].masterId)?.name || '—'}
                  </span>
                </div>
              )}
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Дата</span>
                <span className={styles.detailValue}>{formatDate(bookingStore.selectedDate!)}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Время</span>
                <span className={styles.detailValue}>{bookingStore.selectedSlot?.start}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Длительность</span>
                <span className={styles.detailValue}>~{totalDuration} мин</span>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Ваши данные</h2>
          <div className={styles.formGroup}>
            <label className={styles.label}>Имя</label>
            <input
              type="text"
              className={styles.input}
              placeholder="Введите ваше имя"
              value={clientName}
              onChange={(e) => setClientName(stripDigits(e.target.value))}
              disabled={isLoading}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Номер телефона</label>
            <input
              type="tel"
              className={styles.input}
              placeholder="+998 XX XXX-XX-XX"
              value={clientPhone}
              onChange={(e) => setClientPhone(formatPhoneMask(e.target.value))}
              disabled={isLoading || authStore.isAuthenticated}
            />
          </div>
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
