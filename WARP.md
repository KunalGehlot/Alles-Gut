# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**Alles Gut** is a privacy-first life check-in app using end-to-end encryption. Users send regular "I'm OK" signals to emergency contacts, with automatic notifications if a check-in is missed.

## Common Commands

### Development
```bash
# Run entire stack (API + Mobile)
npm run dev

# Run API only (port 3000)
npm run api

# Run mobile only
npm run mobile
```

### Building
```bash
# Build all workspaces
npm run build

# Build specific workspace
npm run build --workspace=apps/api
npm run build --workspace=apps/mobile
```

### Linting
```bash
# Lint all workspaces
npm run lint

# Lint specific workspace
npm run lint --workspace=apps/api
npm run lint --workspace=apps/mobile
```

### Database
```bash
# Initialize database schema
psql $DATABASE_URL < apps/api/src/db/schema.sql

# Or manually connect and run
psql -d alles_gut_dev -f apps/api/src/db/schema.sql
```

### Testing
The project currently relies on manual verification. Test flow:
1. Sign up with an email address
2. Complete onboarding flow
3. Add a dummy contact email
4. Tap the check-in button
5. Verify last check-in time updates

### Mobile Development
```bash
# iOS simulator
npm run mobile
# Then press 'i'

# Android emulator
npm run mobile
# Then press 'a'

# Install dependencies and fix version issues
cd apps/mobile && npx expo install --fix

# Build for production
cd apps/mobile
eas build --profile production --platform all
```

## Architecture

### Monorepo Structure (Turbo)
- **apps/api** - Express/Node.js backend with PostgreSQL
- **apps/mobile** - React Native/Expo mobile app
- **packages/shared** - Shared TypeScript types and constants

### Key Architectural Patterns

#### End-to-End Encryption
All PII (Personally Identifiable Information) is encrypted at the application level before storage:
- User display names and contact info are encrypted using AES-256-GCM
- Each user has a derived encryption key from a master key + their user ID
- Contact info is hashed for uniqueness checks (HMAC-SHA256)
- Decryption happens only in-memory when needed
- See `apps/api/src/services/encryption.ts` for implementation

#### Passwordless Authentication
- Users authenticate via verification codes sent to email
- JWT access tokens (short-lived) + refresh tokens (long-lived)
- Refresh tokens stored as hashed values in database
- See `apps/api/src/routes/auth.ts` for flow

#### Check-in System
- Background scheduler runs every minute checking for missed deadlines
- Grace period system allows flexible notification timing
- Tracks check-in history for audit purposes
- Users can pause check-ins (e.g., for vacation)
- See `apps/api/src/services/scheduler.ts` for logic

#### Contact Management
- Bidirectional relationship model (contacts table)
- Invitation system with time-limited codes
- Contact status: pending, accepted, rejected
- Max 5 contacts per user (configurable in shared constants)

#### Notification System
- Push notifications via Expo Push Notifications
- Email backup notifications via Resend
- Notifications sent when check-in deadline + grace period expires
- Alert deduplication (max 1 alert per hour per user)
- See `apps/api/src/services/notifications.ts` and `apps/api/src/services/email.ts`

### Database Schema
PostgreSQL schema located at `apps/api/src/db/schema.sql`:
- **users** - Encrypted PII, check-in schedule, pause state
- **contacts** - Bidirectional relationships with status
- **check_ins** - Audit log of all check-ins
- **alerts** - Log of triggered alerts
- **invitations** - Time-limited invite codes
- **verification_codes** - OTP codes for auth
- **refresh_tokens** - Hashed refresh tokens

Critical indexes for performance:
- `idx_users_next_deadline` - For scheduler queries
- `idx_users_contact_info_hash` - For uniqueness checks

