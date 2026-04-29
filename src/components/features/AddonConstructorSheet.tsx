import { useState } from 'react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import type { ServiceAddon } from '@/lib/api/types'
import type { AddonSelection } from '@/stores/bookingStore'
import styles from './AddonConstructorSheet.module.css'

interface Props {
  open: boolean
  onClose: () => void
  serviceName: string
  basePrice: number
  baseDuration: number
  addons: ServiceAddon[]
  initial: AddonSelection[]
  onConfirm: (selections: AddonSelection[]) => void
}

export function AddonConstructorSheet({ open, onClose, serviceName, basePrice, baseDuration, addons, initial, onConfirm }: Props) {
  const [qtys, setQtys] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {}
    for (const s of initial) map[s.addonId] = s.qty
    return map
  })

  const totalAddonPrice = addons.reduce((sum, a) => sum + a.price * (qtys[a.id] ?? 0), 0)
  const totalAddonDuration = addons.reduce((sum, a) => sum + a.duration_min * (qtys[a.id] ?? 0), 0)
  const totalPrice = basePrice + totalAddonPrice
  const totalDuration = baseDuration + totalAddonDuration

  const setQty = (addonId: string, delta: number, maxQty: number) => {
    setQtys(prev => {
      const current = prev[addonId] ?? 0
      const next = Math.max(0, Math.min(maxQty, current + delta))
      if (next === 0) {
        const { [addonId]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [addonId]: next }
    })
  }

  const handleConfirm = () => {
    const selections: AddonSelection[] = addons
      .filter(a => (qtys[a.id] ?? 0) > 0)
      .map(a => ({
        addonId: a.id,
        name: a.name,
        qty: qtys[a.id]!,
        price_each: a.price,
        duration_min_each: a.duration_min,
      }))
    onConfirm(selections)
    onClose()
  }

  const fmtPrice = (p: number) => p.toLocaleString('ru')
  const fmtDur = (min: number) => min >= 60 ? `${Math.floor(min / 60)} ч ${min % 60 > 0 ? `${min % 60} мин` : ''}`.trim() : `${min} мин`

  return (
    <BottomSheet open={open} onClose={onClose} title={serviceName}>
      <div className={styles.wrap}>
        <div className={styles.baseRow}>
          <span className={styles.baseLabel}>Базовая услуга</span>
          <span className={styles.baseMeta}>{fmtDur(baseDuration)} · {fmtPrice(basePrice)} сум</span>
        </div>

        <p className={styles.hint}>Выберите дополнения</p>

        <div className={styles.list}>
          {addons.map(addon => {
            const qty = qtys[addon.id] ?? 0
            const isSelected = qty > 0
            return (
              <div key={addon.id} className={`${styles.addonRow} ${isSelected ? styles.addonRowActive : ''}`}>
                <div className={styles.addonInfo}>
                  <span className={styles.addonName}>{addon.name}</span>
                  <span className={styles.addonMeta}>
                    {addon.duration_min > 0 ? `+${addon.duration_min} мин · ` : ''}
                    {fmtPrice(addon.price)} сум
                    {addon.max_qty > 1 ? ' / шт' : ''}
                  </span>
                </div>
                {addon.max_qty > 1 ? (
                  <div className={styles.stepper}>
                    <button
                      className={styles.stepBtn}
                      onClick={() => setQty(addon.id, -1, addon.max_qty)}
                      disabled={qty === 0}
                    >−</button>
                    <span className={styles.stepVal}>{qty}</span>
                    <button
                      className={styles.stepBtn}
                      onClick={() => setQty(addon.id, +1, addon.max_qty)}
                      disabled={qty >= addon.max_qty}
                    >+</button>
                  </div>
                ) : (
                  <button
                    className={`${styles.checkBtn} ${isSelected ? styles.checkBtnOn : ''}`}
                    onClick={() => setQty(addon.id, isSelected ? -1 : +1, addon.max_qty)}
                  >
                    {isSelected ? '✓' : '+'}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        <div className={styles.summary}>
          <div className={styles.summaryRow}>
            <span>Итого</span>
            <span className={styles.summaryTotal}>{fmtPrice(totalPrice)} сум</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Длительность</span>
            <span>{fmtDur(totalDuration)}</span>
          </div>
        </div>

        <button className={styles.confirmBtn} onClick={handleConfirm}>
          Добавить в запись
        </button>
      </div>
    </BottomSheet>
  )
}
