// iOS-native color system with light and dark themes

export const LightTheme = {
  // Backgrounds
  background: '#F2F2F7',
  surface: '#FFFFFF',
  surfaceSecondary: '#F2F2F7',
  surfaceTertiary: '#EFEFF4',

  // Text
  text: '#000000',
  textSecondary: '#8E8E93',
  textTertiary: '#C7C7CC',

  // Separators & Borders
  separator: '#C6C6C8',
  border: '#E5E5EA',

  // Primary brand color (green for "all good")
  primary: '#34C759',
  primaryLight: '#30D158',
  primaryDark: '#248A3D',

  // Status colors
  success: '#34C759',
  warning: '#FF9500',
  danger: '#FF3B30',
  info: '#007AFF',

  // Glass effects
  glassBackground: 'rgba(255, 255, 255, 0.72)',
  glassBorder: 'rgba(255, 255, 255, 0.5)',

  // Tab bar
  tabBar: 'rgba(249, 249, 249, 0.94)',
  tabBarBorder: 'rgba(0, 0, 0, 0.1)',

  // Misc
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.4)',
} as const;

export const DarkTheme = {
  // Backgrounds
  background: '#000000',
  surface: '#1C1C1E',
  surfaceSecondary: '#2C2C2E',
  surfaceTertiary: '#3A3A3C',

  // Text
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  textTertiary: '#636366',

  // Separators & Borders
  separator: '#38383A',
  border: '#38383A',

  // Primary brand color
  primary: '#30D158',
  primaryLight: '#34C759',
  primaryDark: '#248A3D',

  // Status colors
  success: '#30D158',
  warning: '#FF9F0A',
  danger: '#FF453A',
  info: '#0A84FF',

  // Glass effects
  glassBackground: 'rgba(44, 44, 46, 0.72)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',

  // Tab bar
  tabBar: 'rgba(30, 30, 30, 0.94)',
  tabBarBorder: 'rgba(255, 255, 255, 0.1)',

  // Misc
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.6)',
} as const;

export type Theme = typeof LightTheme;
export type ThemeColors = keyof Theme;

// Legacy export for backwards compatibility during migration
export const Colors = LightTheme;
