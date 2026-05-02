import { useEffect, useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ProLayout } from '@/pro/components/ProLayout/ProLayout';
import { useMerchantStore } from '@/pro/stores/merchantStore';
import { listServices, listStaff, upsertService, deleteService, updateMasterServices, reorderService, listAddons, upsertAddon, deleteAddon } from '@/pro/api';
import type { ServiceInput, AddonInput } from '@/pro/api';
import type { Master, Service, ServiceAddon } from '@/lib/api/types';
import { emit, subscribe, startPolling } from '@/pro/realtime';
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
  const { t } = useTranslation();
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
  const [photoUploading, setPhotoUploading] = useState(false);

  // Addon management
  const [loading, setLoading] = useState(true);
  const [expandedAddonsId, setExpandedAddonsId] = useState<string | null>(null);
  const [addonsByService, setAddonsByService] = useState<Record<string, ServiceAddon[]>>({});
  const [editingAddon, setEditingAddon] = useState<(AddonInput & { serviceId: string }) | null>(null);
  const [savingAddon, setSavingAddon] = useState(false);
  const EMPTY_ADDON: AddonInput = { name: '', price: 0, duration_min: 0, max_qty: 1 };

  const showToast = (msg: string) => setToast({ msg, key: Date.now() });

  const load = useCallback(() => {
    if (!merchantId) return;
    setLoading(true);
    Promise.all([
      listServices(merchantId).then(list => setServices([...list].sort((a, b) => a.position - b.position))),
      listStaff(merchantId).then(setStaff),
    ]).finally(() => setLoading(false));
  }, [merchantId]);

  useEffect(() => {
    load();
    const unsub = subscribe(ev => {
      if ('merchantId' in ev && ev.merchantId === merchantId) load();
    });
    const stopPoll = startPolling(load, 300000);
    return () => { unsub(); stopPoll(); };
  }, [load]);

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
      const msg = editing.id ? t('pro.services.saved') : t('pro.services.added');
      setEditing(null);
      emit({ type: 'service.changed', merchantId });
      load();
      showToast(msg);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t('pro.services.saveError'));
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
      showToast(t('pro.services.deleted'));
    } catch {
      showToast(t('pro.services.deleteError'));
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

  const loadAddons = async (serviceId: string) => {
    if (!merchantId) return;
    const addons = await listAddons(merchantId, serviceId).catch(() => []);
    setAddonsByService(prev => ({ ...prev, [serviceId]: addons }));
  };

  const handleToggleAddons = (serviceId: string) => {
    if (expandedAddonsId === serviceId) {
      setExpandedAddonsId(null);
    } else {
      setExpandedAddonsId(serviceId);
      if (!addonsByService[serviceId]) loadAddons(serviceId);
    }
  };

  const handleSaveAddon = async () => {
    if (!merchantId || !editingAddon || !editingAddon.name.trim()) return;
    setSavingAddon(true);
    try {
      const saved = await upsertAddon(merchantId, editingAddon.serviceId, editingAddon);
      setAddonsByService(prev => {
        const list = prev[editingAddon.serviceId] ?? [];
        const existing = list.findIndex(a => a.id === saved.id);
        return {
          ...prev,
          [editingAddon.serviceId]: existing >= 0
            ? list.map(a => a.id === saved.id ? saved : a)
            : [...list, saved],
        };
      });
      setEditingAddon(null);
      showToast('Сохранено');
    } catch {
      showToast('Ошибка сохранения');
    } finally {
      setSavingAddon(false);
    }
  };

  const handleDeleteAddon = async (serviceId: string, addonId: string) => {
    if (!merchantId) return;
    await deleteAddon(merchantId, serviceId, addonId).catch(() => {});
    setAddonsByService(prev => ({
      ...prev,
      [serviceId]: (prev[serviceId] ?? []).filter(a => a.id !== addonId),
    }));
    showToast('Удалено');
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

  const uploadServicePhoto = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('variant', 'cover');
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
    const token = localStorage.getItem('yookie_auth_token');
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`${API_BASE}/businesses/upload-image`, { method: 'POST', body: formData, headers });
    if (!res.ok) throw new Error('Ошибка загрузки фото');
    const json = await res.json() as { url?: string };
    if (!json.url) throw new Error('Нет URL в ответе');
    return json.url;
  };

  const openAdd = () => { setEditing({ ...EMPTY }); setSaveError(null); };

  const actions = <button className={styles.addBtn} onClick={openAdd}>+</button>;

  return (
    <ProLayout title={t('pro.services.title')} actions={actions} onRefresh={load}>
      {/* Category filter — L2 underline tabs */}
      {categories.length > 1 && (
        <div className={styles.catFilter}>
          <button
            className={`${styles.catTab} ${activeCategory === null ? styles.catTabActive : ''}`}
            onClick={() => setActiveCategory(null)}
          >{t('common.all')}</button>
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
            placeholder={t('pro.services.searchPlaceholder')}
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
            placeholder={`${t('pro.services.name')} *`}
            value={editing.name}
            onChange={e => setEditing({ ...editing, name: e.target.value })}
            autoFocus
          />
          <input
            className={styles.input}
            list="svc-categories"
            placeholder={t('pro.services.category')}
            value={editing.category ?? ''}
            onChange={e => setEditing({ ...editing, category: e.target.value })}
          />
          <datalist id="svc-categories">
            {CATEGORY_SUGGESTIONS.map(c => <option key={c} value={c} />)}
          </datalist>
          <textarea
            className={styles.input}
            placeholder={t('pro.services.descriptionPlaceholder')}
            rows={2}
            value={editing.description ?? ''}
            onChange={e => setEditing({ ...editing, description: e.target.value })}
            style={{ resize: 'none' }}
          />
          <div className={styles.row}>
            <input
              className={styles.input}
              type="number"
              placeholder={t('pro.services.pricePlaceholder')}
              value={editing.price || ''}
              onChange={e => setEditing({ ...editing, price: Number(e.target.value) })}
            />
            <input
              className={styles.input}
              type="number"
              placeholder={t('pro.services.durationLabel')}
              value={editing.duration_min || ''}
              onChange={e => setEditing({ ...editing, duration_min: Number(e.target.value) })}
            />
          </div>

          {/* Service photo upload */}
          <div className={styles.photoUploadRow}>
            {editing.photo_url ? (
              <div className={styles.photoPreviewWrap}>
                <img src={editing.photo_url} alt="Фото услуги" className={styles.photoPreview} />
                <button
                  type="button"
                  className={styles.photoRemoveBtn}
                  onClick={() => setEditing({ ...editing, photo_url: null })}
                >✕</button>
              </div>
            ) : (
              <label className={`${styles.photoUploadBtn} ${photoUploading ? styles.photoUploadBtnLoading : ''}`}>
                {photoUploading ? 'Загрузка…' : '+ Фото услуги'}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  disabled={photoUploading}
                  onChange={async e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setPhotoUploading(true);
                    try {
                      const url = await uploadServicePhoto(file);
                      setEditing({ ...editing, photo_url: url });
                    } catch { setSaveError('Не удалось загрузить фото'); }
                    finally { setPhotoUploading(false); }
                  }}
                />
              </label>
            )}
          </div>

          {saveError && <p className={styles.formError}>{saveError}</p>}
          <div className={styles.formActions}>
            <button className={styles.cancelBtn} onClick={() => { setEditing(null); setSaveError(null); }}>{t('common.cancel')}</button>
            <button className={styles.saveBtn} onClick={handleSave} disabled={saving || !editing.name.trim()}>
              {saving ? '…' : t('pro.services.saveBtn')}
            </button>
          </div>
        </div>
      )}

      <div className={styles.list}>
        {/* Loading skeleton */}
        {loading ? (
          <div className={styles.skeletonList}>
            {[1, 2, 3].map(i => <div key={i} className={styles.skeletonCard} />)}
          </div>
        ) : services.length === 0 ? (
          /* Empty state */
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>✂️</span>
            <p className={styles.emptyTitle}>{t('pro.services.noServices')}</p>
            <p className={styles.emptyText}>{t('pro.services.noServicesFirstDesc')}</p>
            <button className={styles.emptyAddBtn} onClick={openAdd}>+ {t('pro.services.add')}</button>
          </div>
        ) : filtered.length === 0 ? (
          <p className={styles.empty}>
            {search ? t('common.notFound') : t('pro.services.noCategory')}
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
                    <span className={styles.cardMeta}>{s.duration_min} {t('common.min')} · {s.price.toLocaleString('ru')} {t('common.currency')}</span>
                  </div>
                  <div className={styles.cardActions}>
                    {staff.length > 0 && (
                      <button
                        className={`${styles.mastersBtn} ${isExpanded ? styles.mastersBtnActive : ''}`}
                        onClick={() => setExpandedServiceId(isExpanded ? null : s.id)}
                        title={t('pro.services.masterAssignTitle')}
                      >👤</button>
                    )}
                    <button
                      className={`${styles.addonsBtn} ${expandedAddonsId === s.id ? styles.addonsBtnActive : ''}`}
                      onClick={() => handleToggleAddons(s.id)}
                      title="Подуслуги"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="2" width="5" height="5" rx="1.2" />
                        <rect x="9" y="2" width="5" height="5" rx="1.2" />
                        <rect x="2" y="9" width="5" height="5" rx="1.2" />
                        <rect x="9" y="9" width="5" height="5" rx="1.2" />
                      </svg>
                    </button>
                    <button className={styles.editBtn} onClick={() => { setEditing({ ...s }); setSaveError(null); }}>✎</button>
                    <button className={styles.deleteBtn} onClick={() => handleDelete(s.id)}>✕</button>
                  </div>
                </div>

                {isExpanded && (
                  <div className={styles.masterAssign}>
                    <p className={styles.masterAssignTitle}>{t('pro.services.masterAssignTitle')}</p>
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

                {expandedAddonsId === s.id && (
                  <div className={styles.addonPanel}>
                    <div className={styles.addonPanelHead}>
                      <p className={styles.addonPanelTitle}>Подуслуги</p>
                      <button
                        className={styles.addonAddBtn}
                        onClick={() => setEditingAddon({ ...EMPTY_ADDON, serviceId: s.id })}
                      >+ Добавить</button>
                    </div>

                    {(addonsByService[s.id] ?? []).length === 0 && (
                      <p className={styles.addonEmpty}>Нет подуслуг. Нажмите «+ Добавить»</p>
                    )}

                    {(addonsByService[s.id] ?? []).map(addon => (
                      <div key={addon.id} className={styles.addonRow}>
                        <div className={styles.addonInfo}>
                          <span className={styles.addonName}>{addon.name}</span>
                          <span className={styles.addonMeta}>
                            {addon.duration_min > 0 ? `+${addon.duration_min} мин · ` : ''}
                            {addon.price.toLocaleString('ru')} сум
                            {addon.max_qty > 1 ? ` · макс ${addon.max_qty}` : ''}
                          </span>
                        </div>
                        <div className={styles.addonActions}>
                          <button className={styles.addonEditBtn} onClick={() => setEditingAddon({ ...addon, serviceId: s.id })}>✎</button>
                          <button className={styles.addonDeleteBtn} onClick={() => handleDeleteAddon(s.id, addon.id)}>✕</button>
                        </div>
                      </div>
                    ))}

                    {editingAddon?.serviceId === s.id && (
                      <div className={styles.addonForm}>
                        <input
                          className={styles.input}
                          placeholder="Название *"
                          value={editingAddon.name}
                          onChange={e => setEditingAddon({ ...editingAddon, name: e.target.value })}
                          autoFocus
                        />
                        <div className={styles.row}>
                          <input
                            className={styles.input}
                            type="number"
                            placeholder="Цена"
                            value={editingAddon.price || ''}
                            onChange={e => setEditingAddon({ ...editingAddon, price: Number(e.target.value) })}
                          />
                          <input
                            className={styles.input}
                            type="number"
                            placeholder="Мин"
                            value={editingAddon.duration_min || ''}
                            onChange={e => setEditingAddon({ ...editingAddon, duration_min: Number(e.target.value) })}
                          />
                          <input
                            className={styles.input}
                            type="number"
                            placeholder="Макс. кол"
                            value={editingAddon.max_qty || 1}
                            min={1}
                            max={99}
                            onChange={e => setEditingAddon({ ...editingAddon, max_qty: Number(e.target.value) })}
                          />
                        </div>
                        <div className={styles.formActions}>
                          <button className={styles.cancelBtn} onClick={() => setEditingAddon(null)}>Отмена</button>
                          <button
                            className={styles.saveBtn}
                            onClick={handleSaveAddon}
                            disabled={savingAddon || !editingAddon.name.trim()}
                          >
                            {savingAddon ? '…' : 'Сохранить'}
                          </button>
                        </div>
                      </div>
                    )}
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
