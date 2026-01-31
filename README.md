# Atlas Systems - Home Security Management

A smart home security management app demonstrating Median.co's native plugin capabilities: **Biometric Authentication**, **DataStore**, and **Push Notifications**.

## Overview

Atlas Systems is a home security dashboard that showcases how web apps can leverage native device features through Median's JavaScript Bridge. Built for the Median.co Solutions Engineer technical exercise.

### Plugin Integration

| Plugin | Feature | Use Case |
|--------|---------|----------|
| **Biometrics** | Face ID / Touch ID | Secure login to security dashboard |
| **DataStore** | Encrypted local storage | Store user profile & activity log |
| **OneSignal** | Push notifications | Real-time security alerts (motion, doors, cameras) |

## Features

### Security Dashboard
- **System Status** — View armed/disarmed state, doors, cameras, sensors
- **Activity Feed** — Recent security events with timestamps and locations
- **Quick Actions** — Arm/disarm system, view cameras, access history

### User Profile (DataStore Demo)
- Store user name, email, and address
- Persists across app sessions via Median DataStore

### Security Alerts (Push Demo)
- Motion detection notifications
- Door/window activity alerts
- Camera event notifications
- System status changes

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

#### DataStore
- Navigate to **Native Plugins** → **DataStore**
- Enable the plugin

#### Push Notifications (OneSignal)
- Navigate to **Native Plugins** → **OneSignal**
- Create app at [onesignal.com](https://onesignal.com)
- Enter OneSignal App ID

### 4. Build & Test

1. Click **Build** in Median App Studio
2. Download dev build to your device
3. Test biometrics on physical device

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
// { hasTouchId: bool, hasFaceId: bool, hasSecret: bool }

// Save credential
await median.auth.save({ secret: 'session-token' });

// Authenticate (triggers biometric prompt)
const result = await median.auth.get();
// { success: bool, secret: string }
```

### DataStore
```javascript
// Save user profile
await median.datastore.set({
    key: 'atlas_user_profile',
    value: JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
        address: '123 Main St'
    })
});

// Load user profile
const result = await median.datastore.get({ key: 'atlas_user_profile' });
const profile = JSON.parse(result.value);
```

### Push Notifications
```javascript
// Register device
await median.onesignal.register();

// Get device ID
const info = await median.onesignal.info();
// { oneSignalUserId: 'player-id-here' }

// Handle incoming alerts
median.onesignal.receive = function(data) {
    // data: { title, body, ... }
    console.log('Security alert:', data.title);
};
```

## Technical Decisions

### Why Home Security?

Home security is the ideal use case for these three plugins:

1. **Biometrics** — Users expect and trust biometric authentication for security apps. It's not just convenient; it's essential.

2. **DataStore** — User profiles and activity logs need reliable local persistence. Security data shouldn't depend on network availability.

3. **Push Notifications** — Real-time alerts are the core value proposition. Motion detected at 2 AM? You need to know immediately, even if the app is closed.

### Browser Fallback Strategy

The app gracefully degrades in browsers:
- **Biometrics** → "Enter Dashboard" button (demo mode)
- **DataStore** → Falls back to localStorage
- **Push** → Shows "Requires Median app" message

This enables UI testing without a physical device.

### Data Model

**User Profile** (stored in DataStore):
```json
{
    "name": "string",
    "email": "string", 
    "address": "string"
}
```

**Activity Event** (stored in DataStore):
```json
{
    "id": "string",
    "type": "motion|door|camera|sensor|system|custom",
    "title": "string",
    "content": "string",
    "location": "string",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
}
```

## Debrief Talking Points

### Why Atlas Systems?

> "I chose a home security app because it creates a compelling narrative for all three plugins. Biometrics for secure access, DataStore for user preferences and event history, and push notifications for real-time security alerts. It's a use case where native features aren't just nice-to-have—they're essential."

### Plugin Selection Rationale

| Plugin | Why It Matters |
|--------|---------------|
| **Biometrics** | Security apps demand secure authentication. Passwords aren't enough. |
| **DataStore** | Activity logs and user info must persist reliably, even offline. |
| **Push** | Real-time alerts are the entire point of a security app. |

### Technical Tradeoffs

1. **Local-first architecture** — All data stored on device for privacy and offline access. A production app would sync to a backend.

2. **Demo data on first launch** — Pre-populated activity feed shows the UI's potential without requiring real security hardware.

3. **Event type categorization** — Structured activity types (motion, door, camera, etc.) enable icon differentiation and potential filtering.

### With More Time

- **Camera Integration** — Live feed from IP cameras via native plugin
- **Geofencing** — Auto-arm when leaving home
- **HomeKit/Google Home** — Native smart home integrations
- **Encrypted Backup** — Cloud sync of activity history
- **Family Access** — Multi-user support with different permission levels

### Customer Explanation

> "Atlas Systems shows how Median transforms a web dashboard into a native security app. The biometric login gives users confidence their security data is protected. The DataStore keeps their profile and activity history available instantly, even offline. And push notifications mean they'll never miss a security alert—whether it's motion at the front door or a sensor going offline. All of this without writing a single line of Swift or Kotlin."

## Resources

- [Median Documentation](https://docs.median.co)
- [JavaScript Bridge Reference](https://docs.median.co/docs/javascript-bridge)
- [Biometric Auth Docs](https://docs.median.co/docs/biometric-authentication)
- [DataStore Docs](https://docs.median.co/docs/datastore)
- [OneSignal Setup](https://docs.median.co/docs/onesignal)

---

Built for Median.co Solutions Engineer Exercise
