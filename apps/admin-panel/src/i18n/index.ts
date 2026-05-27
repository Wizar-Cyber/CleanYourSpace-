import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { commonEn, commonEs, mergeResources } from '@corecon/i18n';
import appEn from './en.json';
import appEs from './es.json';

const savedLang = typeof window !== 'undefined' ? localStorage.getItem('language') : null;

const resources = mergeResources(commonEn, appEn, commonEs, appEs);

i18n.use(initReactI18next).init({
  resources,
  lng: savedLang || 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export function changeLanguage(lang: string) {
  i18n.changeLanguage(lang);
  localStorage.setItem('language', lang);
  document.documentElement.lang = lang;
}

export default i18n;
