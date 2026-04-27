import { useState, useEffect } from 'react'
import { ProLayout } from '@/pro/components/ProLayout/ProLayout'
import { useMerchantStore } from '@/pro/stores/merchantStore'
import { api } from '@/lib/api/client'
import type { Master } from '@/lib/api/types'
import styles from './GalleryPage.module.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'

interface Photo {
  id: string
  url: string
  type: 'salon' | 'portfolio'
  master_id: string | null
  position: number
}

interface AddPhotoForm {
  url: string
  type: 'salon' | 'portfolio'
  master_id: string
}

const INITIAL_FORM: AddPhotoForm = { url: '', type: 'salon', master_id: '' }

export default function GalleryPage() {
  const { merchantId } = useMerchantStore()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [masters, setMasters] = useState<Master[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<AddPhotoForm>(INITIAL_FORM)
  const [showForm, setShowForm] = useState<'salon' | 'portfolio' | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (!merchantId) return
    Promise.all([
      api.get<Photo[]>(`${API_BASE}/businesses/${merchantId}/photos`),
      api.get<Master[]>(`${API_BASE}/businesses/${merchantId}/masters`),
    ])
      .then(([ph, ms]) => {
        setPhotos(Array.isArray(ph) ? ph : [])
        setMasters(Array.isArray(ms) ? ms : [])
      })
      .catch(() => setError('Не удалось загрузить галерею'))
      .finally(() => setLoading(false))
  }, [merchantId])

  const salonPhotos = photos.filter(p => p.type === 'salon')
  const portfolioPhotos = photos.filter(p => p.type === 'portfolio')

  const handleShowForm = (type: 'salon' | 'portfolio') => {
    setForm({ ...INITIAL_FORM, type })
    setShowForm(type)
    setError(null)
  }

  const handleAdd = async () => {
    if (!merchantId || !form.url.trim()) {
      setError('Введите URL фотографии')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const body: Record<string, unknown> = {
        url: form.url.trim(),
        type: form.type,
        position: photos.filter(p => p.type === form.type).length,
      }
      if (form.type === 'portfolio' && form.master_id) {
        body.master_id = form.master_id
      }
      const added = await api.post<Photo>(`${API_BASE}/businesses/${merchantId}/photos`, body)
      setPhotos(prev => [...prev, added])
      setForm(INITIAL_FORM)
      setShowForm(null)
    } catch {
      setError('Не удалось добавить фото. Проверьте URL и попробуйте снова.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!merchantId) return
    const tg = window.Telegram?.WebApp
    const confirmed = tg
      ? await new Promise<boolean>(resolve => tg.showConfirm('Удалить фото?', resolve))
      : window.confirm('Удалить фото?')
    if (!confirmed) return
    setDeletingId(id)
    try {
      await api.delete(`${API_BASE}/businesses/${merchantId}/photos/${id}`)
      setPhotos(prev => prev.filter(p => p.id !== id))
    } catch {
      setError('Не удалось удалить фото')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <ProLayout title="Галерея">
      <div className={styles.page}>
        {error && <p className={styles.error}>{error}</p>}

        {loading ? (
          <div className={styles.loadingGrid}>
            {[1, 2, 3, 4].map(i => <div key={i} className={styles.skeleton} />)}
          </div>
        ) : (
          <>
            {/* ── Salon section ── */}
            <section className={styles.section}>
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle}>Салон</h2>
                <span className={styles.sectionCount}>{salonPhotos.length} фото</span>
              </div>
              <p className={styles.sectionHint}>Фотографии интерьера и атмосферы салона</p>

              <div className={styles.grid}>
                {salonPhotos.map(p => (
                  <div key={p.id} className={styles.gridItem}>
                    <img src={p.url} alt="" className={styles.gridImg} />
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDelete(p.id)}
                      disabled={deletingId === p.id}
                      aria-label="Удалить"
                    >
                      {deletingId === p.id ? '...' : '✕'}
                    </button>
                  </div>
                ))}
                <button
                  className={styles.addCell}
                  onClick={() => handleShowForm('salon')}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              {showForm === 'salon' && (
                <div className={styles.form}>
                  <input
                    className={styles.input}
                    placeholder="URL фотографии (https://...)"
                    value={form.url}
                    onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                    autoFocus
                  />
                  <div className={styles.formActions}>
                    <button
                      className={styles.cancelBtn}
                      onClick={() => setShowForm(null)}
                    >
                      Отмена
                    </button>
                    <button
                      className={styles.saveBtn}
                      onClick={handleAdd}
                      disabled={saving || !form.url.trim()}
                    >
                      {saving ? 'Добавление...' : 'Добавить'}
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* ── Portfolio section ── */}
            <section className={styles.section}>
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle}>Портфолио</h2>
                <span className={styles.sectionCount}>{portfolioPhotos.length} фото</span>
              </div>
              <p className={styles.sectionHint}>Работы мастеров — фото до/после и готовых результатов</p>

              {masters.length > 0 && (
                <div className={styles.masterLegend}>
                  {masters.map(m => (
                    <span key={m.id} className={styles.masterTag}>
                      {m.name.split(' ')[0]}
                      <span className={styles.masterTagCount}>
                        {portfolioPhotos.filter(p => p.master_id === m.id).length}
                      </span>
                    </span>
                  ))}
                </div>
              )}

              <div className={styles.grid}>
                {portfolioPhotos.map(p => {
                  const master = masters.find(m => m.id === p.master_id)
                  return (
                    <div key={p.id} className={styles.gridItem}>
                      <img src={p.url} alt="" className={styles.gridImg} />
                      {master && (
                        <span className={styles.masterBadge}>
                          {master.name.split(' ')[0]}
                        </span>
                      )}
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleDelete(p.id)}
                        disabled={deletingId === p.id}
                        aria-label="Удалить"
                      >
                        {deletingId === p.id ? '...' : '✕'}
                      </button>
                    </div>
                  )
                })}
                <button
                  className={styles.addCell}
                  onClick={() => handleShowForm('portfolio')}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              {showForm === 'portfolio' && (
                <div className={styles.form}>
                  <input
                    className={styles.input}
                    placeholder="URL фотографии (https://...)"
                    value={form.url}
                    onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                    autoFocus
                  />
                  {masters.length > 0 && (
                    <select
                      className={styles.select}
                      value={form.master_id}
                      onChange={e => setForm(f => ({ ...f, master_id: e.target.value }))}
                    >
                      <option value="">Мастер (не указан)</option>
                      {masters.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  )}
                  <div className={styles.formActions}>
                    <button
                      className={styles.cancelBtn}
                      onClick={() => setShowForm(null)}
                    >
                      Отмена
                    </button>
                    <button
                      className={styles.saveBtn}
                      onClick={handleAdd}
                      disabled={saving || !form.url.trim()}
                    >
                      {saving ? 'Добавление...' : 'Добавить'}
                    </button>
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </ProLayout>
  )
}
