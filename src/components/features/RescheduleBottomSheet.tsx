import { useState, useEffect, useRef } from 'react'
import { BottomSheet } from '@/shared/ui'
import { useSlots } from '@/hooks/useSlots'
import { useOverlayStore } from '@/stores/overlayStore'
import { TimeSlot } from '@/lib/api/types'
import styles from './RescheduleBottomSheet.module.css'

interface RescheduleBottomSheetProps {
  open: boolean
  onClose: () => void
  businessId: string
  masterId: string
  currentStartsAt: string
  onConfirm: (newStartsAt: string, newMasterId: string) => void
  loading?: boolean
}

export default function RescheduleBottomSheet({
  open,
  onClose,
  businessId,
  masterId,
  currentStartsAt,
  onConfirm,
  loading = false,
  serviceDurationMin,
}: RescheduleBottomSheetProps & { serviceDurationMin?: number }) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [selectedMasterId, setSelectedMasterId] = useState(masterId)
  const contentRef = useRef<HTMLDivElement>(null)
  const timeSlotsRef = useRef<HTMLDivElement>(null)
  const mountedRef = useRef(true)
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { open: openOverlay, close: closeOverlay } = useOverlayStore()

  // Track mount status for cleanup
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current)
      }
    }
  }, [])

  const { slots, isLoading: slotsLoading } = useSlots(businessId, selectedMasterId, selectedDate ?? undefined)

  // Compute how many slots the booking occupies
  const slotDuration = 30 // default slot step
  const slotsOccupied = serviceDurationMin
    ? Math.max(1, Math.ceil(serviceDurationMin / slotDuration))
    : 1

  // Reset state when sheet opens
  useEffect(() => {
    if (open) {
      setSelectedDate(null)
      setSelectedSlot(null)
      setSelectedMasterId(masterId)
      openOverlay()
    } else {
      closeOverlay()
    }
    return () => {
      // Ensure overlay is closed when component unmounts or sheet closes
      closeOverlay()
    }
  }, [open, masterId, openOverlay, closeOverlay])

  // Wrap onClose to ensure overlay is always closed
  const handleClose = () => {
    closeOverlay()
    onClose()
  }

  const handleDateSelect = (date: string) => {
    setSelectedDate(date)
    setSelectedSlot(null)
    // Auto-scroll to time slots after date selection (with cleanup)
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current)
    scrollTimerRef.current = setTimeout(() => {
      if (mountedRef.current) {
        timeSlotsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 100)
  }

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot)
  }

  const handleConfirm = () => {
    if (!selectedDate || !selectedSlot) return
    const startsAt = selectedSlot.id ?? `${selectedDate}T${selectedSlot.start}:00`
    onConfirm(startsAt, selectedMasterId)
  }

  const canConfirm = !!selectedDate && !!selectedSlot && !loading

  // Context-aware button label
  const confirmLabel = loading ? 'Перенос...'
    : canConfirm ? 'Перенести запись'
    : selectedDate ? 'Выберите время'
    : 'Выберите дату'

  return (
    <BottomSheet open={open} onClose={handleClose} title="Перенести запись">
      <div className={styles.sheetBody}>
        {/* Scrollable content */}
        <div ref={contentRef} className={styles.content}>
          {/* Current booking info */}
          <div className={styles.currentInfo}>
            <span className={styles.currentLabel}>Текущая запись:</span>
            <span className={styles.currentValue}>
              {new Date(currentStartsAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
              {' '}в{' '}
              {new Date(currentStartsAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Date picker */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Выберите дату</h3>
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
          </div>

          {/* Time slots */}
          <div ref={timeSlotsRef} className={styles.section}>
            <h3 className={styles.sectionTitle}>Выберите время</h3>
            {slotsLoading ? (
              <div className={styles.slotsSkeleton}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className={styles.slotPlaceholder} />
                ))}
              </div>
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
            ) : selectedDate ? (
              <p className={styles.emptyText}>Нет свободного времени. Выберите другую дату.</p>
            ) : (
              <p className={styles.emptyText}>Выберите дату для отображения времени</p>
            )}
          </div>
        </div>

        {/* Sticky confirm button */}
        <div className={styles.stickyFooter}>
          <button
            className={`${styles.confirmBtn} ${!canConfirm ? styles.confirmBtnDisabled : ''}`}
            onClick={canConfirm ? handleConfirm : undefined}
            disabled={!canConfirm || loading}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}
