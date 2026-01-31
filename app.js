/**
 * Atlas Systems - Home Security Management
 * 
 * Demonstrates integration with Median.co plugins:
 * - Biometric Authentication (Face ID / Touch ID) - Save & retrieve login credentials
 * - DataStore (User profile & activity storage)
 * - Push Notifications (Security alerts via OneSignal)
 * 
 * Auth Flow:
 * 1. First time user → Sign Up form → Create account → Save with biometrics
 * 2. Returning user (no biometrics) → Sign In form
 * 3. Returning user (with biometrics) → Biometric unlock screen
 */

// ============================================
// App State
// ============================================

const AppState = {
    isMedianApp: false,
    isAuthenticated: false,
    
    // Account status
    hasAccount: false,      // Has created an account (stored locally)
    hasBiometrics: false,   // Has biometric credentials saved
    
    // Biometrics info
    biometricAvailable: false,
    biometricType: 'biometrics', // 'faceId' or 'touchId' or 'biometrics'
    
    // Saved account info (from localStorage)
    savedAccount: {
        name: '',
        email: ''
    },
    
    // User profile (from DataStore)
    userProfile: {
        name: '',
        email: '',
        address: ''
    },
    
    // Security activity log
    activities: [],
    
    // System status
    systemArmed: true,
    
    // Editing state
    editingActivityId: null,
    
    // Push
    pushRegistered: false,
    playerId: null
};

// ============================================
// DOM Elements
// ============================================

const DOM = {
    // Screens
    lockScreen: document.getElementById('lock-screen'),
    vaultScreen: document.getElementById('vault-screen'),
    
    // Auth Containers
    signupContainer: document.getElementById('signup-container'),
    signinContainer: document.getElementById('signin-container'),
    biometricUnlockContainer: document.getElementById('biometric-unlock-container'),
    browserFallback: document.getElementById('browser-fallback'),
    
    // Sign Up Form
    signupForm: document.getElementById('signup-form'),
    signupName: document.getElementById('signup-name'),
    signupEmail: document.getElementById('signup-email'),
    signupPassword: document.getElementById('signup-password'),
    signupConfirm: document.getElementById('signup-confirm'),
    signupBiometricOption: document.getElementById('signup-biometric-option'),
    signupEnableBiometric: document.getElementById('signup-enable-biometric'),
    signupBiometricText: document.getElementById('signup-biometric-text'),
    signupSubmitBtn: document.getElementById('signup-submit-btn'),
    signupStatus: document.getElementById('signup-status'),
    toggleSignupPassword: document.getElementById('toggle-signup-password'),
    switchToSignin: document.getElementById('switch-to-signin'),
    
    // Sign In Form
    loginForm: document.getElementById('login-form'),
    loginEmail: document.getElementById('login-email'),
    loginPassword: document.getElementById('login-password'),
    loginSubmitBtn: document.getElementById('login-submit-btn'),
    loginStatus: document.getElementById('login-status'),
    togglePassword: document.getElementById('toggle-password'),
    biometricOption: document.getElementById('biometric-option'),
    rememberBiometric: document.getElementById('remember-biometric'),
    biometricTypeText: document.getElementById('biometric-type-text'),
    switchToSignup: document.getElementById('switch-to-signup'),
    
    // Biometric Unlock
    savedUserName: document.getElementById('saved-user-name'),
    savedUserEmail: document.getElementById('saved-user-email'),
    unlockBtn: document.getElementById('unlock-btn'),
    unlockText: document.getElementById('unlock-text'),
    biometricStatus: document.getElementById('biometric-status'),
    usePasswordBtn: document.getElementById('use-password-btn'),
    useDifferentAccount: document.getElementById('use-different-account'),
    
    // Dashboard
    userGreeting: document.getElementById('user-greeting'),
    systemStatus: document.getElementById('system-status'),
    activityList: document.getElementById('activity-list'),
    emptyState: document.getElementById('empty-state'),
    activityCount: document.getElementById('activity-count'),
    addNoteBtn: document.getElementById('add-note-btn'),
    lockBtn: document.getElementById('lock-btn'),
    notificationsBtn: document.getElementById('notifications-btn'),
    profileBtn: document.getElementById('profile-btn'),
    notificationBadge: document.getElementById('notification-badge'),
    
    // Quick Actions
    armBtn: document.getElementById('arm-btn'),
    camerasBtn: document.getElementById('cameras-btn'),
    historyBtn: document.getElementById('history-btn'),
    
    // Activity Drawer
    activityDrawerBtn: document.getElementById('activity-drawer-btn'),
    activityDrawer: document.getElementById('activity-drawer'),
    activityDrawerOverlay: document.getElementById('activity-drawer-overlay'),
    closeDrawerBtn: document.getElementById('close-drawer-btn'),
    activityBadge: document.getElementById('activity-badge'),
    
    // Activity Modal
    noteModal: document.getElementById('note-modal'),
    modalTitle: document.getElementById('modal-title'),
    noteForm: document.getElementById('note-form'),
    noteId: document.getElementById('note-id'),
    eventType: document.getElementById('event-type'),
    noteTitle: document.getElementById('note-title'),
    noteContent: document.getElementById('note-content'),
    noteLocation: document.getElementById('note-location'),
    closeModalBtn: document.getElementById('close-modal-btn'),
    deleteNoteBtn: document.getElementById('delete-note-btn'),
    
    // Profile Panel
    profilePanel: document.getElementById('profile-panel'),
    closeProfileBtn: document.getElementById('close-profile-btn'),
    profileForm: document.getElementById('profile-form'),
    userName: document.getElementById('user-name'),
    userEmail: document.getElementById('user-email'),
    userAddress: document.getElementById('user-address'),
    
    // Notifications Panel
    notificationsPanel: document.getElementById('notifications-panel'),
    closePanelBtn: document.getElementById('close-panel-btn'),
    pushPermission: document.getElementById('push-permission'),
    playerId: document.getElementById('player-id'),
    registerPushBtn: document.getElementById('register-push-btn'),
    
    // Toast
    toastContainer: document.getElementById('toast-container')
};

