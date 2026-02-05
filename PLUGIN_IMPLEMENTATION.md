# Plugin Implementation Walkthrough

This document explains how the Median.co plugins (Biometric Authentication and QR Code Scanner) are implemented in the Atlas Systems app.

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Biometric Authentication Plugin](#biometric-authentication-plugin)
3. [QR Code Scanner Plugin](#qr-code-scanner-plugin)
4. [Flow Diagrams](#flow-diagrams)

---

## Architecture Overview

### 1. Median Environment Detection

**Location:** `app.js` lines 493-501

```javascript
function checkMedianEnvironment() {
    AppState.isMedianApp = typeof median !== 'undefined' && median !== null;
    
    if (AppState.isMedianApp) {
        initBiometrics();  // Initialize biometrics if in Median app
    } else {
        determineAuthScreen();  // Show regular sign in if in browser
    }
}
```

**Logic:**
- Checks if `median` global object exists (only available in Median app)
- If yes → Initialize biometric features
- If no → Use browser fallback (regular forms)

**Why:** This allows the same code to work in both Median app and regular browsers.

---

## Biometric Authentication Plugin

### Step 1: Initialization (`initBiometrics`)

**Location:** `app.js` lines 507-530

```javascript
async function initBiometrics() {
    if (!AppState.isMedianApp) return;
    
    try {
        // Call Median API to check biometric status
        const status = await median.auth.status();
        
        // Store what's available
        AppState.biometricAvailable = status.hasTouchId;
        AppState.hasBiometrics = status.hasSecret;
        
        // Determine which type (Face ID or Touch ID)
        if (status.biometryType === 'faceId') {
            AppState.biometricType = 'faceId';
        } else if (status.biometryType === 'touchId') {
            AppState.biometricType = 'touchId';
        }
        
        // Update UI text (e.g., "Unlock with Face ID")
        updateAllBiometricText();
        updateUnlockButtonIcon();
        determineAuthScreen();
        
    } catch (error) {
        console.error('Biometric init error:', error);
        determineAuthScreen();
    }
}
```

**What it does:**
1. Calls `median.auth.status()` to check:
   - Is biometric hardware available? (`hasTouchId`)
   - Has user already saved credentials? (`hasSecret`)
   - What type? (`biometryType`: 'faceId' or 'touchId')
2. Updates app state and UI based on results

**Median API Response:**
```javascript
{
    hasTouchId: true,        // Hardware available
    hasSecret: true,         // Credentials already saved
    biometryType: 'faceId'   // or 'touchId'
}
```

---

### Step 2: Saving Credentials (`saveCredentialsWithBiometrics`)

**Location:** `app.js` lines 598-622

**When it's called:**
- After user signs up (if they check "Enable biometrics")
- After user signs in (if they check "Remember with biometrics")

```javascript
async function saveCredentialsWithBiometrics(name, email, password) {
    if (!AppState.isMedianApp || !AppState.biometricAvailable) {
        return false;  // Can't save if not in Median app
    }
    
    try {
        // Package credentials as JSON string
        const credentials = JSON.stringify({
            name: name,
            email: email,
            password: password,
            savedAt: Date.now()
        });
        
        // Call Median API to save to device's secure storage
        const result = await median.auth.save({ secret: credentials });
        
        if (result.success) {
            AppState.hasBiometrics = true;
            return true;
        }
    } catch (error) {
        console.error('Save biometric credentials error:', error);
    }
    
    return false;
}
```

**What it does:**
1. Packages user credentials as JSON
2. Calls `median.auth.save({ secret: credentials })`
3. Median stores this in iOS Keychain / Android Keystore (encrypted hardware storage)
4. Sets `AppState.hasBiometrics = true` if successful

**Security:** Credentials are stored in device's encrypted hardware storage, NOT on Median's servers.

---

### Step 3: Authenticating (`authenticateWithBiometrics`)

**Location:** `app.js` lines 550-596

**When it's called:**
- User taps "Unlock with Face ID/Touch ID" button
- App automatically tries biometrics on load (if previously enabled)

```javascript
async function authenticateWithBiometrics() {
    if (!AppState.isMedianApp || !AppState.biometricAvailable) {
        showSignin();  // Fallback to password
        return;
    }
    
    DOM.biometricStatus.textContent = 'Authenticating...';
    
    try {
        // Trigger native biometric prompt
        const result = await median.auth.get();
        
        if (result.success && result.secret) {
            // Parse the saved credentials
            const credentials = JSON.parse(result.secret);
            
            // Restore user profile
            if (credentials.email) {
                AppState.userProfile.email = credentials.email;
            }
            if (credentials.name) {
                AppState.userProfile.name = credentials.name;
            }
            
            // Log the login
            logActivity('system', 'Biometric Login', 
                `User authenticated via ${AppState.biometricType === 'faceId' ? 'Face ID' : 'Touch ID'}`);
            
            // Unlock the app
            setTimeout(() => {
                unlockApp();
            }, 300);
        } else {
            // Authentication failed or cancelled
            DOM.biometricStatus.textContent = 'Authentication failed. Try again.';
        }
    } catch (error) {
        console.error('Biometric auth error:', error);
        // Fallback to password login
        showSignin();
    }
}
```

**What it does:**
1. Calls `median.auth.get()` - this triggers native biometric prompt
2. User scans face/fingerprint
3. If successful, Median returns the saved `secret` (credentials)
4. App parses credentials and restores user session
5. Unlocks the app

**User Experience:**
- Native iOS/Android biometric prompt appears
- User authenticates with Face ID/Touch ID
- App automatically logs them in

---

### Step 4: Integration with Sign Up/Sign In

**Sign Up Flow** (`handleSignup` - line ~790):
```javascript
// After account creation
if (rememberWithBiometric && AppState.isMedianApp) {
    const saved = await saveCredentialsWithBiometrics(name, email, password);
    // If saved, user can use biometrics next time
}
```

**Sign In Flow** (`handleSignin` - line ~835):
```javascript
// After successful login
if (rememberWithBiometric && AppState.isMedianApp) {
    await saveCredentialsWithBiometrics(AppState.userProfile.name, email, password);
    // Saves for future biometric login
}
```

---

## QR Code Scanner Plugin

### Step 1: Scanning (`scanQRCode`)

**Location:** `app.js` lines 628-670

```javascript
function scanQRCode() {
    // Browser fallback - generate demo code
    if (!AppState.isMedianApp) {
        const demoCode = 'ATLAS-' + Math.random().toString(36).substring(2, 10).toUpperCase();
        handleScanResult({ success: true, code: demoCode });
        return;
    }
    
    // Set custom prompt for camera
    if (median.barcode.setPrompt) {
        median.barcode.setPrompt('Scan QR code on your Atlas product');
    }
    
    // Call Median API with callback
    median.barcode.scan({
        callback: function(data) {
            console.log('Scan result:', data);
            
            // Handle success
            if (data?.code) {
                handleScanResult({ success: true, code: data.code, type: 'qr' });
            } 
            // Handle cancellation
            else if (data?.cancelled || data?.error) {
                DOM.scanStatus.textContent = 'Scan cancelled. You can try again or enter code manually.';
                // Show manual entry fallback
                if (DOM.manualEntryContainer) {
                    DOM.manualEntryContainer.style.display = 'flex';
                }
            }
        }
    });
}
```

**What it does:**
1. **Browser mode:** Generates a demo code (for testing)
2. **Median app mode:**
   - Sets custom prompt text
   - Calls `median.barcode.scan({ callback: ... })`
   - Opens native camera scanner
   - When QR code is detected, callback fires with result

**Median API Pattern:**
- Uses **callback pattern** (not Promise)
- Camera opens automatically
- User points at QR code
- When detected, callback receives: `{ code: "ATLAS-ABC123", type: "qr" }`

---

### Step 2: Processing Scan Result (`handleScanResult`)

**Location:** `app.js` lines 688-721

```javascript
function handleScanResult(data) {
    if (data.success && data.code) {
        // Create pending product object
        AppState.pendingProduct = {
            id: generateId(),
            code: data.code,           // Scanned QR code
            name: data.name || '',     // Optional name
            connectedAt: Date.now(),
            status: 'offline'
        };
        
        // Hide manual entry
        if (DOM.manualEntryContainer) {
            DOM.manualEntryContainer.style.display = 'none';
        }
        
        // Show preview card with scanned code
        DOM.deviceCode.textContent = data.code;
        if (DOM.deviceNameInput) {
            DOM.deviceNameInput.value = data.name || '';
            DOM.deviceNameInput.focus();
        }
        DOM.scannedDevicePreview.style.display = 'block';
        
        // Log the scan
        logActivity('scan', 'Device Scanned', `Scanned device code: ${data.code}`);
    } else {
        // Show error
        DOM.scanStatus.textContent = data.error || 'No QR code detected. Try again.';
    }
}
```

**What it does:**
1. Creates a `pendingProduct` object with scanned code
2. Shows preview card so user can confirm
3. Allows user to edit product name
4. Logs the scan event

---

### Step 3: Confirming Device (`confirmDevice`)

**Location:** `app.js` lines 723-742

```javascript
function confirmDevice() {
    if (!AppState.pendingProduct) return;
    
    // Get name from input field
    const name = DOM.deviceNameInput?.value.trim() || 'Atlas Product';
    AppState.pendingProduct.name = name;
    
    // Add to products array
    AppState.products.push(AppState.pendingProduct);
    AppState.hasDevice = true;
    
    // Save to localStorage
    saveProducts();
    
    // Log the registration
    logActivity('scan', 'Product Registered', `${name} registered: ${AppState.pendingProduct.code}`);
    
    // Clear pending
    AppState.pendingProduct = null;
    
    // Go to dashboard
    unlockApp();
}
```

**What it does:**
1. Gets product name from user input
2. Adds product to `AppState.products` array
3. Saves to `localStorage` (for offline access)
4. Logs the registration
5. Navigates to dashboard

---

### Step 4: Manual Entry Fallback

**Location:** `app.js` lines 672-686

```javascript
function handleManualEntry() {
    const name = DOM.manualNameInput?.value.trim();
    const code = DOM.manualCodeInput?.value.trim();
    
    if (!code) {
        DOM.scanStatus.textContent = 'Please enter a product code';
        return;
    }
    
    // Process the same way as scanned code
    handleScanResult({ success: true, code: code, name: name, type: 'manual' });
    DOM.manualNameInput.value = '';
    DOM.manualCodeInput.value = '';
}
```

**What it does:**
- Allows users to manually type product code if scanning fails
- Processes it the same way as scanned codes
- Provides graceful fallback

---

## Flow Diagrams

### Biometric Authentication Flow

```
App Starts
    │
    ▼
checkMedianEnvironment()
    │
    ├─ Browser? ──► Show Sign In Form
    │
    └─ Median App? ──► initBiometrics()
                        │
                        ▼
                    median.auth.status()
                        │
                        ├─ hasSecret: false ──► Show Sign Up/Sign In
                        │
                        └─ hasSecret: true ──► Show Biometric Unlock Screen
                                                │
                                                ▼
                                            User taps "Unlock"
                                                │
                                                ▼
                                            median.auth.get()
                                                │
                                                ├─ Success ──► Parse credentials ──► unlockApp()
                                                │
                                                └─ Failed ──► Show Sign In Form
```

### QR Code Scanning Flow

```
User taps "Scan QR Code"
    │
    ├─ Browser? ──► Generate demo code ──► handleScanResult()
    │
    └─ Median App? ──► median.barcode.scan({ callback })
                        │
                        ▼
                    Native Camera Opens
                        │
                        ├─ QR Code Detected ──► callback({ code: "..." })
                        │                         │
                        │                         ▼
                        │                     handleScanResult()
                        │                         │
                        │                         ▼
                        │                     Show Preview Card
                        │                         │
                        │                         ▼
                        │                     User confirms ──► confirmDevice()
                        │                                            │
                        │                                            ▼
                        │                                        Add to products[]
                        │                                            │
                        │                                            ▼
                        │                                        Save to localStorage
                        │                                            │
                        │                                            ▼
                        │                                        unlockApp()
                        │
                        └─ Cancelled/Error ──► Show Manual Entry
```

---

## Key Implementation Details

### 1. Error Handling
- All plugin calls wrapped in try/catch
- Graceful fallbacks to manual entry/password login
- User-friendly error messages

### 2. State Management
- `AppState.isMedianApp` - tracks environment
- `AppState.hasBiometrics` - tracks if credentials saved
- `AppState.biometricAvailable` - tracks hardware availability
- `AppState.products` - stores registered products

### 3. Browser Fallbacks
- Biometrics → Password form
- QR Scanner → Manual entry or demo code
- Same UI, different functionality

### 4. Data Persistence
- Biometric credentials → iOS Keychain / Android Keystore (via Median)
- Products → localStorage (for offline access)
- User profile → localStorage

---

## Testing Checklist

### Biometric Authentication
- [ ] Test Face ID on iPhone
- [ ] Test Touch ID on iPhone/iPad
- [ ] Test sign up with biometrics enabled
- [ ] Test sign in with biometrics enabled
- [ ] Test biometric unlock on app restart
- [ ] Test fallback to password if biometric fails

### QR Code Scanner
- [ ] Test scanning QR code in Median app
- [ ] Test manual entry fallback
- [ ] Test product name customization
- [ ] Test multiple products registration
- [ ] Test browser demo mode
- [ ] Test error handling (cancelled scan)

---

## Common Issues & Solutions

### Issue: Biometric prompt doesn't appear
**Solution:** Check `AppState.biometricAvailable` and `AppState.hasBiometrics` are both `true`

### Issue: QR scanner callback not firing
**Solution:** Ensure using callback pattern, not Promise pattern. Check console for errors.

### Issue: Credentials not saving
**Solution:** Verify `median.auth.save()` returns `{ success: true }`. Check error logs.

---

## Resources

- [Median Biometric Auth Docs](https://docs.median.co/docs/biometric-authentication)
- [Median QR/Barcode Scanner Docs](https://docs.median.co/docs/qr-barcode-scanner)
- [Median JavaScript Bridge](https://docs.median.co/docs/javascript-bridge)
