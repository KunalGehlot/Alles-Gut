// Check-in interval options (in hours)
export const CHECK_IN_INTERVALS = [
  { value: 24, label: '24 Stunden', labelEn: '24 hours' },
  { value: 48, label: '48 Stunden', labelEn: '48 hours' },
  { value: 72, label: '72 Stunden', labelEn: '72 hours' },
  { value: 168, label: '1 Woche', labelEn: '1 week' },
] as const;

export const DEFAULT_CHECK_IN_INTERVAL_HOURS = 48;
export const DEFAULT_GRACE_PERIOD_HOURS = 6;
export const MAX_CONTACTS = 5;
export const INVITATION_EXPIRY_DAYS = 7;

// Warning threshold (hours before deadline)
export const WARNING_THRESHOLD_HOURS = 6;

// Color palette
export const COLORS = {
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

// Typography
export const TYPOGRAPHY = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
} as const;

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
} as const;

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH_REQUEST_CODE: '/auth/request-code',
  AUTH_VERIFY: '/auth/verify',
  AUTH_REFRESH: '/auth/refresh',
  AUTH_LOGOUT: '/auth/logout',

  // User
  USER_ME: '/user/me',
  USER_EXPORT: '/user/export',

  // Check-in
  CHECKIN: '/checkin',
  CHECKIN_STATUS: '/checkin/status',

  // Contacts
  CONTACTS: '/contacts',
  CONTACTS_INVITE: '/contacts/invite',
  CONTACTS_ACCEPT: '/contacts/accept',

  // Notifications
  NOTIFICATIONS_REGISTER: '/notifications/register',
} as const;

// German translations for common strings
export const TRANSLATIONS_DE = {
  // General
  appName: 'Alles Gut',
  tagline: 'Dein digitales Lebenszeichen',

  // Auth
  getStarted: 'Jetzt starten',
  alreadyRegistered: 'Bereits registriert? Anmelden',
  withPhone: 'Mit Handynummer',
  withEmail: 'Mit E-Mail',
  requestCode: 'Code anfordern',
  verifyCode: 'Bestätigungscode eingeben',
  resendCode: 'Code erneut senden',
  continue: 'Weiter',
  done: 'Fertig',

  // Check-in
  imOkay: 'ALLES GUT',
  tapToCheckIn: 'Tippe, um dich zu melden',
  signOfLifeSent: 'Lebenszeichen gesendet!',
  nextDeadline: 'Nächste Frist',
  lastCheckIn: 'Letztes Lebenszeichen',
  pleaseCheckInSoon: 'Bitte melde dich bald!',
  hoursRemaining: 'noch {hours} Stunden',

  // Contacts
  contacts: 'Kontakte',
  emergencyContacts: 'Notfallkontakte',
  inviteContact: 'Kontakt einladen',
  pending: 'Einladung ausstehend',
  active: 'Aktiv',
  copyLink: 'Link kopieren',
  shareLink: 'Link teilen',
  linkValidFor: 'Der Link ist {days} Tage gültig',

  // Settings
  settings: 'Einstellungen',
  profile: 'Profil',
  displayName: 'Anzeigename',
  checkInInterval: 'Intervall',
  pause: 'Pausieren',
  pauseSubtitle: 'Für Urlaub/Reisen',
  notifications: 'Benachrichtigungen',
  reminders: 'Erinnerungen',
  emailBackup: 'E-Mail-Backup',
  privacy: 'Datenschutz',
  privacyPolicy: 'Datenschutzerklärung',
  exportData: 'Meine Daten exportieren',
  deleteAccount: 'Konto löschen',
  about: 'Über Alles Gut',
  imprint: 'Impressum',

  // Alerts
  alertTitle: 'Wichtige Mitteilung',
  alertMessage: '{name} hat sich seit {hours} Stunden nicht gemeldet. Bitte prüfe, ob alles in Ordnung ist.',

  // Privacy
  dataStaysPrivate: 'Deine Daten bleiben privat',
  gdprCompliant: 'DSGVO-konform',
  endToEndEncrypted: 'Ende-zu-Ende verschlüsselt',
} as const;
