import { useState } from 'react';
import { ProLayout } from '@/pro/components/ProLayout/ProLayout';
import styles from './MerchantSettingsPage.module.css';

/**
 * Merchant public profile editor.
 *
 * Changes here update the Business record that B2C displays (name, address,
 * description, photos, contacts). MVP scope: text fields only, photos later.
 *
 * When backend is wired: POST /merchants/:id/profile → updates `businesses` table.
 */
export default function MerchantSettingsPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // TODO: wire to api.post(`/merchants/${id}/profile`, { name, description, address, phone })
    await new Promise((r) => setTimeout(r, 400));
    setSaving(false);
  };

  return (
    <ProLayout title="Профиль">
      <div className={styles.form}>
        <label className={styles.label}>
          <span className={styles.labelText}>Название</span>
          <input className={styles.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Студия красоты…" />
        </label>
        <label className={styles.label}>
          <span className={styles.labelText}>Описание</span>
          <textarea className={styles.textarea} value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Несколько слов о заведении…" />
        </label>
        <label className={styles.label}>
          <span className={styles.labelText}>Адрес</span>
          <input className={styles.input} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="ул. Примерная, 1" />
        </label>
        <label className={styles.label}>
          <span className={styles.labelText}>Телефон</span>
          <input className={styles.input} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7…" />
        </label>
      </div>

      <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
        {saving ? 'Сохранение…' : 'Сохранить'}
      </button>
    </ProLayout>
  );
}