// ============================================
// Activity Type Icons
// ============================================

const ActivityIcons = {
    motion: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>`,
    door: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>`,
    camera: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M23 7l-7 5 7 5V7z"/>
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
    </svg>`,
    sensor: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
    </svg>`,
    system: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>`,
    custom: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
        <polyline points="14 2 14 8 20 8"/>
    </svg>`
};

// ============================================
// Utility Functions
// ============================================

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<p>${message}</p>`;
    DOM.toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// Screen Management
// ============================================

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId)?.classList.add('active');
}

function hideAllAuthContainers() {
    DOM.signupContainer.style.display = 'none';
    DOM.signinContainer.style.display = 'none';
    DOM.biometricUnlockContainer.style.display = 'none';
}

function showSignup() {
    hideAllAuthContainers();
    DOM.signupContainer.style.display = 'block';
    
    // Show biometric option if available and in Median app
    if (AppState.biometricAvailable && AppState.isMedianApp) {
        DOM.signupBiometricOption.style.display = 'block';
        // Ensure correct biometric text is shown
        updateBiometricText(DOM.signupBiometricText, 'Enable');
    } else {
        DOM.signupBiometricOption.style.display = 'none';
    }
}

function showSignin() {
    hideAllAuthContainers();
    DOM.signinContainer.style.display = 'block';
    
    // Pre-fill email if we have it
    if (AppState.savedAccount.email) {
        DOM.loginEmail.value = AppState.savedAccount.email;
    }
    
    // Show biometric option if available
    if (AppState.biometricAvailable) {
        DOM.biometricOption.style.display = 'block';
        updateBiometricText(DOM.biometricTypeText, 'Remember with');
    }
}

function showBiometricUnlock() {
    hideAllAuthContainers();
    DOM.biometricUnlockContainer.style.display = 'flex';
    
    // Display saved user info
    if (AppState.savedAccount.name) {
        DOM.savedUserName.textContent = `Welcome back, ${AppState.savedAccount.name.split(' ')[0]}`;
    } else {
        DOM.savedUserName.textContent = 'Welcome back';
    }
    DOM.savedUserEmail.textContent = AppState.savedAccount.email || 'user@example.com';
    
    // Update unlock button text
    if (AppState.biometricType === 'faceId') {
        DOM.unlockText.textContent = 'Unlock with Face ID';
    } else if (AppState.biometricType === 'touchId') {
        DOM.unlockText.textContent = 'Unlock with Touch ID';
    } else {
        DOM.unlockText.textContent = 'Unlock with Biometrics';
    }
}

function updateBiometricText(element, prefix) {
    if (AppState.biometricType === 'faceId') {
        element.textContent = `${prefix} Face ID`;
    } else if (AppState.biometricType === 'touchId') {
        element.textContent = `${prefix} Touch ID`;
    } else {
        element.textContent = `${prefix} Biometrics`;
    }
}

function lockApp() {
    AppState.isAuthenticated = false;
    showScreen('lock-screen');
    determineAuthScreen();
}

function unlockApp() {
    AppState.isAuthenticated = true;
    showScreen('vault-screen');
    loadUserData();
    loadActivities();
    updateGreeting();
}

function updateGreeting() {
    const name = AppState.userProfile.name || AppState.savedAccount.name;
    if (name) {
        DOM.userGreeting.textContent = `Welcome, ${name.split(' ')[0]}`;
    } else if (AppState.savedAccount.email) {
        DOM.userGreeting.textContent = `Welcome, ${AppState.savedAccount.email.split('@')[0]}`;
    } else {
        DOM.userGreeting.textContent = 'Welcome';
    }
}

// ============================================
// Determine Which Auth Screen to Show
// ============================================

function determineAuthScreen() {
    // Check for existing account
    const savedAccountData = localStorage.getItem('atlas_account');
    if (savedAccountData) {
        AppState.savedAccount = JSON.parse(savedAccountData);
        AppState.hasAccount = true;
    }
    
    // Determine which screen to show
    if (AppState.hasBiometrics && AppState.hasAccount) {
        // Has biometrics saved → show biometric unlock
        showBiometricUnlock();
        // Auto-trigger biometric after short delay
        setTimeout(() => authenticateWithBiometrics(), 600);
    } else if (AppState.hasAccount) {
        // Has account but no biometrics → show sign in
        showSignin();
    } else {
        // No account → show sign up
        showSignup();
    }
}

// ============================================
// Median Detection & Initialization
// ============================================

function checkMedianEnvironment() {
    AppState.isMedianApp = typeof median !== 'undefined' && median !== null;
    console.log('Running in Median:', AppState.isMedianApp);
    
    if (AppState.isMedianApp) {
        initBiometrics();
        // Push Notifications disabled - requires paid Apple Developer account
        // initPushNotifications();
    } else {
        // Browser fallback
        DOM.browserFallback.style.display = 'block';
        determineAuthScreen();
    }
}

// ============================================
// Biometric Authentication
// ============================================

async function initBiometrics() {
    if (!AppState.isMedianApp) return;
    
    try {
        const status = await median.auth.status();
        console.log('Biometric status:', status);
        
        AppState.biometricAvailable = status.hasTouchId || status.hasFaceId;
        AppState.hasBiometrics = status.hasSecret;
        
        // Determine biometric type - check Face ID first
        // On iOS, use device detection as fallback since some SDKs report incorrectly
        if (status.hasFaceId) {
            AppState.biometricType = 'faceId';
        } else if (status.hasTouchId) {
            // Double check - iPhones X and later have Face ID
            // Use device detection to confirm
            if (isFaceIdDevice()) {
                AppState.biometricType = 'faceId';
            } else {
                AppState.biometricType = 'touchId';
            }
        }
        
        console.log('Biometric type detected:', AppState.biometricType);
        
        // Update all biometric text elements after detection
        updateAllBiometricText();
        
        // Now determine which auth screen to show
        determineAuthScreen();
        
    } catch (error) {
        console.error('Biometric init error:', error);
        determineAuthScreen();
    }
}

// Helper function to detect if device likely has Face ID
function isFaceIdDevice() {
    // Check if iOS device
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (!isIOS) return false;
    
    // Check screen dimensions - Face ID devices have notch/Dynamic Island
    // iPhone X and later have screen ratios around 2.16 or higher
    const screenRatio = window.screen.height / window.screen.width;
    const reverseRatio = window.screen.width / window.screen.height;
    const ratio = Math.max(screenRatio, reverseRatio);
    
    // Face ID iPhones have ratio >= 2.16 (19.5:9 aspect ratio)
    // Touch ID iPhones have ratio around 1.77 (16:9 aspect ratio)
    if (ratio >= 2.0) {
        return true;
    }
    
    // Also check if device has notch by checking for safe area insets
    const hasSafeAreaInset = getComputedStyle(document.documentElement)
        .getPropertyValue('--sat')?.trim() !== '' ||
        parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-top)')) > 20;
    
    return hasSafeAreaInset;
}

// Update all biometric text elements
function updateAllBiometricText() {
    if (DOM.signupBiometricText) {
        updateBiometricText(DOM.signupBiometricText, 'Enable');
    }
    if (DOM.biometricTypeText) {
        updateBiometricText(DOM.biometricTypeText, 'Remember with');
    }
    if (DOM.unlockText) {
        if (AppState.biometricType === 'faceId') {
            DOM.unlockText.textContent = 'Unlock with Face ID';
        } else if (AppState.biometricType === 'touchId') {
            DOM.unlockText.textContent = 'Unlock with Touch ID';
        } else {
            DOM.unlockText.textContent = 'Unlock with Biometrics';
        }
    }
}

async function authenticateWithBiometrics() {
    if (!AppState.isMedianApp || !AppState.biometricAvailable) {
        showSignin();
        return;
    }
    
    DOM.biometricStatus.textContent = 'Authenticating...';
    DOM.biometricStatus.className = 'status-text';
    
    try {
        const result = await median.auth.get();
        
        if (result.success && result.secret) {
            console.log('Biometric auth successful');
            
            // Parse saved credentials
            const credentials = JSON.parse(result.secret);
            
            // Update saved account info
            AppState.savedAccount.email = credentials.email;
            AppState.savedAccount.name = credentials.name || '';
            
            DOM.biometricStatus.textContent = 'Authentication successful!';
            DOM.biometricStatus.className = 'status-text success';
            
            // Log security event
            logSecurityEvent('system', 'Biometric Login', 
                `User authenticated via ${AppState.biometricType === 'faceId' ? 'Face ID' : 'Touch ID'}`, 
                'Mobile Device');
            
            setTimeout(() => {
                unlockApp();
                showToast('Welcome to Atlas Systems');
            }, 300);
        } else {
            DOM.biometricStatus.textContent = 'Authentication failed. Try again.';
            DOM.biometricStatus.className = 'status-text error';
        }
    } catch (error) {
        console.error('Biometric auth error:', error);
        
        if (error.message && error.message.includes('cancel')) {
            DOM.biometricStatus.textContent = 'Authentication cancelled';
            DOM.biometricStatus.className = 'status-text';
        } else {
            DOM.biometricStatus.textContent = 'Authentication failed. Use password instead.';
            DOM.biometricStatus.className = 'status-text error';
        }
    }
}

async function saveCredentialsWithBiometrics(name, email, password) {
    if (!AppState.isMedianApp || !AppState.biometricAvailable) {
        return false;
    }
    
    try {
        const credentials = JSON.stringify({
            name: name,
            email: email,
            password: password,
            savedAt: Date.now()
        });
        
        const result = await median.auth.save({ secret: credentials });
        
        if (result.success) {
            AppState.hasBiometrics = true;
            console.log('Credentials saved with biometrics');
            return true;
        }
    } catch (error) {
        console.error('Save biometric credentials error:', error);
    }
    
    return false;
}

// ============================================
// Sign Up Handler
// ============================================

async function handleSignup(e) {
    e.preventDefault();
    
    const name = DOM.signupName.value.trim();
    const email = DOM.signupEmail.value.trim();
    const password = DOM.signupPassword.value;
    const confirmPassword = DOM.signupConfirm.value;
    const enableBiometric = DOM.signupEnableBiometric?.checked ?? false;
    
    // Validation
    if (!name || !email || !password) {
        DOM.signupStatus.textContent = 'Please fill in all fields';
        DOM.signupStatus.className = 'status-text error';
        return;
    }
    
    if (password !== confirmPassword) {
        DOM.signupStatus.textContent = 'Passwords do not match';
        DOM.signupStatus.className = 'status-text error';
        return;
    }
    
    if (password.length < 6) {
        DOM.signupStatus.textContent = 'Password must be at least 6 characters';
        DOM.signupStatus.className = 'status-text error';
        return;
    }
    
    // Show loading
    DOM.signupSubmitBtn.disabled = true;
    DOM.signupSubmitBtn.innerHTML = `
        <svg class="spinner" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>
        Creating Account...
    `;
    DOM.signupStatus.textContent = '';
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Save credentials with biometrics FIRST if enabled
    // This ensures the Face ID prompt happens during signup
    if (enableBiometric && AppState.biometricAvailable && AppState.isMedianApp) {
        // Update status to show we're setting up biometrics
        DOM.signupSubmitBtn.innerHTML = `
            <svg class="spinner" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>
            Setting up ${AppState.biometricType === 'faceId' ? 'Face ID' : 'Touch ID'}...
        `;
        
        const saved = await saveCredentialsWithBiometrics(name, email, password);
        if (saved) {
            showToast(`Account secured with ${AppState.biometricType === 'faceId' ? 'Face ID' : 'Touch ID'}`);
        } else {
            // Biometric save failed - continue without biometrics
            showToast('Biometric setup skipped', 'warning');
        }
    }
    
    // Save account locally
    const accountData = { name, email, createdAt: Date.now() };
    localStorage.setItem('atlas_account', JSON.stringify(accountData));
    AppState.savedAccount = accountData;
    AppState.hasAccount = true;
    
    // Save initial profile
    AppState.userProfile = { name, email, address: '' };
    await saveUserProfileToStore();
    
    // Log security event
    logSecurityEvent('system', 'Account Created', 'New Atlas Systems account registered', 'Mobile Device');
    
    // Clear form
    DOM.signupForm.reset();
    
    // Reset button
    DOM.signupSubmitBtn.disabled = false;
    DOM.signupSubmitBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="8.5" cy="7" r="4"/>
            <line x1="20" y1="8" x2="20" y2="14"/>
            <line x1="23" y1="11" x2="17" y2="11"/>
        </svg>
        Create Account
    `;
    
    // Unlock app
    unlockApp();
    showToast('Welcome to Atlas Systems!');
}

