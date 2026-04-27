/**
 * ProviderDetailPage — Unified provider profile (business salon OR individual master).
 *
 * provider_type === 'business'   → salon with multiple specialists:
 *   services → pick master per service → date → time → confirm
 *
 * provider_type === 'individual' → freelance master (single specialist):
 *   services → auto-select the only master (UI hidden) → date → time → confirm
 */

import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useState, useMemo, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Skeleton, EmptyState, Badge, Rating } from '@/shared/ui'
import {
  ServiceCard,
  ReviewCard,
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
import { createBooking, createBookingBatch } from '@/lib/api/bookings'
import { syncBookingToMerchant } from '@/lib/syncBookingToMerchant'
import { CATEGORY_LABELS } from '@/lib/api/types'
import type { Master, TimeSlot } from '@/lib/api/types'
import { getMockBusinessImage, getMockMasterImage } from '@/lib/utils/mockImages'
import { PhotoSwipe, FavoriteButton, InstagramGallery } from '@/components/features'
import GalleryModal from '@/components/features/GalleryModal/GalleryModal'
import type { GalleryPhoto } from '@/components/features/GalleryModal/GalleryModal'
import { PORTFOLIO_IMAGES } from '@/lib/utils/mockImages'
import { heroCoverUrl, cardAvatarUrl } from '@/lib/utils/imageUrl'
import { formatPhoneMask, isPhoneComplete, stripDigits, getCleanPhone } from '@/lib/utils/phone'
import { fetchBusinessReviews } from '@/lib/api/reviews'
import { formatMasterName } from '@/lib/utils/name'
import { toLocalYMD, formatRelativeDate } from '@/lib/utils/date'
import styles from './ProviderDetailPage.module.css'

const TAB_KEYS = ['provider.tabServices', 'provider.tabMasters', 'provider.tabReviews', 'provider.tabAbout']

interface ReviewItem {
  id: string
  name: string
  rating: number
  comment?: string
  date: string
}

function formatDate(dateStr: string): string {
  try {
    return formatRelativeDate(dateStr)
  } catch {
    return dateStr
  }
}

export default function ProviderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [activeTab, setActiveTab] = useState(0)
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [activeServiceCat, setActiveServiceCat] = useState<string | null>(null)
  const [serviceSearch, setServiceSearch] = useState('')
  const [masterFilter, setMasterFilter] = useState<string | null>(null)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryPhotos, setGalleryPhotos] = useState<GalleryPhoto[]>([])
  const [galleryTab, setGalleryTab] = useState<'salon' | 'portfolio'>('salon')

  // Swipe-back gesture refs
  const swipeStartX = useRef(0)
  const swipeStartY = useRef(0)

  // Booking flow state
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)
  const servicesRef = useRef<HTMLDivElement>(null)
  const timeSlotsRef = useRef<HTMLDivElement>(null)
  const dateRef = useRef<HTMLDivElement>(null)
  const confirmationRef = useRef<HTMLDivElement>(null)

  const authStore = useAuthStore()

  // Pre-fill client info from auth store or Telegram
  const [clientName, setClientName] = useState(() =>
    authStore.name || (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.first_name || ''
  )
  const [clientPhone, setClientPhone] = useState('')

  useEffect(() => {
    if (authStore.isAuthenticated) {
      if (authStore.phone && !clientPhone) setClientPhone(authStore.phone)
    }
  }, [])

  // Use clientPhone (pre-filled from authStore on mount, but always editable)
  const effectivePhone = getCleanPhone(clientPhone)

  const location = useLocation();
  const { business, masters, services, isLoading, error } = useBusiness(id)

  const selectedServices = useBookingStore((s) => s.selectedServices)
  const toggleService = useBookingStore((s) => s.toggleService)
  const assignMasterToService = useBookingStore((s) => s.assignMasterToService)
  const setMaster = useBookingStore((s) => s.setMaster)
  const setBusiness = useBookingStore((s) => s.setBusiness)

  // ── Provider type flag ──────────────────────────────────────────
  const isIndividual = business?.provider_type === 'individual'
  const soloMaster = useMemo(
    () => (isIndividual && masters.length === 1 ? masters[0] : null),
    [isIndividual, masters]
  )

  // Обработка deep link параметров (highlight service/master)
  useEffect(() => {
    const state = location.state as any;
    if (state?.fromDeepLink && state.highlightService) {
      const serviceToHighlight = services?.find(s => s.id === state.highlightService);
      if (serviceToHighlight && !selectedServices.find(s => s.service.id === serviceToHighlight.id)) {
        toggleService(serviceToHighlight);
        if (soloMaster) {
          assignMasterToService(serviceToHighlight.id, soloMaster.id);
        } else if (masters.length === 1) {
          assignMasterToService(serviceToHighlight.id, masters[0].id);
        }
      }
    }
    if (state?.fromDeepLink && state.highlightMaster) {
      setMasterFilter(state.highlightMaster);
      setTimeout(() => {
        servicesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    }
  }, [location.state, services, masters, soloMaster]);

  // Compute activeMasterId BEFORE useSlots call
  const activeMasterId = selectedServices.find(s => s.masterId !== null)?.masterId ?? undefined
  // Pass first selected service's ID so backend uses correct service duration for slot generation
  const activeServiceId = selectedServices.length > 0 ? selectedServices[0].service.id : undefined
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

  // Resolved coords/address via Yandex geocoder (syncs address ↔ coordinates)
  const [resolvedLat, setResolvedLat] = useState<number | null>(null)
  const [resolvedLng, setResolvedLng] = useState<number | null>(null)
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null)

  useEffect(() => {
    if (!business) return
    const hasCoords = business.lat != null && business.lng != null &&
      (business.lat !== 0 || business.lng !== 0)
    const hasAddress = !!business.address?.trim()

    setResolvedLat(hasCoords ? business.lat! : null)
    setResolvedLng(hasCoords ? business.lng! : null)
    setResolvedAddress(hasAddress ? business.address! : null)

    const ymaps = (window as any).ymaps
    if (!ymaps) return

    ymaps.ready(() => {
      if (hasAddress && !hasCoords) {
        ymaps.geocode(`Ташкент, ${business.address}`, { results: 1 })
          .then((res: any) => {
            const obj = res.geoObjects.get(0)
            if (!obj) return
            const [lat, lng] = obj.geometry.getCoordinates()
            setResolvedLat(lat)
            setResolvedLng(lng)
          })
          .catch(() => {})
      } else if (hasCoords && !hasAddress) {
        ymaps.geocode([business.lat!, business.lng!], { results: 1 })
          .then((res: any) => {
            const obj = res.geoObjects.get(0)
            if (!obj) return
            setResolvedAddress(obj.getAddressLine?.() ?? null)
          })
          .catch(() => {})
      }
    })
  }, [business?.id])

  // ── Fetch gallery photos ────────────────────────────────────────
  useEffect(() => {
    if (!id) return
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
    fetch(`${API_BASE}/businesses/${id}/photos`)
      .then(r => r.json())
      .then(res => {
        const raw = res.data ?? []
        if (raw.length > 0) {
          setGalleryPhotos(raw)
        }
      })
      .catch(() => {})
  }, [id])

  // ── Auto-select solo master for individual providers ────────────
  useEffect(() => {
    if (!soloMaster || selectedServices.length === 0) return
    const unassigned = selectedServices.filter(s => s.masterId === null)
    if (unassigned.length > 0) {
      for (const svc of unassigned) {
        assignMasterToService(svc.service.id, soloMaster.id)
      }
    }
  }, [soloMaster?.id, selectedServices.length])

  // Auto-select first master when a NEW service is added (pre-select only)
  useEffect(() => {
    if (masters.length === 0 || soloMaster) return
    const unassigned = selectedServices.filter(s => s.masterId === null)
    if (unassigned.length > 0) {
      const lastUnassigned = unassigned[unassigned.length - 1]
      const assignedMasters = selectedServices.filter(s => s.masterId !== null).map(s => s.masterId)
      const commonMaster = assignedMasters.length > 0
        ? assignedMasters.find((m, _, arr) => arr.every(x => x === m))
        : null
      assignMasterToService(lastUnassigned.service.id, commonMaster ?? masters[0].id)
    }
  }, [selectedServices.length])

  // Intentionally no auto-advance of selected date. The previous implementation
  // jumped the user forward whenever a day had no slots, which made many dates
  // effectively unselectable. We now show a clear empty state and leave the
  // choice to the user.

  // ── CTA flow states ─────────────────────────────────────────────
  const hasServices = selectedServices.length > 0
  const allAssigned = selectedServices.length > 0 && selectedServices.every(s => s.masterId !== null)
  const hasTime = !!selectedSlot
  // For individual providers, allAssigned is always true (auto-assigned)
  const canBook = hasServices && allAssigned && hasTime

  // Compute total booking duration and how many slots it occupies
  const totalServiceDuration = selectedServices.reduce((sum, s) => sum + (s.service.duration_min || 30), 0)
  const slotDuration = business?.slot_duration_min ?? 30
  const slotsOccupied = Math.max(1, Math.ceil(totalServiceDuration / slotDuration))

  const handleServiceToggle = (service: typeof services[0]) => {
    toggleService(service)
    setSelectedSlot(null)
  }

  // Per-service master selection — if chosen master can serve all selected services, lock all to them
  const handleMasterSelectForService = (serviceId: string, masterId: string) => {
    const canDoAll = selectedServices.every(svc =>
      mastersForService(svc.service.id).some(m => m.id === masterId)
    )
    if (canDoAll) {
      selectedServices.forEach(svc => assignMasterToService(svc.service.id, masterId))
    } else {
      assignMasterToService(serviceId, masterId)
    }
    setSelectedSlot(null)
  }

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot)
    setTimeout(() => {
      confirmationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }

  const handleConfirmBooking = async () => {
    // Validate name (no digits)
    if (!clientName.trim()) {
      setBookingError(t('provider.errorName'))
      return
    }
    if (/\d/.test(clientName)) {
      setBookingError(t('provider.errorNameDigits'))
      return
    }
    if (!effectivePhone || effectivePhone.length < 10) {
      setBookingError(t('provider.errorPhone'))
      return
    }
    if (!authStore.isAuthenticated && !isPhoneComplete(clientPhone)) {
      setBookingError(t('provider.errorPhoneFull'))
      return
    }
    if (!business || !selectedSlot) return

    setBookingLoading(true)
    setBookingError(null)

    let bookedList: import('@/lib/api/types').Booking[] = []
    let bookingSuccess = false

    try {
      const startsAt = selectedSlot.id ?? `${selectedDate}T${selectedSlot.start}:00`

      if (selectedServices.length > 1) {
        bookedList = await createBookingBatch({
          businessId: business.id,
          startsAt,
          clientPhone: effectivePhone,
          clientName,
          services: selectedServices.map((svc) => ({
            serviceId: svc.service.id,
            masterId: svc.masterId!,
          })),
        })
      } else {
        const svc = selectedServices[0]
        const booking = await createBooking({
          businessId: business.id,
          masterId: svc.masterId!,
          serviceId: svc.service.id,
          startsAt,
          clientPhone: effectivePhone,
          clientName,
        })
        bookedList = [booking]
      }

      bookingSuccess = true
    } catch (err) {
      const message = err instanceof Error ? err.message : t('provider.errorBookingGeneral')
      setBookingError(message)
      if (/занято|Conflict|409/i.test(message)) {
        setSelectedSlot(null)
        refetchSlots()
      }
      setTimeout(() => {
        confirmationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    } finally {
      setBookingLoading(false)
      if (bookingSuccess) {
        bookedList.forEach((b) => syncBookingToMerchant(b))
        navigate('/my-bookings')
      }
    }
  }

  // CTA click handler — each state anchors to the relevant section
  const handleCTAClick = () => {
    if (canBook) {
      confirmationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      handleConfirmBooking()
      return
    }
    if (hasServices && allAssigned && !selectedDate) {
      dateRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    if (hasServices && allAssigned && !hasTime) {
      timeSlotsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    if (hasServices && !allAssigned) {
      const firstService = document.querySelector('[data-service-id]')
      firstService?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    servicesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleDateSelect = (date: string) => {
    setSelectedDate(date)
    setSelectedSlot(null)
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
    return hours ? `${hours.open}–${hours.close}` : null
  }, [business])

  // Unique service categories (ordered by first appearance)
  const serviceCategories = useMemo(() => {
    const seen = new Set<string>()
    const cats: string[] = []
    for (const s of services) {
      const cat = s.category?.trim()
      if (cat && !seen.has(cat)) { seen.add(cat); cats.push(cat) }
    }
    return cats
  }, [services])

  // Filter services by master filter, category, and search
  const filteredServices = useMemo(() => {
    let result = services
    if (masterFilter) {
      const masterSvcIds = new Set(
        masters.find(m => m.id === masterFilter)
          ?.master_services?.map(ms => ms.service_id) ?? []
      )
      if (masterSvcIds.size > 0) {
        result = result.filter(s => masterSvcIds.has(s.id))
      }
    }
    if (activeServiceCat) result = result.filter(s => s.category?.trim() === activeServiceCat)
    if (serviceSearch.trim()) {
      const q = serviceSearch.toLowerCase()
      result = result.filter(s => s.name.toLowerCase().includes(q))
    }
    return result
  }, [services, masterFilter, activeServiceCat, serviceSearch, masters])

  // Filter masters available for a given service (falls back to all if no M2M defined)
  const mastersForService = (serviceId: string): Master[] => {
    const assigned = masters.filter(m =>
      m.master_services && m.master_services.length > 0 &&
      m.master_services.some(ms => ms.service_id === serviceId)
    )
    return assigned.length > 0 ? assigned : masters
  }

  // ── Hero image ──────────────────────────────────────────────────
  // For individual: show master photo; for business: use uploaded photo_url, fall back to mock
  const coverPhotos = useMemo(() => {
    if (!business) return []
    const seen = new Set<string>()
    const result: string[] = []
    for (const p of [business.photo_url, ...(business.photo_urls ?? [])]) {
      if (p && !seen.has(p)) { seen.add(p); result.push(heroCoverUrl(p)) }
    }
    if (result.length === 0) {
      const mock = getMockBusinessImage(business.category, business.id)
      if (mock) result.push(mock) // mocks are local, no transform needed
    }
    return result
  }, [business])
  const soloMasterPhoto = soloMaster
    ? (soloMaster.photo_url ? cardAvatarUrl(soloMaster.photo_url) : getMockMasterImage(soloMaster.id))
    : null
  const soloMasterPhotos = soloMasterPhoto ? [soloMasterPhoto] : []

  const tabs = TAB_KEYS.map(k => t(k))

  // ── Error state ─────────────────────────────────────────────────
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
          <h2 className={styles.errorTitle}>{t('provider.loadFailed')}</h2>
          <p className={styles.errorDescription}>{t('provider.loadFailedDesc')}</p>
          <div className={styles.errorActions}>
            <button className={styles.errorPrimaryBtn} onClick={() => navigate('/')}>{t('provider.goHome')}</button>
            <button className={styles.errorSecondaryBtn} onClick={() => navigate(-1)}>{t('common.back')}</button>
          </div>
        </div>
      </div>
    )
  }

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div
      className={styles.page}
      onTouchStart={(e) => {
        swipeStartX.current = e.touches[0].clientX
        swipeStartY.current = e.touches[0].clientY
      }}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - swipeStartX.current
        const dy = Math.abs(e.changedTouches[0].clientY - swipeStartY.current)
        if (dx > 80 && dy < 60) navigate(-1)
      }}
    >
      {/* Hero: business cover OR individual master photo */}
      <div
        className={styles.coverWrap}
        onClick={() => {
          if (!isLoading && !isIndividual) {
            const hasGallery = galleryPhotos.length > 0
            if (!hasGallery) {
              // synthesize mock photos so gallery can open
              const mockSalon = coverPhotos.map((url, i) => ({
                id: `mock-salon-${i}`,
                url,
                type: 'salon' as const,
                master_id: null,
              }))
              const mockPortfolio = PORTFOLIO_IMAGES.map((url, i) => ({
                id: `mock-portfolio-${i}`,
                url,
                type: 'portfolio' as const,
                master_id: masters[i % Math.max(masters.length, 1)]?.id ?? null,
              }))
              setGalleryPhotos([...mockSalon, ...mockPortfolio])
            }
            setGalleryTab('salon')
            setGalleryOpen(true)
          }
        }}
        style={!isLoading && !isIndividual ? { cursor: 'pointer' } : undefined}
      >
        {isLoading ? (
          <div className={styles.coverSkeleton} />
        ) : isIndividual && soloMaster && soloMasterPhotos.length > 0 ? (
          <PhotoSwipe photos={soloMasterPhotos} alt={soloMaster.name} />
        ) : coverPhotos.length > 0 ? (
          <PhotoSwipe photos={coverPhotos} alt={business?.name ?? ''} />
        ) : (
          <div className={styles.coverFallback}>
            {!isLoading && isIndividual && soloMaster && (
              <span>{soloMaster.name.charAt(0)}</span>
            )}
          </div>
        )}
        {/* Gallery hint badge */}
        {!isLoading && !isIndividual && (
          <div className={styles.galleryHint}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2.2" />
              <circle cx="8.5" cy="10.5" r="1.5" fill="currentColor" />
              <path d="M3 16L7 12L11 16L15 11L21 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Смотреть все
          </div>
        )}
      </div>

      {/* Gallery modal */}
      {galleryOpen && (
        <GalleryModal
          photos={galleryPhotos}
          masters={masters}
          initialTab={galleryTab}
          onClose={() => setGalleryOpen(false)}
        />
      )}

      {/* Info block */}
      {!isLoading && business && (
        <div className={`${styles.infoBlock} contentReveal`}>
          <div className={styles.infoHeader}>
            <div className={styles.infoTitleWrap}>
              <h1 className={styles.infoTitle}>
                {isIndividual && soloMaster
                  ? formatMasterName(soloMaster.name)
                  : business.name}
              </h1>
              <div className={styles.infoRatingRow}>
                {(business.rating != null && Number(business.rating) > 0) ? (
                  <span className={styles.infoRatingValue}>
                    {Number(business.rating).toFixed(1)}
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                      <path d="M7 0L8.63 4.79L13.64 5.46L10 8.97L10.88 13.96L7 11.42L3.12 13.96L4 8.97L0.36 5.46L5.37 4.79L7 0Z" fill="#6BCEFF" />
                    </svg>
                  </span>
                ) : (
                  <span className={styles.infoRatingNew}>{t('common.new')}</span>
                )}
                {(business.rating != null && Number(business.rating) > 0) && (
                  <span className={styles.infoRatingCount}> · {t('common.reviews', { count: (business as any).review_count ?? 0 })}</span>
                )}
                <span className={styles.infoDot}> · </span>
                {!isIndividual && business.category && (
                  <span className={styles.infoCategory}>{CATEGORY_LABELS[business.category]}</span>
                )}
                {isIndividual && soloMaster?.specialization && (
                  <span className={styles.infoCategory}>{soloMaster.specialization}</span>
                )}
              </div>
            </div>
            <div className={styles.infoActions}>
              {id && <FavoriteButton businessId={id} />}
              <button
                className={styles.shareBtn}
                aria-label="Поделиться"
                onClick={() => {
                  const url = window.location.href
                  const title = isIndividual && soloMaster ? soloMaster.name : (business?.name ?? '')
                  if (navigator.share) {
                    navigator.share({ title, url }).catch(() => {})
                  } else {
                    navigator.clipboard?.writeText(url).catch(() => {})
                  }
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
              </button>
            </div>
          </div>
          {(business.address || resolvedAddress) && (
            <div className={styles.infoAddress}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 0C4.24 0 2 2.24 2 5C2 8.5 7 14 7 14S12 8.5 12 5C12 2.24 9.76 0 7 0ZM7 7C5.9 7 5 6.1 5 5C5 3.9 5.9 3 7 3C8.1 3 9 3.9 9 5C9 6.1 8.1 7 7 7Z" fill="#6B7280" />
              </svg>
              <span>{resolvedAddress ?? business.address}</span>
              <button className={styles.showOnMapBtn} onClick={() => {
                const lat = resolvedLat ?? business.lat ?? 0
                const lng = resolvedLng ?? business.lng ?? 0
                window.open(`https://yandex.com/maps/?pt=${lng},${lat}&z=16&l=map`, '_blank')
              }}>
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <path d="M7 0C3.13 0 0 3.13 0 7C0 12.25 7 14 7 14S14 12.25 14 7C14 3.13 10.87 0 7 0ZM7 9.5C5.62 9.5 4.5 8.38 4.5 7C4.5 5.62 5.62 4.5 7 4.5C8.38 4.5 9.5 5.62 9.5 7C9.5 8.38 8.38 9.5 7 9.5Z" fill="currentColor"/>
                </svg>
                {t('provider.showOnMap')}
              </button>
            </div>
          )}
          {todayHours && (
            <div className={styles.infoHours}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" stroke="#6B7280" strokeWidth="1.4" />
                <path d="M7 3.5V7L9.5 9" stroke="#6B7280" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              <span>{t('provider.workingToday', { hours: todayHours })}</span>
            </div>
          )}
          {isIndividual && soloMaster?.bio && (
            <p className={styles.masterBio}>{soloMaster.bio}</p>
          )}
        </div>
      )}

      {/* Tabs (chips) */}
      <div className={styles.chipRow}>
        {tabs.map((tab, i) => (
          <Chip key={tab} label={tab} active={activeTab === i} onClick={() => setActiveTab(i)} />
        ))}
      </div>

      {/* Content area */}
      <div className={styles.content}>
        {/* ── Services tab ──────────────────────────────────────── */}
        {activeTab === 0 && (
          <>
            {/* Services list */}
            <section className={styles.section} ref={servicesRef}>
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle}>{t('provider.sectionServices')}</h2>
              </div>

              {/* Active master filter indicator — set from Мастера tab */}
              {masterFilter && (
                <div className={styles.masterActiveFilterBar}>
                  <span>{t('provider.masterFilter', { name: formatMasterName(masters.find(m => m.id === masterFilter)?.name ?? '') })}</span>
                  <button className={styles.masterActiveFilterClear} onClick={() => setMasterFilter(null)}>✕</button>
                </div>
              )}

              {/* L2 category filter — underline tabs */}
              {!isLoading && serviceCategories.length > 1 && (
                <div className={styles.serviceCatFilter}>
                  <button
                    className={`${styles.serviceCatTab} ${activeServiceCat === null ? styles.serviceCatTabActive : ''}`}
                    onClick={() => setActiveServiceCat(null)}
                  >
                    {t('provider.allCategories')}
                  </button>
                  {serviceCategories.map(cat => (
                    <button
                      key={cat}
                      className={`${styles.serviceCatTab} ${activeServiceCat === cat ? styles.serviceCatTabActive : ''}`}
                      onClick={() => setActiveServiceCat(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              {/* Search — shown when > 6 services */}
              {!isLoading && services.length > 6 && (
                <div className={styles.serviceSearchWrap}>
                  <input
                    className={styles.serviceSearchInput}
                    placeholder={t('provider.searchService')}
                    value={serviceSearch}
                    onChange={e => setServiceSearch(e.target.value)}
                  />
                  {serviceSearch && (
                    <button className={styles.serviceSearchClear} onClick={() => setServiceSearch('')}>✕</button>
                  )}
                </div>
              )}

              {isLoading ? (
                <div className={styles.skeletonList}>
                  {[1, 2, 3].map(i => <Skeleton key={i} variant="rect" height={80} />)}
                </div>
              ) : filteredServices.length > 0 ? (
                <div className={`${styles.serviceList} contentReveal`}>
                  {filteredServices.map((service) => {
                    const isSelected = selectedServices.some((s) => s.service.id === service.id)
                    const svcAssignment = selectedServices.find(s => s.service.id === service.id)
                    const assignedMasterId = svcAssignment?.masterId
                    const eligibleMasters = mastersForService(service.id)
                    return (
                      <div key={service.id} data-service-id={service.id}>
                        <ServiceCard
                          service={service}
                          selected={isSelected}
                          onSelect={handleServiceToggle}
                        />
                        {isSelected && eligibleMasters.length > 1 && (
                          <div className={styles.masterChipRow}>
                            {eligibleMasters.map((master) => (
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
              ) : services.length === 0 ? (
                <EmptyState title={t('provider.servicesNotAdded')} compact />
              ) : (
                <EmptyState title={t('provider.servicesNotFound')} compact />
              )}
            </section>

            {/* Date & Time — visible when ANY service is selected */}
            {hasServices && (
              <div ref={timeSlotsRef}>
                <section className={styles.section} ref={dateRef}>
                  <h2 className={styles.sectionTitle}>{t('provider.selectDate')}</h2>
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
                  <h2 className={styles.sectionTitle}>{t('provider.selectTime')}</h2>
                  {!activeMasterId ? (
                    <EmptyState
                      title={t('provider.selectMaster')}
                      description={t('provider.selectMasterDesc')}
                      compact
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
                      title={t('provider.noSlots')}
                      description={t('provider.noSlotsDesc')}
                      compact
                    />
                  )}
                </section>
              </div>
            )}

            {/* Confirmation */}
            {canBook && (
              <div ref={confirmationRef} className={styles.confirmationSection}>
                <h2 className={styles.confirmationTitle}>{t('provider.confirmation')}</h2>

                {/* Unified summary card with inputs */}
                <div className={styles.confirmationSummary}>
                  {/* Business name + count */}
                  <div>
                    <div className={styles.confirmationBusiness}>{business?.name}</div>
                    <div className={styles.confirmationCount}>
                      {selectedServices.length} {selectedServices.length === 1 ? 'услуга' : 'услуги'}
                    </div>
                  </div>

                  {/* Master groups */}
                  {(() => {
                    const mGroups = new Map<string, { name: string; specialization: string; services: typeof selectedServices }>()
                    for (const item of selectedServices) {
                      const mid = item.masterId || '_'
                      const master = isIndividual && soloMaster
                        ? soloMaster
                        : masters.find(m => m.id === item.masterId)
                      const mName = master?.name ? formatMasterName(master.name) : '—'
                      const mSpec = master?.specialization || ''
                      if (!mGroups.has(mid)) mGroups.set(mid, { name: mName, specialization: mSpec, services: [] })
                      mGroups.get(mid)!.services.push(item)
                    }
                    const fmtDur = (min: number) => min >= 60 ? `${Math.floor(min / 60)} час` : `${min} мин`
                    return (
                      <div className={styles.confirmationMasterList}>
                        {Array.from(mGroups.values()).map((mg, mi) => (
                          <div key={mi} className={styles.confirmationMasterGroup}>
                            <div className={styles.confirmationMasterHeader}>
                              <span className={styles.confirmationMasterName}>{mg.name}</span>
                              {mg.specialization && (
                                <span className={styles.confirmationSpecBadge}>{mg.specialization}</span>
                              )}
                            </div>
                            {mg.services.map((item) => {
                              const dur = item.service.duration_min
                              return (
                                <div key={item.service.id} className={styles.confirmationServiceRow}>
                                  <span className={styles.confirmationServiceName}>
                                    {item.service.name}{dur ? ` ~ ${fmtDur(dur)}` : ''}
                                  </span>
                                  <span className={styles.confirmationServicePrice}>
                                    {item.service.price.toLocaleString('ru')} {t('common.currency')}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        ))}
                      </div>
                    )
                  })()}

                  {/* Date + time */}
                  <div className={styles.confirmationDateTime}>
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} • {selectedSlot?.start}
                  </div>

                  {/* Total */}
                  <div className={styles.confirmationTotalValue}>
                    {selectedServices.reduce((sum, s) => sum + s.service.price, 0).toLocaleString('ru')} {t('common.currency')}
                  </div>

                  {/* Input fields */}
                  <div className={styles.confirmationInputs}>
                    <input
                      className={styles.confirmationInput}
                      placeholder={t('provider.yourName')}
                      value={clientName}
                      onChange={(e) => setClientName(stripDigits(e.target.value))}
                      disabled={bookingLoading}
                    />
                    <input
                      className={styles.confirmationInput}
                      placeholder="+998 XX XXX-XX-XX"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(formatPhoneMask(e.target.value))}
                      type="tel"
                      disabled={bookingLoading || authStore.isAuthenticated}
                    />
                  </div>
                </div>

                {bookingError && <div className={styles.confirmationError}>{bookingError}</div>}
              </div>
            )}

          </>
        )}

        {/* ── Мастера tab (index 1) ────────────────────────────── */}
        {activeTab === 1 && (
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>{t('provider.sectionSpecialists')}</h2>
            </div>
            {isLoading ? (
              <div className={styles.skeletonList}>
                {[1, 2].map(i => <Skeleton key={i} variant="rect" height={80} />)}
              </div>
            ) : masters.length > 0 ? (
              <div className={styles.mastersList}>
                {masters.map(master => (
                  <div key={master.id} className={styles.masterRow}>
                    <div className={styles.masterRowPhoto}>
                      {master.photo_url
                        ? <img src={cardAvatarUrl(master.photo_url)} alt={master.name} />
                        : <span className={styles.masterRowPhotoFallback}>{master.name.charAt(0)}</span>
                      }
                    </div>
                    <div className={styles.masterRowInfo}>
                      <span className={styles.masterRowName}>{formatMasterName(master.name)}</span>
                      {master.specialization && (
                        <span className={styles.masterRowSpec}>{master.specialization}</span>
                      )}
                      {master.rating > 0 && (
                        <span className={styles.masterRowRating}>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M6 0.5L7.545 3.63L11 4.135L8.5 6.57L9.09 10.01L6 8.385L2.91 10.01L3.5 6.57L1 4.135L4.455 3.63L6 0.5Z" fill="#6BCEFF" />
                          </svg>
                          {master.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <button
                      className={styles.masterRowBtn}
                      onClick={() => { setMasterFilter(master.id); setActiveTab(0) }}
                    >
                      {t('provider.services_btn')}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title={t('provider.mastersNotFound')} description={t('provider.mastersNotAdded')} compact />
            )}
          </section>
        )}

        {/* ── Отзывы tab (index 2) ─────────────────────────────── */}
        {activeTab === 2 && (
          <section className={`${styles.section} ${styles.reviewsSection}`}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>{t('provider.sectionReviews')}</h2>
            </div>
            {reviewsLoading ? (
              <div className={styles.skeletonList}>
                {[1, 2].map(i => <Skeleton key={i} variant="rect" height={100} />)}
              </div>
            ) : reviews.length > 0 ? (
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
            ) : (
              <EmptyState title={t('provider.noReviews')} description={t('provider.noReviewsDesc')} compact />
            )}
          </section>
        )}

        {/* ── О нас tab (index 3) ──────────────────────────────── */}
        {activeTab === 3 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{t('provider.sectionAbout')}</h2>
            <p className={styles.aboutText}>
              {business?.description ?? t('provider.aboutFallback')}
            </p>

            <div className={styles.infoCardsRow}>
              {todayHours && (
                <InfoCard
                  icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="#6BCEFF" strokeWidth="1.5" /><path d="M10 5V10L13 13" stroke="#6BCEFF" strokeWidth="1.5" strokeLinecap="round" /></svg>}
                  label={t('provider.workingUntil')}
                  value={todayHours.split('-')[1]?.trim()}
                />
              )}
              <InfoCard
                icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="#6BCEFF" strokeWidth="1.5" /><path d="M7 10L9 12L13 8" stroke="#6BCEFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                label={t('provider.availability')}
                value={t('common.online')}
              />
            </div>

            {business?.instagram && (
              <InstagramGallery
                username={business.instagram}
                postUrls={business.instagram_post_urls}
              />
            )}

            <div className={styles.section}>
              <ContactInfo
                phone={business?.phone}
                instagram={business?.instagram}
                telegramUsername={business?.telegram_username}
              />
            </div>
          </section>
        )}
      </div>

      {/* Sticky CTA */}
      <StickyCTA
        label={
          bookingLoading
            ? t('provider.ctaSending')
            : canBook
              ? t('provider.ctaBook')
              : hasServices && allAssigned && !hasTime
                ? t('provider.ctaSelectTime')
                : hasServices && allAssigned && !selectedDate
                  ? t('provider.ctaSelectDate')
                  : hasServices && !allAssigned
                    ? t('provider.ctaSelectMaster')
                    : t('provider.ctaSelectService')
        }
        onClick={handleCTAClick}
        disabled={bookingLoading}
      />
    </div>
  )
}
