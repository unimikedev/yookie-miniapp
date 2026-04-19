# 🚨 BACKEND BLOCKERS - Требуемые изменения для синхронизации с фронтендом

## Контекст
Фронтенд команда завершила реализацию Phase 2 и начинает Phase 3. Для полной функциональности требуются следующие изменения на бэкенде.

---

## 🔴 КРИТИЧЕСКИЕ БЛОКЕРЫ (требуются до запуска MVP)

### 1. Enhanced 409 Conflict Response для слотов
**Проблема:** При конфликте бронирования (два клиента выбрали одно время) фронтенд получает generic 409 ошибку без альтернатив.

**Требуется изменить:**
```typescript
// Сейчас:
POST /api/v1/bookings
// Response 409: { "error": "BOOKING_CONFLICT", "message": "Slot is already booked" }

// Нужно:
POST /api/v1/bookings
// Response 409: { 
//   "error": "BOOKING_CONFLICT", 
//   "message": "Выбранное время только что заняли",
//   "alternative_slots": [
//     { "starts_at": "2025-01-20T10:30:00Z", "ends_at": "2025-01-20T11:30:00Z", "master_id": "..." },
//     { "starts_at": "2025-01-20T11:00:00Z", "ends_at": "2025-01-20T12:00:00Z", "master_id": "..." },
//     { "starts_at": "2025-01-20T14:00:00Z", "ends_at": "2025-01-20T15:00:00Z", "master_id": "..." }
//   ]
// }
```

**Где изменить:**
- Файл: `src/routes/bookings.ts` (или аналогичный контроллер создания записей)
- Логика: При выбрасывании ошибки BOOKING_CONFLICT, автоматически запросить 3 ближайших доступных слота для того же мастера/услуги
- API для альтернатив: использовать существующий `/slots/available` с параметрами `{ masterId, serviceId, date, limit: 3, after: requestedTime }`

**Связано с фронтендом:**
- Файл: `/workspace/src/hooks/useAlternativeSlots.ts` (уже готов, ждет реальный API)
- Файл: `/workspace/src/pages/BookingFlowPage.tsx` (нужно добавить модалку с альтернативами)

---

### 2. Merchant Profile Validation Endpoint
**Проблема:** Фронтенд не может проверить готовность профиля мерчанта к показу в B2C.

**Требуется добавить:**
```typescript
GET /api/v1/merchants/:merchantId/validation

Response 200: {
  "is_validated": boolean,
  "completion_percentage": number, // 0-100
  "errors": string[], // ["Нет услуг", "Нет мастеров", "Не настроен график"]
  "checks": {
    "has_basic_info": boolean,
    "has_services": boolean,
    "has_staff": boolean,
    "has_schedule": boolean,
    "has_photo": boolean
  },
  "is_ready_for_b2c": boolean // true если все критические проверки пройдены
}
```

**Логика проверок:**
- `has_basic_info`: name, category, city заполнены
- `has_services`: count(services) >= 1
- `has_staff`: count(staff) >= 1  
- `has_schedule`: schedule имеет хотя бы 1 день с открытыми часами
- `has_photo`: photo_url существует (не критично, но влияет на %)
- `is_ready_for_b2c`: true если первые 4 проверки = true

**Где добавить:**
- Новый роут: `src/routes/merchants.ts` → `GET /:merchantId/validation`
- Или добавить в существующий `GET /merchants/:id` response

**Связано с фронтендом:**
- Файл: `/workspace/src/hooks/useMerchantProfileValidation.ts` (сейчас эмулирует, нужно заменить на API call)
- Файл: `/workspace/src/pro/pages/MerchantSettingsPage/MerchantSettingsPage.tsx` (интегрирован хук)

---

### 3. Real-time Booking Sync (WebSocket события)
**Проблема:** Когда клиент создает запись в B2C, мерчант в B2B не видит её мгновенно.

**Требуется добавить:**
```typescript
// WebSocket событие при создании записи
{
  "event": "booking.created",
  "data": {
    "booking_id": "...",
    "business_id": "...",
    "merchant_id": "...",
    "client_name": "...",
    "client_phone": "...",
    "service_id": "...",
    "master_id": "...",
    "starts_at": "...",
    "ends_at": "...",
    "created_at": "..."
  }
}

// Аналогично для:
// - booking.updated
// - booking.cancelled
// - booking.confirmed
```

**Где добавить:**
- Файл: `src/routes/bookings.ts` → после успешного создания → emit WebSocket event
- Файл: `src/websocket/index.ts` (или аналогичный) → регистрация новых типов событий
- Подписка: мерчанты подписываются на комнату `merchant:{merchantId}` или `business:{businessId}`

**Связано с фронтендом:**
- Файл: `/workspace/src/lib/syncBookingToMerchant.ts` (уже готов, слушает события)
- Файл: `/workspace/src/pro/stores/merchantStore.ts` (нужно добавить обработчик WebSocket)

---

### 4. JWT должен включать merchant_id
**Проблема:** При логине пользователя с бизнесом, фронтенд не знает merchant_id без дополнительного запроса.

**Требуется изменить:**
```typescript
// Сейчас в JWT payload:
{
  "phone": "+998901234567",
  "user_id": "..."
}

// Нужно:
{
  "phone": "+998901234567",
  "user_id": "...",
  "merchant_ids": ["merchant_123", "merchant_456"] // массив ID бизнесов пользователя
}
```

**Где изменить:**
- Файл: `src/routes/auth.ts` → логика генерации JWT (login/register)
- Добавить join с таблицей merchants/businesses для получения всех merchant_id пользователя

