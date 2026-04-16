import { useEffect, useState } from 'react';
import { ProLayout } from '@/pro/components/ProLayout/ProLayout';
import { useMerchantStore } from '@/pro/stores/merchantStore';
import { listServices, upsertService, deleteService } from '@/pro/api';
import type { ServiceInput } from '@/pro/api';
import type { Service } from '@/lib/api/types';
import { emit } from '@/pro/realtime';
import styles from './ServicesPage.module.css';

const EMPTY: ServiceInput = { name: '', price: 0, duration_min: 30, category: 'other' };

export default function ServicesPage() {
  const { merchantId } = useMerchantStore();
  const [services, setServices] = useState<Service[]>([]);
  const [editing, setEditing] = useState<ServiceInput | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    if (!merchantId) return;
    listServices(merchantId).then(setServices).catch(() => {});
  };

  useEffect(load, [merchantId]);

  const handleSave = async () => {
    if (!merchantId || !editing) return;
    setSaving(true);
    try {
      await upsertService(merchantId, editing);
      emit({ type: 'service.changed', merchantId });
      setEditing(null);
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!merchantId) return;
    await deleteService(merchantId, id);
    emit({ type: 'service.changed', merchantId });
    load();
  };

  const actions = (
    <button className={styles.addBtn} onClick={() => setEditing({ ...EMPTY })}>
      +
    </button>
  );

  return (
    <ProLayout title="Услуги" actions={actions}>
      {editing && (
        <div className={styles.form}>
          <input
            className={styles.input}
            placeholder="Название"
            value={editing.name}
            onChange={(e) => setEditing({ ...editing, name: e.target.value })}
          />
          <div className={styles.row}>
            <input
              className={styles.input}
              type="number"
              placeholder="Цена"
              value={editing.price || ''}
              onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })}
            />
            <input
              className={styles.input}
              type="number"
              placeholder="Мин."
              value={editing.duration_min || ''}
              onChange={(e) => setEditing({ ...editing, duration_min: Number(e.target.value) })}
            />
          </div>
          <div className={styles.formActions}>
            <button className={styles.cancelBtn} onClick={() => setEditing(null)}>
              Отмена
            </button>
            <button className={styles.saveBtn} onClick={handleSave} disabled={saving || !editing.name}>
              {saving ? '…' : 'Сохранить'}
            </button>
          </div>
        </div>
      )}

      <div className={styles.list}>
        {services.map((s) => (
          <div key={s.id} className={styles.card}>
            <div className={styles.cardMain}>
              <span className={styles.cardName}>{s.name}</span>
              <span className={styles.cardMeta}>{s.duration_min} мин · {s.price} ₽</span>
            </div>
            <div className={styles.cardActions}>
              <button
                className={styles.editBtn}
                onClick={() => setEditing({ ...s })}
              >
                ✎
              </button>
              <button
                className={styles.deleteBtn}
                onClick={() => handleDelete(s.id)}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </ProLayout>
  );
}
