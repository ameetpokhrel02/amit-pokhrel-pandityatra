import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: import.meta.env.DEV, // Only log in development, not production

    // Only load these exact languages — strips region codes (en-US → en)
    supportedLngs: ['en', 'hi', 'ne'],
    nonExplicitSupportedLngs: true, // en-US will match 'en'
    
    // Namespaces
    ns: ['common', 'auth', 'dashboard', 'about', 'home', 'shop'],
    defaultNS: 'common',
    keySeparator: '.', 

    interpolation: {
      escapeValue: false,
    },
    
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    }
  });

export default i18n;