**Связано с фронтендом:**
- Файл: `/workspace/src/stores/authStore.ts` (уже извлекает merchant_id из JWT если есть)
- Файл: `/workspace/src/pro/router/ProRouter.tsx` (использует merchant_id из authStore)

---

## 🟠 ВЫСОКИЙ ПРИОРИТЕТ (желательно до MVP)

### 5. Telegram Notifications Integration
**Проблема:** Нет уведомлений клиентам и мерчантам о статусах записи.

**Требуется добавить:**
```typescript
// Отправка уведомлений при событиях:
// 1. booking.created → клиенту + мерчанту
// 2. booking.confirmed → клиенту
// 3. booking.cancelled → клиенту + мерчанту
// 4. booking.reminder (за 2 часа) → клиенту

// API метод:
POST /api/v1/notifications/send
{
  "user_id": "...",
  "type": "booking_created|booking_confirmed|booking_cancelled|reminder",
  "data": {
    "booking_id": "...",
    "business_name": "...",
    "service_name": "...",
    "master_name": "...",
    "starts_at": "...",
    // ... другие данные для шаблона
  }
}
```

**Интеграция с Telegram Bot API:**
- Использовать `bot.sendMessage(chat_id, template(data))`
- Шаблоны сообщений хранить в `src/templates/notifications.ts`
- Chat_id пользователя брать из таблицы users (поле telegram_chat_id)

**Где добавить:**
- Файл: `src/services/notificationService.ts` (новый сервис)
- Файл: `src/routes/bookings.ts` → вызов notificationService после создания/изменения
- Cron job для reminder уведомлений (каждые 30 мин проверять записи через 2 часа)

**Связано с фронтендом:**
- Файл: `/workspace/src/lib/api/notifications.ts` (уже есть заготовки)
- Файл: `/workspace/src/pages/AccountPage.tsx` (кнопка подключения уведомлений)

---

### 6. Schedule Validation на бэкенде
**Проблема:** Можно создать некорректный график (закрытие раньше открытия).

**Требуется добавить валидацию:**
```typescript
// POST /api/v1/merchants/:merchantId/schedule
// Request body:
{
  "schedule": {
    "monday": { "open": "09:00", "close": "18:00" },
    "tuesday": { "open": "10:00", "close": "08:00" } // ❌ Ошибка!
  }
}

// Response 400:
{
  "error": "INVALID_SCHEDULE",
  "message": "Время закрытия не может быть раньше времени открытия",
  "invalid_days": ["tuesday"]
}
```

**Где добавить:**
- Файл: `src/routes/merchants.ts` → валидация перед сохранением schedule
- Middleware или service layer для переиспользования

---

### 7. Pagination для списков бизнесов/записей/клиентов
**Проблема:** При росте данных фронтенд будет загружать всё сразу.

**Требуется изменить существующие endpoints:**
```typescript
// GET /api/v1/businesses
// Query params: ?limit=20&offset=0&category=hair&city=Tashkent

// Response:
{
  "data": [...],
  "meta": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}

// Аналогично для:
// GET /api/v1/bookings?businessId=...&limit=50&offset=0
// GET /api/v1/clients?businessId=...&limit=50&offset=0&search=...
```

**Где изменить:**
- Файл: `src/routes/businesses.ts`
- Файл: `src/routes/bookings.ts`
- Файл: `src/routes/clients.ts` (или merchants/:id/clients)
- Добавить поддержку query params limit/offset/search во все list endpoints

**Связано с фронтендом:**
- Файл: `/workspace/src/hooks/useBusinesses.ts` (готов к pagination)
- Файл: `/workspace/src/pro/hooks/useMerchantSearch.ts` (ожидает search param)

---

### 8. Image Optimization на бэкенде
**Проблема:** Пользователи загружают фото 10MB+, это замедляет загрузку страниц.

**Требуется добавить обработку изображений:**
```typescript
// POST /api/v1/businesses/upload-image
// Требования:
// 1. Ресайз до max 1920px (сохраняя aspect ratio)
// 2. Сжатие JPEG quality 80%
// 3. Конвертация PNG/WebP в JPEG для фото
// 4. Генерация thumbnail 400x400 для карточек
// 5. Ограничение размера файла до 5MB

// Response:
{
  "url": "https://cdn.yookie.uz/businesses/abc123.jpg",
  "thumbnail_url": "https://cdn.yookie.uz/businesses/abc123_thumb.jpg"
}
```

**Библиотеки:**
- Node.js: `sharp` или `jimp`
- Python: `Pillow`

**Где добавить:**
- Файл: `src/routes/businesses.ts` → обработка перед сохранением
- CDN integration (если используется S3/Cloudflare R2)

---

## 📋 ЧЕКЛИСТ ДЛЯ БЭКЕНД КОМАНДЫ

- [ ] 1. Enhanced 409 response с alternative_slots
- [ ] 2. GET /merchants/:id/validation endpoint
- [ ] 3. WebSocket события booking.*
- [ ] 4. JWT с merchant_ids array
- [ ] 5. Telegram notification service
- [ ] 6. Schedule validation middleware
- [ ] 7. Pagination для всех list endpoints
- [ ] 8. Image optimization (resize + compress)

## 🔄 СИНХРОНИЗАЦИЯ С ФРОНТЕНДОМ

После реализации каждого пункта:
1. Обновить OpenAPI/Swagger документацию
2. Уведомить фронтенд команду
3. Фронтенд заменит mock/emulation на реальные API вызовы
4. Провести end-to-end тестирование сценария

## 📞 КОНТАКТЫ

Фронтенд команда готова ответить на вопросы и провести демо реализованных функций.
