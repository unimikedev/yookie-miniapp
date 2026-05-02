import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { ProLayout } from '@/pro/components/ProLayout/ProLayout';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useMerchantStore } from '@/pro/stores/merchantStore';
import { useAuthStore } from '@/stores/authStore';
import { getMerchantShareLink, getTelegramShareUrl } from '@/shared/constants';
import { leaveBusinessApi } from '@/pro/api';
import styles from './MorePage.module.css';

export default function MorePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { merchantId, setMerchantId, setRole, setMasterId } = useMerchantStore();
  const { logout: authLogout } = useAuthStore();

  const [copied, setCopied] = useState(false);
  const [qrVisible, setQrVisible] = useState(false);
  const [exitSheetOpen, setExitSheetOpen] = useState(false);
  const [exitLoading, setExitLoading] = useState(false);

  const shareLink = merchantId ? getMerchantShareLink(merchantId) : null;

  const handleCopy = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.Telegram?.WebApp?.showAlert('Не удалось скопировать ссылку');
    }
  };

  const handleTelegramShare = () => {
    if (!shareLink) return;
    const url = getTelegramShareUrl(shareLink, 'наш салон');
    window.Telegram?.WebApp?.openTelegramLink(url);
  };

  const handleLeaveOnly = async () => {
    if (!merchantId) return;
    setExitLoading(true);
    try {
      const res = await leaveBusinessApi(merchantId);
      localStorage.setItem('yookie_auth_token', res.token);
      if (res.nextBusinessId) {
        setMerchantId(res.nextBusinessId);
      } else {
        setMerchantId(null);
        setRole(null);
        setMasterId(null);
      }
      setExitSheetOpen(false);
      navigate('/pro', { replace: true });
    } catch {
      window.Telegram?.WebApp?.showAlert('Не удалось выйти из заведения');
    } finally {
      setExitLoading(false);
    }
  };

  const handleFullLogout = () => {
    setExitSheetOpen(false);
    setMerchantId(null);
    setRole(null);
    setMasterId(null);
    authLogout();
    navigate('/', { replace: true });
  };

  return (
    <ProLayout title={t('pro.more.title')}>
      <div className={styles.list}>

        {/* ── Share card ── */}
        {shareLink && (
          <div className={styles.shareCard}>
            <p className={styles.shareTitle}>{t('pro.more.shareTitle')}</p>
            <p className={styles.shareHint}>{t('pro.more.shareHint')}</p>

            <div className={styles.linkBox}>
              <span className={styles.linkText}>{shareLink}</span>
            </div>

            <div className={styles.shareActions}>
              <button className={styles.copyBtn} onClick={handleCopy}>
                {copied ? t('pro.more.copied') : t('pro.more.copy')}
              </button>
              <button className={styles.tgBtn} onClick={handleTelegramShare}>
                {t('pro.more.shareVia')}
              </button>
            </div>

            <button className={styles.qrToggle} onClick={() => setQrVisible(v => !v)}>
              {qrVisible ? t('pro.more.hideQr') : t('pro.more.showQr')}
            </button>

            {qrVisible && (
              <div className={styles.qrWrap}>
                <QRCodeSVG value={shareLink} size={200} bgColor="transparent" fgColor="var(--color-text)" level="M" />
                <p className={styles.qrHint}>{t('pro.more.qrHint')}</p>
              </div>
            )}
          </div>
        )}

        {/* ── Команда ── */}
        <p className={styles.groupLabel}>Команда</p>
        <button className={styles.row} onClick={() => navigate('/pro/staff')}>
          <span>Мастера</span><span className={styles.chev}>›</span>
        </button>
        <button className={styles.row} onClick={() => navigate('/pro/services')}>
          <span>{t('pro.more.services')}</span><span className={styles.chev}>›</span>
        </button>
        <button className={styles.row} onClick={() => navigate('/pro/gallery')}>
          <span>Галерея</span><span className={styles.chev}>›</span>
        </button>

        {/* ── Заведение ── */}
        <p className={styles.groupLabel}>Заведение</p>
        <button className={styles.row} onClick={() => navigate('/pro/my-profile')}>
          <span>Логотип и профиль</span><span className={styles.chev}>›</span>
        </button>
        <button className={styles.row} onClick={() => navigate('/pro/schedule')}>
          <span>{t('pro.more.schedule')}</span><span className={styles.chev}>›</span>
        </button>
        <button className={styles.row} onClick={() => navigate('/pro/settings')}>
          <span>{t('pro.more.profileSettings')}</span><span className={styles.chev}>›</span>
        </button>
        <button className={styles.row} onClick={() => navigate('/pro/select')}>
          <span>Сменить бизнес</span><span className={styles.chev}>›</span>
        </button>
        <button className={styles.addBusinessBtn} onClick={() => navigate('/pro/new-business')}>
          {t('pro.more.addBusiness')}
        </button>

        {/* ── Выход ── */}
        <p className={styles.groupLabel}>Аккаунт</p>
        <button className={styles.logoutBtn} onClick={() => setExitSheetOpen(true)}>
          Выйти
        </button>

      </div>

      {/* ── Exit bottom sheet ── */}
      <BottomSheet open={exitSheetOpen} onClose={() => setExitSheetOpen(false)} title="Выйти">
        <div className={styles.exitOptions}>
          <button
            className={styles.exitOptionBtn}
            onClick={handleLeaveOnly}
            disabled={exitLoading}
          >
            <span className={styles.exitOptionTitle}>Выйти из заведения</span>
            <span className={styles.exitOptionDesc}>Только выйти из бизнеса. Аккаунт и записи сохранятся. Можно вернуться позже.</span>
          </button>
          <div className={styles.exitDivider} />
          <button
            className={`${styles.exitOptionBtn} ${styles.exitOptionDanger}`}
            onClick={handleFullLogout}
            disabled={exitLoading}
          >
            <span className={styles.exitOptionTitle}>Выйти из аккаунта</span>
            <span className={styles.exitOptionDesc}>Полный выход из учётной записи и заведения.</span>
          </button>
          <button
            className={styles.cancelBtn}
            onClick={() => setExitSheetOpen(false)}
            disabled={exitLoading}
          >
            Отмена
          </button>
        </div>
      </BottomSheet>
    </ProLayout>
  );
}
