import React, { createContext, useContext, useMemo } from 'react';
import { LightTheme, DarkTheme, Theme } from '@/constants/colors';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Force dark mode
  const isDark = true;

  const value = useMemo(
    () => ({
      theme: isDark ? DarkTheme : LightTheme,
      isDark,
    }),
    [isDark]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
