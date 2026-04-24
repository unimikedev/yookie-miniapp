import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProLayout } from '@/pro/components/ProLayout/ProLayout';
import { useMerchantStore } from '@/pro/stores/merchantStore';
import { useAuthStore } from '@/stores/authStore';
import { upsertStaff, getInviteInfo, acceptInvite } from '@/pro/api';
import { api } from '@/lib/api/client';
import { UZBEKISTAN_CITIES } from '@/stores/cityStore';
import { formatPhoneMask } from '@/lib/utils/phone';
import { useMerchantProfileValidation, getOnboardingSteps, type OnboardingStep } from '@/hooks/useMerchantProfileValidation';
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

const CITY_COORDS: Record<string, [number, number]> = {
  Tashkent: [41.2995, 69.2401],
  Samarkand: [39.6542, 66.9597],
  Bukhara: [39.7764, 64.4286],
  Namangan: [41.0011, 71.6725],
  Andijan: [40.7821, 72.3442],
  Fergana: [40.3864, 71.7864],
  Nukus: [42.4608, 59.6120],
};

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

interface PendingStaff {
  tempId: string;
  name: string;
  specialization: string;
  photo_url?: string;
}

/* ── Map Picker Overlay ─────────────────────────────────────────── */
interface MapPickerProps {
  initialCenter: [number, number];
  onConfirm: (lat: number, lng: number) => void;
  onClose: () => void;
}

function MapPickerOverlay({ initialCenter, onConfirm, onClose }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const ymapRef = useRef<any>(null);

  useEffect(() => {
    const init = () => {
      if (!mapRef.current || ymapRef.current) return;
      const map = new window.ymaps.Map(mapRef.current, {
        center: initialCenter,
        zoom: 15,
        controls: [],
      }, { suppressMapOpenBlock: true });
      ymapRef.current = map;
    };

    if (window.ymaps) {
      window.ymaps.ready(init);
    }

    return () => {
      ymapRef.current?.destroy();
      ymapRef.current = null;
    };
  }, []);

  const handleConfirm = () => {
    if (!ymapRef.current) return;
    const [lat, lng] = ymapRef.current.getCenter();
    onConfirm(lat, lng);
  };

  return (
    <div className={styles.mapPickerOverlay}>
      <div className={styles.mapPickerTopBar}>
        <button className={styles.mapPickerClose} onClick={onClose}>✕</button>
        <span className={styles.mapPickerTitle}>Поставьте метку</span>
        <div style={{ width: 32 }} />
      </div>
      <div ref={mapRef} className={styles.mapPickerMap} />
      <div className={styles.mapPickerPin}>📍</div>
      <div className={styles.mapPickerHint}>Переместите карту, чтобы поставить метку в нужном месте</div>
      <button className={styles.mapPickerConfirmBtn} onClick={handleConfirm}>
        Подтвердить место
      </button>
    </div>
  );
}

/* ── Instagram post URLs editor ─────────────────────────────────── */
const IG_POST_RE = /instagram\.com\/(p|reel)\/([A-Za-z0-9_-]+)/

interface UrlsEditorProps {
  urls: string[]
  input: string
  onInputChange: (v: string) => void
  onAdd: (url: string) => void
  onRemove: (i: number) => void
}