### Mobile App Structure
Uses Expo Router for file-based routing:
- **app/(auth)/** - Authentication flow screens (welcome, register, verify, setup)
- **app/(main)/** - Main app screens (index/home, settings, contacts, etc.)
- **contexts/** - React context providers (ThemeContext)
- **hooks/** - Custom hooks (useAuth, useBiometric, useContacts, useNotifications)
- **components/** - Reusable UI components (Button, GlassCard, LockScreen, etc.)
- **constants/** - UI constants (colors, typography)

Key mobile features:
- Biometric lock screen support (Face ID/Touch ID)
- Push notification registration and handling
- Offline-first with secure storage (expo-secure-store)
- Theme support (light/dark mode)

### API Routes
All routes in `apps/api/src/routes/`:
- **/auth** - Request code, verify, refresh token, logout
- **/user** - Get profile, update profile, export data
- **/checkin** - Perform check-in, get status
- **/contacts** - List, create invitation, accept invitation, remove
- **/notifications** - Register push token

### Shared Package
TypeScript types and constants shared between API and mobile:
- **types.ts** - User, Contact, CheckIn, Alert, API request/response interfaces
- **constants.ts** - Check-in intervals, color palette, API endpoints, translations

## Environment Variables

### API (`apps/api/.env`)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Access token signing key
- `JWT_REFRESH_SECRET` - Refresh token signing key
- `MASTER_ENCRYPTION_KEY` - **Critical**: Master key for deriving user encryption keys
- `RESEND_API_KEY` - Email service API key
- `EXPO_ACCESS_TOKEN` - Push notification access token
- `CORS_ORIGIN` - CORS allowed origin (default: *)
- `PORT` - Server port (default: 3000)

### Mobile (`apps/mobile/.env`)
- `EXPO_PUBLIC_API_URL` - API endpoint URL (use LAN IP for physical devices, not localhost)
- `EXPO_PUBLIC_EAS_PROJECT_ID` - EAS project ID for push notifications

## Important Development Notes

### Path Spaces Issue
**Critical**: Avoid spaces in the project path (e.g., use `Alles-Gut` not `Alles Gut`). iOS CocoaPods scripts may fail with spaces in paths.

### Physical Device Testing
When testing on physical devices:
- Cannot use `localhost` in `EXPO_PUBLIC_API_URL`
- Must use machine's LAN IP address (e.g., `http://192.168.1.50:3000`)
- Ensure phone and development machine are on same WiFi network

### Encryption Key Requirements
The `MASTER_ENCRYPTION_KEY` environment variable is critical:
- Used to derive per-user encryption keys
- Losing this key means all encrypted data becomes unrecoverable
- Must be kept secure and never committed to version control

### Database Migration
Currently uses manual schema application:
```bash
psql $DATABASE_URL < apps/api/src/db/schema.sql
```
The schema is idempotent (uses IF NOT EXISTS) so it's safe to re-run.

### Scheduler
The API server starts a background cron scheduler on startup:
- Checks for missed deadlines every minute
- Cleans up expired tokens/codes every hour
- Requires API server to be running continuously in production

## Deployment

### API (Railway)
- Uses `Dockerfile` and `railway.toml`
- Connect GitHub repo to Railway
- Add PostgreSQL plugin
- Set production environment variables
- Auto-deploys on push

### Mobile (Expo EAS)
```bash
eas login
cd apps/mobile
eas build --profile production --platform all
eas submit --platform ios
eas submit --platform android
```

## Code Style Notes

### TypeScript
- Strict mode enabled
- Node version >=18.0.0 required
- Uses ESM modules (`.js` extensions in imports for compiled output)

### Encryption Functions
When working with encrypted data:
- Always use `encrypt(plaintext, userId)` and `decrypt(ciphertext, userId)` from encryption service
- Never log decrypted data
- Encryption format: IV (16 bytes) + AuthTag (16 bytes) + Encrypted Data

### Database Queries
- Use parameterized queries ($1, $2, etc.) - NEVER string concatenation
- Use `db.transaction()` helper for multi-query operations
- Always handle query errors gracefully

### Mobile State Management
- Auth state managed via React Context (`useAuth` hook)
- Secure storage for tokens (expo-secure-store)
- No global state library - uses React Context + hooks pattern
