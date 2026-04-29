import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ProLayout } from '@/pro/components/ProLayout/ProLayout';
import { useMerchantStore } from '@/pro/stores/merchantStore';
import { useAuthStore } from '@/stores/authStore';
import {
  listStaff,
  listMembers,
  listServices,
  updateMasterServices,
  upsertStaff,
  deleteStaff,
  createInvite,
  changeUserRole,
  revokeUserAccess,
} from '@/pro/api';
import type { StaffInput } from '@/pro/api';
import type { Master, Service } from '@/lib/api/types';
import { emit } from '@/pro/realtime';
import styles from './StaffPage.module.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
const EMPTY: StaffInput = { name: '', specialization: '' };

type Tab = 'users' | 'masters';

export default function StaffPage() {
  const { merchantId, role: myRole } = useMerchantStore();
  const { t } = useTranslation();

  const ROLE_LABELS: Record<string, string> = {
    owner: t('pro.staff.roleOwner'),
    admin: t('pro.staff.roleAdmin'),
    staff: t('pro.staff.roleStaff'),
  };
  const myUser = useAuthStore((s) => s.user);
  const myUserId = myUser?.id;
  const [tab, setTab] = useState<Tab>('users');

  // Virtual masters (no user_id)
  const [staff, setStaff] = useState<Master[]>([]);
  // All members including real users (from /members endpoint)
  const [members, setMembers] = useState<Master[]>([]);

  const [services, setServices] = useState<Service[]>([]);
  const [editing, setEditing] = useState<StaffInput | null>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  // Per-master invite links: masterId → link
  const [inviteLinks, setInviteLinks] = useState<Record<string, string>>({});
  const [inviting, setInviting] = useState<string | null>(null); // masterId being invited
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Member management
  const [roleChanging, setRoleChanging] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  const isOwner = myRole === 'owner' || myRole === null;

  const loadAll = () => {
    if (!merchantId) return;
    listStaff(merchantId).then(setStaff).catch(() => {});
    listMembers(merchantId).then(setMembers).catch(() => {});
    listServices(merchantId).then(setServices).catch(() => {});
  };

  useEffect(() => { loadAll(); }, [merchantId]);

  const virtualMasters = staff.filter((s) => !s.user_id);
  const realUsersFromAPI = members.filter((m) => m.user_id);

  // Include the current owner if they're not already in the members list
  const ownerAlreadyListed = realUsersFromAPI.some((m) => m.user_id === myUserId);
  const ownerEntry: Master[] = (!ownerAlreadyListed && myUser)
    ? [{
        id: myUser.id,
        name: myUser.name,
        specialization: '',
        user_id: myUser.id,
        user_accounts: { phone: myUser.phone ?? '', role: 'owner', avatar_url: myUser.avatarUrl ?? null },
        photo_url: myUser.avatarUrl ?? null,
        rating: 0,
        is_active: true,
        master_services: [],
      } as unknown as Master]
    : [];
  const realUsers = [...ownerEntry, ...realUsersFromAPI];

  // ─── Photo upload ──────────────────────────────────────────────

  const uploadPhoto = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append('image', file);
    fd.append('variant', 'avatar');
    const token = localStorage.getItem('yookie_auth_token');
    const res = await fetch(`${API_BASE}/businesses/upload-image`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error((json as { message?: string }).message || t('pro.staff.uploadError'));
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
    } catch { /* non-critical */ } finally {
      setUploading(false);
      if (photoRef.current) photoRef.current.value = '';
    }
  };

  // ─── Master CRUD ───────────────────────────────────────────────

  const handleSave = async () => {
    if (!merchantId || !editing) return;
    setSaving(true);
    setSaveError(null);
    try {
      const master = await upsertStaff(merchantId, editing);
      await updateMasterServices(merchantId, master.id, selectedServiceIds);
      emit({ type: 'staff.changed', merchantId });
      setEditing(null);
      setSelectedServiceIds([]);
      loadAll();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t('pro.staff.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!merchantId) return;
    setDeleteError(null);
    try {
      await deleteStaff(merchantId, id);
      emit({ type: 'staff.changed', merchantId });
      loadAll();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : t('pro.staff.deleteError'));
    }
  };

  // ─── Invite for virtual master ─────────────────────────────────

  const handleInviteMaster = async (masterId: string) => {
    setInviting(masterId);
    try {
      const result = await createInvite(masterId);
      setInviteLinks((prev) => ({ ...prev, [masterId]: result.link }));
    } catch { /* noop */ } finally {
      setInviting(null);
    }
  };

  const handleCopyLink = async (link: string, key: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(key);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch { /* noop */ }
  };

  // ─── Member role / revoke ──────────────────────────────────────

  const handleChangeRole = async (userId: string, newRole: string) => {
    if (!merchantId) return;
    setRoleChanging(userId);
    try {
      await changeUserRole(merchantId, userId, newRole);
      loadAll();
    } catch { /* noop */ } finally {
      setRoleChanging(null);
    }
  };

  const handleRevoke = async (userId: string) => {
    if (!merchantId) return;
    const ok = window.confirm(t('pro.staff.confirmDelete'));
    if (!ok) return;
    setRevoking(userId);
    try {
      await revokeUserAccess(merchantId, userId);
      loadAll();
    } catch { /* noop */ } finally {
      setRevoking(null);
    }
  };

  // ─── Actions button in header ──────────────────────────────────

  const addMasterBtn = tab === 'masters' && isOwner ? (
    <button
      className={styles.addBtn}
      onClick={() => { setEditing({ ...EMPTY }); setSelectedServiceIds([]); }}
    >
      +
    </button>
  ) : null;

  return (
    <ProLayout title={t('pro.staff.title')} actions={addMasterBtn ?? undefined}>
      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'users' ? styles.tabActive : ''}`}
          onClick={() => setTab('users')}
        >
          Менеджеры
        </button>
        <button
          className={`${styles.tab} ${tab === 'masters' ? styles.tabActive : ''}`}
          onClick={() => setTab('masters')}
        >
          {t('pro.staff.tabMasters')}
        </button>
      </div>

      {/* ── Tab: Real Users ── */}
      {tab === 'users' && (
        <div className={styles.list}>
          <p className={styles.managersNote}>
            Менеджеры управляют записями и настройками. Они не оказывают услуги клиентам.
          </p>
          {realUsers.length === 0 && (
            <p className={styles.emptyHint}>
              {t('pro.staff.noUsers')}
            </p>
          )}
          {realUsers.map((m) => {
            const ua = m.user_accounts;
            const userId = m.user_id!;
            const isMe = userId === myUserId;
            const currentRole = ua?.role ?? 'staff';
            return (
              <div key={m.id} className={styles.card}>
                {m.photo_url || ua?.avatar_url ? (
                  <img
                    src={(m.photo_url ?? ua?.avatar_url)!}
                    className={styles.avatarImg}
                    alt={m.name}
                  />
                ) : (
                  <div className={styles.avatar}>{(m.name?.[0] ?? '?').toUpperCase()}</div>
                )}
                <div className={styles.info}>
                  <span className={styles.name}>{m.name}</span>
                  <span className={styles.spec}>{ua?.phone ?? ''}</span>
                  <span className={styles.roleBadge} data-role={currentRole}>
                    {ROLE_LABELS[currentRole] ?? currentRole}
                  </span>
                </div>
                {isOwner && !isMe && currentRole !== 'owner' && (
                  <div className={styles.actions}>
                    <button
                      className={styles.editBtn}
                      title="Сделать администратором"
                      disabled={roleChanging === userId}
                      onClick={() => handleChangeRole(userId, currentRole === 'admin' ? 'staff' : 'admin')}
                    >
                      {currentRole === 'admin' ? '↓' : '↑'}
                    </button>
                    <button
                      className={styles.deleteBtn}
                      title="Удалить из бизнеса"
                      disabled={revoking === userId}
                      onClick={() => handleRevoke(userId)}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Tab: Virtual Masters ── */}
      {tab === 'masters' && (
        <>
          {editing && (
            <div className={styles.form}>
              <div className={styles.photoRow}>
                <div
                  className={styles.photoPreview}
                  onClick={() => photoRef.current?.click()}
                  style={editing.photo_url ? { backgroundImage: `url(${editing.photo_url})` } : undefined}
                >
                  {!editing.photo_url && (
                    <span className={styles.photoPlaceholder}>{uploading ? '…' : '📷'}</span>
                  )}
                </div>
                <button
                  type="button"
                  className={styles.photoBtn}
                  onClick={() => photoRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? t('pro.staff.uploading') : editing.photo_url ? t('pro.staff.changePhoto') : t('pro.staff.uploadPhoto')}
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
                placeholder={t('pro.staff.name')}
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              />
              <input
                className={styles.input}
                placeholder={t('pro.staff.specialization')}
                value={editing.specialization}
                onChange={(e) => setEditing({ ...editing, specialization: e.target.value })}
              />

              {services.length > 0 && (
                <div className={styles.servicesPicker}>
                  <p className={styles.servicesLabel}>{t('pro.staff.servicesLabel')}</p>
                  {services.map((svc) => (
                    <label key={svc.id} className={styles.serviceCheckbox}>
                      <input
                        type="checkbox"
                        checked={selectedServiceIds.includes(svc.id)}
                        onChange={(e) =>
                          setSelectedServiceIds((prev) =>
                            e.target.checked
                              ? [...prev, svc.id]
                              : prev.filter((id) => id !== svc.id)
                          )
                        }
                      />
                      <span>{svc.name}</span>
                      <span className={styles.servicePrice}>{svc.price.toLocaleString()} {t('common.currency')}</span>
                    </label>
                  ))}
                </div>
              )}

              {saveError && <p className={styles.errorMsg}>{saveError}</p>}
              <div className={styles.formActions}>
                <button className={styles.cancelBtn} onClick={() => { setEditing(null); setSelectedServiceIds([]); }}>
                  {t('common.cancel')}
                </button>
                <button className={styles.saveBtn} onClick={handleSave} disabled={saving || !editing.name}>
                  {saving ? '…' : t('common.save')}
                </button>
              </div>
            </div>
          )}

          {deleteError && <p className={styles.errorMsg}>{deleteError}</p>}

          <div className={styles.list}>
            {virtualMasters.length === 0 && !editing && (
              <p className={styles.emptyHint}>
                {t('pro.staff.noMasters')}
              </p>
            )}
            {virtualMasters.map((s) => {
              const link = inviteLinks[s.id];
              return (
                <div key={s.id} className={styles.virtualCard}>
                  <div className={styles.cardMain}>
                    {s.photo_url ? (
                      <img src={s.photo_url} className={styles.avatarImg} alt={s.name} />
                    ) : (
                      <div className={styles.avatar}>{(s.name?.[0] ?? '?').toUpperCase()}</div>
                    )}
                    <div className={styles.info}>
                      <span className={styles.name}>{s.name}</span>
                      <span className={styles.spec}>{s.specialization}</span>
                      {(s.master_services ?? []).length > 0 && (
                        <span className={styles.masterServices}>
                          {(s.master_services ?? []).map((ms) => ms.services?.name).filter(Boolean).join(', ')}
                        </span>
                      )}
                    </div>
                    <div className={styles.actions}>
                      {isOwner && (
                        <button
                          className={styles.inviteBtn}
                          disabled={inviting === s.id}
                          onClick={() => handleInviteMaster(s.id)}
                          title="Пригласить пользователя"
                        >
                          {inviting === s.id ? '…' : '✉'}
                        </button>
                      )}
                      <button className={styles.editBtn} onClick={() => {
                        setEditing({ ...s });
                        setSelectedServiceIds((s.master_services ?? []).map((ms) => ms.service_id));
                      }}>✎</button>
                      <button className={styles.deleteBtn} onClick={() => handleDelete(s.id)}>✕</button>
                    </div>
                  </div>
                  {link && (
                    <div className={styles.inviteLinkRow}>
                      <span className={styles.inviteLinkText}>{link}</span>
                      <button
                        className={styles.copyBtn}
                        onClick={() => handleCopyLink(link, s.id)}
                      >
                        {copiedLink === s.id ? t('pro.staff.linkCopied') : t('pro.staff.copyLink')}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </ProLayout>
  );
}
