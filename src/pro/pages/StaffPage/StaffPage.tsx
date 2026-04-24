import { useEffect, useRef, useState } from 'react';
import { ProLayout } from '@/pro/components/ProLayout/ProLayout';
import { useMerchantStore } from '@/pro/stores/merchantStore';
import { listStaff, upsertStaff, deleteStaff, createInvite, listInvites, deleteInvite } from '@/pro/api';
import type { StaffInput, Invite } from '@/pro/api';
import type { Master } from '@/lib/api/types';
import { emit } from '@/pro/realtime';
import styles from './StaffPage.module.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
const EMPTY: StaffInput = { name: '', specialization: '' };

export default function StaffPage() {
  const { merchantId, role } = useMerchantStore();
  const [staff, setStaff] = useState<Master[]>([]);
  const [editing, setEditing] = useState<StaffInput | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);

  // Invite state
  const [showInvites, setShowInvites] = useState(false);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isOwnerRole = role === 'owner' || role === null;

  const load = () => {
    if (!merchantId) return;
    listStaff(merchantId).then(setStaff).catch(() => {});
  };

  useEffect(load, [merchantId]);

  const loadInvites = () => {
    setLoadingInvites(true);
    listInvites()
      .then(setInvites)
      .catch(() => setInvites([]))
      .finally(() => setLoadingInvites(false));
  };

  const handleOpenInvites = () => {
    setShowInvites(true);
    setInviteLink(null);
    loadInvites();
  };

  const handleCreateInvite = async () => {
    setCreatingInvite(true);
    try {
      const result = await createInvite();
      setInviteLink(result.link);
      loadInvites();
    } catch {
      // noop
    } finally {
      setCreatingInvite(false);
    }
  };

  const handleDeleteInvite = async (id: string) => {
    await deleteInvite(id);
    loadInvites();
  };

  const handleCopyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // noop
    }
  };

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
    setSaveError(null);
    try {
      await upsertStaff(merchantId, editing);
      emit({ type: 'staff.changed', merchantId });
      setEditing(null);
      load();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Ошибка при сохранении');
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
      load();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Не удалось удалить сотрудника');
    }
  };

  const actions = (
    <div style={{ display: 'flex', gap: 8 }}>
      {isOwnerRole && (
        <button className={styles.addBtn} onClick={handleOpenInvites} title="Пригласить сотрудника">
          ✉
        </button>
      )}
      <button className={styles.addBtn} onClick={() => setEditing({ ...EMPTY })}>
        +
      </button>
    </div>
  );

  return (
    <ProLayout title="Сотрудники" actions={actions}>
      {/* Invite sheet — owner only */}
      {showInvites && isOwnerRole && (
        <div className={styles.inviteSheet}>
          <div className={styles.inviteHeader}>
            <span className={styles.inviteTitle}>Приглашения</span>
            <button className={styles.closeBtn} onClick={() => setShowInvites(false)}>✕</button>
          </div>

          <button
            className={styles.createInviteBtn}
            onClick={handleCreateInvite}
            disabled={creatingInvite}
          >
            {creatingInvite ? 'Создаём…' : '+ Создать ссылку'}
          </button>

          {inviteLink && (
            <div className={styles.inviteLinkCard}>
              <p className={styles.inviteLinkLabel}>Новая ссылка:</p>
              <div className={styles.inviteLinkRow}>
                <span className={styles.inviteLinkText}>{inviteLink}</span>
                <button
                  className={styles.copyBtn}
                  onClick={() => handleCopyLink(inviteLink)}
                >
                  {copied ? '✓' : 'Копировать'}
                </button>
              </div>
            </div>
          )}

          {loadingInvites ? (
            <p className={styles.inviteEmptyText}>Загрузка…</p>
          ) : invites.length === 0 ? (
            <p className={styles.inviteEmptyText}>Нет активных приглашений</p>
          ) : (
            <div className={styles.inviteList}>
              {invites.map((inv) => (
                <div key={inv.id} className={styles.inviteCard}>
                  <div className={styles.inviteCardInfo}>
                    <span className={styles.inviteCardStatus}>
                      {inv.is_used ? '✓ Использовано' : 'Активно'}
                    </span>
                    {inv.master_name && (
                      <span className={styles.inviteCardMaster}>Мастер: {inv.master_name}</span>
                    )}
                    <span className={styles.inviteCardExpiry}>
                      Истекает: {new Date(inv.expires_at).toLocaleDateString('ru-RU')}
                    </span>
                    <button
                      className={styles.copyBtnSmall}
                      onClick={() => handleCopyLink(inv.link)}
                    >
                      Копировать ссылку
                    </button>
                  </div>
                  {!inv.is_used && (
                    <button
                      className={styles.revokeBtn}
                      onClick={() => handleDeleteInvite(inv.id)}
                    >
                      Отозвать
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
          {saveError && <p className={styles.errorMsg}>{saveError}</p>}
          <div className={styles.formActions}>
            <button className={styles.cancelBtn} onClick={() => setEditing(null)}>Отмена</button>
            <button className={styles.saveBtn} onClick={handleSave} disabled={saving || !editing.name}>
              {saving ? '…' : 'Сохранить'}
            </button>
          </div>
        </div>
      )}

      {deleteError && <p className={styles.errorMsg}>{deleteError}</p>}

      <div className={styles.list}>
        {staff.map((s) => (
          <div key={s.id} className={styles.card}>
            {s.photo_url ? (
              <img src={s.photo_url} className={styles.avatarImg} alt={s.name} />
            ) : (
              <div className={styles.avatar}>{(s.name?.[0] ?? '?').toUpperCase()}</div>
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
