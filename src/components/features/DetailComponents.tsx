/**
 * Detail Page shared components — modern dark theme minimalism
 * ServiceCard, ReviewCard, SpecialistCard, Chip, InfoCard, StickyCTA, ContactInfo
 */

import React from 'react'
import type { Service, Master } from '@/lib/api/types'
import { getMockMasterImage } from '@/lib/utils/mockImages'
import { formatMasterName } from '@/lib/utils/name'
import styles from './DetailComponents.module.css'

/* ── Chip (active/inactive pill for tabs) ──────────────────── */

export interface ChipProps {
  label: string
  active?: boolean
  onClick?: () => void
}

export function Chip({ label, active, onClick }: ChipProps) {
  return (
    <button
      className={`${styles.chip} ${active ? styles.chipActive : ''}`}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

/* ── InfoCard (2 in row) ──────────────────────────────────── */

export interface InfoCardProps {
  icon: React.ReactNode
  label: string
  value?: string
}

export function InfoCard({ icon, label, value }: InfoCardProps) {
  return (
    <div className={styles.infoCard}>
      <div className={styles.infoCardIcon}>{icon}</div>
      <div className={styles.infoCardLabel}>{label}</div>
      {value && <div className={styles.infoCardValue}>{value}</div>}
    </div>
  )
}

/* ── ServiceCard (selected / default) ─────────────────────── */

export interface ServiceCardProps {
  service: Service
  selected?: boolean
  onSelect?: (service: Service) => void
}

export function ServiceCard({ service, selected, onSelect }: ServiceCardProps) {
  return (
    <div
      className={`${styles.serviceCard} ${selected ? styles.serviceCardSelected : ''}`}
      onClick={() => onSelect?.(service)}
      role="button"
      tabIndex={0}
    >
      <div className={styles.serviceInfo}>
        <span className={styles.serviceName}>{service.name}</span>
        <span className={styles.servicePrice}>
          {service.price.toLocaleString('ru')} сўм
        </span>
        <span className={styles.serviceMeta}>
          ⏱ {service.duration_min} мин
          {service.description && ` • ${service.description}`}
        </span>
      </div>
      <div className={styles.serviceAction}>
        {selected ? (
          <div className={styles.serviceCheck}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#6BCEFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 8L7 12L13 4" />
            </svg>
          </div>
        ) : (
          <span className={styles.serviceSelectBtn}>Выбрать</span>
        )}
      </div>
    </div>
  )
}

/* ── ReviewCard ────────────────────────────────────────────── */

export interface ReviewCardProps {
  name: string
  rating: number
  date: string
  comment?: string
  avatar?: string
}

export function ReviewCard({ name, rating, date, comment, avatar }: ReviewCardProps) {
  return (
    <div className={styles.reviewCard}>
      <div className={styles.reviewHeader}>
        <div className={styles.reviewAvatar}>
          {avatar ? (
            <img src={avatar} alt={name} className={styles.reviewAvatarImg} />
          ) : (
            <span className={styles.reviewAvatarFallback}>{name.charAt(0)}</span>
          )}
        </div>
        <div className={styles.reviewMeta}>
          <span className={styles.reviewName}>{name}</span>
          <span className={styles.reviewDate}>{date}</span>
        </div>
        <div className={styles.reviewRating}>
          {'★'.repeat(Math.floor(rating))}
          <span className={styles.reviewRatingValue}>{rating.toFixed(1)}</span>
        </div>
      </div>
      {comment && <p className={styles.reviewComment}>{comment}</p>}
    </div>
  )
}

/* ── SpecialistCard ────────────────────────────────────────── */

export interface SpecialistCardProps {
  name: string
  role: string
  rating: number
  photoUrl?: string | null
  onClick?: () => void
}

export function SpecialistCard({ name, role, rating, photoUrl, onClick }: SpecialistCardProps) {
  return (
    <div className={styles.specialistCard} onClick={onClick} role="button" tabIndex={0}>
      <div className={styles.specialistPhotoWrap}>
        {photoUrl ? (
          <img src={photoUrl} alt={name} className={styles.specialistPhoto} />
        ) : (
          <div className={styles.specialistPhotoFallback}>
            <span>{name.charAt(0)}</span>
          </div>
        )}
      </div>
      <div className={styles.specialistInfo}>
        <div className={styles.specialistTop}>
          <span className={styles.specialistName}>{formatMasterName(name)}</span>
          <div className={styles.specialistRating}>
            ★ {rating.toFixed(1)}
          </div>
        </div>
        <span className={styles.specialistRole}>{role}</span>
      </div>
    </div>
  )
}

/* ── MasterChip (small chip for master selection in booking flow) ── */

export interface MasterChipProps {
  master: Master
  selected?: boolean
  onClick?: () => void
}

export function MasterChip({ master, selected, onClick }: MasterChipProps) {
  const photoUrl = master.photo_url ?? getMockMasterImage(master.id)

  return (
    <button
      className={`${styles.masterChip} ${selected ? styles.masterChipSelected : ''}`}
      onClick={onClick}
      type="button"
    >
      <div className={styles.masterChipAvatar}>
        {photoUrl ? (
          <img src={photoUrl} alt={master.name} className={styles.masterChipAvatarImg} />
        ) : (
          <span>{master.name.charAt(0)}</span>
        )}
      </div>
      <div className={styles.masterChipInfo}>
        <span className={styles.masterChipName}>{formatMasterName(master.name)}</span>
        <div className={styles.masterChipRating}>
          <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
            <path d="M7 0L8.63 4.79L13.64 5.46L10 8.97L10.88 13.96L7 11.42L3.12 13.96L4 8.97L0.36 5.46L5.37 4.79L7 0Z" fill="#FBBF24" />
          </svg>
          <span>{Number(master.rating).toFixed(1)}</span>
        </div>
      </div>
      {selected && (
        <div className={styles.masterChipCheck}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#6BCEFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 8L7 12L13 4" />
          </svg>
        </div>
      )}
    </button>
  )
}

/* ── ContactInfo ────────────────────────────────────────────── */

export interface ContactInfoProps {
  phone?: string
  instagram?: string
  telegramUsername?: string
}

export function ContactInfo({ phone, instagram, telegramUsername }: ContactInfoProps) {
  const hasAny = phone || instagram || telegramUsername
  if (!hasAny) return null

  return (
    <div className={styles.contactInfo}>
      <h3 className={styles.contactTitle}>Контакты</h3>
      <div className={styles.contactLinks}>
        {phone && (
          <a href={`tel:${phone}`} className={styles.contactLink} rel="noopener noreferrer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
            </svg>
            <span>{phone}</span>
          </a>
        )}
        {instagram && (
          <a href={`https://instagram.com/${instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className={styles.contactLink}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
            <span>@{instagram.replace('@', '')}</span>
          </a>
        )}
        {telegramUsername && (
          <a href={`https://t.me/${telegramUsername.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className={styles.contactLink}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
            <span>@{telegramUsername.replace('@', '')}</span>
          </a>
        )}
      </div>
    </div>
  )
}

/* ── StickyCTA ─────────────────────────────────────────────── */

export interface StickyCTAProps {
  label: string
  onClick: () => void
  disabled?: boolean
  secondaryLabel?: string
  onSecondaryClick?: () => void
}

export function StickyCTA({ label, onClick, disabled, secondaryLabel, onSecondaryClick }: StickyCTAProps) {
  return (
    <div className={styles.stickyCTA}>
      {secondaryLabel && onSecondaryClick && (
        <button className={styles.stickyCTASecondary} onClick={onSecondaryClick}>
          {secondaryLabel}
        </button>
      )}
      <button
        className={`${styles.stickyCTABtn} ${disabled ? styles.stickyCTADisabled : ''}`}
        onClick={onClick}
        disabled={disabled}
      >
        {label}
      </button>
    </div>
  )
}
