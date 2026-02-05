# Atlas Systems - Home Security Management

A smart home security management app demonstrating Median.co's native plugin capabilities: **Biometric Authentication** and **QR Code Scanner**.

## Overview

Atlas Systems is a product management dashboard that showcases how web apps can leverage native device features through Median's JavaScript Bridge. Users can scan Atlas product QR codes using their device camera and register them to their account.

### Plugin Integration

| Plugin | Feature | Use Case |
|--------|---------|----------|
| **Biometrics** | Face ID / Touch ID | Secure login to product dashboard |
| **QR Code Scanner** | Device camera | Scan and register Atlas product QR codes |

## Features

### Product Registration
- **QR Code Scanning** — Use device camera to scan any Atlas product QR code
- **Product Display** — Registered products appear as "Atlas Sensor" on dashboard
- **Offline Support** — All data stored locally using localStorage

### User Profile
- Store user name, email, and address
- Persists across app sessions via localStorage
- View registered product information

### Activity Log
- Track product registration events
- Log motion detection and system events
- View activity history with timestamps

### Biometric Login
- Face ID (iOS) / Touch ID support
- Secure session management
- Automatic re-authentication

## Quick Start

### 1. Deploy the Web App

**Vercel (Recommended)**
```bash
cd "Median Site"
npx vercel
```

**Netlify**
- Drag folder to [netlify.com/drop](https://app.netlify.com/drop)

### 2. Create App in Median App Studio

1. Go to [median.co/new](https://median.co/new)
2. Enter your deployed URL
3. Configure app settings:
   - **App Name**: Atlas Systems
   - **App Icon**: Security/shield icon
   - **Theme**: Dark mode recommended

### 3. Enable Native Plugins

#### Biometric Authentication
- Navigate to **Native Plugins** → **Biometric Auth**
- Enable the plugin

#### QR Code Scanner
- Navigate to **Native Plugins** → **QR / Barcode Scanner**
- Enable the plugin
- Optionally set a custom prompt message

### 4. Build & Test

1. Click **Build** in Median App Studio
2. Download dev build to your device
3. Test biometrics and QR code scanning on physical device

## Project Structure

```
Median Site/
├── index.html      # Dashboard UI, lock screen, panels
├── styles.css      # Dark security theme, responsive
├── app.js          # Median plugin integration
└── README.md       # Documentation
```

## JavaScript Bridge API

### Biometrics
```javascript
// Check availability
const status = await median.auth.status();
// { hasTouchId: bool, hasFaceId: bool, hasSecret: bool, biometryType: 'faceId'|'touchId' }

// Save credential
await median.auth.save({ secret: JSON.stringify(credentials) });

// Authenticate (triggers biometric prompt)
const result = await median.auth.get();
// { success: bool, secret: string }
```

### QR Code Scanner
```javascript
// Set custom prompt (optional)
median.barcode.setPrompt('Scan QR code on your Atlas product');

// Scan QR code (triggers native camera scanner)
median.barcode.scan({
    callback: function(data) {
        // { code: string, type: string, cancelled: bool, error: string }
        // Example: { code: 'ATLAS-ABC123', type: 'qr' }
    }
});
```

## Technical Decisions

### Why Product Registration?

Product registration is an ideal use case for these plugins:

1. **Biometrics** — Users expect secure authentication for account access. Face ID/Touch ID provides seamless, secure login.

2. **QR Code Scanner** — Native camera access enables instant product registration. Users simply point their camera at any Atlas product QR code to register it.

### Browser Fallback Strategy

The app gracefully degrades in browsers:
- **Biometrics** → Sign in form (demo mode)
- **QR Code Scanner** → Generates demo QR code for testing

This enables UI testing without a physical device.

### Data Model

**User Profile** (stored in localStorage):
```json
{
    "name": "string",
    "email": "string", 
    "address": "string"
}
```

**Registered Product** (stored in localStorage):
```json
{
    "code": "string",
    "name": "Atlas Sensor",
    "connectedAt": "timestamp",
    "status": "online|offline"
}
```

**Activity Event** (stored in localStorage):
```json
{
    "id": "string",
    "type": "motion|scan|system|custom",
    "title": "string",
    "content": "string",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
}
```

## User Flow

1. **Sign Up** → Create account with name, email, address
2. **Add Product** → Scan QR code on any Atlas product
3. **Dashboard** → View registered product and activity log
4. **Returning Users** → Biometric login or password sign in

## Debrief Talking Points

### Why Atlas Systems?

> "I chose a product registration app because it demonstrates practical use of native device capabilities. Biometrics provide secure, convenient authentication, while the QR code scanner enables instant product registration using the device camera. It's a use case where native features create a seamless user experience that wouldn't be possible in a standard web browser."

### Plugin Selection Rationale

| Plugin | Why It Matters |
|--------|---------------|
| **Biometrics** | Secure, convenient authentication without passwords |
| **QR Code Scanner** | Native camera access enables instant product registration |

### Technical Tradeoffs

1. **Local-first architecture** — All data stored on device using localStorage for privacy and offline access. A production app would sync to a backend.

2. **Any QR code accepted** — The scanner accepts any QR code format and displays it as an "Atlas Sensor" for demo purposes.

3. **Offline capability** — All user data and activity logs are stored locally, enabling full functionality without network connectivity.

### With More Time

- **Product Catalog** — Identify product types from QR code and show specific device information
- **Multiple Products** — Support registering multiple products, not just one
- **Cloud Sync** — Back up registered products and activity to cloud
- **Product Management** — Edit product names, locations, and settings
- **Notifications** — Alert users when products go offline or detect activity

### Customer Explanation

> "Atlas Systems shows how Median transforms a web dashboard into a native product management app. The biometric login gives users quick, secure access to their account. The QR code scanner uses the device camera to instantly register any Atlas product—just point and scan. All product data is stored locally, so everything works offline. All of this without writing a single line of Swift or Kotlin."

## Resources

- [Median Documentation](https://docs.median.co)
- [JavaScript Bridge Reference](https://docs.median.co/docs/javascript-bridge)
- [Biometric Auth Docs](https://docs.median.co/docs/biometric-authentication)
- [QR Code Scanner Docs](https://docs.median.co/docs/qr-barcode-scanner)

---
