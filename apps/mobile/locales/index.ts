import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import 'intl-pluralrules';

// Import all translation files
import enGB from './en-GB.json';
import de from './de.json';
import it from './it.json';
import fr from './fr.json';
import es from './es.json';
import pt from './pt.json';
import enUS from './en-US.json';
import cs from './cs.json';
import pl from './pl.json';
import ja from './ja.json';
import ko from './ko.json';

export const SUPPORTED_LANGUAGES = {
  'en-GB': { name: 'English (UK)', nativeName: 'English (UK)' },
  'de': { name: 'German', nativeName: 'Deutsch' },
  'it': { name: 'Italian', nativeName: 'Italiano' },
  'fr': { name: 'French', nativeName: 'Francais' },
  'es': { name: 'Spanish', nativeName: 'Espanol' },
  'pt': { name: 'Portuguese', nativeName: 'Portugues' },
  'en-US': { name: 'English (US)', nativeName: 'English (US)' },
  'cs': { name: 'Czech', nativeName: 'Cestina' },
  'pl': { name: 'Polish', nativeName: 'Polski' },
  'ja': { name: 'Japanese', nativeName: '日本語' },
  'ko': { name: 'Korean', nativeName: '한국어' },
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

const resources = {
  'en-GB': { translation: enGB },
  'de': { translation: de },
  'it': { translation: it },
  'fr': { translation: fr },
  'es': { translation: es },
  'pt': { translation: pt },
  'en-US': { translation: enUS },
  'cs': { translation: cs },
  'pl': { translation: pl },
  'ja': { translation: ja },
  'ko': { translation: ko },
};

// Detect best matching language from device
const getDeviceLanguage = (): SupportedLanguage => {
  const deviceLocale = Localization.getLocales()[0]?.languageTag;

  // Exact match
  if (deviceLocale && deviceLocale in SUPPORTED_LANGUAGES) {
    return deviceLocale as SupportedLanguage;
  }

  // Language-only match (e.g., "de-AT" -> "de")
  const languageCode = deviceLocale?.split('-')[0];
  if (languageCode && languageCode in SUPPORTED_LANGUAGES) {
    return languageCode as SupportedLanguage;
  }

  // Special case: any English variant defaults to en-GB
  if (languageCode === 'en') {
    return 'en-GB';
  }

  // Fallback to English UK
  return 'en-GB';
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getDeviceLanguage(),
    fallbackLng: 'en-GB',
    interpolation: {
      escapeValue: false, // React already escapes
    },
    react: {
      useSuspense: false, // Disable suspense for RN compatibility
    },
  });

export default i18n;
