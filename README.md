# SecureVault - Median.co Plugin Demo

A demonstration app showcasing Median.co's native plugin capabilities: **Biometric Authentication**, **DataStore**, and **Push Notifications**.

## Overview

SecureVault is a secure notes application that demonstrates how web apps can leverage native device features through Median's JavaScript Bridge. This project was built for the Median.co Solutions Engineer technical exercise.

### Features Demonstrated

| Plugin | Feature | Implementation |
|--------|---------|----------------|
| **Biometrics** | Face ID / Touch ID | Secure app unlock with native biometric prompt |
| **DataStore** | Encrypted local storage | Persist user notes across app sessions |
| **OneSignal** | Push notifications | Register device and receive push alerts |

## Quick Start

### 1. Deploy the Web App

Deploy this project to a publicly accessible URL. Recommended options:

**Vercel (Fastest)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd "Median Site"
vercel
```

**Netlify**
- Drag and drop the folder to [netlify.com/drop](https://app.netlify.com/drop)

**GitHub Pages**
- Push to GitHub and enable Pages in repository settings

### 2. Create App in Median App Studio

1. Go to [median.co/new](https://median.co/new)
2. Enter your deployed URL (e.g., `https://your-app.vercel.app`)
3. Configure basic settings:
   - **App Name**: SecureVault
   - **App Icon**: Upload a custom icon or use default
   - **Splash Screen**: Configure loading screen

### 3. Enable Native Plugins

In the Median App Studio sidebar, enable these plugins:

#### Biometric Authentication
- Navigate to **Native Plugins** → **Biometric Auth**
- Enable the plugin
- No additional configuration required

#### DataStore
- Navigate to **Native Plugins** → **DataStore**
- Enable the plugin
- Data is automatically encrypted on device

#### Push Notifications (OneSignal)
- Navigate to **Native Plugins** → **OneSignal**
- You'll need a OneSignal account and App ID
- Create an app at [onesignal.com](https://onesignal.com)
- Enter your OneSignal App ID in Median settings

### 4. Build & Test

1. Click **Build** in Median App Studio
2. Download the development build:
   - **iOS**: Install via TestFlight or direct download
   - **Android**: Download APK and install
3. Test biometrics on a physical device (simulators have limited biometric support)

## Project Structure

```
Median Site/
├── index.html      # Main app HTML structure
├── styles.css      # Dark vault theme & responsive design
├── app.js          # Median JavaScript Bridge integration
└── README.md       # This file
```

## JavaScript Bridge API Reference

### Biometrics

```javascript
// Check availability
const status = await median.auth.status();
// Returns: { hasTouchId: boolean, hasFaceId: boolean, hasSecret: boolean }

// Save secret with biometric protection
await median.auth.save({ secret: 'your-token' });

// Retrieve secret (triggers biometric prompt)
const result = await median.auth.get();
// Returns: { success: boolean, secret: string }
```

### DataStore

```javascript
// Save data
await median.datastore.set({
    key: 'my_key',
    value: JSON.stringify(data)
});

// Retrieve data
const result = await median.datastore.get({ key: 'my_key' });
const data = JSON.parse(result.value);
```

### Push Notifications (OneSignal)

```javascript
// Register for push
await median.onesignal.register();

// Get subscription info
const info = await median.onesignal.info();
// Returns: { oneSignalUserId: string, ... }

// Handle incoming notifications
median.onesignal.receive = function(data) {
    console.log('Notification:', data);
};
```

## Technical Tradeoffs & Decisions

### Why Build a Custom Demo Site?

Rather than wrapping an existing website, I built a custom demo to:
1. Have full control over JavaScript Bridge integration
2. Demonstrate a cohesive user flow across all three plugins
3. Show meaningful plugin usage (not just "it works")

### Browser Fallback Strategy

The app gracefully degrades when running in a browser:
- Biometrics → Shows "Demo Mode" button
- DataStore → Falls back to localStorage
- Push → Shows "Requires Median app" message

This allows testing UI without a physical device while making it clear that native features require the Median app.

### Security Considerations

- Biometric secrets are stored in the device's secure enclave
- DataStore values are encrypted at rest
- No sensitive data is transmitted to external servers (demo mode)

### What I'd Add With More Time

1. **Offline Support**: Service worker for offline access
2. **Native Navigation**: Bottom tab bar using Median's native nav
3. **Rich Notifications**: Deep linking from push notifications
4. **Search**: Full-text search across encrypted notes
5. **Export**: Encrypted backup/restore functionality
6. **Theming**: Light mode option with system preference detection

## Debrief Talking Points

### Why SecureVault?

A secure notes app is an ideal demo because:
- **Biometrics make sense**: Users expect security for private notes
- **Persistence is essential**: Notes must survive app restarts
- **Push adds value**: Reminders, sharing notifications

### Plugin Selection Rationale

These three plugins represent the core value proposition of going native:
- **Security** (biometrics) - Can't be done in a browser
- **Reliability** (datastore) - More reliable than web storage
- **Engagement** (push) - Works when app is closed

### How I'd Explain This to a Customer

> "Your web app already works on mobile browsers, but Median lets you add the features that make users *prefer* native apps—secure login with Face ID, reliable offline storage, and push notifications that reach users even when they're not actively using the app. And you don't need to hire iOS/Android developers or maintain separate codebases."

## Resources

- [Median Documentation](https://docs.median.co)
- [JavaScript Bridge Reference](https://docs.median.co/docs/javascript-bridge)
- [OneSignal Setup Guide](https://docs.median.co/docs/onesignal)
- [Biometric Auth Docs](https://docs.median.co/docs/biometric-authentication)

---

Built for Median.co Solutions Engineer Exercise
