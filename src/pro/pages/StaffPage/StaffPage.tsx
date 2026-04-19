import { useEffect, useRef, useState } from 'react';
import { ProLayout } from '@/pro/components/ProLayout/ProLayout';
import { useMerchantStore } from '@/pro/stores/merchantStore';
import { listStaff, upsertStaff, deleteStaff } from '@/pro/api';
import type { StaffInput } from '@/pro/api';
import type { Master } from '@/lib/api/types';
import { emit } from '@/pro/realtime';
import styles from './StaffPage.module.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
const EMPTY: StaffInput = { name: '', specialization: '' };

export default function StaffPage() {
  const { merchantId } = useMerchantStore();
  const [staff, setStaff] = useState<Master[]>([]);
  const [editing, setEditing] = useState<StaffInput | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);

  const load = () => {
    if (!merchantId) return;
    listStaff(merchantId).then(setStaff).catch(() => {});
  };

  useEffect(load, [merchantId]);

  const uploadPhoto = async (file: File): Promise<string> => {
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
      throw new Error((json as { message?: string }).message || 'Ошибка загрузки фото');
    }
    const json = await res.json() as { url: string };
    return json.url;
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    setUploading(true);
    try {
      const url = await uploadPhoto(file);
      setEditing((prev) => prev ? { ...prev, photo_url: url } : prev);
    } catch {
      // non-critical, skip photo
    } finally {
      setUploading(false);
      if (photoRef.current) photoRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!merchantId || !editing) return;
    setSaving(true);
    try {
      await upsertStaff(merchantId, editing);
      emit({ type: 'staff.changed', merchantId });
      setEditing(null);
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!merchantId) return;
    await deleteStaff(merchantId, id);
    emit({ type: 'staff.changed', merchantId });
    load();
  };

  const actions = (
    <button className={styles.addBtn} onClick={() => setEditing({ ...EMPTY })}>
      +
    </button>
  );

  return (
    <ProLayout title="Сотрудники" actions={actions}>
      {editing && (
        <div className={styles.form}>
          {/* Photo picker */}
          <div className={styles.photoRow}>
            <div
              className={styles.photoPreview}
              onClick={() => photoRef.current?.click()}
              style={editing.photo_url ? { backgroundImage: `url(${editing.photo_url})` } : undefined}
            >
              {!editing.photo_url && (
                <span className={styles.photoPlaceholder}>
                  {uploading ? '…' : '📷'}
                </span>
              )}
            </div>
            <button
              type="button"
              className={styles.photoBtn}
              onClick={() => photoRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? 'Загрузка…' : editing.photo_url ? 'Сменить фото' : 'Добавить фото'}
            </button>
            <input
              ref={photoRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handlePhotoChange}
            />
          </div>

          <input
            className={styles.input}
            placeholder="Имя"
            value={editing.name}
            onChange={(e) => setEditing({ ...editing, name: e.target.value })}
          />
          <input
            className={styles.input}
            placeholder="Специализация"
            value={editing.specialization}
            onChange={(e) => setEditing({ ...editing, specialization: e.target.value })}
          />
          <div className={styles.formActions}>
            <button className={styles.cancelBtn} onClick={() => setEditing(null)}>Отмена</button>
            <button className={styles.saveBtn} onClick={handleSave} disabled={saving || !editing.name}>
              {saving ? '…' : 'Сохранить'}
            </button>
          </div>
        </div>
      )}

      <div className={styles.list}>
        {staff.map((s) => (
          <div key={s.id} className={styles.card}>
            {s.photo_url ? (
              <img src={s.photo_url} className={styles.avatarImg} alt={s.name} />
            ) : (
              <div className={styles.avatar}>{s.name[0]}</div>
            )}
            <div className={styles.info}>
              <span className={styles.name}>{s.name}</span>
              <span className={styles.spec}>{s.specialization}</span>
            </div>
            <div className={styles.actions}>
              <button className={styles.editBtn} onClick={() => setEditing({ ...s })}>✎</button>
              <button className={styles.deleteBtn} onClick={() => handleDelete(s.id)}>✕</button>
            </div>
          </div>
        ))}
      </div>
    </ProLayout>
  );
}
