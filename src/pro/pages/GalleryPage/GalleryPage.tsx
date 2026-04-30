import { useState, useEffect, useRef } from 'react'
import { ProLayout } from '@/pro/components/ProLayout/ProLayout'
import { useMerchantStore } from '@/pro/stores/merchantStore'
import { api } from '@/lib/api/client'
import { galleryThumbUrl } from '@/lib/utils/imageUrl'
import type { Master } from '@/lib/api/types'
import styles from './GalleryPage.module.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
const MAX_FILE_MB = 10

interface Photo {
  id: string
  url: string
  type: 'salon' | 'portfolio'
  master_id: string | null
  position: number
}

interface UploadState {
  preview: string
  file: File
  type: 'salon' | 'portfolio'
  master_id: string
}

export default function GalleryPage() {
  const { merchantId } = useMerchantStore()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [masters, setMasters] = useState<Master[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [upload, setUpload] = useState<UploadState | null>(null)
  const [uploading, setUploading] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])

  const salonInputRef = useRef<HTMLInputElement>(null)
  const portfolioInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!merchantId) return
    Promise.all([
      api.get<Photo[]>(`/businesses/${merchantId}/photos`),
      api.get<Master[]>(`/businesses/${merchantId}/masters`),
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

  const handleFileSelect = (type: 'salon' | 'portfolio') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    e.target.value = ''

    const oversized = files.find(f => f.size > MAX_FILE_MB * 1024 * 1024)
    if (oversized) {
      setError(`Файл слишком большой. Максимум ${MAX_FILE_MB} МБ`)
      return
    }
    setError(null)
    // Show preview for first file; rest queued via pendingFiles
    const file = files[0]
    const preview = URL.createObjectURL(file)
    setPendingFiles(files.slice(1))
    setUpload({ preview, file, type, master_id: '' })
  }

  const handleUploadConfirm = async () => {
    if (!merchantId || !upload) return
    setUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('image', upload.file)
      fd.append('type', upload.type)
      if (upload.master_id) fd.append('master_id', upload.master_id)

      const token = localStorage.getItem('yookie_auth_token')
      const res = await fetch(`${API_BASE}/businesses/${merchantId}/photos`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error((json as { message?: string }).message || 'Ошибка загрузки')
      }

      const json = await res.json() as { data: Photo }
      setPhotos(prev => [...prev, json.data])
      URL.revokeObjectURL(upload.preview)

      // If there are more files queued, open next one automatically
      if (pendingFiles.length > 0) {
        const [next, ...rest] = pendingFiles
        setPendingFiles(rest)
        setUpload({ preview: URL.createObjectURL(next), file: next, type: upload.type, master_id: upload.master_id })
      } else {
        setUpload(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить фото')
    } finally {
      setUploading(false)
    }
  }

  const handleUploadCancel = () => {
    if (upload) URL.revokeObjectURL(upload.preview)
    pendingFiles.forEach(f => URL.revokeObjectURL(URL.createObjectURL(f)))
    setPendingFiles([])
    setUpload(null)
    setError(null)
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
      await api.delete(`/businesses/${merchantId}/photos/${id}`)
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

        {/* ── Upload preview modal ── */}
        {upload && (
          <div className={styles.uploadModal}>
            <div className={styles.uploadCard}>
              <img src={upload.preview} alt="" className={styles.uploadPreview} />
              <div className={styles.uploadMeta}>
                <p className={styles.uploadLabel}>
                  {upload.type === 'salon' ? 'Фото салона' : 'Портфолио'}
                  {pendingFiles.length > 0 && <span style={{ color: 'var(--color-text-muted)', marginLeft: 6 }}>+{pendingFiles.length} ещё</span>}
                </p>
                {upload.type === 'portfolio' && masters.length > 0 && (
                  <select
                    className={styles.uploadSelect}
                    value={upload.master_id}
                    onChange={e => setUpload(u => u ? { ...u, master_id: e.target.value } : u)}
                  >
                    <option value="">Мастер (не указан)</option>
                    {masters.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className={styles.uploadActions}>
                <button className={styles.cancelBtn} onClick={handleUploadCancel} disabled={uploading}>
                  Отмена
                </button>
                <button className={styles.saveBtn} onClick={handleUploadConfirm} disabled={uploading}>
                  {uploading ? (
                    <span className={styles.uploadSpinner} />
                  ) : 'Загрузить'}
                </button>
              </div>
              {uploading && <p className={styles.uploadHint}>Сжатие и загрузка...</p>}
            </div>
          </div>
        )}

        {loading ? (
          <div className={styles.loadingGrid}>
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className={styles.skeleton} />)}
          </div>
        ) : (
          <>
            {/* ── Salon section ── */}
            <section className={styles.section}>
              <div className={styles.sectionHead}>
                <div>
                  <h2 className={styles.sectionTitle}>Салон</h2>
                  <p className={styles.sectionHint}>Интерьер и атмосфера</p>
                </div>
                <span className={styles.sectionCount}>{salonPhotos.length} фото</span>
              </div>

              <div className={styles.grid}>
                {salonPhotos.map(p => (
                  <div key={p.id} className={styles.gridItem}>
                    <img src={galleryThumbUrl(p.url)} alt="" className={styles.gridImg} />
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDelete(p.id)}
                      disabled={deletingId === p.id}
                    >
                      {deletingId === p.id ? '…' : '✕'}
                    </button>
                  </div>
                ))}
                <button className={styles.addCell} onClick={() => salonInputRef.current?.click()}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <span>Добавить</span>
                </button>
              </div>
              <input
                ref={salonInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic"
                multiple
                className={styles.hiddenInput}
                onChange={handleFileSelect('salon')}
              />
            </section>

            {/* ── Portfolio section ── */}
            <section className={styles.section}>
              <div className={styles.sectionHead}>
                <div>
                  <h2 className={styles.sectionTitle}>Портфолио</h2>
                  <p className={styles.sectionHint}>Работы мастеров — фото результатов</p>
                </div>
                <span className={styles.sectionCount}>{portfolioPhotos.length} фото</span>
              </div>

              {masters.length > 0 && portfolioPhotos.length > 0 && (
                <div className={styles.masterLegend}>
                  {masters.map(m => {
                    const cnt = portfolioPhotos.filter(p => p.master_id === m.id).length
                    if (cnt === 0) return null
                    return (
                      <span key={m.id} className={styles.masterTag}>
                        {m.name.split(' ')[0]}
                        <span className={styles.masterTagCount}>{cnt}</span>
                      </span>
                    )
                  })}
                </div>
              )}

              <div className={styles.grid}>
                {portfolioPhotos.map(p => {
                  const master = masters.find(m => m.id === p.master_id)
                  return (
                    <div key={p.id} className={styles.gridItem}>
                      <img src={galleryThumbUrl(p.url)} alt="" className={styles.gridImg} />
                      {master && (
                        <span className={styles.masterBadge}>{master.name.split(' ')[0]}</span>
                      )}
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleDelete(p.id)}
                        disabled={deletingId === p.id}
                      >
                        {deletingId === p.id ? '…' : '✕'}
                      </button>
                    </div>
                  )
                })}
                <button className={styles.addCell} onClick={() => portfolioInputRef.current?.click()}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <span>Добавить</span>
                </button>
              </div>
              <input
                ref={portfolioInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic"
                multiple
                className={styles.hiddenInput}
                onChange={handleFileSelect('portfolio')}
              />
            </section>
          </>
        )}
      </div>
    </ProLayout>
  )
}
