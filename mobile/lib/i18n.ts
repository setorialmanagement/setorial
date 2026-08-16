import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import en from '../assets/locales/en.json';
import fr from '../assets/locales/fr.json';
import es from '../assets/locales/es.json';


const resources = {
  en: { translation: en },
  fr: { translation: fr },
  es: { translation: es }
};

import * as SecureStore from 'expo-secure-store';

// Try to get saved language synchronously if possible, or we might need to handle it async.
// Since i18n initialization is synchronous here, we'll try getItem (which is sync in expo-secure-store? No, SecureStore.getItem is not standard, let's use getItem if available or default, then async change).
// Actually, SecureStore doesn't have a synchronous getItem. We can initialize with device language, then override async.

const deviceLang = Localization.getLocales()[0].languageCode ?? 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: deviceLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
