/**
 * ServiceMasterStep — assign a master to each selected service.
 * Shows selected services with master dropdowns.
 * All services must have a master assigned before proceeding to date/time.
 */

import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect, useMemo } from 'react'
import { useBusiness } from '@/hooks/useBusiness'
import { useBookingStore } from '@/stores/bookingStore'
import { Skeleton, EmptyState } from '@/shared/ui'
import { formatMasterName } from '@/lib/utils/name'
import styles from './ServiceMasterStep.module.css'

export default function ServiceMasterStep() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { business, masters, isLoading } = useBusiness(id)

  const selectedServices = useBookingStore((s) => s.selectedServices)
  const assignMasterToService = useBookingStore((s) => s.assignMasterToService)
  const clearServices = useBookingStore((s) => s.clearServices)
  const setDate = useBookingStore((s) => s.setDate)
  const setSlot = useBookingStore((s) => s.setSlot)
  const setMaster = useBookingStore((s) => s.setMaster)

  // Redirect if no services selected
  useEffect(() => {
    if (selectedServices.length === 0) {
      navigate(-1)
    }
  }, [])

  const allAssigned = selectedServices.every((s) => s.masterId !== null)
  const totalDuration = selectedServices.reduce((sum, s) => sum + (s.service.duration_min || 30), 0)
  const totalPrice = selectedServices.reduce((sum, s) => sum + (s.service.price || 0), 0)

  // For each service, get masters who can perform it
  const getMastersForService = (serviceId: string) => {
    // If we have master_services data, filter by it.
    // For now, return all masters (the backend will filter by availability later)
    return masters
  }

  const handleContinue = () => {
    if (!allAssigned) return

    // For the booking, we'll use the first service as the primary
    // and the date/time selection will check all masters' availability
    const firstMasterId = selectedServices[0]?.masterId
    if (firstMasterId) {
      const master = masters.find((m) => m.id === firstMasterId)
      if (master) setMaster(master)
    }

    // Reset date/slot since we're going to pick them now
    setDate('')
    setSlot(null)

    // Navigate to booking flow (the bookingStore already has services + masters assigned)
    navigate('/booking')
  }

  if (isLoading) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M13 4L7 10L13 16" stroke="#F9FAFB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span className={styles.headerTitle}>Выберите мастера</span>
          <div style={{ width: 36 }} />
        </header>
        <div className={styles.content}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.skeletonCard}>
              <Skeleton variant="rect" height={80} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (selectedServices.length === 0) return null

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M13 4L7 10L13 16" stroke="#F9FAFB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className={styles.headerTitle}>Выберите мастера</span>
        <div style={{ width: 36 }} />
      </header>

      <div className={styles.content}>
        <p className={styles.hint}>
          Выберите специалиста для каждой услуги. Все услуги будут выполнены в одно время.
        </p>

        {/* Services list with master assignment */}
        <div className={styles.servicesList}>
          {selectedServices.map((item, idx) => {
            const serviceMasters = getMastersForService(item.service.id)
            const assignedMaster = masters.find((m) => m.id === item.masterId)

            return (
              <div key={item.service.id} className={styles.serviceRow}>
                <div className={styles.serviceNumber}>{idx + 1}</div>
                <div className={styles.serviceInfo}>
                  <span className={styles.serviceName}>{item.service.name}</span>
                  <span className={styles.serviceMeta}>
                    {item.service.duration_min} мин • {item.service.price.toLocaleString('ru')} сўм
                  </span>
                </div>
                <select
                  className={`${styles.masterSelect} ${assignedMaster ? styles.masterSelectFilled : ''}`}
                  value={item.masterId || ''}
                  onChange={(e) => assignMasterToService(item.service.id, e.target.value)}
                >
                  <option value="" disabled>Мастер</option>
                  {serviceMasters.map((m) => (
                    <option key={m.id} value={m.id}>{formatMasterName(m.name)}</option>
                  ))}
                </select>
              </div>
            )
          })}
        </div>

        {/* Summary */}
        <div className={styles.summary}>
          <div className={styles.summaryRow}>
            <span>Услуг</span>
            <span>{selectedServices.length}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Общая длительность</span>
            <span>~{totalDuration} мин</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Итого</span>
            <span className={styles.totalPrice}>{totalPrice.toLocaleString('ru')} сўм</span>
          </div>
        </div>

        {/* Continue button */}
        <button
          className={`${styles.continueBtn} ${!allAssigned ? styles.continueBtnDisabled : ''}`}
          onClick={handleContinue}
          disabled={!allAssigned}
        >
          {allAssigned ? 'Продолжить' : 'Выберите мастеров для всех услуг'}
        </button>
      </div>
    </div>
  )
}
