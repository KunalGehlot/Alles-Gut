# Alles Gut

A privacy-first life check-in app. Users send regular "I'm OK" signals to their emergency contacts. If a check-in is missed, contacts are automatically notified.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [1. Clone & Install](#1-clone--install)
  - [2. Environment Setup](#2-environment-setup)
  - [3. Database Setup](#3-database-setup)
  - [4. Running Locally](#4-running-locally)
- [Features](#features)
  - [Safe Check-ins](#safe-check-ins)
  - [Strict Pausing](#strict-pausing)
  - [Security](#security)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## Overview

**Alles Gut** (German: "All Good") provides peace of mind through periodic check-ins.
- **Privacy-First**: End-to-end encryption for all user data (AES-256).
- **Reliable**: Automatic notifications via email and push notifications if a check-in is missed.
- **Simple**: One-tap check-ins.
- **Strict**: 24-hour only pause mechanism to prevent long-term tracking avoidance.

---

## Architecture

This project is a monorepo managed by [Turbo](https://turbo.build/).

```mermaid
graph TD
    subgraph Monorepo
        API[apps/api<br>Express & Node.js]
        Mobile[apps/mobile<br>React Native & Expo]
        Shared[packages/shared<br>TypeScript Types]
    end
    
    DB[(PostgreSQL)]
    
    API --> DB
    Mobile --> API
    API --> Shared
    Mobile --> Shared
```

- **Backend**: Node.js, Express, PostgreSQL
- **Frontend**: React Native, Expo (Expo Router)
- **Shared**: TypeScript interfaces, constants, and types
- **Database**: PostgreSQL (Railway)

---

## Prerequisites

Before you begin, ensure you have the following installed:

| Tool | Version | Purpose |
|------|---------|---------|
| [Node.js](https://nodejs.org/) | ≥18.0.0 | Runtime environment |
| [Git](https://git-scm.com/) | Latest | Version control |
| [PostgreSQL](https://www.postgresql.org/) | ≥14 | Local database |

**For Mobile Development:**
- [Expo Go](https://expo.dev/client) app on your physical device.
- **iOS Simulator**: Requires Xcode (macOS only).
- **Android Emulator**: Requires Android Studio.

---

## Getting Started

### 1. Clone & Install

```bash
# Clone the repository
git clone https://github.com/your-org/alles-gut.git
cd alles-gut

# Install dependencies (installs for all workspaces)
npm install
```

### 2. Environment Setup

You need to set up environment variables for both the API and the Mobile app.

#### API (`apps/api/.env`)

```bash
cp apps/api/.env.example apps/api/.env
```

Required variables in `apps/api/.env`:

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `DATABASE_URL` | Postgres connection string | `postgresql://user:pass@localhost:5432/alles_gut_dev` |
| `JWT_SECRET` | Signing access tokens | `openssl rand -hex 32` |
| `JWT_REFRESH_SECRET` | Signing refresh tokens | `openssl rand -hex 32` |
| `ENCRYPTION_KEY` | **Critical**: Data encryption | 32-char string (exactly 32 chars) |
| `RESEND_API_KEY` | Email service (Resend) | `re_123...` |
| `EXPO_ACCESS_TOKEN` | Push notifications | (From Expo Dashboard) |

#### Mobile (`apps/mobile/.env`)

```bash
cp apps/mobile/.env.example apps/mobile/.env
```

Required variables:

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_API_URL` | URL of your local API. |
| `EXPO_PUBLIC_EAS_PROJECT_ID` | EAS project UUID (required for push notifications). |

> [!IMPORTANT]
> - If testing on a physical device, `localhost` will not work. Use your machine's local IP address (e.g., `http://192.168.1.50:3000`).
> - Push notifications require a development build (not Expo Go) with a valid `EXPO_PUBLIC_EAS_PROJECT_ID`.

### 3. Database Setup

Ensure PostgreSQL is running, then run migrations:

```bash
# Initialize database schema
npm run db:migrate --workspace=apps/api
```

### 4. Running Locally

You can run the entire stack or individual parts.

**Run All (Recommended):**
```bash
npm run dev
```
This uses Turbo to start both the API (port 3000) and Mobile bundler.

**Run API Only:**
```bash
npm run api
```

**Run Mobile Only:**
```bash
npm run mobile
```
Press `i` for iOS simulator, `a` for Android emulator, or scan the QR code with Expo Go.

---

## Features

### Safe Check-ins
Primary interface allows for a quick "Alles Gut" tap. This resets your deadline based on your chosen interval (default 48h).

### Strict Pausing
Users can pause check-ins for **exactly 24 hours**. 
- Cannot pause if already overdue.
- Cannot extend an active pause.
- Must manually verify (check-in) to unpause or after the timer expires.

### Security
- **Encryption**: Names and contact info are encrypted at rest using AES-256-CBC. keys are never stored in plain text in the DB.
- **Biometrics**: Mobile app supports blocking access via FaceID/TouchID.
- **GDPR**: Full export and strict deletion support.

---

## Testing

Currently, the project relies on **manual verification**. Use the following flow to verify changes:

1.  **Sign Up**: Create a new account using an email address.
    -   *Verify*: You receive an email code (look at server logs if Resend key is invalid).
2.  **Onboarding**: Complete the simplified onboarding flow.
3.  **Add Contact**: Add a dummy contact email.
4.  **Check-In**: Tap the main check-in button.
    -   *Verify*: Last check-in time updates.
5.  **Pause**: Test the 24h pause feature in Settings.

---

## Deployment

### API (Railway)

The API includes a `Dockerfile` and `railway.toml` for easy deployment on [Railway](https://railway.app/).

1.  Connect your GitHub repo to Railway.
2.  Add a PostgreSQL plugin.
3.  Set production environment variables in Railway dashboard.
4.  Railway will automatically build and deploy using the Dockerfile.

Alternatively, use the Railway CLI:
```bash
railway link
railway up
```

### Mobile (Expo EAS)

1.  Install EAS CLI: `npm install -g eas-cli`
2.  Login: `eas login`
3.  Build:
    ```bash
    cd apps/mobile
    eas build --profile production --platform all
    ```
4.  Submit:
    ```bash
    eas submit --platform ios
    eas submit --platform android
    ```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **"Network Error" on mobile** | Ensure `EXPO_PUBLIC_API_URL` uses your standard LAN IP (e.g., `192.168.x.x`), not `localhost`. Ensure phone is on same WiFi. |
| **"Worklets mismatch"** | Run `npx expo install --fix` in `apps/mobile` to align Reanimated versions. |
| **"No workspaces found"** | If deploying to Railway, ensure `railway.toml` points to correct start command. |
| **Path spaces error** | Avoid spaces in project path (e.g. use `Alles-Gut` not `Alles Gut`). iOS pods scripts may fail otherwise. |
