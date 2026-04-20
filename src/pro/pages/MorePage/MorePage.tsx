import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { ProLayout } from '@/pro/components/ProLayout/ProLayout';
import { useMerchantStore } from '@/pro/stores/merchantStore';
import { getMerchantShareLink, getTelegramShareUrl } from '@/shared/constants';
import { api } from '@/lib/api/client';
import styles from './MorePage.module.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export default function MorePage() {
  const navigate = useNavigate();
  const { merchantId } = useMerchantStore();

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
    { label: 'Сотрудники', path: '/pro/staff' },
    { label: 'Клиенты', path: '/pro/clients' },
    { label: 'Профиль заведения', path: '/pro/settings' },
    { label: 'Предпросмотр страницы', path: '/pro/preview' },
  ];

  return (
    <ProLayout title="Ещё">
      <div className={styles.list}>
        {shareLink && (
          <div className={styles.shareCard}>
            <p className={styles.shareTitle}>Ссылка на ваш салон</p>
            <p className={styles.shareHint}>
              Клиент перейдёт прямо на вашу страницу в Yookie
            </p>

            <div className={styles.linkBox}>
              <span className={styles.linkText}>{shareLink}</span>
            </div>

            <div className={styles.shareActions}>
              <button className={styles.copyBtn} onClick={handleCopy}>
                {copied ? 'Скопировано!' : 'Скопировать'}
              </button>
              <button className={styles.tgBtn} onClick={handleTelegramShare}>
                Поделиться
              </button>
            </div>

            <button
              className={styles.qrToggle}
              onClick={() => setQrVisible((v) => !v)}
            >
              {qrVisible ? 'Скрыть QR-код' : 'Показать QR-код'}
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
                <p className={styles.qrHint}>Распечатайте и разместите у стойки</p>
              </div>
            )}

            <div className={styles.divider} />

            <button
              className={styles.broadcastBtn}
              onClick={handleBroadcast}
              disabled={broadcasting}
            >
              {broadcasting ? 'Отправка...' : '📣 Уведомить клиентов в Telegram'}
            </button>

            {broadcastResult && (
              <p className={styles.broadcastResult}>
                Отправлено: {broadcastResult.sent} из {broadcastResult.total} клиентов
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
      </div>
    </ProLayout>
  );
}
