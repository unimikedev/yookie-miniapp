import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ru from './locales/ru.json'
import uz from './locales/uz.json'
import en from './locales/en.json'

export type AppLanguage = 'ru' | 'uz' | 'en'

const LANG_KEY = 'yookie_lang'

function getStoredLang(): AppLanguage {
  try {
    const stored = localStorage.getItem(LANG_KEY)
    if (stored === 'ru' || stored === 'uz' || stored === 'en') return stored
  } catch {}
  return 'ru'
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ru: { translation: ru },
      uz: { translation: uz },
      en: { translation: en },
    },
    lng: getStoredLang(),
    fallbackLng: 'ru',
    interpolation: {
      escapeValue: false,
    },
  })

export function setLanguage(lang: AppLanguage) {
  i18n.changeLanguage(lang)
  try { localStorage.setItem(LANG_KEY, lang) } catch {}
}

export { i18n }
export default i18n
