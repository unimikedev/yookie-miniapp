import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProLayout } from '@/pro/components/ProLayout/ProLayout';
import { useMerchantStore } from '@/pro/stores/merchantStore';
import { api } from '@/lib/api/client';
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

export default function MerchantSettingsPage() {
  const navigate = useNavigate();
  const { merchantId, setMerchantId } = useMerchantStore();
  const isNew = !merchantId;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState<CategoryEnum>('other');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing business data
  useEffect(() => {
    if (!merchantId) return;
    api.get<{ data: Business }>(`/businesses/${merchantId}`)
      .then((res) => {
        const b = res.data;
        if (b) {
          setName(b.name || '');
          setDescription(b.description || '');
          setAddress(b.address || '');
          setCity(b.city || '');
          setPhone(b.phone || '');
          setCategory(b.category || 'other');
        }
      })
      .catch(() => { /* ignore — new business */ });
  }, [merchantId]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Введите название');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (isNew) {
        // Create new business
        const res = await api.post<{ data: Business }>('/businesses', {
          name: name.trim(),
          category,
          description: description.trim() || undefined,
          address: address.trim() || undefined,
          city: city.trim() || undefined,
          phone: phone.trim() || undefined,
        });
        const newBiz = res.data;
        setMerchantId(newBiz.id);
        navigate('/pro');
      } else {
        // Update existing
        await api.patch<{ data: Business }>(`/businesses/${merchantId}`, {
          name: name.trim(),
          category,
          description: description.trim() || undefined,
          address: address.trim() || undefined,
          city: city.trim() || undefined,
          phone: phone.trim() || undefined,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  // When creating (no merchantId), render without ProLayout's auth guard wrapper
  // since ProLayout shows onboarding when merchantId is null.
  // The settings page is linked from the onboarding screen.
  const content = (
    <>
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
          <input
            className={styles.input}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ташкент"
          />
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

      <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
        {saving ? 'Сохранение…' : isNew ? 'Создать бизнес' : 'Сохранить'}
      </button>
    </>
  );

  return (
    <ProLayout title={isNew ? 'Новый бизнес' : 'Профиль'} allowWithoutBusiness={isNew}>
      {content}
    </ProLayout>
  );
}
