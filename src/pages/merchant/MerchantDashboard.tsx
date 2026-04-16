/**
 * Merchant Dashboard (B2B)
 * Main dashboard for merchants to manage bookings, services, staff, and profile
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/ui';
import { Card, CardHeader, CardBody, CardFooter } from '@/shared/ui';
import { useBusinessStore } from '@/stores/businessStore';
import styles from './MerchantDashboard.module.css';

type Tab = 'bookings' | 'services' | 'staff' | 'profile' | 'clients';

export const MerchantDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { 
    currentMerchant: merchant, 
    isAuthenticated, 
    merchantBookings: bookings, 
    merchantServices: services, 
    merchantStaff: staff, 
    merchantClients: clients,
    logout,
    updateBookingStatus,
    cancelBooking,
    deleteService,
    deleteStaff,
    updateMerchantProfile,
    setAvailability,
    createBooking,
  } = useBusinessStore();
  
  const [activeTab, setActiveTab] = useState<Tab>('bookings');

  // Auth guard
  if (!isAuthenticated || !merchant) {
    navigate('/merchant/register');
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Ожидает',
      confirmed: 'Подтверждено',
      completed: 'Завершено',
      cancelled: 'Отменено',
      no_show: 'Не пришел',
    };
    return labels[status] || status;
  };

  const getStatusClass = (status: string) => {
    const classes: Record<string, string> = {
      pending: styles.statusPending,
      confirmed: styles.statusConfirmed,
      completed: styles.statusCompleted,
      cancelled: styles.statusCancelled,
      no_show: styles.statusNoShow,
    };
    return classes[status] || '';
  };

  const handleBookingAction = (bookingId: string, newStatus: string) => {
    updateBookingStatus(bookingId, newStatus as any);
  };

  const sortedBookings = [...bookings].sort((a, b) => 
    new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime()
  );

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.title}>{merchant.business_name}</h1>
            <p className={styles.subtitle}>
              {merchant.business_type === 'salon' ? 'Салон / Студия' : 'Частный мастер'}
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="small"
            onClick={handleLogout}
          >
            Выйти
          </Button>
        </div>

        {/* Tabs */}
        <nav className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'bookings' ? styles.active : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            Записи
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'services' ? styles.active : ''}`}
            onClick={() => setActiveTab('services')}
          >
            Услуги
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'staff' ? styles.active : ''}`}
            onClick={() => setActiveTab('staff')}
            style={{ display: merchant.business_type === 'individual' ? 'none' : 'flex' }}
          >
            Сотрудники
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'clients' ? styles.active : ''}`}
            onClick={() => setActiveTab('clients')}
          >
            Клиенты
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'profile' ? styles.active : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Профиль
          </button>
        </nav>
      </header>

      {/* Content */}
      <main className={styles.content}>
        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className={styles.tabContent}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Все записи</h2>
              <Button 
                variant="primary" 
                size="small"
                onClick={() => navigate('/merchant/bookings/new')}
              >
                + Создать запись
              </Button>
            </div>

            {sortedBookings.length === 0 ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyText}>Нет активных записей</p>
                <p className={styles.emptyHint}>
                  Создайте первую запись вручную или ожидайте онлайн-бронирование
                </p>
              </div>
            ) : (
              <div className={styles.bookingsList}>
                {sortedBookings.map((booking) => (
                  <Card key={booking.id} variant="default" className={styles.bookingCard}>
                    <CardBody>
                      <div className={styles.bookingHeader}>
                        <div>
                          <h3 className={styles.bookingClient}>{booking.client_name}</h3>
                          <p className={styles.bookingService}>
                            {booking.service_id ? 
                              services.find(s => s.id === booking.service_id)?.name || 'Услуга' 
                              : 'Услуга'}
                          </p>
                        </div>
                        <span className={`${styles.statusBadge} ${getStatusClass(booking.status)}`}>
                          {getStatusLabel(booking.status)}
                        </span>
                      </div>

                      <div className={styles.bookingDetails}>
                        <div className={styles.bookingDetail}>
                          <span className={styles.detailLabel}>Дата и время</span>
                          <span className={styles.detailValue}>
                            {new Date(booking.starts_at).toLocaleString('ru-RU', {
                              day: 'numeric',
                              month: 'long',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        {booking.staff_id && (
                          <div className={styles.bookingDetail}>
                            <span className={styles.detailLabel}>Мастер</span>
                            <span className={styles.detailValue}>
                              {staff.find(s => s.id === booking.staff_id)?.name || 'Не указан'}
                            </span>
                          </div>
                        )}
                        <div className={styles.bookingDetail}>
                          <span className={styles.detailLabel}>Цена</span>
                          <span className={styles.detailValue}>
                            {booking.price.toLocaleString('ru-RU')} сум
                          </span>
                        </div>
                      </div>

                      {booking.notes && (
                        <div className={styles.bookingNotes}>
                          <span className={styles.notesLabel}>Комментарий:</span>
                          {booking.notes}
                        </div>
                      )}
                    </CardBody>

                    <CardFooter>
                      <div className={styles.bookingActions}>
                        {booking.status === 'pending' && (
                          <>
                            <Button
                              variant="secondary"
                              size="small"
                              onClick={() => handleBookingAction(booking.id, 'confirmed')}
                            >
                              Подтвердить
                            </Button>
                            <Button
                              variant="ghost"
                              size="small"
                              onClick={() => handleBookingAction(booking.id, 'cancelled')}
                            >
                              Отменить
                            </Button>
                          </>
                        )}
                        {booking.status === 'confirmed' && (
                          <>
                            <Button
                              variant="secondary"
                              size="small"
                              onClick={() => handleBookingAction(booking.id, 'completed')}
                            >
                              Завершить
                            </Button>
                            <Button
                              variant="ghost"
                              size="small"
                              onClick={() => handleBookingAction(booking.id, 'cancelled')}
                            >
                              Отменить
                            </Button>
                          </>
                        )}
                        {booking.status === 'completed' && (
                          <Button
                            variant="ghost"
                            size="small"
                            onClick={() => handleBookingAction(booking.id, 'cancelled')}
                          >
                            Вернуть
                          </Button>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div className={styles.tabContent}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Услуги</h2>
              <Button 
                variant="primary" 
                size="small"
                onClick={() => navigate('/merchant/services/new')}
              >
                + Добавить услугу
              </Button>
            </div>

            {services.length === 0 ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyText}>Нет услуг</p>
                <p className={styles.emptyHint}>Добавьте первую услугу</p>
              </div>
            ) : (
              <div className={styles.servicesList}>
                {services.map((service) => (
                  <Card key={service.id} variant="default" className={styles.serviceCard}>
                    <CardBody>
                      <div className={styles.serviceHeader}>
                        <h3 className={styles.serviceName}>{service.name}</h3>
                        <span className={styles.servicePrice}>
                          {service.price.toLocaleString('ru-RU')} сум
                        </span>
                      </div>
                      {service.description && (
                        <p className={styles.serviceDescription}>{service.description}</p>
                      )}
                      <div className={styles.serviceMeta}>
                        <span className={styles.serviceDuration}>
                          {service.duration_min} мин
                        </span>
                        <span className={styles.serviceCategory}>
                          {service.category}
                        </span>
                      </div>
                    </CardBody>
                    <CardFooter>
                      <div className={styles.serviceActions}>
                        <Button
                          variant="ghost"
                          size="small"
                          onClick={() => navigate(`/merchant/services/edit/${service.id}`)}
                        >
                          Редактировать
                        </Button>
                        <Button
                          variant="ghost"
                          size="small"
                          onClick={() => {
                            if (confirm('Удалить услугу?')) {
                              deleteService(service.id);
                            }
                          }}
                        >
                          Удалить
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Staff Tab */}
        {activeTab === 'staff' && merchant.business_type === 'salon' && (
          <div className={styles.tabContent}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Сотрудники</h2>
              <Button 
                variant="primary" 
                size="small"
                onClick={() => navigate('/merchant/staff/new')}
              >
                + Добавить сотрудника
              </Button>
            </div>

            {staff.length === 0 ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyText}>Нет сотрудников</p>
                <p className={styles.emptyHint}>Добавьте первого сотрудника</p>
              </div>
            ) : (
              <div className={styles.staffList}>
                {staff.map((member) => (
                  <Card key={member.id} variant="default" className={styles.staffCard}>
                    <CardBody>
                      <div className={styles.staffHeader}>
                        <div className={styles.staffAvatar}>
                          {member.photo_url ? (
                            <img src={member.photo_url} alt={member.name} />
                          ) : (
                            <span>{member.name.charAt(0)}</span>
                          )}
                        </div>
                        <div>
                          <h3 className={styles.staffName}>{member.name}</h3>
                          <p className={styles.staffSpecialization}>{member.specialization}</p>
                        </div>
                      </div>
                      {member.phone && (
                        <p className={styles.staffPhone}>{member.phone}</p>
                      )}
                    </CardBody>
                    <CardFooter>
                      <div className={styles.staffActions}>
                        <Button
                          variant="ghost"
                          size="small"
                          onClick={() => navigate(`/merchant/staff/edit/${member.id}`)}
                        >
                          Редактировать
                        </Button>
                        <Button
                          variant="ghost"
                          size="small"
                          onClick={() => {
                            if (confirm('Удалить сотрудника?')) {
                              // deleteStaff(member.id);
                            }
                          }}
                        >
                          Удалить
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Clients Tab */}
        {activeTab === 'clients' && (
          <div className={styles.tabContent}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Клиенты</h2>
            </div>

            {clients.length === 0 ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyText}>Нет клиентов</p>
                <p className={styles.emptyHint}>
                  Клиенты появятся после первых записей
                </p>
              </div>
            ) : (
              <div className={styles.clientsList}>
                {clients.map((client) => (
                  <Card key={client.id} variant="default" className={styles.clientCard}>
                    <CardBody>
                      <div className={styles.clientHeader}>
                        <h3 className={styles.clientName}>{client.name}</h3>
                        <span className={styles.clientBookings}>
                          {client.total_bookings} записей
                        </span>
                      </div>
                      <p className={styles.clientPhone}>{client.phone}</p>
                      {client.last_visit && (
                        <p className={styles.clientLastVisit}>
                          Последний визит: {new Date(client.last_visit).toLocaleDateString('ru-RU')}
                        </p>
                      )}
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className={styles.tabContent}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Профиль бизнеса</h2>
              <Button 
                variant="primary" 
                size="small"
                onClick={() => navigate('/merchant/profile/edit')}
              >
                Редактировать
              </Button>
            </div>

            <Card variant="default">
              <CardBody>
                <div className={styles.profileSection}>
                  <h3 className={styles.profileLabel}>Название</h3>
                  <p className={styles.profileValue}>{merchant.business_name}</p>
                </div>

                <div className={styles.profileSection}>
                  <h3 className={styles.profileLabel}>Тип бизнеса</h3>
                  <p className={styles.profileValue}>
                    {merchant.business_type === 'salon' ? 'Салон / Студия' : 'Частный мастер'}
                  </p>
                </div>

                <div className={styles.profileSection}>
                  <h3 className={styles.profileLabel}>Категория</h3>
                  <p className={styles.profileValue}>{merchant.category}</p>
                </div>

                <div className={styles.profileSection}>
                  <h3 className={styles.profileLabel}>Адрес</h3>
                  <p className={styles.profileValue}>{merchant.address}</p>
                </div>

                <div className={styles.profileSection}>
                  <h3 className={styles.profileLabel}>Город</h3>
                  <p className={styles.profileValue}>{merchant.city}</p>
                </div>

                {merchant.description && (
                  <div className={styles.profileSection}>
                    <h3 className={styles.profileLabel}>Описание</h3>
                    <p className={styles.profileValue}>{merchant.description}</p>
                  </div>
                )}

                {merchant.instagram && (
                  <div className={styles.profileSection}>
                    <h3 className={styles.profileLabel}>Instagram</h3>
                    <p className={styles.profileValue}>{merchant.instagram}</p>
                  </div>
                )}

                {merchant.telegram_username && (
                  <div className={styles.profileSection}>
                    <h3 className={styles.profileLabel}>Telegram</h3>
                    <p className={styles.profileValue}>{merchant.telegram_username}</p>
                  </div>
                )}

                <div className={styles.profileSection}>
                  <h3 className={styles.profileLabel}>Статус</h3>
                  <p className={styles.profileValue}>
                    {merchant.is_active ? '✓ Активен' : 'Не активен'}
                  </p>
                </div>

                <div className={styles.profileSection}>
                  <h3 className={styles.profileLabel}>Рейтинг</h3>
                  <p className={styles.profileValue}>
                    {merchant.rating > 0 ? `${merchant.rating} ★` : 'Нет оценок'} 
                    ({merchant.review_count} отзывов)
                  </p>
                </div>
              </CardBody>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};
