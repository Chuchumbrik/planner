import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '@/i18n/locales/en.json'
import ru from '@/i18n/locales/ru.json'

const STORAGE_KEY = 'motivator_lang'

function storedLng(): string {
  const fromStorage = localStorage.getItem(STORAGE_KEY)
  if (fromStorage === 'en' || fromStorage === 'ru') return fromStorage
  return 'ru'
}

void i18n.use(initReactI18next).init({
  resources: {
    ru: { translation: ru },
    en: { translation: en },
  },
  lng: storedLng(),
  fallbackLng: 'ru',
  interpolation: { escapeValue: false },
})

i18n.on('languageChanged', (lng) => {
  if (lng === 'en' || lng === 'ru') localStorage.setItem(STORAGE_KEY, lng)
})

export { STORAGE_KEY as I18N_STORAGE_KEY }
export default i18n
