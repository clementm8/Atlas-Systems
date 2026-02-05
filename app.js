/**
 * Atlas Systems - Home Security System
 * 
 * Demonstrates integration with Median.co plugins:
 * - Biometric Authentication (Face ID / Touch ID)
 * - QR Scanner (Device registration)
 * 
 * Flow:
 * 1. First time user → Sign Up → Add Device (scan QR code) → Dashboard
 * 2. Returning user → Sign In / Biometric → Dashboard
 */

// ============================================
// App State
// ============================================

const AppState = {
    isMedianApp: false,
    isAuthenticated: false,
    
    // Account status
    hasAccount: false,
    hasBiometrics: false,
    hasDevice: false,
    
    // Biometrics info
    biometricAvailable: false,
    biometricType: 'biometrics',
    
    // User profile (localStorage)
    userProfile: {
        name: '',
        email: '',
        address: ''
    },
    
    // Registered Atlas products
    products: [],
    
    // Pending product (during scan/add flow)
    pendingProduct: null,
    
    // Activity log
    activities: [],
    
    // Editing state
    editingActivityId: null
};

// ============================================
// DOM Elements
// ============================================

const DOM = {
    // Screens
    lockScreen: document.getElementById('lock-screen'),
    addDeviceScreen: document.getElementById('add-device-screen'),
    vaultScreen: document.getElementById('vault-screen'),
    
    // Auth Containers
    signupContainer: document.getElementById('signup-container'),
    signinContainer: document.getElementById('signin-container'),
    biometricUnlockContainer: document.getElementById('biometric-unlock-container'),
    
    // Sign Up Form
    signupForm: document.getElementById('signup-form'),
    signupName: document.getElementById('signup-name'),
    signupEmail: document.getElementById('signup-email'),
    signupAddress: document.getElementById('signup-address'),
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
    
    // Add Device Screen
    scanDeviceBtn: document.getElementById('scan-device-btn'),
    scanStatus: document.getElementById('scan-status'),
    scannedDevicePreview: document.getElementById('scanned-device-preview'),
    deviceCode: document.getElementById('device-code'),
    confirmDeviceBtn: document.getElementById('confirm-device-btn'),
    skipDeviceBtn: document.getElementById('skip-device-btn'),
    manualEntryContainer: document.getElementById('manual-entry-container'),
    manualNameInput: document.getElementById('manual-name-input'),
    manualCodeInput: document.getElementById('manual-code-input'),
    submitManualCodeBtn: document.getElementById('submit-manual-code-btn'),
    deviceNameInput: document.getElementById('device-name-input'),
    
    // Dashboard
    userGreeting: document.getElementById('user-greeting'),
    productsContainer: document.getElementById('products-container'),
    addDeviceBtn: document.getElementById('add-device-btn'),
    addDeviceText: document.getElementById('add-device-text'),
    historyBtn: document.getElementById('history-btn'),
    activityList: document.getElementById('activity-list'),
    emptyState: document.getElementById('empty-state'),
    activityCount: document.getElementById('activity-count'),
    addNoteBtn: document.getElementById('add-note-btn'),
    lockBtn: document.getElementById('lock-btn'),
    profileBtn: document.getElementById('profile-btn'),
    
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
    noteContent: document.getElementById('note-content'),
    closeModalBtn: document.getElementById('close-modal-btn'),
    deleteNoteBtn: document.getElementById('delete-note-btn'),
    
    // Add Product Modal
    addProductModal: document.getElementById('add-product-modal'),
    closeAddProductBtn: document.getElementById('close-add-product-btn'),
    cancelAddProductBtn: document.getElementById('cancel-add-product-btn'),
    dashboardProductName: document.getElementById('dashboard-product-name'),
    dashboardProductCode: document.getElementById('dashboard-product-code'),
    submitProductCodeBtn: document.getElementById('submit-product-code-btn'),
    
    // Profile Panel
    profilePanel: document.getElementById('profile-panel'),
    closeProfileBtn: document.getElementById('close-profile-btn'),
    profileForm: document.getElementById('profile-form'),
    userName: document.getElementById('user-name'),
    userEmail: document.getElementById('user-email'),
    userAddress: document.getElementById('user-address'),
    profileHubCode: document.getElementById('profile-hub-code'),
    profileHubStatus: document.getElementById('profile-hub-status'),
    
};

