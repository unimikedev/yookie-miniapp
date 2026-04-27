import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { ProLayout } from '@/pro/components/ProLayout/ProLayout';
import { useMerchantStore } from '@/pro/stores/merchantStore';
import { getMerchantShareLink, getTelegramShareUrl } from '@/shared/constants';
import { api } from '@/lib/api/client';
import { useBusinessExit } from '@/pro/hooks/useBusinessExit';
import styles from './MorePage.module.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export default function MorePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { merchantId } = useMerchantStore();
  const { leaveWithoutResigning, logout, loading: exitLoading, error: exitError } = useBusinessExit();

  const [copied, setCopied] = useState(false);
  const [qrVisible, setQrVisible] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<{ sent: number; total: number } | null>(null);

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

  const handleBroadcast = async () => {
    if (!merchantId || !shareLink) return;

    const confirmed = await new Promise<boolean>((resolve) => {
      window.Telegram?.WebApp?.showConfirm(
        'Отправить ссылку на ваш салон всем клиентам в Telegram?',
        resolve,
      );
    });
    if (!confirmed) return;

    setBroadcasting(true);
    setBroadcastResult(null);
    try {
      const text =
        `✨ Теперь вы можете записаться к нам онлайн!\n\n` +
        `Перейдите по ссылке и запишитесь в пару кликов:\n${shareLink}`;

      const result = await api.post<{ sent: number; total: number }>(
        `${API_BASE}/merchants/${merchantId}/broadcast`,
        { message: text },
      );
      setBroadcastResult(result);
    } catch {
      window.Telegram?.WebApp?.showAlert('Не удалось отправить рассылку. Попробуйте позже.');
    } finally {
      setBroadcasting(false);
    }
  };

  const items = [
    { label: t('pro.more.schedule'),        path: '/pro/schedule' },
    { label: t('pro.more.services'),        path: '/pro/services' },
    { label: t('pro.more.staff'),           path: '/pro/staff' },
    { label: 'Галерея',                     path: '/pro/gallery' },
    { label: t('pro.more.profileSettings'), path: '/pro/settings' },
    { label: t('pro.more.preview'),         path: '/pro/preview' },
    { label: t('pro.more.myBusinesses'),    path: '/pro/select' },
  ];

  return (
    <ProLayout title={t('pro.more.title')}>
      <div className={styles.list}>
        {shareLink && (
          <div className={styles.shareCard}>
            <p className={styles.shareTitle}>{t('pro.more.shareTitle')}</p>
            <p className={styles.shareHint}>
              {t('pro.more.shareHint')}
            </p>

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

            <button
              className={styles.qrToggle}
              onClick={() => setQrVisible((v) => !v)}
            >
              {qrVisible ? t('pro.more.hideQr') : t('pro.more.showQr')}
            </button>

            {qrVisible && (
              <div className={styles.qrWrap}>
                <QRCodeSVG
                  value={shareLink}
                  size={200}
                  bgColor="transparent"
                  fgColor="var(--color-text)"
                  level="M"
                />
                <p className={styles.qrHint}>{t('pro.more.qrHint')}</p>
              </div>
            )}

            <div className={styles.divider} />

            <button
              className={styles.broadcastBtn}
              onClick={handleBroadcast}
              disabled={broadcasting}
            >
              {broadcasting ? t('pro.more.broadcasting') : `📣 ${t('pro.more.broadcastBtn')}`}
            </button>

            {broadcastResult && (
              <p className={styles.broadcastResult}>
                {t('pro.more.broadcastResult', { sent: broadcastResult.sent, total: broadcastResult.total })}
              </p>
            )}
          </div>
        )}

        {items.map((item) => (
          <button
            key={item.path}
            className={styles.row}
            onClick={() => navigate(item.path)}
          >
            <span>{item.label}</span>
            <span className={styles.chev}>›</span>
          </button>
        ))}

        <button
          className={styles.addBusinessBtn}
          onClick={() => navigate('/pro/new-business')}
        >
          {t('pro.more.addBusiness')}
        </button>

        <div className={styles.accountSection}>
          {exitError && <p className={styles.accountError}>{exitError}</p>}
          <button
            className={styles.leaveBtn}
            onClick={() => merchantId && leaveWithoutResigning(merchantId)}
            disabled={exitLoading}
          >
            {t('pro.more.leaveBusiness')}
          </button>
          <button
            className={styles.logoutBtn}
            onClick={logout}
            disabled={exitLoading}
          >
            {t('pro.more.logoutBtn')}
          </button>
        </div>
      </div>
    </ProLayout>
  );
}
