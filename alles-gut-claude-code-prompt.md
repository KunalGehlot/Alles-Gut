# Alles Gut - Claude Code Project Prompt

## Start Command
```bash
claude --plan "Read CLAUDE_PROMPT.md and create a complete implementation plan for the Alles Gut app"
```

---

# PROJECT OVERVIEW

## App Name
**Alles Gut** (German: "All Good" / "Everything's Fine")

## Concept
A "proof of life" app for the German market. Users check in periodically by pressing a button. If they fail to check in within a configurable time window (default: 48 hours), their designated emergency contacts receive an automated notification. This addresses the growing concern of people living alone—especially in urban areas—who fear something happening to them without anyone noticing.

## Target Market
- Germany (primary)
- German-speaking countries (Austria, Switzerland) as secondary
- EU-compliant from day one

## Development Phase
MVP - Initial launch targeting 10-100 users

## Tech Stack (Non-negotiable)
- **Frontend**: React Native (Expo managed workflow for faster MVP)
- **Language**: TypeScript
- **Backend**: Node.js with Express or Fastify
- **Database**: PostgreSQL with encryption at rest
- **Push Notifications**: Expo Push Notifications (free tier sufficient for MVP)
- **Hosting**: Railway.app or Render.com (simple, EU regions available, affordable)
- **Authentication**: Passwordless (magic link or phone verification)

---

# FUNCTIONAL REQUIREMENTS

## Core Features (MVP)

### 1. User Registration
- Phone number OR email-based registration (passwordless)
- Minimal data collection:
  - Display name (can be pseudonym)
  - Phone number OR email
  - Preferred language (German default)
- Generate unique user ID (UUID v4)
- All PII encrypted at rest using AES-256