// ============================================
// Activity Type Icons
// ============================================

const ActivityIcons = {
    motion: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="10" r="6"/>
        <circle cx="12" cy="10" r="2"/>
        <path d="M5 10 Q2 8 5 5" opacity="0.6"/>
        <path d="M19 10 Q22 8 19 5" opacity="0.6"/>
        <rect x="8" y="18" width="8" height="3" rx="1"/>
        <line x1="12" y1="16" x2="12" y2="18"/>
    </svg>`,
    scan: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
        <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
        <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
        <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
        <line x1="7" y1="12" x2="17" y2="12"/>
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
    
    if (AppState.biometricAvailable && AppState.isMedianApp) {
        DOM.signupBiometricOption.style.display = 'block';
        updateBiometricText(DOM.signupBiometricText, 'Enable');
    } else {
        DOM.signupBiometricOption.style.display = 'none';
    }
}

function showSignin() {
    hideAllAuthContainers();
    DOM.signinContainer.style.display = 'block';
    
    if (AppState.userProfile.email) {
        DOM.loginEmail.value = AppState.userProfile.email;
    }
    
    if (AppState.biometricAvailable) {
        DOM.biometricOption.style.display = 'block';
        updateBiometricText(DOM.biometricTypeText, 'Remember with');
    }
}

function showBiometricUnlock() {
    hideAllAuthContainers();
    DOM.biometricUnlockContainer.style.display = 'flex';
    DOM.biometricUnlockContainer.style.flexDirection = 'column';
    
    const displayName = AppState.userProfile.name;
    if (displayName) {
        DOM.savedUserName.textContent = `Welcome back, ${displayName.split(' ')[0]}`;
    } else {
        DOM.savedUserName.textContent = 'Welcome back';
    }
    DOM.savedUserEmail.style.display = 'none';
    
    updateUnlockButtonIcon();
}

function updateUnlockButtonIcon() {
    const iconContainer = document.querySelector('.fingerprint-icon');
    if (!iconContainer) return;
    
    if (AppState.biometricType === 'faceId') {
        iconContainer.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
                <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
                <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
                <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
                <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                <path d="M9 9h.01"/>
                <path d="M15 9h.01"/>
            </svg>
        `;
        DOM.unlockText.textContent = 'Unlock with Face ID';
    } else if (AppState.biometricType === 'touchId') {
        iconContainer.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 4"/>
                <path d="M5 19.5C5.5 18 6 15 6 12c0-.7.12-1.37.34-2"/>
                <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/>
                <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/>
                <path d="M8.65 22c.21-.66.45-1.32.57-2"/>
                <path d="M14 13.12c0 2.38 0 6.38-1 8.88"/>
                <path d="M2 16h.01"/>
                <path d="M21.8 16c.2-2 .131-5.354 0-6"/>
                <path d="M9 6.8a6 6 0 0 1 9 5.2c0 .47 0 1.17-.02 2"/>
            </svg>
        `;
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
    updateSensorDisplay();
    updateAddDeviceButton();
}

function updateAddDeviceButton() {
    if (DOM.addDeviceText) {
        DOM.addDeviceText.textContent = AppState.isMedianApp ? 'Scan Product' : 'Add Product';
    }
}

function showAddDeviceScreen() {
    // Reset form fields
    if (DOM.manualNameInput) DOM.manualNameInput.value = '';
    if (DOM.manualCodeInput) DOM.manualCodeInput.value = '';
    if (DOM.deviceNameInput) DOM.deviceNameInput.value = '';
    if (DOM.scanStatus) {
        DOM.scanStatus.textContent = '';
        DOM.scanStatus.className = 'status-text';
    }
    if (DOM.scannedDevicePreview) DOM.scannedDevicePreview.style.display = 'none';
    if (DOM.manualEntryContainer) DOM.manualEntryContainer.style.display = 'flex';
    
    showScreen('add-device-screen');
}

function updateGreeting() {
    const name = AppState.userProfile.name;
    if (name) {
        DOM.userGreeting.textContent = `Welcome, ${name.split(' ')[0]}`;
    } else if (AppState.userProfile.email) {
        DOM.userGreeting.textContent = `Welcome, ${AppState.userProfile.email.split('@')[0]}`;
    } else {
        DOM.userGreeting.textContent = 'Welcome';
    }
}

// ============================================
// Products Display
// ============================================

function updateProductsDisplay() {
    const container = DOM.productsContainer;
    if (!container) return;
    
    if (AppState.products.length === 0) {
        container.innerHTML = `
            <div class="no-products-message">
                <p>No products registered</p>
                <span>Add a product to get started</span>
            </div>
        `;
        return;
    }
    
    container.innerHTML = AppState.products.map(product => {
        const isOnline = product.status === 'online';
        return `
            <div class="product-card" data-product-id="${product.id}">
                <div class="product-header">
                    <div class="product-icon-container">
                        <div class="product-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <circle cx="12" cy="10" r="6"/>
                                <circle cx="12" cy="10" r="2"/>
                                <path d="M5 10 Q2 8 5 5" opacity="0.6"/>
                                <path d="M19 10 Q22 8 19 5" opacity="0.6"/>
                                <rect x="8" y="18" width="8" height="3" rx="1"/>
                                <line x1="12" y1="16" x2="12" y2="18"/>
                            </svg>
                        </div>
                        ${isOnline ? '<div class="product-pulse"></div>' : ''}
                    </div>
                    <div class="product-info">
                        <h3>${product.name}</h3>
                        <code class="product-code">${product.code}</code>
                    </div>
                </div>
                <div class="product-status">
                    <div class="product-status-indicator">
                        <span class="status-dot ${isOnline ? 'active' : ''}"></span>
                        <span>${isOnline ? 'Online' : 'Offline'}</span>
                    </div>
                    <label class="toggle-switch">
                        <input type="checkbox" class="product-toggle" data-product-id="${product.id}" ${isOnline ? 'checked' : ''} />
                        <span class="toggle-slider"></span>
                    </label>
                </div>
            </div>
        `;
    }).join('');
    
    // Add toggle event listeners
    container.querySelectorAll('.product-toggle').forEach(toggle => {
        toggle.addEventListener('change', (e) => {
            toggleProductStatus(e.target.dataset.productId);
        });
    });
    
    // Update profile panel products count
    if (DOM.profileHubCode) {
        DOM.profileHubCode.textContent = `${AppState.products.length} product${AppState.products.length !== 1 ? 's' : ''}`;
    }
    if (DOM.profileHubStatus) {
        const onlineCount = AppState.products.filter(p => p.status === 'online').length;
        DOM.profileHubStatus.textContent = `${onlineCount} online`;
    }
}

// Legacy function name for compatibility
function updateSensorDisplay() {
    updateProductsDisplay();
}

// ============================================
// Determine Which Auth Screen to Show
// ============================================

function determineAuthScreen() {
    const savedAccountData = localStorage.getItem('atlas_account');
    if (savedAccountData) {
        AppState.hasAccount = true;
    }
    
    const savedProfile = localStorage.getItem('atlas_user_profile');
    if (savedProfile) {
        AppState.userProfile = JSON.parse(savedProfile);
    }
    
    const savedProducts = localStorage.getItem('atlas_products');
    if (savedProducts) {
        AppState.products = JSON.parse(savedProducts);
        // Ensure status defaults to offline for each product
        AppState.products.forEach(p => {
            if (!p.status) p.status = 'offline';
        });
        AppState.hasDevice = AppState.products.length > 0;
    }
    
    if (AppState.hasBiometrics && AppState.hasAccount) {
        showBiometricUnlock();
        setTimeout(() => authenticateWithBiometrics(), 600);
    } else if (AppState.hasAccount) {
        showSignin();
    } else {
        showSignin();
    }
}

// ============================================
// Median Detection & Initialization
// ============================================

function checkMedianEnvironment() {
    AppState.isMedianApp = typeof median !== 'undefined' && median !== null;
    
    if (AppState.isMedianApp) {
        initBiometrics();
    } else {
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
        
        AppState.biometricAvailable = status.hasTouchId;
        AppState.hasBiometrics = status.hasSecret;
        
        if (status.biometryType === 'faceId') {
            AppState.biometricType = 'faceId';
        } else if (status.biometryType === 'touchId') {
            AppState.biometricType = 'touchId';
        }
        
        updateAllBiometricText();
        updateUnlockButtonIcon();
        determineAuthScreen();
        
    } catch (error) {
        console.error('Biometric init error:', error);
        determineAuthScreen();
    }
}

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
            const credentials = JSON.parse(result.secret);
            
            if (credentials.email) {
                AppState.userProfile.email = credentials.email;
            }
            if (credentials.name) {
                AppState.userProfile.name = credentials.name;
            }
            
            DOM.biometricStatus.textContent = 'Authentication successful!';
            DOM.biometricStatus.className = 'status-text success';
            
            logActivity('system', 'Biometric Login', 
                `User authenticated via ${AppState.biometricType === 'faceId' ? 'Face ID' : 'Touch ID'}`);
            
            setTimeout(() => {
                unlockApp();
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
            return true;
        }
    } catch (error) {
        console.error('Save biometric credentials error:', error);
    }
    
    return false;
}

// ============================================
// QR Scanner
// ============================================

function scanQRCode() {
    if (!AppState.isMedianApp) {
        // Demo mode - simulate a scan
        const demoCode = 'ATLAS-' + Math.random().toString(36).substring(2, 10).toUpperCase();
        handleScanResult({ success: true, code: demoCode });
        return;
    }
    
    if (median.barcode.setPrompt) {
        median.barcode.setPrompt('Scan QR code on your Atlas product');
    }
    
    median.barcode.scan({
        callback: function(data) {
            if (data?.code) {
                handleScanResult({ success: true, code: data.code, type: data.type || 'qr' });
            } else if (data?.cancelled || data?.error) {
                if (DOM.scanStatus) {
                    DOM.scanStatus.textContent = 'Scan cancelled. You can try again or enter code manually.';
                    DOM.scanStatus.className = 'status-text';
                }
                if (DOM.manualEntryContainer) {
                    DOM.manualEntryContainer.style.display = 'flex';
                }
            }
        }
    });
}

function handleManualEntry() {
    const name = DOM.manualNameInput?.value.trim();
    const code = DOM.manualCodeInput?.value.trim();
    
    if (!code) {
        DOM.scanStatus.textContent = 'Please enter a product code';
        DOM.scanStatus.className = 'status-text error';
        return;
    }
    
    // Process manual entry the same way as scanned code
    handleScanResult({ success: true, code: code, name: name, type: 'manual' });
    DOM.manualNameInput.value = '';
    DOM.manualCodeInput.value = '';
}

function handleScanResult(data) {
    if (data.success && data.code) {
        // Store pending product for confirmation (name will be set on confirm)
        AppState.pendingProduct = {
            id: generateId(),
            code: data.code,
            name: data.name || '',
            connectedAt: Date.now(),
            status: 'offline'
        };
        
        // Hide manual entry when code is found
        if (DOM.manualEntryContainer) {
            DOM.manualEntryContainer.style.display = 'none';
        }
        
        // Show the preview with editable name
        DOM.deviceCode.textContent = data.code;
        if (DOM.deviceNameInput) {
            DOM.deviceNameInput.value = data.name || '';
            DOM.deviceNameInput.focus();
        }
        DOM.scannedDevicePreview.style.display = 'block';
        DOM.scanStatus.textContent = data.type === 'manual' ? 'Code entered!' : 'Device found!';
        DOM.scanStatus.className = 'status-text success';
        
        // Log the entry
        const logType = data.type === 'manual' ? 'Device Entered' : 'Device Scanned';
        logActivity('scan', logType, `${data.type === 'manual' ? 'Entered' : 'Scanned'} device code: ${data.code}`);
    } else {
        DOM.scanStatus.textContent = data.error || 'No QR code detected. Try again.';
        DOM.scanStatus.className = 'status-text error';
    }
}

function confirmDevice() {
    if (!AppState.pendingProduct) return;
    
    // Get name from input field
    const name = DOM.deviceNameInput?.value.trim() || 'Atlas Product';
    AppState.pendingProduct.name = name;
    
    // Add to products array
    AppState.products.push(AppState.pendingProduct);
    AppState.hasDevice = true;
    
    // Save all products
    saveProducts();
    
    // Log the connection
    logActivity('scan', 'Product Registered', `${name} registered: ${AppState.pendingProduct.code}`);
    
    // Clear pending
    AppState.pendingProduct = null;
    
    unlockApp();
}

function saveProducts() {
    localStorage.setItem('atlas_products', JSON.stringify(AppState.products));
}

// ============================================
// Sign Up Handler
// ============================================

async function handleSignup(e) {
    e.preventDefault();
    
    const name = DOM.signupName.value.trim();
    const email = DOM.signupEmail.value.trim();
    const address = DOM.signupAddress.value.trim();
    const password = DOM.signupPassword.value;
    const confirmPassword = DOM.signupConfirm.value;
    const enableBiometric = DOM.signupEnableBiometric?.checked ?? false;
    
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
    
    DOM.signupSubmitBtn.disabled = true;
    DOM.signupSubmitBtn.innerHTML = `
        <svg class="spinner" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>
        Creating Account...
    `;
    DOM.signupStatus.textContent = '';
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (enableBiometric && AppState.biometricAvailable && AppState.isMedianApp) {
        DOM.signupSubmitBtn.innerHTML = `
            <svg class="spinner" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>
            Setting up ${AppState.biometricType === 'faceId' ? 'Face ID' : 'Touch ID'}...
        `;
        
        await saveCredentialsWithBiometrics(name, email, password);
    }
    
    // Save account
    const accountData = { name, email, createdAt: Date.now() };
    localStorage.setItem('atlas_account', JSON.stringify(accountData));
    AppState.hasAccount = true;
    
    // Save profile
    AppState.userProfile = { name, email, address };
    saveUserProfile();
    
    // Log event
    logActivity('system', 'Account Created', 'New Atlas Systems account registered');
    
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
    
    // Go to Add Device screen
    showAddDeviceScreen();
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
    
    DOM.loginSubmitBtn.disabled = true;
    DOM.loginSubmitBtn.innerHTML = `
        <svg class="spinner" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>
        Signing in...
    `;
    DOM.loginStatus.textContent = '';
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (email.includes('@') && password.length >= 1) {
        if (!AppState.userProfile.name) {
            AppState.userProfile.name = email.split('@')[0];
        }
        AppState.userProfile.email = email;
        saveUserProfile();
        
        const accountData = { name: AppState.userProfile.name, email, createdAt: Date.now() };
        localStorage.setItem('atlas_account', JSON.stringify(accountData));
        
        if (rememberWithBiometric && AppState.biometricAvailable && AppState.isMedianApp) {
            await saveCredentialsWithBiometrics(AppState.userProfile.name, email, password);
        }
        
        logActivity('system', 'Password Login', 'User authenticated with email/password');
        
        DOM.loginForm.reset();
        
        unlockApp();
    } else {
        DOM.loginStatus.textContent = 'Invalid email or password';
        DOM.loginStatus.className = 'status-text error';
    }
    
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
// User Profile (localStorage)
// ============================================

function loadUserData() {
    try {
        const stored = localStorage.getItem('atlas_user_profile');
        if (stored) {
            AppState.userProfile = JSON.parse(stored);
        }
        
        DOM.userName.value = AppState.userProfile.name || '';
        DOM.userEmail.value = AppState.userProfile.email || '';
        DOM.userAddress.value = AppState.userProfile.address || '';
        
    } catch (error) {
        console.error('Load user data error:', error);
    }
}

function saveUserProfile() {
    localStorage.setItem('atlas_user_profile', JSON.stringify(AppState.userProfile));
}

function handleSaveProfile(e) {
    e.preventDefault();
    
    AppState.userProfile = {
        name: DOM.userName.value.trim(),
        email: DOM.userEmail.value.trim(),
        address: DOM.userAddress.value.trim()
    };
    
    saveUserProfile();
    updateGreeting();
    closeProfilePanel();
}

// ============================================
// Activities (localStorage)
// ============================================

function loadActivities() {
    try {
        const stored = localStorage.getItem('atlas_activities');
        AppState.activities = stored ? JSON.parse(stored) : [];
        
        if (AppState.activities.length === 0) {
            addDemoActivities();
        }
        
        renderActivities();
    } catch (error) {
        console.error('Load activities error:', error);
        AppState.activities = [];
        renderActivities();
    }
}

function addDemoActivities() {
    const now = Date.now();
    AppState.activities = [
        {
            id: generateId(),
            type: 'scan',
            title: 'Product Registered',
            content: 'Atlas sensor is connected and monitoring',
            createdAt: now - 3600000,
            updatedAt: now - 3600000
        }
    ];
    saveActivities();
}

function saveActivities() {
    localStorage.setItem('atlas_activities', JSON.stringify(AppState.activities));
}

function logActivity(type, title, content) {
    const activity = {
        id: generateId(),
        type,
        title,
        content,
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
    DOM.modalTitle.textContent = 'Log Event';
    DOM.noteId.value = '';
    DOM.eventType.value = 'motion';
    DOM.noteContent.value = '';
    DOM.deleteNoteBtn.style.display = 'none';
    DOM.noteModal.classList.add('active');
    DOM.noteContent.focus();
}

function openEditActivityModal(activityId) {
    const activity = AppState.activities.find(a => a.id === activityId);
    if (!activity) return;
    
    AppState.editingActivityId = activityId;
    DOM.modalTitle.textContent = 'Edit Event';
    DOM.noteId.value = activity.id;
    DOM.eventType.value = activity.type;
    DOM.noteContent.value = activity.content;
    DOM.deleteNoteBtn.style.display = 'block';
    DOM.noteModal.classList.add('active');
    DOM.noteContent.focus();
}

function closeActivityModal() {
    DOM.noteModal.classList.remove('active');
    AppState.editingActivityId = null;
}

async function saveActivity(e) {
    e.preventDefault();
    
    const type = DOM.eventType.value;
    const content = DOM.noteContent.value.trim();
    
    if (!content) {
        return;
    }
    
    const typeLabels = {
        motion: 'Motion Detected',
        scan: 'Device Scanned',
        system: 'System Event',
        custom: 'Custom Note'
    };
    const title = typeLabels[type] || 'Event';
    
    const now = Date.now();
    
    if (AppState.editingActivityId) {
        const index = AppState.activities.findIndex(a => a.id === AppState.editingActivityId);
        if (index !== -1) {
            AppState.activities[index] = { ...AppState.activities[index], type, title, content, updatedAt: now };
        }
    } else {
        AppState.activities.unshift({ id: generateId(), type, title, content, createdAt: now, updatedAt: now });
    }
    
    saveActivities();
    renderActivities();
    closeActivityModal();
}

async function deleteActivity() {
    if (!AppState.editingActivityId) return;
    if (!confirm('Delete this event?')) return;
    
    AppState.activities = AppState.activities.filter(a => a.id !== AppState.editingActivityId);
    saveActivities();
    renderActivities();
    closeActivityModal();
}

// ============================================
// Product Toggle
// ============================================

function toggleProductStatus(productId) {
    const product = AppState.products.find(p => p.id === productId);
    if (!product) return;
    
    // Toggle between online and offline
    product.status = product.status === 'online' ? 'offline' : 'online';
    saveProducts();
    updateProductsDisplay();
    
    const status = product.status;
    logActivity('system', `Product ${status.charAt(0).toUpperCase() + status.slice(1)}`, 
        `${product.name} ${status}: ${product.code}`);
}

// ============================================
// Add Product Modal (Dashboard)
// ============================================

function handleAddDeviceClick() {
    if (AppState.isMedianApp) {
        // In Median app, use QR scanner
        scanQRCode();
    } else {
        // In browser, open manual entry modal
        openAddProductModal();
    }
}

function openAddProductModal() {
    if (DOM.dashboardProductName) {
        DOM.dashboardProductName.value = '';
    }
    if (DOM.dashboardProductCode) {
        DOM.dashboardProductCode.value = '';
    }
    DOM.addProductModal?.classList.add('active');
    DOM.dashboardProductName?.focus();
}

function closeAddProductModal() {
    DOM.addProductModal?.classList.remove('active');
}

function submitDashboardProductCode() {
    const name = DOM.dashboardProductName?.value.trim() || 'Atlas Product';
    const code = DOM.dashboardProductCode?.value.trim();
    
    if (!code) {
        return;
    }
    
    // Create new product and add to array
    const newProduct = {
        id: generateId(),
        code: code,
        name: name,
        connectedAt: Date.now(),
        status: 'offline'
    };
    
    AppState.products.push(newProduct);
    AppState.hasDevice = true;
    
    saveProducts();
    updateProductsDisplay();
    closeAddProductModal();
    
    logActivity('scan', 'Product Added', `${name} registered: ${code}`);
}

// ============================================
// Profile Panel
// ============================================

function openProfilePanel() {
    DOM.userName.value = AppState.userProfile.name || '';
    DOM.userEmail.value = AppState.userProfile.email || '';
    DOM.userAddress.value = AppState.userProfile.address || '';
    
    updateSensorDisplay();
    
    DOM.profilePanel.classList.add('active');
}

function closeProfilePanel() {
    DOM.profilePanel.classList.remove('active');
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
// Account Management
// ============================================

function clearAccountAndLogout() {
    localStorage.removeItem('atlas_account');
    localStorage.removeItem('atlas_user_profile');
    localStorage.removeItem('atlas_activities');
    localStorage.removeItem('atlas_products');
    
    AppState.hasAccount = false;
    AppState.hasBiometrics = false;
    AppState.hasDevice = false;
    AppState.userProfile = { name: '', email: '', address: '' };
    AppState.products = [];
    
    showSignin();
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
    
    // Add Device Screen
    DOM.scanDeviceBtn?.addEventListener('click', scanQRCode);
    DOM.confirmDeviceBtn?.addEventListener('click', confirmDevice);
    DOM.submitManualCodeBtn?.addEventListener('click', handleManualEntry);
    DOM.manualCodeInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            handleManualEntry();
        }
    });
    DOM.skipDeviceBtn?.addEventListener('click', () => {
        unlockApp();
    });
    
    // Dashboard
    DOM.lockBtn?.addEventListener('click', lockApp);
    DOM.addNoteBtn?.addEventListener('click', openAddActivityModal);
    DOM.profileBtn?.addEventListener('click', openProfilePanel);
    DOM.addDeviceBtn?.addEventListener('click', handleAddDeviceClick);
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
    DOM.profileForm?.addEventListener('submit', handleSaveProfile);
    
    // Add Product Modal
    DOM.closeAddProductBtn?.addEventListener('click', closeAddProductModal);
    DOM.cancelAddProductBtn?.addEventListener('click', closeAddProductModal);
    DOM.submitProductCodeBtn?.addEventListener('click', submitDashboardProductCode);
    DOM.dashboardProductCode?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            submitDashboardProductCode();
        }
    });
    
    // Close on backdrop
    DOM.noteModal?.addEventListener('click', (e) => { if (e.target === DOM.noteModal) closeActivityModal(); });
    DOM.profilePanel?.addEventListener('click', (e) => { if (e.target === DOM.profilePanel) closeProfilePanel(); });
    DOM.addProductModal?.addEventListener('click', (e) => { if (e.target === DOM.addProductModal) closeAddProductModal(); });
    
    // Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (DOM.noteModal?.classList.contains('active')) closeActivityModal();
            if (DOM.profilePanel?.classList.contains('active')) closeProfilePanel();
            if (DOM.addProductModal?.classList.contains('active')) closeAddProductModal();
        }
    });
}

// ============================================
// Initialize
// ============================================

function init() {
    initEventListeners();
    checkMedianEnvironment();
    showScreen('lock-screen');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
