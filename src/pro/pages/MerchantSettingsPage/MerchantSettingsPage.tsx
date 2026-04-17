import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProLayout } from '@/pro/components/ProLayout/ProLayout';
import { useMerchantStore } from '@/pro/stores/merchantStore';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api/client';
import { UZBEKISTAN_CITIES } from '@/stores/cityStore';
import type { Business, CategoryEnum } from '@/lib/api/types';
import styles from './MerchantSettingsPage.module.css';

const CATEGORIES: { value: CategoryEnum; label: string }[] = [
  { value: 'hair', label: 'Волосы' },
  { value: 'nail', label: 'Ногти' },
  { value: 'brow_lash', label: 'Брови и ресницы' },
  { value: 'makeup', label: 'Макияж' },
  { value: 'spa_massage', label: 'СПА и массаж' },
  { value: 'epilation', label: 'Эпиляция' },
  { value: 'cosmetology', label: 'Косметология' },
  { value: 'barber', label: 'Барбершоп' },
  { value: 'tattoo', label: 'Тату' },
  { value: 'piercing', label: 'Пирсинг' },
  { value: 'yoga', label: 'Йога' },
  { value: 'fitness', label: 'Фитнес' },
  { value: 'other', label: 'Другое' },
];

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export default function MerchantSettingsPage() {
  const navigate = useNavigate();
  const { merchantId, setMerchantId } = useMerchantStore();
  const isNew = !merchantId;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Tashkent');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState<CategoryEnum>('other');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!merchantId) return;
    api.get<{ data: Business }>(`/businesses/${merchantId}`)
      .then((res) => {
        const b = res.data;
        if (b) {
          setName(b.name || '');
          setDescription(b.description || '');
          setAddress(b.address || '');
          // Normalize city: if stored value matches a known city id, use it; else default
          const matched = UZBEKISTAN_CITIES.find(c => c.id === b.city || c.name === b.city);
          setCity(matched?.id ?? 'Tashkent');
          setPhone(b.phone || '');
          setCategory(b.category || 'other');
          setPhotoUrl(b.photo_url ?? null);
        }
      })
      .catch(() => { /* ignore — new business */ });
  }, [merchantId]);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const token = localStorage.getItem('yookie_auth_token');
      const res = await fetch(`${API_BASE}/businesses/upload-image`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error((json as { message?: string }).message || 'Ошибка загрузки');
      }
      const json = await res.json() as { url: string };
      setPhotoUrl(json.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки фото');
    } finally {
      setUploading(false);
      // Reset so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    if (!merchantId) return;
    if (!window.confirm('Удалить заведение? Все данные (услуги, мастера) останутся в системе, но бизнес исчезнет из каталога.')) return;
    setSaving(true);
    setError(null);
    try {
      await api.delete<{ success: boolean }>(`/businesses/${merchantId}`);
      setMerchantId(null);
      // Clear stale JWT businessId
      try {
        const storedUser = JSON.parse(localStorage.getItem('yookie_auth_user') || '{}');
        storedUser.businessId = null;
        localStorage.setItem('yookie_auth_user', JSON.stringify(storedUser));
        useAuthStore.setState((s) => ({ user: s.user ? { ...s.user, businessId: null } : null }));
      } catch { /* noop */ }
      navigate('/pro');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Введите название');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body = {
        name: name.trim(),
        category,
        description: description.trim() || undefined,
        address: address.trim() || undefined,
        city,
        phone: phone.trim() || undefined,
        photo_url: photoUrl || undefined,
      };

      if (isNew) {
        const res = await api.post<{ data: Business; token?: string }>('/businesses', body);
        const newBiz = res.data;

        // Store refreshed JWT so PATCH /businesses/:id works immediately
        if (res.token) {
          try {
            localStorage.setItem('yookie_auth_token', res.token);
            // Sync auth store user's businessId
            const authState = useAuthStore.getState();
            if (authState.user) {
              const updatedUser = { ...authState.user, businessId: newBiz.id };
              localStorage.setItem('yookie_auth_user', JSON.stringify(updatedUser));
              useAuthStore.setState({ user: updatedUser, token: res.token });
            }
          } catch { /* storage unavailable */ }
        }

        setMerchantId(newBiz.id);
        navigate('/pro');
      } else {
        await api.patch<{ data: Business }>(`/businesses/${merchantId}`, body);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProLayout title={isNew ? 'Новый бизнес' : 'Профиль'} allowWithoutBusiness={isNew}>
      {/* Photo upload */}
      <div className={styles.photoSection}>
        <div
          className={styles.photoPreview}
          onClick={() => fileInputRef.current?.click()}
          style={photoUrl ? { backgroundImage: `url(${photoUrl})` } : undefined}
        >
          {!photoUrl && (
            <span className={styles.photoPlaceholder}>
              {uploading ? 'Загрузка…' : '+ Фото'}
            </span>
          )}
          {uploading && <div className={styles.photoOverlay}>Загрузка…</div>}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className={styles.fileInput}
          onChange={handlePhotoSelect}
        />
        {photoUrl && (
          <button
            className={styles.photoRemoveBtn}
            type="button"
            onClick={() => setPhotoUrl(null)}
          >
            Удалить фото
          </button>
        )}
      </div>

      <div className={styles.form}>
        <label className={styles.label}>
          <span className={styles.labelText}>Название *</span>
          <input
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Студия красоты…"
          />
        </label>

        <label className={styles.label}>
          <span className={styles.labelText}>Категория</span>
          <select
            className={styles.input}
            value={category}
            onChange={(e) => setCategory(e.target.value as CategoryEnum)}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </label>

        <label className={styles.label}>
          <span className={styles.labelText}>Описание</span>
          <textarea
            className={styles.textarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Несколько слов о заведении…"
          />
        </label>

        <label className={styles.label}>
          <span className={styles.labelText}>Город</span>
          <select
            className={styles.input}
            value={city}
            onChange={(e) => setCity(e.target.value)}
          >
            {UZBEKISTAN_CITIES.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>

        <label className={styles.label}>
          <span className={styles.labelText}>Адрес</span>
          <input
            className={styles.input}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="ул. Примерная, 1"
          />
        </label>

        <label className={styles.label}>
          <span className={styles.labelText}>Телефон</span>
          <input
            className={styles.input}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+998…"
          />
        </label>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <button className={styles.saveBtn} onClick={handleSave} disabled={saving || uploading}>
        {saving ? 'Сохранение…' : isNew ? 'Создать бизнес' : 'Сохранить'}
      </button>

      {!isNew && (
        <button className={styles.deleteBtn} onClick={handleDelete} disabled={saving}>
          Удалить заведение
        </button>
      )}
    </ProLayout>
  );
}