### 2. Check-In Mechanism ("Lebenszeichen" - Sign of Life)
- Large, prominent button on home screen
- Single tap to confirm "Ich bin okay" (I'm okay)
- Visual feedback: Animation + haptic feedback
- Configurable check-in interval:
  - 24 hours
  - 48 hours (default)
  - 72 hours
  - 1 week
- Grace period: 6 hours after deadline before alert sent

### 3. Contact Management
- Add emergency contacts via:
  - In-app invitation (generates unique link)
  - QR code scanning
- Contacts MUST have the app installed (closed network = more secure)
- Bidirectional relationship: Both parties must accept
- Maximum 5 emergency contacts (MVP limit)
- Contact data stored encrypted

### 4. Alert System
- Triggered when: User misses check-in + grace period expires
- Notification to all emergency contacts:
  - Push notification (primary)
  - Optional: Email backup
- Alert message (German):
  ```
  "[Name] hat sich seit [X] Stunden nicht gemeldet. 
   Bitte prüfe, ob alles in Ordnung ist."
  ```
  Translation: "[Name] hasn't checked in for [X] hours. Please check if everything is okay."

### 5. Settings
- Check-in interval configuration
- Notification preferences
- Vacation mode / Pause function
- Data export (GDPR requirement)
- Account deletion (GDPR requirement)

## Non-MVP Features (Document but don't implement)
- Scheduled check-ins (specific times)
- Location sharing (emergency only)
- Integration with emergency services
- Widget for home screen
- Apple Watch / WearOS support

---

# TECHNICAL ARCHITECTURE

## System Architecture (MVP)

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                  │
│  ┌───────────────┐                      ┌───────────────┐       │
│  │   iOS App     │                      │  Android App  │       │
│  │ (React Native)│                      │(React Native) │       │
│  └───────┬───────┘                      └───────┬───────┘       │
│          │                                      │               │
│          └──────────────┬───────────────────────┘               │
│                         │                                        │
│                         ▼                                        │
│          ┌──────────────────────────────┐                       │
│          │      Expo Push Service       │                       │
│          │   (Notifications Gateway)    │                       │
│          └──────────────┬───────────────┘                       │
└─────────────────────────┼───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                       BACKEND (EU Region)                        │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    API Server (Node.js)                     │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │ │
│  │  │    Auth     │ │  Check-In   │ │  Notification       │   │ │
│  │  │   Service   │ │   Service   │ │  Scheduler (Cron)   │   │ │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘   │ │
│  └────────────────────────┬───────────────────────────────────┘ │
│                           │                                      │
│                           ▼                                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              PostgreSQL (Encrypted at Rest)                 │ │
│  │                                                             │ │
│  │  ┌─────────┐ ┌─────────────┐ ┌───────────┐ ┌────────────┐  │ │
│  │  │  Users  │ │  Contacts   │ │ Check-ins │ │   Alerts   │  │ │
│  │  │(encrypted)│(encrypted) │ │           │ │            │  │ │
│  │  └─────────┘ └─────────────┘ └───────────┘ └────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Database Schema

```sql
-- Users table (PII fields encrypted)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    encrypted_display_name BYTEA NOT NULL,        -- AES-256 encrypted
    encrypted_contact_info BYTEA NOT NULL,        -- email or phone, encrypted
    contact_type VARCHAR(10) NOT NULL,            -- 'email' or 'phone'
    check_in_interval_hours INTEGER DEFAULT 48,
    grace_period_hours INTEGER DEFAULT 6,
    expo_push_token TEXT,                         -- for push notifications
    is_paused BOOLEAN DEFAULT FALSE,
    last_check_in TIMESTAMP WITH TIME ZONE,
    next_deadline TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contacts (friend relationships)
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    contact_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending',         -- pending, accepted, rejected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, contact_user_id)
);

-- Check-in history (for audit/debugging)
CREATE TABLE check_ins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alert log
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notified_contacts UUID[] -- array of contact IDs notified
);

-- Invitations (for adding contacts)
CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    invite_code VARCHAR(20) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## API Endpoints

```yaml
Authentication:
  POST   /auth/request-code      # Request magic link/OTP
  POST   /auth/verify            # Verify code, return JWT
  POST   /auth/refresh           # Refresh JWT token
  DELETE /auth/logout            # Invalidate token

User:
  GET    /user/me                # Get current user profile
  PATCH  /user/me                # Update profile/settings
  DELETE /user/me                # Delete account (GDPR)
  GET    /user/export            # Export all user data (GDPR)

Check-In:
  POST   /checkin                # Record check-in, update deadline
  GET    /checkin/status         # Get current status & next deadline

Contacts:
  GET    /contacts               # List all contacts
  POST   /contacts/invite        # Generate invitation code/link
  POST   /contacts/accept        # Accept invitation by code
  DELETE /contacts/:id           # Remove contact

Notifications:
  POST   /notifications/register # Register Expo push token
```

## Encryption Strategy

```typescript
// Use Node.js crypto with AES-256-GCM
// Master key stored in environment variable (Railway/Render secrets)
// Per-user data encryption key derived from master key + user ID

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function encrypt(text: string, masterKey: string, userId: string): Buffer {
    // Derive user-specific key
    const userKey = crypto.scryptSync(masterKey, userId, 32);
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, userKey, iv);
    
    const encrypted = Buffer.concat([
        cipher.update(text, 'utf8'),
        cipher.final()
    ]);
    
    const authTag = cipher.getAuthTag();
    
    // Return: IV + AuthTag + EncryptedData
    return Buffer.concat([iv, authTag, encrypted]);
}

