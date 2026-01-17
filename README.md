# Alles Gut

A privacy-first life check-in app. Users send regular "I'm OK" signals to their emergency contacts. If a check-in is missed, contacts are automatically notified via push notifications and email.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
  - [macOS](#macos)
  - [Windows](#windows)
  - [Linux](#linux)
- [Project Setup](#project-setup)
- [Development](#development)
  - [Running the API](#running-the-api)
  - [Running the Mobile App](#running-the-mobile-app)
- [Building for Production](#building-for-production)
  - [API Build](#api-build)
  - [Mobile App Build](#mobile-app-build)
- [Deployment](#deployment)
  - [API Deployment (Railway)](#api-deployment-railway)
  - [Mobile App Deployment (Expo/App Stores)](#mobile-app-deployment)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)

---

## Overview

**Alles Gut** (German: "All Good") provides peace of mind through periodic check-ins:

- **Regular Check-ins**: Users tap a button to confirm they're okay
- **Emergency Contacts**: Up to 5 trusted contacts per user
- **Automatic Alerts**: Contacts notified if check-in deadline is missed
- **Privacy-First**: End-to-end encryption, GDPR compliant
- **Passwordless Auth**: Email-based verification codes

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Monorepo                             │
├─────────────────┬─────────────────┬─────────────────────────┤
│   apps/api      │  apps/mobile    │    packages/shared      │
│   (Express.js)  │  (Expo/React    │    (Types, Constants)   │
│                 │   Native)       │                         │
└────────┬────────┴────────┬────────┴─────────────────────────┘
         │                 │
         ▼                 ▼
┌─────────────────┐  ┌─────────────────┐
│   PostgreSQL    │  │   Expo Go /     │
│   Database      │  │   Native Build  │
└─────────────────┘  └─────────────────┘
```

**Tech Stack:**
- **API**: Node.js, Express, TypeScript, PostgreSQL
- **Mobile**: React Native, Expo, TypeScript
- **Shared**: TypeScript types and constants
- **Build**: Turbo (monorepo), Docker (API deployment)

---

## Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | ≥18.0.0 | JavaScript runtime |
| npm | ≥10.0.0 | Package manager |
| Git | Latest | Version control |
| PostgreSQL | ≥14 | Database (for local API dev) |

### For Mobile Development

| Software | Purpose |
|----------|---------|
| Expo Go app | Testing on physical devices |
| Xcode | iOS Simulator (macOS only) |
| Android Studio | Android Emulator |

---

## Environment Setup

### macOS

#### 1. Install Homebrew (if not installed)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### 2. Install Node.js
```bash
# Using Homebrew
brew install node@18

# Or using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.zshrc
nvm install 18
nvm use 18
```

#### 3. Install PostgreSQL
```bash
brew install postgresql@14
brew services start postgresql@14

# Create database
createdb alles_gut_dev
```

#### 4. Install Xcode (for iOS development)
```bash
# Install from Mac App Store, then:
xcode-select --install
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

#### 5. Install Watchman (recommended for React Native)
```bash
brew install watchman
```

---

### Windows

#### 1. Install Node.js
Download and install from [nodejs.org](https://nodejs.org/) (LTS version 18+)

Or use **nvm-windows**:
```powershell
# Install nvm-windows from https://github.com/coreybutler/nvm-windows/releases
nvm install 18
nvm use 18
```

#### 2. Install PostgreSQL
Download and install from [postgresql.org](https://www.postgresql.org/download/windows/)

After installation:
```powershell
# Open psql and create database
psql -U postgres
CREATE DATABASE alles_gut_dev;
\q
```

#### 3. Install Git
Download from [git-scm.com](https://git-scm.com/download/win)

#### 4. Install Android Studio (for Android development)
Download from [developer.android.com](https://developer.android.com/studio)

Configure environment variables:
```powershell
# Add to System Environment Variables
ANDROID_HOME = C:\Users\<username>\AppData\Local\Android\Sdk
Path += %ANDROID_HOME%\emulator
Path += %ANDROID_HOME%\platform-tools
```

#### 5. Enable Developer Mode (for Expo)
Settings → Update & Security → For developers → Developer mode: On

---

### Linux (Ubuntu/Debian)

#### 1. Install Node.js
```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# Or using apt
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### 2. Install PostgreSQL
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database
sudo -u postgres createdb alles_gut_dev
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"
```

#### 3. Install Android Studio (for Android development)
```bash
# Install required dependencies
sudo apt install openjdk-11-jdk

# Download Android Studio from developer.android.com and extract
# Add to ~/.bashrc:
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

#### 4. Install Watchman
```bash
sudo apt install watchman
```

---

## Project Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/alles-gut.git
cd alles-gut
```

### 2. Install Dependencies
```bash
npm install
```

This installs dependencies for all workspaces (api, mobile, shared).

### 3. Set Up Environment Variables

#### API Environment
```bash
cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env`:
```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/alles_gut_dev

# Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars

# Encryption
ENCRYPTION_KEY=your-32-character-encryption-key

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxx
FROM_EMAIL=noreply@allesgut.app

# Push Notifications (Expo)
EXPO_ACCESS_TOKEN=your-expo-access-token

# Server
PORT=3000
NODE_ENV=development
```

#### Mobile Environment
```bash
cp apps/mobile/.env.example apps/mobile/.env
```

Edit `apps/mobile/.env`:
```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

### 4. Initialize Database
```bash
cd apps/api
npm run db:migrate
cd ../..
```

---

## Development

### Running the API

```bash
# From root directory
npm run api

# Or from apps/api directory
cd apps/api
npm run dev
```

The API will be available at `http://localhost:3000`

#### API Endpoints
- `GET /health` - Health check
- `POST /auth/request-code` - Request verification code
- `POST /auth/verify` - Verify code and login
- `GET /user/me` - Get current user profile
- `POST /checkin` - Record a check-in
- `GET /contacts` - List contacts
- `POST /contacts/invite` - Create invitation

### Running the Mobile App

```bash
# From root directory
npm run mobile

# Or from apps/mobile directory
cd apps/mobile
npm run dev
```

This starts the Expo development server.

#### Testing on Devices

**Physical Device (Recommended):**
1. Install "Expo Go" from App Store / Play Store
2. Scan the QR code shown in terminal
3. For iOS: Make sure your phone and computer are on the same WiFi network

**iOS Simulator (macOS only):**
```bash
# Press 'i' in the Expo terminal
# Or run:
npm run ios
```

**Android Emulator:**
```bash
# Start emulator from Android Studio first
# Press 'a' in the Expo terminal
# Or run:
npm run android
```

#### Connecting Mobile to Local API

For physical devices to connect to your local API:

**macOS/Linux:**
```bash
# Find your local IP
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Windows:**
```powershell
ipconfig
# Look for IPv4 Address under your WiFi adapter
```

Update `apps/mobile/.env`:
```env
EXPO_PUBLIC_API_URL=http://192.168.x.x:3000
```

Restart the Expo server after changing environment variables.

---

## Building for Production

### API Build

```bash
cd apps/api
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

To test the production build locally:
```bash
NODE_ENV=production node dist/index.js
```

### Mobile App Build

#### Development Build (for testing)
```bash
cd apps/mobile

# iOS (requires Apple Developer account)
npx eas build --profile development --platform ios

# Android
npx eas build --profile development --platform android
```

#### Production Build
```bash
# iOS
npx eas build --profile production --platform ios

# Android
npx eas build --profile production --platform android

# Both platforms
npx eas build --profile production --platform all
```

#### Configure EAS Build

First, set up EAS:
```bash
npm install -g eas-cli
eas login
eas build:configure
```

This creates `eas.json`:
```json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
```

---

## Deployment

### API Deployment (Railway)

The API is configured to deploy on [Railway](https://railway.app) using Docker.

#### 1. Create Railway Project
1. Go to [railway.app](https://railway.app) and sign up
2. Create a new project
3. Add a PostgreSQL database service
4. Add a new service from GitHub repo

#### 2. Configure Environment Variables

In Railway dashboard, add these environment variables:

```env
DATABASE_URL=<from Railway PostgreSQL>
JWT_SECRET=<generate secure random string>
JWT_REFRESH_SECRET=<generate secure random string>
ENCRYPTION_KEY=<32 character string>
RESEND_API_KEY=<from resend.com>
FROM_EMAIL=noreply@yourdomain.com
EXPO_ACCESS_TOKEN=<from expo.dev>
NODE_ENV=production
PORT=3000
```

#### 3. Deploy

Railway auto-deploys when you push to the main branch.

Manual deploy:
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# Deploy
railway up
```

#### 4. Run Database Migrations

```bash
railway run npm run db:migrate --service=api
```

#### Docker Configuration

The project includes a `Dockerfile` for Railway:

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json ./
COPY .npmrc ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
RUN node -e "const pkg = require('./package.json'); pkg.workspaces = ['apps/api', 'packages/shared']; require('fs').writeFileSync('./package.json', JSON.stringify(pkg, null, 2));"
RUN npm install --legacy-peer-deps
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared
WORKDIR /app/packages/shared
RUN npm run build
WORKDIR /app/apps/api
RUN npm run build

# Production stage
FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

---

### Mobile App Deployment

#### iOS App Store

1. **Apple Developer Account** ($99/year required)

2. **Configure app.json:**
```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourcompany.allesgut",
      "buildNumber": "1.0.0"
    }
  }
}
```

3. **Build for App Store:**
```bash
eas build --profile production --platform ios
```

4. **Submit to App Store:**
```bash
eas submit --platform ios
```

#### Google Play Store

1. **Google Play Developer Account** ($25 one-time)

2. **Configure app.json:**
```json
{
  "expo": {
    "android": {
      "package": "com.yourcompany.allesgut",
      "versionCode": 1
    }
  }
}
```

3. **Build for Play Store:**
```bash
eas build --profile production --platform android
```

4. **Submit to Play Store:**
```bash
eas submit --platform android
```

#### Over-the-Air Updates

For JavaScript-only updates (no native code changes):

```bash
eas update --branch production --message "Bug fixes"
```

---

## Environment Variables

### API Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for access token signing (min 32 chars) |
| `JWT_REFRESH_SECRET` | Yes | Secret for refresh token signing (min 32 chars) |
| `ENCRYPTION_KEY` | Yes | AES encryption key (exactly 32 chars) |
| `RESEND_API_KEY` | Yes | API key from resend.com |
| `FROM_EMAIL` | Yes | Email sender address |
| `EXPO_ACCESS_TOKEN` | Yes | For push notifications |
| `PORT` | No | Server port (default: 3000) |
| `NODE_ENV` | No | Environment (development/production) |

### Mobile Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_API_URL` | Yes | Backend API URL |

---

## Project Structure

```
alles-gut/
├── apps/
│   ├── api/                    # Backend API
│   │   ├── src/
│   │   │   ├── routes/         # API endpoints
│   │   │   ├── services/       # Business logic
│   │   │   ├── db/             # Database schema & queries
│   │   │   └── index.ts        # Entry point
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── mobile/                 # React Native app
│       ├── app/                # Expo Router screens
│       │   ├── (auth)/         # Auth flow screens
│       │   ├── (main)/         # Main app screens
│       │   └── _layout.tsx     # Root layout
│       ├── components/         # Reusable components
│       ├── contexts/           # React contexts
│       ├── hooks/              # Custom hooks
│       ├── services/           # API client
│       ├── constants/          # Colors, typography
│       ├── app.json            # Expo config
│       └── package.json
│
├── packages/
│   └── shared/                 # Shared code
│       ├── src/
│       │   ├── types.ts        # TypeScript types
│       │   └── constants.ts    # Shared constants
│       └── package.json
│
├── Dockerfile                  # API Docker config
├── railway.toml                # Railway deployment config
├── package.json                # Root package.json
├── turbo.json                  # Turbo build config
└── README.md
```

---

## Troubleshooting

### Common Issues

#### "No workspaces found" on Railway
**Cause:** Railway is running workspace commands but Docker only has API workspace.
**Solution:** Ensure `railway.toml` exists with:
```toml
[deploy]
startCommand = "node dist/index.js"
```

#### "Worklets mismatch" error in Expo
**Cause:** Version mismatch between JS and native worklets.
**Solution:**
```bash
cd apps/mobile
npx expo install --fix
```

#### Metro bundler port in use
**Solution:**
```bash
# Kill process on port 8081
lsof -ti:8081 | xargs kill -9

# Or start on different port
npx expo start --port 8082
```

#### iOS build fails with signing errors
**Solution:**
1. Open Xcode
2. Go to Preferences → Accounts
3. Add your Apple ID
4. Download certificates

#### Android emulator not detected
**Solution:**
1. Open Android Studio
2. Go to Tools → Device Manager
3. Create or start a virtual device
4. Verify with `adb devices`

#### API can't connect to PostgreSQL
**Solution:**
```bash
# Check PostgreSQL is running
# macOS
brew services list

# Linux
sudo systemctl status postgresql

# Windows
# Check Services app for PostgreSQL
```

#### Environment variables not loading
**Solution:**
```bash
# Restart the development server after changing .env
# For Expo, clear cache:
npx expo start --clear
```

### Getting Help

- Check [Expo documentation](https://docs.expo.dev)
- Check [React Native documentation](https://reactnative.dev)
- Open an issue on GitHub

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is proprietary software. All rights reserved.

---

## Security

If you discover a security vulnerability, please email security@allesgut.app instead of opening a public issue.
