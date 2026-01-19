import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import i18n, { SUPPORTED_LANGUAGES, SupportedLanguage } from '@/locales';

const LOCALE_STORAGE_KEY = 'user_locale_preference';

interface LocaleContextType {
  locale: SupportedLanguage;
  setLocale: (locale: SupportedLanguage) => Promise<void>;
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
  isLoading: boolean;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLanguage>(i18n.language as SupportedLanguage);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved preference on mount
  useEffect(() => {
    const loadSavedLocale = async () => {
      try {
        const savedLocale = await SecureStore.getItemAsync(LOCALE_STORAGE_KEY);
        if (savedLocale && savedLocale in SUPPORTED_LANGUAGES) {
          await i18n.changeLanguage(savedLocale);
          setLocaleState(savedLocale as SupportedLanguage);
        }
      } catch (error) {
        console.error('Failed to load locale preference:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSavedLocale();
  }, []);

  const setLocale = useCallback(async (newLocale: SupportedLanguage) => {
    try {
      await i18n.changeLanguage(newLocale);
      await SecureStore.setItemAsync(LOCALE_STORAGE_KEY, newLocale);
      setLocaleState(newLocale);
    } catch (error) {
      console.error('Failed to change locale:', error);
      throw error;
    }
  }, []);

  return (
    <LocaleContext.Provider
      value={{
        locale,
        setLocale,
        supportedLanguages: SUPPORTED_LANGUAGES,
        isLoading,
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextType {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}
