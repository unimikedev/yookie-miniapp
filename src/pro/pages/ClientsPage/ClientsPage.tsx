import { useEffect, useState, useMemo } from 'react';
import { ProLayout } from '@/pro/components/ProLayout/ProLayout';
import { useMerchantStore } from '@/pro/stores/merchantStore';
import { listClients, listBookings } from '@/pro/api';
import { useMerchantSearch, searchPresets } from '@/pro/hooks/useMerchantSearch';
import { ExportButton } from './ExportButton';
import type { Client, Booking } from '@/lib/api/types';
import styles from './ClientsPage.module.css';

export default function ClientsPage() {
  const { merchantId } = useMerchantStore();
  const [clients, setClients] = useState<Client[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!merchantId) return;
    listClients(merchantId).then(setClients).catch(() => {});
    // Load a wide range for history
    const from = new Date();
    from.setMonth(from.getMonth() - 6);
    const to = new Date();
    to.setMonth(to.getMonth() + 1);
    listBookings(merchantId, {
      from: from.toISOString(),
      to: to.toISOString(),
    }).then(setBookings).catch(() => {});
  }, [merchantId]);

  // Use the new search hook for consistent UX
  const {
    query: search,
    setQuery: setSearch,
    filteredItems: filtered,
    hasResults,
    resultsCount,
    totalItems,
  } = useMerchantSearch<Client>(
    clients,
    ['name', 'phone'],
    searchPresets.clients.placeholder
  );

  const bookingsFor = (clientId: string) =>
    bookings
      .filter((b) => b.client_id === clientId)
      .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime());

  return (
    <ProLayout title="Клиенты">
      <div className={styles.pageHeader}>
        <input
          className={styles.search}
          placeholder={searchPresets.clients.placeholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <ExportButton type="clients" />
      </div>

      {totalItems > 0 && (
        <div className={styles.resultsInfo}>
          {hasResults 
            ? `Найдено ${resultsCount} из ${totalItems}` 
            : 'Ничего не найдено'}
        </div>
      )}

      <div className={styles.list}>
        {filtered.length === 0 && totalItems > 0 ? (
          <div className={styles.emptyState}>
            Нет клиентов по вашему запросу
          </div>
        ) : filtered.length === 0 && totalItems === 0 ? (
          <div className={styles.emptyState}>
            Клиенты появятся после первых записей
          </div>
        ) : (
          filtered.map((c) => {
          const hist = bookingsFor(c.id);
          const isOpen = expanded === c.id;
          return (
            <div key={c.id} className={styles.card}>
              <button
                className={styles.cardHead}
                onClick={() => setExpanded(isOpen ? null : c.id)}
              >
                <div className={styles.avatar}>{c.name[0]}</div>
                <div className={styles.info}>
                  <span className={styles.name}>{c.name}</span>
                  <span className={styles.phone}>{c.phone}</span>
                </div>
                <span className={styles.badge}>{hist.length}</span>
                <span className={styles.chev}>{isOpen ? '▾' : '›'}</span>
              </button>

              {isOpen && (
                <div className={styles.history}>
                  {hist.length === 0 && (
                    <span className={styles.histEmpty}>Нет записей</span>
                  )}
                  {hist.map((b) => (
                    <div key={b.id} className={styles.histRow}>
                      <span className={styles.histDate}>
                        {new Date(b.starts_at).toLocaleDateString('ru-RU', {
                          day: 'numeric', month: 'short',
                        })}
                      </span>
                      <span className={styles.histService}>{b.services?.name ?? '—'}</span>
                      <span className={`${styles.histStatus} ${styles[`st-${b.status}`] ?? ''}`}>
                        {b.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
      </div>
    </ProLayout>
  );
}
