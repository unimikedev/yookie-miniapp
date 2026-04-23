import { useEffect, useState, useMemo, useCallback } from 'react';
import { ProLayout } from '@/pro/components/ProLayout/ProLayout';
import { useMerchantStore } from '@/pro/stores/merchantStore';
import { listServices, listStaff, upsertService, deleteService, updateMasterServices, reorderService } from '@/pro/api';
import type { ServiceInput } from '@/pro/api';
import type { Master, Service } from '@/lib/api/types';
import { emit } from '@/pro/realtime';
import { Toast } from '@/components/ui/Toast';
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
  const [saveError, setSaveError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null);
  const [masterAssigning, setMasterAssigning] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; key: number } | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const showToast = (msg: string) => setToast({ msg, key: Date.now() });

  const load = useCallback(() => {
    if (!merchantId) return;
    listServices(merchantId)
      .then(list => setServices([...list].sort((a, b) => a.position - b.position)))
      .catch(() => {});
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

  // Drag reorder only when showing the full unfiltered list
  const canDrag = !activeCategory && !search.trim();

  const handleSave = async () => {
    if (!merchantId || !editing) return;
    setSaving(true);
    setSaveError(null);
    try {
      await upsertService(merchantId, editing);
      const msg = editing.id ? 'Услуга обновлена' : 'Услуга добавлена';
      setEditing(null);
      emit({ type: 'service.changed', merchantId });
      load();
      showToast(msg);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!merchantId) return;
    try {
      await deleteService(merchantId, id);
      emit({ type: 'service.changed', merchantId });
      load();
      showToast('Услуга удалена');
    } catch {
      showToast('Не удалось удалить');
    }
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

  const handleCardDrop = (targetId: string) => {
    const fromId = dragId;
    setDragId(null);
    setDragOverId(null);
    if (!fromId || fromId === targetId || !merchantId) return;

    const list = [...services];
    const fromIdx = list.findIndex(s => s.id === fromId);
    const toIdx   = list.findIndex(s => s.id === targetId);
    if (fromIdx < 0 || toIdx < 0) return;

    const [item] = list.splice(fromIdx, 1);
    list.splice(toIdx, 0, item);
    setServices(list);
    list.forEach((s, idx) => reorderService(merchantId, s.id, idx));
  };

  const openAdd = () => { setEditing({ ...EMPTY }); setSaveError(null); };

  const actions = <button className={styles.addBtn} onClick={openAdd}>+</button>;

  return (
    <ProLayout title="Услуги" actions={actions}>
      {/* Category filter — L2 underline tabs */}
      {categories.length > 1 && (
        <div className={styles.catFilter}>
          <button
            className={`${styles.catTab} ${activeCategory === null ? styles.catTabActive : ''}`}
            onClick={() => setActiveCategory(null)}
          >Все</button>
          {categories.map(cat => (
            <button
              key={cat}
              className={`${styles.catTab} ${activeCategory === cat ? styles.catTabActive : ''}`}
              onClick={() => setActiveCategory(cat)}
            >{cat}</button>
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
          {search && <button className={styles.searchClear} onClick={() => setSearch('')}>✕</button>}
        </div>
      )}

      {/* Editing / add form */}
      {editing && (
        <div className={styles.form}>
          <input
            className={styles.input}
            placeholder="Название *"
            value={editing.name}
            onChange={e => setEditing({ ...editing, name: e.target.value })}
            autoFocus
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
          {saveError && <p className={styles.formError}>{saveError}</p>}
          <div className={styles.formActions}>
            <button className={styles.cancelBtn} onClick={() => { setEditing(null); setSaveError(null); }}>Отмена</button>
            <button className={styles.saveBtn} onClick={handleSave} disabled={saving || !editing.name.trim()}>
              {saving ? '…' : 'Сохранить'}
            </button>
          </div>
        </div>
      )}

      <div className={styles.list}>
        {/* Empty state */}
        {services.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>✂️</span>
            <p className={styles.emptyTitle}>Нет услуг</p>
            <p className={styles.emptyText}>Добавьте первую услугу — она появится в профиле и будет доступна для записи</p>
            <button className={styles.emptyAddBtn} onClick={openAdd}>+ Добавить услугу</button>
          </div>
        ) : filtered.length === 0 ? (
          <p className={styles.empty}>
            {search ? 'Ничего не найдено' : 'Нет услуг в этой категории'}
          </p>
        ) : (
          filtered.map(s => {
            const isExpanded = expandedServiceId === s.id;
            return (
              <div
                key={s.id}
                className={`${styles.cardWrap} ${dragId === s.id ? styles.cardDragging : ''} ${dragOverId === s.id ? styles.cardDragOver : ''}`}
                draggable={canDrag}
                onDragStart={() => { if (canDrag) setDragId(s.id); }}
                onDragOver={e => { e.preventDefault(); if (dragId && dragId !== s.id) setDragOverId(s.id); }}
                onDrop={() => handleCardDrop(s.id)}
                onDragEnd={() => { setDragId(null); setDragOverId(null); }}
              >
                <div className={styles.card}>
                  {canDrag && <span className={styles.dragHandle}>⠿</span>}
                  <div className={styles.cardMain}>
                    <div className={styles.cardTop}>
                      <span className={styles.cardName}>{s.name}</span>
                      {s.category?.trim() && <span className={styles.cardCat}>{s.category}</span>}
                    </div>
                    <span className={styles.cardMeta}>{s.duration_min} мин · {s.price.toLocaleString('ru')} сўм</span>
                  </div>
                  <div className={styles.cardActions}>
                    {staff.length > 0 && (
                      <button
                        className={`${styles.mastersBtn} ${isExpanded ? styles.mastersBtnActive : ''}`}
                        onClick={() => setExpandedServiceId(isExpanded ? null : s.id)}
                        title="Назначить мастеров"
                      >👤</button>
                    )}
                    <button className={styles.editBtn} onClick={() => { setEditing({ ...s }); setSaveError(null); }}>✎</button>
                    <button className={styles.deleteBtn} onClick={() => handleDelete(s.id)}>✕</button>
                  </div>
                </div>

                {isExpanded && (
                  <div className={styles.masterAssign}>
                    <p className={styles.masterAssignTitle}>Кто оказывает эту услугу</p>
                    <div className={styles.masterAssignList}>
                      {staff.map(m => {
                        const isOn = masterServiceMap.get(m.id)?.has(s.id) ?? false;
                        return (
                          <button
                            key={m.id}
                            className={`${styles.masterAssignChip} ${isOn ? styles.masterAssignChipOn : ''}`}
                            onClick={() => handleToggleMaster(s.id, m.id)}
                            disabled={masterAssigning === m.id}
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
          })
        )}
      </div>

      {toast && <Toast key={toast.key} message={toast.msg} onDone={() => setToast(null)} />}
    </ProLayout>
  );
}
