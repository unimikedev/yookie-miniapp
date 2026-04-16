/**
 * Merchant Registration Page (B2B Onboarding)
 * Full onboarding flow for new merchants
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/ui';
import { Input } from '@/shared/ui';
import { TextArea } from '@/shared/ui';
import { useBusinessStore } from '@/stores/businessStore';
import styles from './MerchantRegisterPage.module.css';

type Step = 'contact' | 'business' | 'services' | 'staff' | 'complete';

interface FormData {
  phone: string;
  code: string;
  business_name: string;
  business_type: 'salon' | 'individual';
  category: string;
  address: string;
  city: string;
  description: string;
  instagram?: string;
  telegram_username?: string;
  services: Array<{
    name: string;
    price: string;
    duration_min: string;
    category: string;
  }>;
  staff: Array<{
    name: string;
    specialization: string;
    phone: string;
  }>;
}

const CATEGORIES = [
  { value: 'hair', label: 'Парикмахерская' },
  { value: 'nail', label: 'Ногтевой сервис' },
  { value: 'brow_lash', label: 'Брови и ресницы' },
  { value: 'makeup', label: 'Макияж' },
  { value: 'spa_massage', label: 'СПА и массаж' },
  { value: 'cosmetology', label: 'Косметология' },
  { value: 'barber', label: 'Барбершоп' },
  { value: 'tattoo', label: 'Тату' },
  { value: 'fitness', label: 'Фитнес' },
  { value: 'yoga', label: 'Йога' },
];

export const MerchantRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useBusinessStore();
  
  const [step, setStep] = useState<Step>('contact');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tempToken, setTempToken] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    phone: '',
    code: '',
    business_name: '',
    business_type: 'individual',
    category: 'hair',
    address: '',
    city: 'Tashkent',
    description: '',
    instagram: '',
    telegram_username: '',
    services: [{ name: '', price: '', duration_min: '60', category: 'hair' }],
    staff: [],
  });

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // In production: call requestMerchantOtp(formData.phone)
      // For demo: simulate OTP sent
      setTimeout(() => {
        setStep('business');
        setIsLoading(false);
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send code');
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // In production: call verifyMerchantOtp
      // For demo: generate temp token
      const mockTempToken = `temp_${Date.now()}`;
      setTempToken(mockTempToken);
      setStep('business');
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code');
      setIsLoading(false);
    }
  };

  const handleBusinessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // Validate required fields
      if (!formData.business_name || !formData.address) {
        throw new Error('Please fill in all required fields');
      }
      
      if (formData.business_type === 'individual' && formData.services.length === 0) {
        throw new Error('Please add at least one service');
      }
      
      setStep('services');
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save business info');
      setIsLoading(false);
    }
  };

  const handleServicesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // Validate services
      const validServices = formData.services.filter(s => s.name && s.price);
      if (validServices.length === 0) {
        throw new Error('Please add at least one service with name and price');
      }
      
      if (formData.business_type === 'salon') {
        setStep('staff');
      } else {
        // Individual master - skip staff step
        await completeRegistration();
        return;
      }
      
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save services');
      setIsLoading(false);
    }
  };

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await completeRegistration();
  };

  const completeRegistration = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Create mock merchant
      const mockMerchant = {
        id: `merchant-${Date.now()}`,
        business_name: formData.business_name,
        business_type: formData.business_type,
        category: formData.category as any,
        address: formData.address,
        city: formData.city,
        phone: formData.phone,
        description: formData.description,
        instagram: formData.instagram,
        telegram_username: formData.telegram_username,
        is_active: true,
        is_verified: false,
        rating: 0,
        review_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      // Login and initialize store (this will also add the business to B2C view)
      login('mock-token-123', mockMerchant);
      
      // Add services using the store's methods
      const store = useBusinessStore.getState();
      formData.services.forEach(service => {
        if (service.name && service.price) {
          store.addService({
            name: service.name,
            price: parseInt(service.price) || 0,
            duration_min: parseInt(service.duration_min) || 60,
            category: service.category,
            is_active: true,
            position: 0,
          });
        }
      });
      
      // Add staff if salon
      if (formData.business_type === 'salon') {
        formData.staff.forEach(member => {
          if (member.name) {
            store.addStaff({
              name: member.name,
              specialization: member.specialization || 'Мастер',
              phone: member.phone,
              is_active: true,
              position: 0,
            });
          }
        });
      }
      
      setStep('complete');
      setIsLoading(false);
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/merchant/dashboard');
      }, 2000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      setIsLoading(false);
    }
  };

  const addService = () => {
    setFormData(prev => ({
      ...prev,
      services: [...prev.services, { name: '', price: '', duration_min: '60', category: prev.category }],
    }));
  };

  const removeService = (index: number) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index),
    }));
  };

  const updateService = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.map((s, i) => 
        i === index ? { ...s, [field]: value } : s
      ),
    }));
  };

  const addStaff = () => {
    setFormData(prev => ({
      ...prev,
      staff: [...prev.staff, { name: '', specialization: '', phone: '' }],
    }));
  };

  if (step === 'complete') {
    return (
      <div className={styles.container}>
        <div className={styles.completeCard}>
          <div className={styles.checkmark}>✓</div>
          <h1 className={styles.title}>Регистрация завершена!</h1>
          <p className={styles.subtitle}>
            Ваш бизнес создан и готов к работе
          </p>
          <p className={styles.hint}>
            Перенаправление в панель управления...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Yookie Pro</h1>
        <p className={styles.subtitle}>
          {step === 'contact' && 'Начните работу с Yookie Pro'}
          {step === 'business' && 'Информация о бизнесе'}
          {step === 'services' && 'Добавьте услуги'}
          {step === 'staff' && 'Добавьте сотрудников'}
        </p>
      </div>

      {error && (
        <div className={styles.error}>{error}</div>
      )}

      {/* Step 1: Contact */}
      {step === 'contact' && (
        <form onSubmit={handleContactSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Номер телефона</label>
            <Input
              type="tel"
              placeholder="+998901234567"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              required
              disabled={isLoading}
            />
          </div>
          
          <Button 
            type="submit" 
            variant="primary" 
            size="large"
            disabled={!formData.phone || isLoading}
            loading={isLoading}
          >
            Получить код
          </Button>
        </form>
      )}

      {/* Step 2: Verify Code */}
      {step === 'business' && !tempToken && (
        <form onSubmit={handleVerifyCode} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Код из SMS</label>
            <Input
              type="text"
              placeholder="1234"
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
              required
              disabled={isLoading}
            />
          </div>
          
          <Button 
            type="submit" 
            variant="primary" 
            size="large"
            disabled={!formData.code || isLoading}
            loading={isLoading}
          >
            Подтвердить
          </Button>
        </form>
      )}

      {/* Step 3: Business Info */}
      {step === 'business' && tempToken && (
        <form onSubmit={handleBusinessSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Тип бизнеса</label>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  value="individual"
                  checked={formData.business_type === 'individual'}
                  onChange={(e) => setFormData(prev => ({ ...prev, business_type: e.target.value as any }))}
                />
                Частный мастер
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  value="salon"
                  checked={formData.business_type === 'salon'}
                  onChange={(e) => setFormData(prev => ({ ...prev, business_type: e.target.value as any }))}
                />
                Салон / Студия
              </label>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Название *</label>
            <Input
              type="text"
              placeholder="Beauty Studio Pro"
              value={formData.business_name}
              onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
              required
              disabled={isLoading}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Категория *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className={styles.select}
              disabled={isLoading}
              required
            >
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Город *</label>
            <Input
              type="text"
              placeholder="Ташкент"
              value={formData.city}
              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
              required
              disabled={isLoading}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Адрес *</label>
            <Input
              type="text"
              placeholder="ул. Ленина 45"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              required
              disabled={isLoading}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Описание</label>
            <TextArea
              placeholder="Опишите ваш бизнес..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              disabled={isLoading}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Instagram</label>
            <Input
              type="text"
              placeholder="@beautystudio"
              value={formData.instagram}
              onChange={(e) => setFormData(prev => ({ ...prev, instagram: e.target.value }))}
              disabled={isLoading}
            />
          </div>

          <Button 
            type="submit" 
            variant="primary" 
            size="large"
            disabled={isLoading}
            loading={isLoading}
          >
            Далее
          </Button>
        </form>
      )}

      {/* Step 4: Services */}
      {step === 'services' && (
        <form onSubmit={handleServicesSubmit} className={styles.form}>
          <p className={styles.hint}>
            Добавьте услуги, которые вы предоставляете
          </p>

          {formData.services.map((service, index) => (
            <div key={index} className={styles.serviceRow}>
              <div className={styles.serviceField}>
                <Input
                  type="text"
                  placeholder="Название услуги"
                  value={service.name}
                  onChange={(e) => updateService(index, 'name', e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className={styles.serviceField}>
                <Input
                  type="number"
                  placeholder="Цена (сум)"
                  value={service.price}
                  onChange={(e) => updateService(index, 'price', e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className={styles.serviceField}>
                <Input
                  type="number"
                  placeholder="Мин"
                  value={service.duration_min}
                  onChange={(e) => updateService(index, 'duration_min', e.target.value)}
                  disabled={isLoading}
                />
              </div>
              {formData.services.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeService(index)}
                  className={styles.removeBtn}
                  disabled={isLoading}
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addService}
            className={styles.addBtn}
            disabled={isLoading}
          >
            + Добавить услугу
          </button>

          <Button 
            type="submit" 
            variant="primary" 
            size="large"
            disabled={isLoading}
            loading={isLoading}
            className={styles.submitBtn}
          >
            Далее
          </Button>
        </form>
      )}

      {/* Step 5: Staff (Salon only) */}
      {step === 'staff' && (
        <form onSubmit={handleStaffSubmit} className={styles.form}>
          <p className={styles.hint}>
            Добавьте сотрудников вашего салона
          </p>

          {formData.staff.map((member, index) => (
            <div key={index} className={styles.staffRow}>
              <div className={styles.staffField}>
                <Input
                  type="text"
                  placeholder="ФИО"
                  value={member.name}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    staff: prev.staff.map((s, i) => 
                      i === index ? { ...s, name: e.target.value } : s
                    ),
                  }))}
                  disabled={isLoading}
                />
              </div>
              <div className={styles.staffField}>
                <Input
                  type="text"
                  placeholder="Специализация"
                  value={member.specialization}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    staff: prev.staff.map((s, i) => 
                      i === index ? { ...s, specialization: e.target.value } : s
                    ),
                  }))}
                  disabled={isLoading}
                />
              </div>
              <div className={styles.staffField}>
                <Input
                  type="tel"
                  placeholder="Телефон"
                  value={member.phone}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    staff: prev.staff.map((s, i) => 
                      i === index ? { ...s, phone: e.target.value } : s
                    ),
                  }))}
                  disabled={isLoading}
                />
              </div>
              <button
                type="button"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  staff: prev.staff.filter((_, i) => i !== index),
                }))}
                className={styles.removeBtn}
                disabled={isLoading}
              >
                ✕
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addStaff}
            className={styles.addBtn}
            disabled={isLoading}
          >
            + Добавить сотрудника
          </button>

          <Button 
            type="submit" 
            variant="primary" 
            size="large"
            disabled={isLoading}
            loading={isLoading}
            className={styles.submitBtn}
          >
            Завершить регистрацию
          </Button>
        </form>
      )}
    </div>
  );
};
