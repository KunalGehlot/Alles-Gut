export const Colors = {
  // Primary - Calming green (life, nature, okay)
  primary: '#2D7D46',
  primaryLight: '#4CAF50',
  primaryDark: '#1B5E20',

  // Secondary - Warm neutral
  secondary: '#5C6BC0',

  // Status colors
  success: '#43A047',
  warning: '#FB8C00',
  danger: '#E53935',

  // Neutrals
  background: '#FAFAFA',
  surface: '#FFFFFF',
  textPrimary: '#212121',
  textSecondary: '#757575',
  border: '#E0E0E0',

  // Additional
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export type ColorName = keyof typeof Colors;