// ============================================
// Sign In Handler
// ============================================

async function handleSignin(e) {
    e.preventDefault();
    
    const email = DOM.loginEmail.value.trim();
    const password = DOM.loginPassword.value;
    const rememberWithBiometric = DOM.rememberBiometric?.checked ?? false;
    
    if (!email || !password) {
        DOM.loginStatus.textContent = 'Please enter email and password';
        DOM.loginStatus.className = 'status-text error';
        return;
    }
    
    // Show loading
    DOM.loginSubmitBtn.disabled = true;
    DOM.loginSubmitBtn.innerHTML = `
        <svg class="spinner" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>
        Signing in...
    `;
    DOM.loginStatus.textContent = '';
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Demo mode: accept any valid-looking credentials
    if (email.includes('@') && password.length >= 1) {
        // Update saved account
        if (!AppState.savedAccount.name) {
            AppState.savedAccount.name = email.split('@')[0];
        }
        AppState.savedAccount.email = email;
        localStorage.setItem('atlas_account', JSON.stringify(AppState.savedAccount));
        
        // Save with biometrics if enabled
        if (rememberWithBiometric && AppState.biometricAvailable && AppState.isMedianApp) {
            const saved = await saveCredentialsWithBiometrics(AppState.savedAccount.name, email, password);
            if (saved) {
                showToast(`Login saved with ${AppState.biometricType === 'faceId' ? 'Face ID' : 'Touch ID'}`);
            }
        }
        
        // Log security event
        logSecurityEvent('system', 'Password Login', 'User authenticated with email/password', 'Mobile Device');
        
        // Clear form
        DOM.loginForm.reset();
        
        // Unlock
        unlockApp();
        showToast('Welcome back!');
    } else {
        DOM.loginStatus.textContent = 'Invalid email or password';
        DOM.loginStatus.className = 'status-text error';
    }
    
    // Reset button
    DOM.loginSubmitBtn.disabled = false;
    DOM.loginSubmitBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
            <polyline points="10 17 15 12 10 7"/>
            <line x1="15" y1="12" x2="3" y2="12"/>
        </svg>
        Sign In
    `;
}

// ============================================
// Password Visibility Toggle
// ============================================

function setupPasswordToggle(button, passwordInput) {
    if (!button || !passwordInput) return;
    
    button.addEventListener('click', () => {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        
        const eyeIcon = button.querySelector('.eye-icon');
        const eyeOffIcon = button.querySelector('.eye-off-icon');
        
        if (eyeIcon && eyeOffIcon) {
            eyeIcon.style.display = isPassword ? 'none' : 'block';
            eyeOffIcon.style.display = isPassword ? 'block' : 'none';
        }
    });
}

// ============================================
// DataStore - User Profile & Activities
// ============================================

async function loadUserData() {
    try {
        if (AppState.isMedianApp) {
            const result = await median.datastore.get({ key: 'atlas_user_profile' });
            if (result && result.value) {
                AppState.userProfile = JSON.parse(result.value);
            }
        } else {
            const stored = localStorage.getItem('atlas_user_profile');
            if (stored) {
                AppState.userProfile = JSON.parse(stored);
            }
        }
        
        // Populate profile form
        DOM.userName.value = AppState.userProfile.name || AppState.savedAccount.name || '';
        DOM.userEmail.value = AppState.userProfile.email || AppState.savedAccount.email || '';
        DOM.userAddress.value = AppState.userProfile.address || '';
        
    } catch (error) {
        console.error('Load user data error:', error);
    }
}

async function saveUserProfileToStore() {
    try {
        const profileJson = JSON.stringify(AppState.userProfile);
        
        if (AppState.isMedianApp) {
            await median.datastore.set({ key: 'atlas_user_profile', value: profileJson });
        }
        
        localStorage.setItem('atlas_user_profile', profileJson);
    } catch (error) {
        console.error('Save profile error:', error);
        localStorage.setItem('atlas_user_profile', JSON.stringify(AppState.userProfile));
    }
}

async function saveUserProfile(e) {
    e.preventDefault();
    
    AppState.userProfile = {
        name: DOM.userName.value.trim(),
        email: DOM.userEmail.value.trim(),
        address: DOM.userAddress.value.trim()
    };
    
    await saveUserProfileToStore();
    updateGreeting();
    closeProfilePanel();
    showToast('Profile saved successfully');
}

async function loadActivities() {
    try {
        if (AppState.isMedianApp) {
            const result = await median.datastore.get({ key: 'atlas_activities' });
            if (result && result.value) {
                AppState.activities = JSON.parse(result.value);
            } else {
                AppState.activities = [];
            }
        } else {
            const stored = localStorage.getItem('atlas_activities');
            AppState.activities = stored ? JSON.parse(stored) : [];
        }
        
        if (AppState.activities.length === 0) {
            addDemoActivities();
        }
        
        renderActivities();
    } catch (error) {
        console.error('Load activities error:', error);
        const stored = localStorage.getItem('atlas_activities');
        AppState.activities = stored ? JSON.parse(stored) : [];
        renderActivities();
    }
}

function addDemoActivities() {
    const now = Date.now();
    AppState.activities = [
        {
            id: generateId(),
            type: 'system',
            title: 'System Armed',
            content: 'Security system activated in Away mode',
            location: 'Control Panel',
            createdAt: now - 3600000,
            updatedAt: now - 3600000
        },
        {
            id: generateId(),
            type: 'door',
            title: 'Front Door Locked',
            content: 'Automatic lock engaged after 30 seconds',
            location: 'Front Entrance',
            createdAt: now - 7200000,
            updatedAt: now - 7200000
        },
        {
            id: generateId(),
            type: 'camera',
            title: 'Camera Recording Started',
            content: 'Motion-triggered recording on driveway camera',
            location: 'Driveway',
            createdAt: now - 10800000,
            updatedAt: now - 10800000
        }
    ];
    saveActivities();
}

async function saveActivities() {
    try {
        const activitiesJson = JSON.stringify(AppState.activities);
        
        if (AppState.isMedianApp) {
            await median.datastore.set({ key: 'atlas_activities', value: activitiesJson });
        }
        
        localStorage.setItem('atlas_activities', activitiesJson);
    } catch (error) {
        console.error('Save activities error:', error);
        localStorage.setItem('atlas_activities', JSON.stringify(AppState.activities));
    }
}

function logSecurityEvent(type, title, content, location) {
    const activity = {
        id: generateId(),
        type,
        title,
        content,
        location,
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
    
    AppState.activities.unshift(activity);
    saveActivities();
    
    if (AppState.isAuthenticated) {
        renderActivities();
    }
}

function renderActivities() {
    const count = AppState.activities.length;
    DOM.activityCount.textContent = `${count} event${count !== 1 ? 's' : ''}`;
    
    // Update activity badge in header
    updateActivityBadge();
    
    if (count === 0) {
        DOM.activityList.innerHTML = '';
        DOM.emptyState.classList.remove('hidden');
        return;
    }
    
    DOM.emptyState.classList.add('hidden');
    
    const sortedActivities = [...AppState.activities].sort((a, b) => b.updatedAt - a.updatedAt);
    
    DOM.activityList.innerHTML = sortedActivities.slice(0, 10).map(activity => `
        <div class="activity-card" data-id="${activity.id}">
            <div class="activity-icon ${activity.type}">
                ${ActivityIcons[activity.type] || ActivityIcons.custom}
            </div>
            <div class="activity-content">
                <h3>${escapeHtml(activity.title)}</h3>
                <p>${escapeHtml(activity.content)}</p>
                <div class="activity-meta">
                    <time>${formatDate(activity.updatedAt)}</time>
                    ${activity.location ? `<span class="location-tag">${escapeHtml(activity.location)}</span>` : ''}
                </div>
            </div>
        </div>
    `).join('');
    
    DOM.activityList.querySelectorAll('.activity-card').forEach(card => {
        card.addEventListener('click', () => openEditActivityModal(card.dataset.id));
    });
}

// ============================================
// Activity Modal
// ============================================

function openAddActivityModal() {
    AppState.editingActivityId = null;
    DOM.modalTitle.textContent = 'Log Security Event';
    DOM.noteId.value = '';
    DOM.eventType.value = 'motion';
    DOM.noteTitle.value = '';
    DOM.noteContent.value = '';
    DOM.noteLocation.value = '';
    DOM.deleteNoteBtn.style.display = 'none';
    DOM.noteModal.classList.add('active');
    DOM.noteTitle.focus();
}

function openEditActivityModal(activityId) {
    const activity = AppState.activities.find(a => a.id === activityId);
    if (!activity) return;
    
    AppState.editingActivityId = activityId;
    DOM.modalTitle.textContent = 'Edit Event';
    DOM.noteId.value = activity.id;
    DOM.eventType.value = activity.type;
    DOM.noteTitle.value = activity.title;
    DOM.noteContent.value = activity.content;
    DOM.noteLocation.value = activity.location || '';
    DOM.deleteNoteBtn.style.display = 'block';
    DOM.noteModal.classList.add('active');
    DOM.noteTitle.focus();
}

function closeActivityModal() {
    DOM.noteModal.classList.remove('active');
    AppState.editingActivityId = null;
}

async function saveActivity(e) {
    e.preventDefault();
    
    const type = DOM.eventType.value;
    const title = DOM.noteTitle.value.trim();
    const content = DOM.noteContent.value.trim();
    const location = DOM.noteLocation.value.trim();
    
    if (!title || !content) {
        showToast('Please fill in required fields', 'error');
        return;
    }
    
    const now = Date.now();
    
    if (AppState.editingActivityId) {
        const index = AppState.activities.findIndex(a => a.id === AppState.editingActivityId);
        if (index !== -1) {
            AppState.activities[index] = { ...AppState.activities[index], type, title, content, location, updatedAt: now };
        }
        showToast('Event updated');
    } else {
        AppState.activities.unshift({ id: generateId(), type, title, content, location, createdAt: now, updatedAt: now });
        showToast('Event logged');
    }
    
    await saveActivities();
    renderActivities();
    closeActivityModal();
}

async function deleteActivity() {
    if (!AppState.editingActivityId) return;
    if (!confirm('Delete this security event?')) return;
    
    AppState.activities = AppState.activities.filter(a => a.id !== AppState.editingActivityId);
    await saveActivities();
    renderActivities();
    closeActivityModal();
    showToast('Event deleted');
}

// ============================================
// Profile Panel
// ============================================

function openProfilePanel() {
    // Populate form with current profile data
    DOM.userName.value = AppState.userProfile.name || AppState.savedAccount.name || '';
    DOM.userEmail.value = AppState.userProfile.email || AppState.savedAccount.email || '';
    DOM.userAddress.value = AppState.userProfile.address || '';
    
    DOM.profilePanel.classList.add('active');
}

function closeProfilePanel() {
    DOM.profilePanel.classList.remove('active');
}

// ============================================
// Push Notifications - DISABLED
// Requires paid Apple Developer account ($99/year)
// Uncomment and enable OneSignal in Median App Studio when ready
// ============================================

async function initPushNotifications() {
    // DISABLED - Push Notifications require paid Apple Developer account
    console.log('Push Notifications disabled - requires paid Apple Developer account');
    return;
    
    /* Original implementation:
    if (!AppState.isMedianApp) {
        DOM.pushPermission.textContent = 'Requires Median app';
        return;
    }
    
    try {
        const info = await median.onesignal.info();
        console.log('OneSignal info:', info);
        
        if (info && info.oneSignalUserId) {
            AppState.pushRegistered = true;
            AppState.playerId = info.oneSignalUserId;
            DOM.pushPermission.textContent = 'Enabled';
            DOM.pushPermission.className = 'status-value granted';
            DOM.playerId.textContent = info.oneSignalUserId;
            DOM.registerPushBtn.textContent = 'Alerts Enabled';
            DOM.registerPushBtn.disabled = true;
            DOM.notificationBadge.classList.remove('hidden');
        } else {
            DOM.pushPermission.textContent = 'Not enabled';
            DOM.playerId.textContent = 'Not registered';
        }
        
        setupNotificationHandler();
    } catch (error) {
        console.error('Push init error:', error);
        DOM.pushPermission.textContent = 'Error';
        DOM.pushPermission.className = 'status-value denied';
    }
    */
}

async function registerPushNotifications() {
    // DISABLED - Push Notifications require paid Apple Developer account
    showToast('Push Notifications require Apple Developer Program', 'error');
    return;
}

function setupNotificationHandler() {
    // DISABLED - Push Notifications require paid Apple Developer account
    return;
}

// ============================================
// Notifications Panel - DISABLED
// ============================================

function openNotificationsPanel() {
    // DISABLED
    showToast('Push Notifications disabled for this build', 'error');
}

function closeNotificationsPanel() {
    // DISABLED - panel is commented out in HTML
}

// ============================================
// Quick Actions
// ============================================

function toggleSystemArm() {
    AppState.systemArmed = !AppState.systemArmed;
    const status = AppState.systemArmed ? 'Armed' : 'Disarmed';
    
    // Update system status badge
    DOM.systemStatus.textContent = status;
    DOM.systemStatus.className = `system-status ${AppState.systemArmed ? 'armed' : 'disarmed'}`;
    
    // Update the main arm button
    DOM.armBtn.className = `arm-control-btn ${AppState.systemArmed ? 'armed' : 'disarmed'}`;
    const statusText = DOM.armBtn.querySelector('.arm-status-text');
    const actionText = DOM.armBtn.querySelector('.arm-action-text');
    if (statusText) statusText.textContent = AppState.systemArmed ? 'System Armed' : 'System Disarmed';
    if (actionText) actionText.textContent = AppState.systemArmed ? 'Tap to Disarm' : 'Tap to Arm';
    
    logSecurityEvent('system', `System ${status}`, `Security system ${AppState.systemArmed ? 'activated' : 'deactivated'} manually`, 'Control Panel');
    showToast(`System ${status.toLowerCase()}`);
}

// ============================================
// Activity Drawer
// ============================================

function openActivityDrawer() {
    DOM.activityDrawer?.classList.add('open');
    DOM.activityDrawerOverlay?.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeActivityDrawer() {
    DOM.activityDrawer?.classList.remove('open');
    DOM.activityDrawerOverlay?.classList.remove('open');
    document.body.style.overflow = '';
}

function updateActivityBadge() {
    if (DOM.activityBadge && AppState.activities.length > 0) {
        DOM.activityBadge.classList.remove('hidden');
    } else if (DOM.activityBadge) {
        DOM.activityBadge.classList.add('hidden');
    }
}

// ============================================
// Clear Account (for testing)
// ============================================

function clearAccountAndLogout() {
    // Clear all stored data
    localStorage.removeItem('atlas_account');
    localStorage.removeItem('atlas_user_profile');
    localStorage.removeItem('atlas_activities');
    
    // Reset state
    AppState.hasAccount = false;
    AppState.hasBiometrics = false;
    AppState.savedAccount = { name: '', email: '' };
    
    // Show signup
    showSignup();
    showToast('Account cleared');
}

// ============================================
// Event Listeners
// ============================================

function initEventListeners() {
    // Sign Up
    DOM.signupForm?.addEventListener('submit', handleSignup);
    DOM.switchToSignin?.addEventListener('click', showSignin);
    setupPasswordToggle(DOM.toggleSignupPassword, DOM.signupPassword);
    
    // Sign In
    DOM.loginForm?.addEventListener('submit', handleSignin);
    DOM.switchToSignup?.addEventListener('click', showSignup);
    setupPasswordToggle(DOM.togglePassword, DOM.loginPassword);
    
    // Biometric Unlock
    DOM.unlockBtn?.addEventListener('click', authenticateWithBiometrics);
    DOM.usePasswordBtn?.addEventListener('click', showSignin);
    DOM.useDifferentAccount?.addEventListener('click', clearAccountAndLogout);
    
    // Dashboard
    DOM.lockBtn?.addEventListener('click', lockApp);
    DOM.addNoteBtn?.addEventListener('click', openAddActivityModal);
    // DOM.notificationsBtn?.addEventListener('click', openNotificationsPanel); // DISABLED - Push requires paid Apple Developer
    DOM.profileBtn?.addEventListener('click', openProfilePanel);
    
    // Quick Actions
    DOM.armBtn?.addEventListener('click', toggleSystemArm);
    DOM.camerasBtn?.addEventListener('click', () => showToast('Camera view coming soon'));
    DOM.historyBtn?.addEventListener('click', openActivityDrawer);
    
    // Activity Drawer
    DOM.activityDrawerBtn?.addEventListener('click', openActivityDrawer);
    DOM.closeDrawerBtn?.addEventListener('click', closeActivityDrawer);
    DOM.activityDrawerOverlay?.addEventListener('click', closeActivityDrawer);
    
    // Activity Modal
    DOM.closeModalBtn?.addEventListener('click', closeActivityModal);
    DOM.noteForm?.addEventListener('submit', saveActivity);
    DOM.deleteNoteBtn?.addEventListener('click', deleteActivity);
    
    // Profile Panel
    DOM.closeProfileBtn?.addEventListener('click', closeProfilePanel);
    DOM.profileForm?.addEventListener('submit', saveUserProfile);
    
    // Notifications Panel - DISABLED (Push requires paid Apple Developer account)
    // DOM.closePanelBtn?.addEventListener('click', closeNotificationsPanel);
    // DOM.registerPushBtn?.addEventListener('click', registerPushNotifications);
    
    // Close on backdrop
    DOM.noteModal?.addEventListener('click', (e) => { if (e.target === DOM.noteModal) closeActivityModal(); });
    // DOM.notificationsPanel?.addEventListener('click', (e) => { if (e.target === DOM.notificationsPanel) closeNotificationsPanel(); }); // DISABLED
    DOM.profilePanel?.addEventListener('click', (e) => { if (e.target === DOM.profilePanel) closeProfilePanel(); });
    
    // Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (DOM.noteModal?.classList.contains('active')) closeActivityModal();
            // if (DOM.notificationsPanel?.classList.contains('active')) closeNotificationsPanel(); // DISABLED
            if (DOM.profilePanel?.classList.contains('active')) closeProfilePanel();
        }
    });
}

// ============================================
// Initialize
// ============================================

function init() {
    console.log('Atlas Systems initializing...');
    initEventListeners();
    checkMedianEnvironment();
    showScreen('lock-screen');
    console.log('Atlas Systems ready');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
