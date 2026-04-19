import React from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import styles from './DeepLinkHandler.module.css';

/**
 * Универсальный обработчик глубоких ссылок (Deep Links)
 * Маршруты:
 * - /link/business/:id -> Профиль бизнеса
 * - /link/service/:id -> Профиль бизнеса + скролл/модалка услуги
 * - /link/master/:id -> Профиль бизнеса + скролл/модалка мастера
 */
export const DeepLinkHandler: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { businessId, serviceId, masterId } = useParams();

  // Логика редиректа и обработки параметров
  React.useEffect(() => {
    const handleRedirect = async () => {
      if (businessId) {
        // Формируем путь к бизнесу
        const targetPath = `/business/${businessId}`;
        
        // Если есть специфичный ID (услуга или мастер), передаем его через state или query params
        if (serviceId || masterId) {
          navigate(targetPath, { 
            state: { 
              highlightService: serviceId, 
              highlightMaster: masterId,
              fromDeepLink: true 
            } 
          });
        } else {
          navigate(targetPath);
        }
      }
    };

    handleRedirect();
  }, [businessId, serviceId, masterId, navigate]);

  return (
    <div className={styles.container}>
      <div className={styles.loader}>
        <div className={styles.spinner}></div>
        <p>Переход по ссылке...</p>
      </div>
    </div>
  );
};
