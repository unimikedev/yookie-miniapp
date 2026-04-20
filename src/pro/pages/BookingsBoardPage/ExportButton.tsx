import { useState } from 'react';
import { useMerchantStore } from '@/pro/stores/merchantStore';
import { listBookings, listClients } from '@/pro/api';
import styles from './ExportButton.module.css';

interface ExportData {
  filename: string;
  data: any[][];
}

/**
 * #21 Export Data - CSV экспорт для мерчанта
 * Позволяет выгрузить клиентов и записи в CSV/Excel
 */
export function ExportButton({ type }: { type: 'clients' | 'bookings' }) {
  const { merchantId } = useMerchantStore();
  const [exporting, setExporting] = useState(false);

  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const downloadCSV = (filename: string, rows: any[][]) => {
    const csvContent = rows.map(row => row.map(escapeCSV).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleExport = async () => {
    if (!merchantId) return;
    setExporting(true);

    try {
      let exportData: ExportData;

      if (type === 'clients') {
        const clients = await listClients(merchantId);
        const headers = ['ID', 'Имя', 'Телефон', 'Telegram', 'Последний визит', 'Всего записей'];
        const rows = clients.map(c => [
          c.id,
          c.name,
          c.phone || '',
          c.telegram_username || '',
          c.last_visit ? new Date(c.last_visit).toLocaleDateString('ru-RU') : '',
          c.total_bookings || 0
        ]);
        exportData = {
          filename: `clients_${new Date().toISOString().split('T')[0]}.csv`,
          data: [headers, ...rows]
        };
      } else {
        const today = new Date().toISOString().slice(0, 10);
        const bookings = await listBookings(merchantId, { from: `${today}T00:00:00`, to: `${today}T23:59:59` });
        const headers = ['ID', 'Клиент', 'Телефон', 'Услуга', 'Мастер', 'Дата', 'Время', 'Статус', 'Создано'];
        const rows = bookings.map(b => [
          b.id,
          b.clients?.name ?? '',
          b.clients?.phone ?? '',
          b.services?.name ?? '',
          b.masters?.name ?? '',
          new Date(b.starts_at).toLocaleDateString('ru-RU'),
          new Date(b.starts_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
          b.status,
          new Date(b.created_at ?? '').toLocaleString('ru-RU')
        ]);
        exportData = {
          filename: `bookings_${new Date().toISOString().split('T')[0]}.csv`,
          data: [headers, ...rows]
        };
      }

      downloadCSV(exportData.filename, exportData.data);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Ошибка экспорта. Попробуйте позже.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      className={styles.exportBtn}
      onClick={handleExport}
      disabled={exporting}
      title={`Экспорт ${type === 'clients' ? 'клиентов' : 'записей'} в CSV`}
    >
      {exporting ? (
        <>
          <span className={styles.spinner} />
          Экспорт...
        </>
      ) : (
        <>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 1v12M8 13l-4-4M8 13l4-4M3 15h10" />
          </svg>
          Скачать CSV
        </>
      )}
    </button>
  );
}
