import { useEffect, useState } from 'react';
import { ProLayout } from '@/pro/components/ProLayout/ProLayout';
import { useMerchantStore } from '@/pro/stores/merchantStore';
import { listStaff, upsertStaff, deleteStaff } from '@/pro/api';
import type { StaffInput } from '@/pro/api';
import type { Master } from '@/lib/api/types';
import { emit } from '@/pro/realtime';
import styles from './StaffPage.module.css';

const EMPTY: StaffInput = { name: '', specialization: '' };

export default function StaffPage() {
  const { merchantId } = useMerchantStore();
  const [staff, setStaff] = useState<Master[]>([]);
  const [editing, setEditing] = useState<StaffInput | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    if (!merchantId) return;
    listStaff(merchantId).then(setStaff).catch(() => {});
  };

  useEffect(load, [merchantId]);

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
            <div className={styles.avatar}>{s.name[0]}</div>
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