function InstagramPostUrlsEditor({ urls, input, onInputChange, onAdd, onRemove }: UrlsEditorProps) {
  const isValid = IG_POST_RE.test(input)
  const atMax = urls.length >= 6

  const handleAdd = () => {
    if (!isValid || atMax) return
    // Normalize to canonical URL
    const match = input.match(IG_POST_RE)!
    onAdd(`https://www.instagram.com/${match[1]}/${match[2]}/`)
  }

  return (
    <div className={styles.fieldGroup}>
      <label className={styles.fieldLabel}>
        Посты для галереи
        <span className={styles.fieldBadge}>{urls.length}/6</span>
      </label>

      {/* Existing URLs */}
      {urls.length > 0 && (
        <div className={styles.igUrlList}>
          {urls.map((url, i) => (
            <div key={url} className={styles.igUrlItem}>
              <span className={styles.igUrlText}>{url.replace('https://www.instagram.com/', 'ig.com/')}</span>
              <button className={styles.igUrlRemove} onClick={() => onRemove(i)} type="button">✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Add input */}
      {!atMax && (
        <div className={styles.igUrlAdd}>
          <input
            className={styles.fieldInput}
            value={input}
            onChange={e => onInputChange(e.target.value.trim())}
            placeholder="https://www.instagram.com/p/…"
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <button
            className={styles.igUrlAddBtn}
            onClick={handleAdd}
            disabled={!isValid}
            type="button"
          >
            +
          </button>
        </div>
      )}

      <p className={styles.fieldHint}>
        Вставьте ссылку на публичный пост или Reel — клиенты увидят реальные работы
      </p>
    </div>
  )
}

/* ── Join existing business ─────────────────────────────────── */
function JoinBusiness({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate();
  const merchantStore = useMerchantStore();
  const [input, setInput] = useState('');
  const [preview, setPreview] = useState<{ businessName: string; role: string; masterId?: string | null } | null>(null);
  const [token, setToken] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseToken = (raw: string): string => {
    const trimmed = raw.trim();
    const deepLinkMatch = trimmed.match(/inv_([a-f0-9]{32})/i);
    if (deepLinkMatch) return deepLinkMatch[1];
    if (/^[a-f0-9]{32}$/i.test(trimmed)) return trimmed;
    return '';
  };

  const handleLookup = async () => {
    setError(null);
    const tok = parseToken(input);
    if (!tok) { setError('Вставьте ссылку-приглашение или код'); return; }
    setLookingUp(true);
    try {
      const info = await getInviteInfo(tok);
      if (!info.valid) { setError(info.reason ?? 'Приглашение недействительно'); return; }
      setToken(tok);
      setPreview({ businessName: info.businessName ?? 'Бизнес', role: info.role ?? 'staff', masterId: info.masterId });
    } catch {
      setError('Не удалось проверить приглашение');
    } finally {
      setLookingUp(false);
    }
  };

  const handleAccept = async () => {
    setAccepting(true);
    setError(null);
    try {
      const result = await acceptInvite(token);
      localStorage.setItem('yookie_auth_token', result.token);
      try {
        const stored = JSON.parse(localStorage.getItem('yookie_auth_user') || '{}');
        stored.businessId = result.businessId;
        stored.role = result.role;
        localStorage.setItem('yookie_auth_user', JSON.stringify(stored));
        useAuthStore.setState(s => ({
          user: s.user ? { ...s.user, businessId: result.businessId, role: result.role as any } : s.user,
        }));
      } catch { /* noop */ }
      merchantStore.setMerchantId(result.businessId);
      merchantStore.setRole(result.role as 'staff' | 'owner');
      if (result.masterId) merchantStore.setMasterId(result.masterId);
      merchantStore.enterProMode();
      navigate('/pro', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось принять приглашение');
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className={styles.joinPage}>
      <div className={styles.joinHeader}>
        <button className={styles.joinBackBtn} onClick={onBack} aria-label="Назад">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M12 4L6 10L12 16" />
          </svg>
        </button>
        <span className={styles.joinHeaderTitle}>Подключиться к бизнесу</span>
      </div>

      <div className={styles.joinBody}>
        <p className={styles.joinInstruction}>
          Вставьте ссылку-приглашение, которую вам отправил владелец бизнеса.
        </p>

        <div>
          <div className={styles.joinInputRow}>
            <input
              className={styles.joinInput}
              placeholder="Ссылка или код приглашения"
              value={input}
              onChange={e => { setInput(e.target.value); setPreview(null); setToken(''); setError(null); }}
              onKeyDown={e => e.key === 'Enter' && !lookingUp && handleLookup()}
              autoFocus
            />
            <button className={styles.joinLookupBtn} onClick={handleLookup} disabled={lookingUp || !input.trim()}>
              {lookingUp ? '…' : 'Найти'}
            </button>
          </div>
          <p className={styles.joinHint}>
            Формат: ссылка вида t.me/yookie_bot?startapp=inv_… или 32-значный код
          </p>
        </div>

        {error && <p className={styles.joinError}>{error}</p>}

        {preview && (
          <div className={styles.joinPreviewCard}>
            <span className={styles.joinPreviewBizName}>{preview.businessName}</span>
            <span className={styles.joinPreviewRole}>
              {preview.role === 'staff' ? 'Сотрудник' : preview.role}
            </span>
            <button className={styles.joinAcceptBtn} onClick={handleAccept} disabled={accepting}>
              {accepting ? 'Подключение…' : 'Присоединиться'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Onboarding choice screen ───────────────────────────────── */
function OnboardingChoice({ onCreateNew, onJoin }: { onCreateNew: () => void; onJoin: () => void }) {
  return (
    <div className={styles.onboardingPage}>
      <div className={styles.onboardingLogo}>Y</div>

      <div className={styles.onboardingHeadline}>
        <h1 className={styles.onboardingTitle}>Yookie Pro</h1>
        <p className={styles.onboardingSubtitle}>
          Управляйте записями, сотрудниками и расписанием
        </p>
      </div>

      <div className={styles.onboardingChoices}>
        <button className={`${styles.choiceCard} ${styles.choiceCardPrimary}`} onClick={onCreateNew}>
          <div className={styles.choiceIcon}>🏢</div>
          <div className={styles.choiceBody}>
            <span className={styles.choiceTitle}>Создать бизнес</span>
            <p className={styles.choiceDesc}>Зарегистрируйте своё заведение и начните принимать записи</p>
          </div>
          <span className={styles.choiceArrow}>›</span>
        </button>

        <button className={styles.choiceCard} onClick={onJoin}>
          <div className={styles.choiceIcon}>🔗</div>
          <div className={styles.choiceBody}>
            <span className={styles.choiceTitle}>Подключиться к бизнесу</span>
            <p className={styles.choiceDesc}>Есть ссылка-приглашение от владельца — войдите как сотрудник</p>
          </div>
          <span className={styles.choiceArrow}>›</span>
        </button>
      </div>
    </div>
  );
}

/* ── Wizard (new business) ──────────────────────────────────────── */
function BusinessWizard() {
  const navigate = useNavigate();
  const auth = useAuthStore();
  const { setMerchantId } = useMerchantStore();

  const TOTAL_STEPS = 3;
  const [step, setStep] = useState(1);
  const [createdBusinessId, setCreatedBusinessId] = useState<string | null>(null);

  // Use validation hook after business is created
  const { isValidated, validationErrors, completionPercentage, isReadyForB2C } = useMerchantProfileValidation(createdBusinessId);
  const onboardingSteps = getOnboardingSteps(createdBusinessId);

  // Step 1 — basic info
  const [name, setName] = useState('');
  const [category, setCategory] = useState<CategoryEnum>('other');
  const [description, setDescription] = useState('');

  // Step 2 — location & contacts
  const [city, setCity] = useState('Tashkent');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [phone, setPhone] = useState('+998');
  const [instagram, setInstagram] = useState('');
  const [instagramPostUrls, setInstagramPostUrls] = useState<string[]>([]);
  const [instagramPostInput, setInstagramPostInput] = useState('');
  const [telegramUsername, setTelegramUsername] = useState('');
  const [showMapPicker, setShowMapPicker] = useState(false);

  // Step 3 — photos & staff
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [pendingStaff, setPendingStaff] = useState<PendingStaff[]>([]);
  const [staffFormOpen, setStaffFormOpen] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffSpec, setStaffSpec] = useState('');
  const [staffPhotoUrl, setStaffPhotoUrl] = useState<string | undefined>(undefined);
  const [staffPhotoUploading, setStaffPhotoUploading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const creatingRef = useRef(false);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const staffPhotoInputRef = useRef<HTMLInputElement>(null);

  const mapCenter: [number, number] = lat && lng
    ? [lat, lng]
    : CITY_COORDS[city] ?? [41.2995, 69.2401];

  const uploadImage = async (file: File): Promise<string> => {
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

  const handlePhotoAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    setError(null);
    try {
      const url = await uploadImage(file);
      setPhotoUrls(prev => [...prev, url]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setPhotoUploading(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const handleStaffPhotoAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStaffPhotoUploading(true);
    try {
      const url = await uploadImage(file);
      setStaffPhotoUrl(url);
    } catch {
      // non-critical
    } finally {
      setStaffPhotoUploading(false);
      if (staffPhotoInputRef.current) staffPhotoInputRef.current.value = '';
    }
  };

  const handleAddStaff = () => {
    if (!staffName.trim()) return;
    setPendingStaff(prev => [
      ...prev,
      { tempId: crypto.randomUUID(), name: staffName.trim(), specialization: staffSpec.trim(), photo_url: staffPhotoUrl },
    ]);
    setStaffName('');
    setStaffSpec('');
    setStaffPhotoUrl(undefined);
    setStaffFormOpen(false);
  };

  const handleNext = () => {
    setError(null);
    if (step === 1) {
      if (!name.trim()) { setError('Введите название заведения'); return; }
    }
    setStep(s => s + 1);
  };

  const handleBack = () => {
    if (step === 1) { navigate(-1); return; }
    setStep(s => s - 1);
    setError(null);
  };

  const handleCreate = async () => {
    if (creatingRef.current) return;
    if (!name.trim()) { setStep(1); setError('Введите название'); return; }
    
    // Check validation before allowing business creation
    // Critical fields: name (checked above), services, staff, schedule
    // Photo is optional
    const hasCriticalIssues = validationErrors.filter(e => !e.includes('фото')).length > 0;
    if (hasCriticalIssues && createdBusinessId) {
      setError('Заполните все обязательные поля: услуги, мастера и график работы');
      return;
    }
    
    creatingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        category,
        description: description.trim() || undefined,
        city,
        address: address.trim() || undefined,
        phone: phone.trim() !== '+998' ? phone.trim() : undefined,
        instagram: instagram.trim() ? instagram.replace(/^@/, '') : undefined,
        instagram_post_urls: instagramPostUrls.length > 0 ? instagramPostUrls : undefined,
        telegram_username: telegramUsername.trim() ? telegramUsername.replace(/^@/, '') : undefined,
        photo_url: photoUrls[0] || undefined,
        photo_urls: photoUrls.length > 0 ? photoUrls : undefined,
        is_active: true,
        ...(lat !== null && lng !== null ? { lat, lng } : {}),
      };

      const authToken = localStorage.getItem('yookie_auth_token');
      const createRes = await fetch(`${API_BASE}/businesses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify(body),
      });
      if (!createRes.ok) {
        const errJson = await createRes.json().catch(() => ({}));
        throw new Error((errJson as { message?: string }).message || 'Ошибка создания заведения');
      }
      const { data: newBiz, token: newToken } = await createRes.json() as { data: Business; token?: string };

      if (newToken) {
        try {
          localStorage.setItem('yookie_auth_token', newToken);
          const authState = useAuthStore.getState();
          if (authState.user) {
            const updatedUser = { ...authState.user, businessId: newBiz.id };
            localStorage.setItem('yookie_auth_user', JSON.stringify(updatedUser));
            useAuthStore.setState({ user: updatedUser, token: newToken });
          }
        } catch { /* storage unavailable */ }
      }

      setMerchantId(newBiz.id);
      setCreatedBusinessId(newBiz.id);

      // Create pending staff
      if (pendingStaff.length > 0) {
        const staffResults = await Promise.allSettled(
          pendingStaff.map(s => upsertStaff(newBiz.id, { name: s.name, specialization: s.specialization, photo_url: s.photo_url }))
        );
        const staffFailed = staffResults.filter(r => r.status === 'rejected').length;
        if (staffFailed > 0) {
          setError(`Заведение создано, но ${staffFailed} сотр. не сохранились. Добавьте их в настройках.`);
          setSaving(false);
          setMerchantId(newBiz.id);
          navigate('/pro');
          return;
        }
      }

      navigate('/pro');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания');
    } finally {
      setSaving(false);
      creatingRef.current = false;
    }
  };

  return (
    <div className={styles.wizard}>
      {showMapPicker && (
        <MapPickerOverlay
          initialCenter={mapCenter}
          onConfirm={(lt, ln) => { setLat(lt); setLng(ln); setShowMapPicker(false); }}
          onClose={() => setShowMapPicker(false)}
        />
      )}

      {/* Wizard header with progress */}
      <div className={styles.wizardHeader}>
        <button className={styles.wizardBackBtn} onClick={handleBack} aria-label="Назад">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 4L6 10L12 16" />
          </svg>
        </button>
        <div className={styles.wizardProgress}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`${styles.wizardProgressSegment} ${i < step ? styles.wizardProgressActive : ''}`}
            />
          ))}
        </div>
        <span className={styles.wizardStepCount}>{step}/{TOTAL_STEPS}</span>
      </div>

      {/* Scrollable content */}
      <div className={styles.wizardContent}>
        {/* ── Step 1: Basic info ─────────────────────────────── */}
        {step === 1 && (
          <div className={styles.stepBody}>
            <div className={styles.stepHeadline}>
              <h1 className={styles.stepTitle}>Расскажите о бизнесе</h1>
              <p className={styles.stepSubtitle}>Эта информация поможет клиентам найти и выбрать вас</p>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Название <span className={styles.required}>*</span></label>
              <input
                className={styles.fieldInput}
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Студия красоты, барбершоп…"
                autoFocus
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Категория <span className={styles.required}>*</span></label>
              <select
                className={styles.fieldInput}
                value={category}
                onChange={e => setCategory(e.target.value as CategoryEnum)}
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Описание</label>
              <textarea
                className={styles.fieldTextarea}
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                placeholder="Несколько слов о вашем заведении — стиль, атмосфера, особенности…"
              />
            </div>
          </div>
        )}

        {/* ── Step 2: Location & contacts ────────────────────── */}
        {step === 2 && (
          <div className={styles.stepBody}>
            <div className={styles.stepHeadline}>
              <h1 className={styles.stepTitle}>Как вас найти?</h1>
              <p className={styles.stepSubtitle}>Укажите адрес и контакты для связи с клиентами</p>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Город</label>
              <select
                className={styles.fieldInput}
                value={city}
                onChange={e => { setCity(e.target.value); setLat(null); setLng(null); }}
              >
                {UZBEKISTAN_CITIES.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Адрес</label>
              <div className={styles.addressRow}>
                <input
                  className={`${styles.fieldInput} ${styles.addressInput}`}
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="ул. Примерная, 1"
                />
                <button
                  className={styles.mapPinBtn}
                  type="button"
                  onClick={() => setShowMapPicker(true)}
                  title="Поставить пин на карте"
                >
                  {lat !== null ? '📍✓' : '📍'}
                </button>
              </div>
              {lat !== null && (
                <span className={styles.coordsHint}>
                  Координаты: {lat.toFixed(5)}, {lng?.toFixed(5)}
                </span>
              )}
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Телефон</label>
              <input
                className={styles.fieldInput}
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={e => setPhone(formatPhoneMask(e.target.value))}
                placeholder="+998 XX XXX-XX-XX"
              />
            </div>

            <div className={styles.sectionDivider}>
              <span className={styles.sectionDividerLabel}>Портфолио и контакты</span>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>
                Instagram
                <span className={styles.fieldBadge}>Портфолио</span>
              </label>
              <div className={styles.socialInput}>
                <span className={styles.socialPrefix}>@</span>
                <input
                  className={`${styles.fieldInput} ${styles.socialField}`}
                  value={instagram}
                  onChange={e => setInstagram(e.target.value.replace(/^@/, ''))}
                  placeholder="username"
                />
              </div>
              <p className={styles.fieldHint}>
                Добавьте ссылки на посты — они появятся в профиле как галерея работ
              </p>
            </div>

            {/* Instagram post URLs */}
            {instagram.trim() && (
              <InstagramPostUrlsEditor
                urls={instagramPostUrls}
                input={instagramPostInput}
                onInputChange={setInstagramPostInput}
                onAdd={url => { if (instagramPostUrls.length < 6) setInstagramPostUrls(prev => [...prev, url]); setInstagramPostInput(''); }}
                onRemove={i => setInstagramPostUrls(prev => prev.filter((_, j) => j !== i))}
              />
            )}

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Telegram</label>
              <div className={styles.socialInput}>
                <span className={styles.socialPrefix}>@</span>
                <input
                  className={`${styles.fieldInput} ${styles.socialField}`}
                  value={telegramUsername}
                  onChange={e => setTelegramUsername(e.target.value.replace(/^@/, ''))}
                  placeholder="username"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Photos & staff ─────────────────────────── */}
        {step === 3 && (
          <div className={styles.stepBody}>
            <div className={styles.stepHeadline}>
              <h1 className={styles.stepTitle}>Фото и команда</h1>
              <p className={styles.stepSubtitle}>Привлекательные фото повышают конверсию записей</p>
            </div>

            {/* Onboarding checklist */}
            <div className={styles.onboardingChecklist}>
              <div className={styles.checklistHeader}>
                <h3 className={styles.checklistTitle}>Готовность к запуску</h3>
                <span className={styles.checklistProgress}>{completionPercentage}%</span>
              </div>
              {onboardingSteps.map((step) => (
                <div
                  key={step.id}
                  className={`${styles.checklistItem} ${step.isCompleted ? styles.checklistItemCompleted : ''}`}
                >
                  <div className={styles.checklistIcon}>
                    {step.isCompleted ? '✅' : '⬜'}
                  </div>
                  <div className={styles.checklistContent}>
                    <span className={styles.checklistItemTitle}>{step.title}</span>
                    <span className={styles.checklistItemDesc}>{step.description}</span>
                  </div>
                </div>
              ))}
              {!isValidated && (
                <p className={styles.checklistWarning}>
                  ⚠️ Заполните все обязательные пункты для публикации в B2C
                </p>
              )}
            </div>

            {/* Photo upload */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Фотографии заведения</label>
              <div className={styles.photoGrid}>
                {photoUrls.map((url, i) => (
                  <div key={url} className={styles.photoThumb}>
                    <img src={url} alt={`Фото ${i + 1}`} className={styles.photoThumbImg} />
                    <button
                      className={styles.photoRemove}
                      onClick={() => setPhotoUrls(prev => prev.filter((_, j) => j !== i))}
                    >✕</button>
                    {i === 0 && <span className={styles.photoPrimary}>Главное</span>}
                  </div>
                ))}
                <button
                  className={styles.photoAddBtn}
                  onClick={() => photoInputRef.current?.click()}
                  disabled={photoUploading}
                >
                  <span className={styles.photoAddIcon}>{photoUploading ? '…' : '+'}</span>
                  <span className={styles.photoAddLabel}>{photoUploading ? 'Загрузка…' : 'Добавить фото'}</span>
                </button>
              </div>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className={styles.fileInput}
                onChange={handlePhotoAdd}
              />
            </div>

            {/* Staff */}
            <div className={styles.sectionDivider}>
              <span className={styles.sectionDividerLabel}>Мастера</span>
            </div>

            {pendingStaff.length > 0 && (
              <div className={styles.staffList}>
                {pendingStaff.map(s => (
                  <div key={s.tempId} className={styles.staffCard}>
                    <div className={styles.staffAvatar}>
                      {s.photo_url
                        ? <img src={s.photo_url} alt={s.name} className={styles.staffAvatarImg} />
                        : (s.name?.[0] ?? '?').toUpperCase()
                      }
                    </div>
                    <div className={styles.staffInfo}>
                      <span className={styles.staffName}>{s.name}</span>
                      <span className={styles.staffSpec}>{s.specialization || 'Мастер'}</span>
                    </div>
                    <button
                      className={styles.staffRemove}
                      onClick={() => setPendingStaff(prev => prev.filter(x => x.tempId !== s.tempId))}
                    >✕</button>
                  </div>
                ))}
              </div>
            )}

            {staffFormOpen ? (
              <div className={styles.staffForm}>
                <div className={styles.staffPhotoRow}>
                  <div
                    className={styles.staffPhotoPreview}
                    onClick={() => staffPhotoInputRef.current?.click()}
                    style={staffPhotoUrl ? { backgroundImage: `url(${staffPhotoUrl})` } : undefined}
                  >
                    {!staffPhotoUrl && <span>{staffPhotoUploading ? '…' : '+'}</span>}
                  </div>
                  <input
                    ref={staffPhotoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className={styles.fileInput}
                    onChange={handleStaffPhotoAdd}
                  />
                  <div className={styles.staffFormFields}>
                    <input
                      className={styles.fieldInput}
                      placeholder="Имя мастера *"
                      value={staffName}
                      onChange={e => setStaffName(e.target.value)}
                      autoFocus
                    />
                    <input
                      className={styles.fieldInput}
                      placeholder="Специализация"
                      value={staffSpec}
                      onChange={e => setStaffSpec(e.target.value)}
                    />
                  </div>
                </div>
                <div className={styles.staffFormActions}>
                  <button className={styles.staffCancelBtn} onClick={() => { setStaffFormOpen(false); setStaffName(''); setStaffSpec(''); setStaffPhotoUrl(undefined); }}>
                    Отмена
                  </button>
                  <button className={styles.staffSaveBtn} onClick={handleAddStaff} disabled={!staffName.trim()}>
                    Добавить
                  </button>
                </div>
              </div>
            ) : (
              <button className={styles.addStaffBtn} onClick={() => setStaffFormOpen(true)}>
                <span>+</span> Добавить мастера
              </button>
            )}

            <p className={styles.staffSkipHint}>
              Мастеров можно добавить позже в разделе «Сотрудники»
            </p>
          </div>
        )}
      </div>

      {/* Error */}
      {error && <p className={styles.wizardError}>{error}</p>}

      {/* Preview button on last step */}
      {step === TOTAL_STEPS && (
        <div className={styles.wizardPreviewBtnWrapper}>
          <button
            className={styles.wizardPreviewBtn}
            onClick={() => navigate('/pro/preview')}
            type="button"
          >
            👁️ Как видят клиенты
          </button>
        </div>
      )}

      {/* Sticky CTA */}
      <div className={styles.wizardFooter}>
        <button
          className={styles.wizardCTA}
          onClick={step < TOTAL_STEPS ? handleNext : handleCreate}
          disabled={saving || photoUploading}
        >
          {saving ? 'Создание…' : step < TOTAL_STEPS ? 'Далее' : 'Создать бизнес'}
        </button>
        <button
          className={styles.wizardSkipBtn}
          onClick={handleCreate}
          disabled={saving || photoUploading}
        >
          {step === 1 ? 'Создать сейчас →' : 'Пропустить →'}
        </button>
      </div>
    </div>
  );
}

/* ── Edit form (existing business) ─────────────────────────────── */
export default function MerchantSettingsPage() {
  const navigate = useNavigate();
  const auth = useAuthStore();
  const { merchantId, setMerchantId } = useMerchantStore();
  const isNew = !merchantId;
  const [onboardingMode, setOnboardingMode] = useState<'choice' | 'create' | 'join'>('choice');

  // Auth guard
  useEffect(() => {
    if (!auth.isAuthenticated) {
      navigate('/auth?return=/pro', { replace: true });
    }
  }, [auth.isAuthenticated]);

  if (!auth.isAuthenticated) return null;

  // New business → fork screen
  if (isNew) {
    if (onboardingMode === 'join') return <JoinBusiness onBack={() => setOnboardingMode('choice')} />;
    if (onboardingMode === 'create') return <BusinessWizard />;
    return (
      <OnboardingChoice
        onCreateNew={() => setOnboardingMode('create')}
        onJoin={() => setOnboardingMode('join')}
      />
    );
  }

  // Existing business → edit form
  return <BusinessEditForm merchantId={merchantId} />;
}

function BusinessEditForm({ merchantId }: { merchantId: string }) {
  const navigate = useNavigate();
  const { setMerchantId } = useMerchantStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Tashkent');
  const [phone, setPhone] = useState('');
  const [instagram, setInstagram] = useState('');
  const [instagramPostUrls, setInstagramPostUrls] = useState<string[]>([]);
  const [instagramPostInput, setInstagramPostInput] = useState('');
  const [telegramUsername, setTelegramUsername] = useState('');
  const [category, setCategory] = useState<CategoryEnum>('other');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get<Business>(`/businesses/${merchantId}`)
      .then(b => {
        if (b) {
          setName(b.name || '');
          setDescription(b.description || '');
          setAddress(b.address || '');
          const matched = UZBEKISTAN_CITIES.find(c => c.id === b.city || c.name === b.city);
          setCity(matched?.id ?? 'Tashkent');
          setPhone(b.phone || '');
          setInstagram(b.instagram || '');
          setInstagramPostUrls(b.instagram_post_urls ?? []);
          setTelegramUsername(b.telegram_username || '');
          setCategory(b.category || 'other');
          const urls = (b as any).photo_urls as string[] | undefined;
          if (urls && urls.length > 0) setPhotoUrls(urls);
          else if (b.photo_url) setPhotoUrls([b.photo_url]);
          setLat((b as any).lat ?? null);
          setLng((b as any).lng ?? null);
        }
      })
      .catch(() => {});
  }, [merchantId]);

  const uploadImage = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append('image', file);
    const token = localStorage.getItem('yookie_auth_token');
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/businesses/upload-image`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    });
    if (!res.ok) throw new Error('Ошибка загрузки');
    const json = await res.json() as { url: string };
    return json.url;
  };

  const handlePhotoAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadImage(file);
      setPhotoUrls(prev => [...prev, url]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Удалить заведение?')) return;
    setSaving(true);
    try {
      await api.delete<{ success: boolean }>(`/businesses/${merchantId}`);
      setMerchantId(null);
      try {
        const storedUser = JSON.parse(localStorage.getItem('yookie_auth_user') || '{}');
        storedUser.businessId = null;
        localStorage.setItem('yookie_auth_user', JSON.stringify(storedUser));
        useAuthStore.setState(s => ({ user: s.user ? { ...s.user, businessId: null } : null }));
      } catch { /* noop */ }
      navigate('/pro');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) { setError('Введите название'); return; }
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        category,
        description: description.trim() || undefined,
        address: address.trim() || undefined,
        city,
        phone: phone.trim() || undefined,
        instagram: instagram.trim() ? instagram.replace(/^@/, '') : null,
        instagram_post_urls: instagramPostUrls,
        telegram_username: telegramUsername.trim() ? telegramUsername.replace(/^@/, '') : null,
        photo_url: photoUrls[0] || null,
        photo_urls: photoUrls,
        is_active: true,
        ...(lat !== null && lng !== null ? { lat, lng } : {}),
      };
      await api.patch<{ data: Business }>(`/businesses/${merchantId}`, body);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const mapCenter: [number, number] = lat && lng ? [lat, lng] : CITY_COORDS[city] ?? [41.2995, 69.2401];

  return (
    <ProLayout title="Профиль">
      {showMapPicker && (
        <MapPickerOverlay
          initialCenter={mapCenter}
          onConfirm={(lt, ln) => { setLat(lt); setLng(ln); setShowMapPicker(false); }}
          onClose={() => setShowMapPicker(false)}
        />
      )}

      {/* Photos */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Фотографии</label>
        <div className={styles.photoGrid}>
          {photoUrls.map((url, i) => (
            <div key={url} className={styles.photoThumb}>
              <img src={url} alt={`Фото ${i + 1}`} className={styles.photoThumbImg} />
              <button className={styles.photoRemove} onClick={() => setPhotoUrls(prev => prev.filter((_, j) => j !== i))}>✕</button>
              {i === 0 && <span className={styles.photoPrimary}>Главное</span>}
            </div>
          ))}
          <button className={styles.photoAddBtn} onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            <span className={styles.photoAddIcon}>{uploading ? '…' : '+'}</span>
            <span className={styles.photoAddLabel}>{uploading ? 'Загрузка…' : 'Добавить'}</span>
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className={styles.fileInput} onChange={handlePhotoAdd} />
      </div>

      <div className={styles.form}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Название *</label>
          <input className={styles.fieldInput} value={name} onChange={e => setName(e.target.value)} placeholder="Студия красоты…" />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Категория</label>
          <select className={styles.fieldInput} value={category} onChange={e => setCategory(e.target.value as CategoryEnum)}>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Описание</label>
          <textarea className={styles.fieldTextarea} value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Несколько слов о заведении…" />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Город</label>
          <select className={styles.fieldInput} value={city} onChange={e => setCity(e.target.value)}>
            {UZBEKISTAN_CITIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Адрес</label>
          <div className={styles.addressRow}>
            <input className={`${styles.fieldInput} ${styles.addressInput}`} value={address} onChange={e => setAddress(e.target.value)} placeholder="ул. Примерная, 1" />
            <button className={styles.mapPinBtn} type="button" onClick={() => setShowMapPicker(true)} title="Поставить пин на карте">
              {lat !== null ? '📍✓' : '📍'}
            </button>
          </div>
          {lat !== null && <span className={styles.coordsHint}>Координаты: {lat.toFixed(5)}, {lng?.toFixed(5)}</span>}
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Телефон</label>
          <input className={styles.fieldInput} type="tel" inputMode="tel" value={phone} onChange={e => setPhone(formatPhoneMask(e.target.value))} placeholder="+998 XX XXX-XX-XX" />
        </div>

        <div className={styles.sectionDivider}>
          <span className={styles.sectionDividerLabel}>Портфолио и контакты</span>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            Instagram
            <span className={styles.fieldBadge}>Портфолио</span>
          </label>
          <div className={styles.socialInput}>
            <span className={styles.socialPrefix}>@</span>
            <input className={`${styles.fieldInput} ${styles.socialField}`} value={instagram} onChange={e => setInstagram(e.target.value.replace(/^@/, ''))} placeholder="username" />
          </div>
          <p className={styles.fieldHint}>
            Добавьте ссылки на посты — они появятся в профиле как галерея работ
          </p>
        </div>

        {instagram.trim() && (
          <InstagramPostUrlsEditor
            urls={instagramPostUrls}
            input={instagramPostInput}
            onInputChange={setInstagramPostInput}
            onAdd={url => { if (instagramPostUrls.length < 6) setInstagramPostUrls(prev => [...prev, url]); setInstagramPostInput(''); }}
            onRemove={i => setInstagramPostUrls(prev => prev.filter((_, j) => j !== i))}
          />
        )}

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Telegram</label>
          <div className={styles.socialInput}>
            <span className={styles.socialPrefix}>@</span>
            <input className={`${styles.fieldInput} ${styles.socialField}`} value={telegramUsername} onChange={e => setTelegramUsername(e.target.value.replace(/^@/, ''))} placeholder="username" />
          </div>
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <button className={styles.saveBtn} onClick={handleSave} disabled={saving || uploading}>
        {saving ? 'Сохранение…' : 'Сохранить'}
      </button>

      <button className={styles.deleteBtn} onClick={handleDelete} disabled={saving}>
        Удалить заведение
      </button>
    </ProLayout>
  );
}