function decrypt(encryptedData: Buffer, masterKey: string, userId: string): string {
    const userKey = crypto.scryptSync(masterKey, userId, 32);
    const iv = encryptedData.subarray(0, IV_LENGTH);
    const authTag = encryptedData.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = encryptedData.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, userKey, iv);
    decipher.setAuthTag(authTag);
    
    return decipher.update(encrypted) + decipher.final('utf8');
}
```

---

# UI/UX SPECIFICATIONS (German Market Adaptation)

## Design Principles for German/European Users

1. **Privacy-First Messaging**: Prominently display data protection info
2. **Minimalist & Functional**: Clean design, no unnecessary gamification
3. **Accessibility**: WCAG 2.1 AA compliance, support for system font scaling
4. **Trust Through Transparency**: Clear explanations of what data is collected and why
5. **Serious but Warm**: Not morbid, but also not overly cheerful—respectful tone
6. **No Dark Patterns**: Clear opt-in/opt-out, no manipulative UI

## Color Palette

```typescript
const colors = {
    // Primary - Calming green (life, nature, okay)
    primary: '#2D7D46',           // Forest green
    primaryLight: '#4CAF50',      // Lighter green for buttons
    primaryDark: '#1B5E20',       // Dark green for text
    
    // Secondary - Warm neutral
    secondary: '#5C6BC0',         // Soft indigo for accents
    
    // Status colors
    success: '#43A047',           // Check-in confirmed
    warning: '#FB8C00',           // Approaching deadline
    danger: '#E53935',            // Missed check-in / Alert
    
    // Neutrals
    background: '#FAFAFA',        // Light gray background
    surface: '#FFFFFF',           // Card backgrounds
    textPrimary: '#212121',       // Main text
    textSecondary: '#757575',     // Secondary text
    border: '#E0E0E0',            // Borders and dividers
};
```

## Typography

```typescript
const typography = {
    // Use system fonts for familiarity and performance
    fontFamily: {
        regular: 'System',        // San Francisco (iOS) / Roboto (Android)
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
};
```

## Screen Specifications

### 1. Onboarding / Welcome Screen

```
┌─────────────────────────────────┐
│                                 │
│         [App Logo]              │
│                                 │
│        "Alles Gut"              │
│                                 │
│   Dein digitales Lebenszeichen  │
│   (Your digital sign of life)   │
│                                 │
│                                 │
│  ┌───────────────────────────┐  │
│  │      Jetzt starten        │  │
│  │      (Get started)        │  │
│  └───────────────────────────┘  │
│                                 │
│  Bereits registriert? Anmelden  │
│  (Already registered? Sign in)  │
│                                 │
│                                 │
│  🔒 Deine Daten bleiben privat  │
│  (Your data stays private)      │
│  DSGVO-konform · Ende-zu-Ende   │
│  verschlüsselt                  │
│                                 │
└─────────────────────────────────┘
```

### 2. Registration Flow

**Step 1: Contact Method**
```
┌─────────────────────────────────┐
│ ←                               │
│                                 │
│   Wie möchtest du dich          │
│   registrieren?                 │
│   (How would you like to        │
│    register?)                   │
│                                 │
│  ┌───────────────────────────┐  │
│  │  📱  Mit Handynummer      │  │
│  │      (With phone number)  │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │  ✉️   Mit E-Mail          │  │
│  │      (With email)         │  │
│  └───────────────────────────┘  │
│                                 │
│                                 │
│  ℹ️ Wir senden dir einen        │
│  Bestätigungscode. Kein         │
│  Passwort nötig.                │
│  (We'll send you a verification │
│   code. No password needed.)    │
│                                 │
└─────────────────────────────────┘
```

**Step 2: Enter Contact Info**
```
┌─────────────────────────────────┐
│ ←                               │
│                                 │
│   Deine E-Mail-Adresse          │
│   (Your email address)          │
│                                 │
│  ┌───────────────────────────┐  │
│  │  max.mustermann@email.de  │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │      Code anfordern       │  │
│  │      (Request code)       │  │
│  └───────────────────────────┘  │
│                                 │
│                                 │
│  🔒 Deine E-Mail wird           │
│  verschlüsselt gespeichert und  │
│  nur für die Anmeldung und      │
│  Notfall-Benachrichtigungen     │
│  verwendet.                     │
│                                 │
└─────────────────────────────────┘
```

**Step 3: Verification**
```
┌─────────────────────────────────┐
│ ←                               │
│                                 │
│   Bestätigungscode eingeben     │
│   (Enter verification code)     │
│                                 │
│   Gesendet an:                  │
│   max.mustermann@email.de       │
│                                 │
│      ┌───┐ ┌───┐ ┌───┐ ┌───┐   │
│      │ 4 │ │ 7 │ │ 2 │ │ _ │   │
│      └───┘ └───┘ └───┘ └───┘   │
│                                 │
│   Code erneut senden (0:45)     │
│   (Resend code)                 │
│                                 │
└─────────────────────────────────┘
```

**Step 4: Display Name**
```
┌─────────────────────────────────┐
│ ←                               │
│                                 │
│   Wie sollen dich deine         │
│   Kontakte sehen?               │
│   (How should your contacts     │
│    see you?)                    │
│                                 │
│  ┌───────────────────────────┐  │
│  │  Max                      │  │
│  └───────────────────────────┘  │
│                                 │
│  ℹ️ Du kannst einen Spitznamen  │
│  oder deinen echten Namen       │
│  verwenden.                     │
│  (You can use a nickname or     │
│   your real name.)              │
│                                 │
│  ┌───────────────────────────┐  │
│  │      Weiter               │  │
│  │      (Continue)           │  │
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

**Step 5: Check-in Interval**
```
┌─────────────────────────────────┐
│ ←                               │
│                                 │
│   Wie oft möchtest du dich      │
│   melden?                       │
│   (How often do you want to     │
│    check in?)                   │
│                                 │
│  ○  Alle 24 Stunden             │
│                                 │
│  ●  Alle 48 Stunden (empfohlen) │
│                                 │
│  ○  Alle 72 Stunden             │
│                                 │
│  ○  Einmal pro Woche            │
│                                 │
│                                 │
│  ℹ️ Nach Ablauf dieser Zeit     │
│  + 6 Stunden Karenzzeit werden  │
│  deine Kontakte benachrichtigt. │
│                                 │
│  ┌───────────────────────────┐  │
│  │      Fertig               │  │
│  │      (Done)               │  │
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

### 3. Home Screen (Main Check-In Screen)

```
┌─────────────────────────────────┐
│  ≡                    [Avatar]  │
│                                 │
│                                 │
│        Hallo, Max! 👋           │
│                                 │
│   Dein letztes Lebenszeichen:   │
│   Gestern, 14:32 Uhr            │
│                                 │
│                                 │
│        ┌─────────────┐          │
│       ╱               ╲         │
│      │                 │        │
│      │    ✓            │        │
│      │  ALLES GUT      │        │
│      │                 │        │
│       ╲               ╱         │
│        └─────────────┘          │
│                                 │
│    Tippe, um dich zu melden     │
│    (Tap to check in)            │
│                                 │
│                                 │
│  ┌───────────────────────────┐  │
│  │ ⏱️ Nächste Frist:          │  │
│  │   Morgen, 20:32 Uhr       │  │
│  │   (noch 30 Stunden)       │  │
│  └───────────────────────────┘  │
│                                 │
│  👥 3 Kontakte werden           │
│     benachrichtigt              │
│                                 │
├─────────────────────────────────┤
│  🏠        👥        ⚙️         │
│ Start   Kontakte  Einstellungen │
└─────────────────────────────────┘
```

**After Check-In (Success State)**
```
┌─────────────────────────────────┐
│                                 │
│                                 │
│            ✓                    │
│                                 │
│     Lebenszeichen gesendet!     │
│     (Sign of life sent!)        │
│                                 │
│     Heute, 18:45 Uhr            │
│                                 │
│                                 │
│     Nächste Frist:              │
│     Freitag, 18:45 Uhr          │
│                                 │
│                                 │
└─────────────────────────────────┘
```

**Warning State (Approaching Deadline)**
```
┌─────────────────────────────────┐
│                                 │
│   ⚠️ Bitte melde dich bald!     │
│                                 │
│        ┌─────────────┐          │
│       ╱   ORANGE     ╲         │
│      │    BUTTON      │        │
│       ╲               ╱         │
│        └─────────────┘          │
│                                 │
│  ⏱️ Nur noch 4 Stunden!         │
│                                 │
└─────────────────────────────────┘
```

### 4. Contacts Screen

```
┌─────────────────────────────────┐
│  ←      Kontakte                │
│                                 │
│  Deine Notfallkontakte (3/5)    │
│  (Your emergency contacts)      │
│                                 │
│  ┌───────────────────────────┐  │
│  │ 👤 Anna                   │  │
│  │    ✓ Aktiv · Hinzugefügt  │  │
│  │      am 12.01.2026        │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ 👤 Thomas                 │  │
│  │    ✓ Aktiv · Hinzugefügt  │  │
│  │      am 10.01.2026        │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ 👤 Mama                   │  │
│  │    ⏳ Einladung ausstehend │  │
│  └───────────────────────────┘  │
│                                 │
│                                 │
│  ┌───────────────────────────┐  │
│  │  ＋ Kontakt einladen      │  │
│  │     (Invite contact)      │  │
│  └───────────────────────────┘  │
│                                 │
├─────────────────────────────────┤
│  🏠        👥        ⚙️         │
└─────────────────────────────────┘
```

### 5. Invite Contact Screen

```
┌─────────────────────────────────┐
│  ←    Kontakt einladen          │
│                                 │
│                                 │
│   Teile diesen Link oder        │
│   QR-Code mit der Person,       │
│   die dich im Notfall           │
│   benachrichtigt werden soll.   │
│                                 │
│       ┌─────────────────┐       │
│       │                 │       │
│       │    [QR CODE]    │       │
│       │                 │       │
│       └─────────────────┘       │
│                                 │
│   ──────── ODER ────────        │
│                                 │
│  ┌───────────────────────────┐  │
│  │  📋 Link kopieren         │  │
│  │  allesgut.app/i/X7kM9p   │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │  📤 Link teilen           │  │
│  │     (Share link)          │  │
│  └───────────────────────────┘  │
│                                 │
│  ℹ️ Der Link ist 7 Tage gültig  │
│  (Link valid for 7 days)        │
│                                 │
└─────────────────────────────────┘
```

### 6. Settings Screen

```
┌─────────────────────────────────┐
│  ←    Einstellungen             │
│                                 │
│  PROFIL                         │
│  ┌───────────────────────────┐  │
│  │ 👤 Anzeigename            │  │
│  │    Max                  → │  │
│  └───────────────────────────┘  │
│                                 │
│  CHECK-IN                       │
│  ┌───────────────────────────┐  │
│  │ ⏱️ Intervall              │  │
│  │    Alle 48 Stunden      → │  │
│  ├───────────────────────────┤  │
│  │ ⏸️ Pausieren              │  │
│  │    Für Urlaub/Reisen    → │  │
│  └───────────────────────────┘  │
│                                 │
│  BENACHRICHTIGUNGEN             │
│  ┌───────────────────────────┐  │
│  │ 🔔 Erinnerungen        [✓]│  │
│  ├───────────────────────────┤  │
│  │ 📧 E-Mail-Backup       [✓]│  │
│  └───────────────────────────┘  │
│                                 │
│  DATENSCHUTZ                    │
│  ┌───────────────────────────┐  │
│  │ 📄 Datenschutzerklärung → │  │
│  ├───────────────────────────┤  │
│  │ 📥 Meine Daten exportieren│  │
│  ├───────────────────────────┤  │
│  │ 🗑️ Konto löschen          │  │
│  └───────────────────────────┘  │
│                                 │
│  APP                            │
│  ┌───────────────────────────┐  │
│  │ ℹ️ Über Alles Gut       → │  │
│  ├───────────────────────────┤  │
│  │ 📝 Impressum            → │  │
│  └───────────────────────────┘  │
│                                 │
│        Version 1.0.0            │
│                                 │
└─────────────────────────────────┘
```

---

# GDPR COMPLIANCE CHECKLIST

## Required Implementations

### 1. Consent & Transparency
- [ ] Privacy policy in German (Datenschutzerklärung)
- [ ] Clear consent checkboxes during registration
- [ ] Explanation of data usage at each collection point
- [ ] Imprint page (Impressum) - legally required in Germany

### 2. Data Subject Rights
- [ ] **Right to Access**: `/user/export` endpoint returns all user data as JSON
- [ ] **Right to Deletion**: `/user/me` DELETE endpoint removes all data
- [ ] **Right to Rectification**: Users can update their profile data
- [ ] **Right to Portability**: Export in machine-readable format (JSON)

### 3. Data Minimization
- [ ] Only collect: display name, contact info (email/phone), push token
- [ ] No tracking, analytics, or unnecessary data collection
- [ ] No third-party SDKs that collect data (no Firebase Analytics, etc.)

### 4. Technical Measures
- [ ] All PII encrypted at rest (AES-256-GCM)
- [ ] TLS 1.3 for all API communication
- [ ] JWT tokens with short expiry (1 hour) + refresh tokens
- [ ] Database hosted in EU region
- [ ] No data transferred outside EU

### 5. Documentation
- [ ] Record of processing activities
- [ ] Data protection impact assessment (DPIA) - basic version for MVP

## Privacy Policy Sections (German)
1. Verantwortlicher (Controller)
2. Erhobene Daten (Data collected)
3. Zweck der Verarbeitung (Purpose)
4. Rechtsgrundlage (Legal basis)
5. Speicherdauer (Retention period)
6. Empfänger der Daten (Recipients)
7. Ihre Rechte (Your rights)
8. Kontakt Datenschutzbeauftragter (DPO contact)

---

# INFRASTRUCTURE SETUP (MVP)

## Recommended: Railway.app

### Why Railway?
- EU region available (eu-west)
- Simple deployment from GitHub
- Managed PostgreSQL included
- Free tier sufficient for MVP (10-100 users)
- Easy environment variable management
- HTTPS included

### Setup Steps
```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Initialize project
railway init

# 4. Add PostgreSQL
railway add --plugin postgresql

# 5. Set environment variables
railway variables set MASTER_ENCRYPTION_KEY=<generate-secure-key>
railway variables set JWT_SECRET=<generate-secure-key>
railway variables set EXPO_ACCESS_TOKEN=<from-expo-dashboard>

# 6. Deploy
railway up
```

### Cost Estimate (MVP)
- Railway Hobby Plan: $5/month
- PostgreSQL: Included in hobby plan
- Expo Push Notifications: Free tier (unlimited)
- **Total: ~$5/month**

## Alternative: Render.com
- Similar pricing and features
- Frankfurt region available
- Good alternative if Railway doesn't work out

---

# PROJECT STRUCTURE

```
alles-gut/
├── apps/
│   └── mobile/                    # React Native app
│       ├── app/                   # Expo Router screens
│       │   ├── (auth)/
│       │   │   ├── welcome.tsx
│       │   │   ├── register.tsx
│       │   │   └── verify.tsx
│       │   ├── (main)/
│       │   │   ├── index.tsx      # Home/Check-in screen
│       │   │   ├── contacts.tsx
│       │   │   └── settings.tsx
│       │   └── _layout.tsx
│       ├── components/
│       │   ├── CheckInButton.tsx
│       │   ├── ContactCard.tsx
│       │   ├── CountdownTimer.tsx
│       │   └── ...
│       ├── hooks/
│       │   ├── useAuth.ts
│       │   ├── useCheckIn.ts
│       │   └── useContacts.ts
│       ├── services/
│       │   └── api.ts
│       ├── i18n/
│       │   └── de.json            # German translations
│       ├── constants/
│       │   ├── colors.ts
│       │   └── typography.ts
│       ├── app.json
│       ├── package.json
│       └── tsconfig.json
│
├── apps/
│   └── api/                       # Node.js backend
│       ├── src/
│       │   ├── routes/
│       │   │   ├── auth.ts
│       │   │   ├── user.ts
│       │   │   ├── checkin.ts
│       │   │   ├── contacts.ts
│       │   │   └── notifications.ts
│       │   ├── services/
│       │   │   ├── encryption.ts
│       │   │   ├── notifications.ts
│       │   │   └── scheduler.ts
│       │   ├── middleware/
│       │   │   └── auth.ts
│       │   ├── db/
│       │   │   ├── schema.sql
│       │   │   └── client.ts
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   └── shared/                    # Shared types/utilities
│       ├── types.ts
│       └── constants.ts
│
├── docs/
│   ├── privacy-policy-de.md
│   ├── impressum.md
│   └── api-documentation.md
│
├── package.json                   # Monorepo root
├── turbo.json                     # Turborepo config
└── README.md
```

---

# IMPLEMENTATION PLAN

## Phase 1: Project Setup (Day 1-2)
1. Initialize monorepo with Turborepo
2. Set up React Native project with Expo
3. Set up Node.js API project
4. Configure TypeScript for all packages
5. Set up Railway project with PostgreSQL
6. Create database schema

## Phase 2: Authentication (Day 3-4)
1. Implement magic link / OTP email sending
2. Build verification flow
3. JWT token generation and refresh
4. Create auth middleware
5. Build mobile auth screens

## Phase 3: Core Check-In Feature (Day 5-7)
1. Build check-in API endpoint
2. Implement deadline calculation logic
3. Create check-in button component with animations
4. Build home screen with status display
5. Implement countdown timer

## Phase 4: Contacts System (Day 8-10)
1. Build invitation generation
2. Create QR code generation/scanning
3. Implement contact acceptance flow
4. Build contacts list screen
5. Handle bidirectional relationships

## Phase 5: Notification System (Day 11-13)
1. Set up Expo Push Notifications
2. Implement push token registration
3. Build notification scheduler (cron job)
4. Create alert triggering logic
5. Test notification delivery

## Phase 6: Settings & GDPR (Day 14-15)
1. Build settings screen
2. Implement data export endpoint
3. Implement account deletion
4. Create pause/vacation mode
5. Write privacy policy and impressum

## Phase 7: Polish & Testing (Day 16-18)
1. UI polish and animations
2. Error handling improvements
3. Loading states
4. End-to-end testing
5. Beta testing with 5-10 users

## Phase 8: App Store Preparation (Day 19-21)
1. Create app icons and splash screens
2. Write app store descriptions (German)
3. Take screenshots
4. Build production versions
5. Submit to App Store and Play Store

---

# COMMANDS FOR CLAUDE CODE

Start the project with:
```bash
claude --plan
```

Then paste this entire document when asked for context.

Key commands you'll use:
```bash
# Initialize the project
claude "Set up the monorepo structure as specified in the PROJECT STRUCTURE section"

# Work on specific features
claude "Implement the authentication flow with magic link emails"
claude "Build the CheckInButton component with the specified design"
claude "Create the notification scheduler service"

# Run the app
cd apps/mobile && npx expo start
cd apps/api && npm run dev

# Deploy
railway up
```

---

# IMPORTANT NOTES

1. **Test on real devices**: Push notifications don't work in simulators
2. **App Store Review**: Apple may take 1-2 weeks for first review
3. **Play Store Review**: Usually faster, 1-3 days
4. **German App Store**: Make sure all metadata is in German
5. **Backup contact method**: Consider adding SMS as fallback (costs money)

---

# SUCCESS METRICS (MVP)

- [ ] User can register in under 2 minutes
- [ ] Check-in takes exactly 1 tap
- [ ] Notification delivered within 1 minute of deadline
- [ ] App size under 50MB
- [ ] Cold start under 3 seconds
- [ ] 99% uptime on backend

---

Good luck with Alles Gut! 🍀
