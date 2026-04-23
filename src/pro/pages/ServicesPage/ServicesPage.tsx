import { useEffect, useState, useMemo, useCallback } from 'react';
import { ProLayout } from '@/pro/components/ProLayout/ProLayout';
import { useMerchantStore } from '@/pro/stores/merchantStore';
import { listServices, listStaff, upsertService, deleteService, updateMasterServices } from '@/pro/api';
import type { ServiceInput } from '@/pro/api';
import type { Master, Service } from '@/lib/api/types';
import { emit } from '@/pro/realtime';
import styles from './ServicesPage.module.css';

const CATEGORY_SUGGESTIONS = [
  'Стрижки', 'Окрашивание', 'Уход за волосами', 'Укладка',
  'Маникюр', 'Педикюр', 'Брови', 'Ресницы', 'Макияж',
  'Массаж', 'Эпиляция', 'Уход за лицом', 'Другое',
];

const EMPTY: ServiceInput = { name: '', price: 0, duration_min: 30, category: '' };

export default function ServicesPage() {
  const { merchantId } = useMerchantStore();
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Master[]>([]);
  const [editing, setEditing] = useState<ServiceInput | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null);
  const [masterAssigning, setMasterAssigning] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!merchantId) return;
    listServices(merchantId).then(setServices).catch(() => {});
    listStaff(merchantId).then(setStaff).catch(() => {});
  }, [merchantId]);

  useEffect(() => { load(); }, [load]);

  const categories = useMemo(() => {
    const seen = new Set<string>();
    const cats: string[] = [];
    for (const s of services) {
      const cat = s.category?.trim();
      if (cat && !seen.has(cat)) { seen.add(cat); cats.push(cat); }
    }
    return cats;
  }, [services]);

  // masterId → Set of assigned serviceIds
  const masterServiceMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const m of staff) {
      map.set(m.id, new Set((m.master_services ?? []).map(ms => ms.service_id)));
    }
    return map;
  }, [staff]);

  const filtered = useMemo(() => {
    let result = services;
    if (activeCategory) result = result.filter(s => s.category?.trim() === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(s => s.name.toLowerCase().includes(q));
    }
    return result;
  }, [services, activeCategory, search]);

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

  const handleToggleMaster = async (serviceId: string, masterId: string) => {
    if (!merchantId) return;
    const current = new Set(masterServiceMap.get(masterId) ?? []);
    if (current.has(serviceId)) current.delete(serviceId);
    else current.add(serviceId);
    setMasterAssigning(masterId);
    try {
      await updateMasterServices(merchantId, masterId, [...current]);
      load();
    } finally {
      setMasterAssigning(null);
    }
  };

  const actions = (
    <button className={styles.addBtn} onClick={() => setEditing({ ...EMPTY })}>+</button>
  );

  return (
    <ProLayout title="Услуги" actions={actions}>
      {/* Category filter — L2 underline tabs */}
      {categories.length > 1 && (
        <div className={styles.catFilter}>
          <button
            className={`${styles.catTab} ${activeCategory === null ? styles.catTabActive : ''}`}
            onClick={() => setActiveCategory(null)}
          >
            Все
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              className={`${styles.catTab} ${activeCategory === cat ? styles.catTabActive : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Search — only when > 6 services */}
      {services.length > 6 && (
        <div className={styles.searchWrap}>
          <input
            className={styles.searchInput}
            placeholder="Поиск услуги…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className={styles.searchClear} onClick={() => setSearch('')}>✕</button>
          )}
        </div>
      )}

      {/* Editing form */}
      {editing && (
        <div className={styles.form}>
          <input
            className={styles.input}
            placeholder="Название *"
            value={editing.name}
            onChange={e => setEditing({ ...editing, name: e.target.value })}
          />
          <input
            className={styles.input}
            list="svc-categories"
            placeholder="Категория"
            value={editing.category ?? ''}
            onChange={e => setEditing({ ...editing, category: e.target.value })}
          />
          <datalist id="svc-categories">
            {CATEGORY_SUGGESTIONS.map(c => <option key={c} value={c} />)}
          </datalist>
          <textarea
            className={styles.input}
            placeholder="Описание (необязательно)"
            rows={2}
            value={editing.description ?? ''}
            onChange={e => setEditing({ ...editing, description: e.target.value })}
            style={{ resize: 'none' }}
          />
          <div className={styles.row}>
            <input
              className={styles.input}
              type="number"
              placeholder="Цена (сўм)"
              value={editing.price || ''}
              onChange={e => setEditing({ ...editing, price: Number(e.target.value) })}
            />
            <input
              className={styles.input}
              type="number"
              placeholder="Мин."
              value={editing.duration_min || ''}
              onChange={e => setEditing({ ...editing, duration_min: Number(e.target.value) })}
            />
          </div>
          <div className={styles.formActions}>
            <button className={styles.cancelBtn} onClick={() => setEditing(null)}>Отмена</button>
            <button className={styles.saveBtn} onClick={handleSave} disabled={saving || !editing.name}>
              {saving ? '…' : 'Сохранить'}
            </button>
          </div>
        </div>
      )}

      <div className={styles.list}>
        {filtered.length === 0 && (
          <p className={styles.empty}>
            {search ? 'Ничего не найдено' : services.length === 0 ? 'Нет услуг — нажмите + чтобы добавить' : 'Нет услуг в этой категории'}
          </p>
        )}
        {filtered.map(s => {
          const isExpanded = expandedServiceId === s.id;
          return (
            <div key={s.id} className={styles.cardWrap}>
              <div className={styles.card}>
                <div className={styles.cardMain}>
                  <div className={styles.cardTop}>
                    <span className={styles.cardName}>{s.name}</span>
                    {s.category?.trim() && (
                      <span className={styles.cardCat}>{s.category}</span>
                    )}
                  </div>
                  <span className={styles.cardMeta}>{s.duration_min} мин · {s.price.toLocaleString('ru')} сўм</span>
                </div>
                <div className={styles.cardActions}>
                  {staff.length > 0 && (
                    <button
                      className={`${styles.mastersBtn} ${isExpanded ? styles.mastersBtnActive : ''}`}
                      onClick={() => setExpandedServiceId(isExpanded ? null : s.id)}
                      title="Назначить мастеров"
                    >
                      👤
                    </button>
                  )}
                  <button className={styles.editBtn} onClick={() => setEditing({ ...s })}>✎</button>
                  <button className={styles.deleteBtn} onClick={() => handleDelete(s.id)}>✕</button>
                </div>
              </div>

              {isExpanded && (
                <div className={styles.masterAssign}>
                  <p className={styles.masterAssignTitle}>Кто оказывает эту услугу</p>
                  <div className={styles.masterAssignList}>
                    {staff.map(m => {
                      const isOn = masterServiceMap.get(m.id)?.has(s.id) ?? false;
                      const isLoading = masterAssigning === m.id;
                      return (
                        <button
                          key={m.id}
                          className={`${styles.masterAssignChip} ${isOn ? styles.masterAssignChipOn : ''}`}
                          onClick={() => handleToggleMaster(s.id, m.id)}
                          disabled={isLoading}
                        >
                          <span className={styles.masterAssignCheck}>{isOn ? '✓' : '+'}</span>
                          {m.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ProLayout>
  );
}
