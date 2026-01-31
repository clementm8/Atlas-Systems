/**
 * Atlas Systems - Home Security Management
 * 
 * Demonstrates integration with Median.co plugins:
 * - Biometric Authentication (Face ID / Touch ID) - Save & retrieve login credentials
 * - DataStore (User profile & activity storage)
 * - Push Notifications (Security alerts via OneSignal)
 */

// ============================================
// App State
// ============================================

const AppState = {
    isMedianApp: false,
    isAuthenticated: false,
    
    // Biometrics
    biometricAvailable: false,
    biometricType: 'biometrics', // 'faceId' or 'touchId' or 'biometrics'
    hasSavedCredentials: false,
    savedEmail: '',
    
    // User profile
    userProfile: {
        name: '',
        email: '',
        phone: '',
        address: '',
        emergencyContact: ''
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
    
    // Login Form
    loginFormContainer: document.getElementById('login-form-container'),
    loginForm: document.getElementById('login-form'),
    loginEmail: document.getElementById('login-email'),
    loginPassword: document.getElementById('login-password'),
    loginSubmitBtn: document.getElementById('login-submit-btn'),
    loginStatus: document.getElementById('login-status'),
    togglePassword: document.getElementById('toggle-password'),
    eyeIcon: document.getElementById('eye-icon'),
    eyeOffIcon: document.getElementById('eye-off-icon'),
    
    // Biometric Option
    biometricOption: document.getElementById('biometric-option'),
    rememberBiometric: document.getElementById('remember-biometric'),
    biometricTypeText: document.getElementById('biometric-type-text'),
    
    // Biometric Unlock
    biometricUnlockContainer: document.getElementById('biometric-unlock-container'),
    savedUserEmail: document.getElementById('saved-user-email'),
    unlockBtn: document.getElementById('unlock-btn'),
    unlockText: document.getElementById('unlock-text'),
    biometricStatus: document.getElementById('biometric-status'),
    usePasswordBtn: document.getElementById('use-password-btn'),
    
    // Browser Fallback
    browserFallback: document.getElementById('browser-fallback'),
    
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
    userPhone: document.getElementById('user-phone'),
    userAddress: document.getElementById('user-address'),
    emergencyContact: document.getElementById('emergency-contact'),
    
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
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }
}

function lockApp() {
    AppState.isAuthenticated = false;
    showScreen('lock-screen');
    
    // Show appropriate login UI based on saved credentials
    if (AppState.hasSavedCredentials && AppState.biometricAvailable) {
        showBiometricUnlock();
    } else {
        showLoginForm();
    }
}

function unlockApp(email) {
    AppState.isAuthenticated = true;
    AppState.savedEmail = email || AppState.savedEmail;
    showScreen('vault-screen');
    loadUserData();
    loadActivities();
    updateGreeting();
}

function updateGreeting() {
    const name = AppState.userProfile.name;
    if (name) {
        DOM.userGreeting.textContent = `Welcome back, ${name.split(' ')[0]}`;
    } else if (AppState.savedEmail) {
        DOM.userGreeting.textContent = `Welcome, ${AppState.savedEmail.split('@')[0]}`;
    } else {
        DOM.userGreeting.textContent = 'Welcome back';
    }
}

// ============================================
// Login UI Management
// ============================================

function showLoginForm() {
    DOM.loginFormContainer.style.display = 'block';
    DOM.biometricUnlockContainer.style.display = 'none';
    
    // Show biometric option if available
    if (AppState.biometricAvailable) {
        DOM.biometricOption.style.display = 'block';
        updateBiometricTypeText();
    }
}

function showBiometricUnlock() {
    DOM.loginFormContainer.style.display = 'none';
    DOM.biometricUnlockContainer.style.display = 'flex';
    DOM.savedUserEmail.textContent = AppState.savedEmail || 'user@example.com';
    
    // Update unlock text
    if (AppState.biometricType === 'faceId') {
        DOM.unlockText.textContent = 'Unlock with Face ID';
    } else if (AppState.biometricType === 'touchId') {
        DOM.unlockText.textContent = 'Unlock with Touch ID';
    } else {
        DOM.unlockText.textContent = 'Unlock with Biometrics';
    }
}

function updateBiometricTypeText() {
    if (AppState.biometricType === 'faceId') {
        DOM.biometricTypeText.textContent = 'Remember with Face ID';
    } else if (AppState.biometricType === 'touchId') {
        DOM.biometricTypeText.textContent = 'Remember with Touch ID';
    } else {
        DOM.biometricTypeText.textContent = 'Remember with Biometrics';
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
        initPushNotifications();
    } else {
        // Browser fallback mode
        DOM.browserFallback.style.display = 'block';
        DOM.biometricOption.style.display = 'none';
        showLoginForm();
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
        AppState.hasSavedCredentials = status.hasSecret;
        
        // Determine biometric type
        if (status.hasFaceId) {
            AppState.biometricType = 'faceId';
        } else if (status.hasTouchId) {
            AppState.biometricType = 'touchId';
        }
        
        if (AppState.biometricAvailable) {
            DOM.biometricOption.style.display = 'block';
            updateBiometricTypeText();
        }
        
        // Check if we have saved credentials
        if (AppState.hasSavedCredentials) {
            // Load saved email from local storage for display
            const savedData = localStorage.getItem('atlas_saved_email');
            if (savedData) {
                AppState.savedEmail = savedData;
            }
            
            // Show biometric unlock screen
            showBiometricUnlock();
            
            // Auto-prompt for biometric auth after a short delay
            setTimeout(() => {
                authenticateWithBiometrics();
            }, 600);
        } else {
            // No saved credentials, show login form
            showLoginForm();
        }
    } catch (error) {
        console.error('Biometric init error:', error);
        showLoginForm();
    }
}

async function authenticateWithBiometrics() {
    if (!AppState.isMedianApp || !AppState.biometricAvailable) {
        showLoginForm();
        return;
    }
    
    DOM.biometricStatus.textContent = 'Authenticating...';
    DOM.biometricStatus.className = 'status-text';
    
    try {
        // Retrieve saved credentials with biometric verification
        const result = await median.auth.get();
        
        if (result.success && result.secret) {
            console.log('Biometric auth successful');
            
            // Parse the saved credentials
            const credentials = JSON.parse(result.secret);
            
            DOM.biometricStatus.textContent = 'Authentication successful!';
            DOM.biometricStatus.className = 'status-text success';
            
            // Log security event
            logSecurityEvent('system', 'Biometric Login', `User authenticated via ${AppState.biometricType === 'faceId' ? 'Face ID' : 'Touch ID'}`, 'Mobile Device');
            
            setTimeout(() => {
                unlockApp(credentials.email);
                showToast('Welcome to Atlas Systems');
            }, 300);
        } else {
            DOM.biometricStatus.textContent = 'Authentication failed';
            DOM.biometricStatus.className = 'status-text error';
        }
    } catch (error) {
        console.error('Biometric auth error:', error);
        
        if (error.message && error.message.includes('cancel')) {
            DOM.biometricStatus.textContent = 'Authentication cancelled';
            DOM.biometricStatus.className = 'status-text';
        } else {
            DOM.biometricStatus.textContent = 'Authentication failed. Try again or use password.';
            DOM.biometricStatus.className = 'status-text error';
        }
    }
}

async function saveCredentialsWithBiometrics(email, password) {
    if (!AppState.isMedianApp || !AppState.biometricAvailable) {
        return false;
    }
    
    try {
        // Save credentials encrypted with biometrics
        const credentials = JSON.stringify({
            email: email,
            password: password,
            savedAt: Date.now()
        });
        
        const result = await median.auth.save({
            secret: credentials
        });
        
        if (result.success) {
            // Save email separately for display purposes
            localStorage.setItem('atlas_saved_email', email);
            AppState.hasSavedCredentials = true;
            AppState.savedEmail = email;
            
            console.log('Credentials saved with biometrics');
            return true;
        }
    } catch (error) {
        console.error('Save credentials error:', error);
    }
    
    return false;
}

// ============================================
// Login Form Handler
// ============================================

async function handleLogin(e) {
    e.preventDefault();
    
    const email = DOM.loginEmail.value.trim();
    const password = DOM.loginPassword.value;
    const rememberWithBiometric = DOM.rememberBiometric.checked;
    
    if (!email || !password) {
        DOM.loginStatus.textContent = 'Please enter email and password';
        DOM.loginStatus.className = 'status-text error';
        return;
    }
    
    // Show loading state
    DOM.loginSubmitBtn.disabled = true;
    DOM.loginSubmitBtn.innerHTML = `
        <svg class="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" stroke-dasharray="60" stroke-dashoffset="20"/>
        </svg>
        Signing in...
    `;
    DOM.loginStatus.textContent = '';
    
    // Simulate authentication (in production, this would hit your API)
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Demo mode: Accept any valid-looking credentials
    if (email.includes('@') && password.length >= 1) {
        // Save credentials with biometrics if option is checked
        if (rememberWithBiometric && AppState.biometricAvailable && AppState.isMedianApp) {
            const saved = await saveCredentialsWithBiometrics(email, password);
            if (saved) {
                showToast(`Credentials saved with ${AppState.biometricType === 'faceId' ? 'Face ID' : 'Touch ID'}`);
            }
        }
        
        // Log security event
        logSecurityEvent('system', 'Password Login', 'User authenticated with email/password', 'Mobile Device');
        
        // Clear form
        DOM.loginForm.reset();
        
        // Unlock app
        unlockApp(email);
        showToast('Welcome to Atlas Systems');
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

function togglePasswordVisibility() {
    const isPassword = DOM.loginPassword.type === 'password';
    DOM.loginPassword.type = isPassword ? 'text' : 'password';
    DOM.eyeIcon.style.display = isPassword ? 'none' : 'block';
    DOM.eyeOffIcon.style.display = isPassword ? 'block' : 'none';
}

function switchToPasswordLogin() {
    showLoginForm();
    DOM.loginEmail.value = AppState.savedEmail || '';
    DOM.loginEmail.focus();
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
        
        // Update form fields
        DOM.userName.value = AppState.userProfile.name || '';
        DOM.userEmail.value = AppState.userProfile.email || AppState.savedEmail || '';
        DOM.userPhone.value = AppState.userProfile.phone || '';
        DOM.userAddress.value = AppState.userProfile.address || '';
        DOM.emergencyContact.value = AppState.userProfile.emergencyContact || '';
        
    } catch (error) {
        console.error('Load user data error:', error);
    }
}

async function saveUserProfile(e) {
    e.preventDefault();
    
    AppState.userProfile = {
        name: DOM.userName.value.trim(),
        email: DOM.userEmail.value.trim(),
        phone: DOM.userPhone.value.trim(),
        address: DOM.userAddress.value.trim(),
        emergencyContact: DOM.emergencyContact.value.trim()
    };
    
    try {
        const profileJson = JSON.stringify(AppState.userProfile);
        
        if (AppState.isMedianApp) {
            await median.datastore.set({
                key: 'atlas_user_profile',
                value: profileJson
            });
        }
        
        localStorage.setItem('atlas_user_profile', profileJson);
        
        updateGreeting();
        closeProfilePanel();
        showToast('Profile saved successfully');
        
    } catch (error) {
        console.error('Save profile error:', error);
        localStorage.setItem('atlas_user_profile', JSON.stringify(AppState.userProfile));
        showToast('Profile saved locally');
    }
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
        
        // Add demo data if empty
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
            await median.datastore.set({
                key: 'atlas_activities',
                value: activitiesJson
            });
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
        card.addEventListener('click', () => {
            openEditActivityModal(card.dataset.id);
        });
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
            AppState.activities[index] = {
                ...AppState.activities[index],
                type,
                title,
                content,
                location,
                updatedAt: now
            };
        }
        showToast('Event updated');
    } else {
        const newActivity = {
            id: generateId(),
            type,
            title,
            content,
            location,
            createdAt: now,
            updatedAt: now
        };
        AppState.activities.unshift(newActivity);
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
    DOM.profilePanel.classList.add('active');
}

function closeProfilePanel() {
    DOM.profilePanel.classList.remove('active');
}

// ============================================
// Push Notifications (OneSignal)
// ============================================

async function initPushNotifications() {
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
}

async function registerPushNotifications() {
    if (!AppState.isMedianApp) {
        showToast('Security alerts require Median app', 'error');
        return;
    }
    
    DOM.registerPushBtn.textContent = 'Enabling...';
    DOM.registerPushBtn.disabled = true;
    
    try {
        await median.onesignal.register();
        
        setTimeout(async () => {
            const info = await median.onesignal.info();
            
            if (info && info.oneSignalUserId) {
                AppState.pushRegistered = true;
                AppState.playerId = info.oneSignalUserId;
                
                DOM.pushPermission.textContent = 'Enabled';
                DOM.pushPermission.className = 'status-value granted';
                DOM.playerId.textContent = info.oneSignalUserId;
                DOM.registerPushBtn.textContent = 'Alerts Enabled';
                DOM.notificationBadge.classList.remove('hidden');
                
                logSecurityEvent('system', 'Push Alerts Enabled', 'Device registered for security notifications', 'Mobile Device');
                showToast('Security alerts enabled!');
            } else {
                DOM.registerPushBtn.textContent = 'Enable Security Alerts';
                DOM.registerPushBtn.disabled = false;
                showToast('Registration pending...', 'error');
            }
        }, 1500);
        
    } catch (error) {
        console.error('Push registration error:', error);
        DOM.registerPushBtn.textContent = 'Enable Security Alerts';
        DOM.registerPushBtn.disabled = false;
        
        if (error.message && error.message.includes('denied')) {
            DOM.pushPermission.textContent = 'Denied';
            DOM.pushPermission.className = 'status-value denied';
            showToast('Alert permission denied', 'error');
        } else {
            showToast('Failed to enable alerts', 'error');
        }
    }
}

function setupNotificationHandler() {
    if (!AppState.isMedianApp) return;
    
    try {
        median.onesignal.receive = function(data) {
            console.log('Security alert received:', data);
            
            logSecurityEvent(
                'motion',
                data.title || 'Security Alert',
                data.body || 'Alert received from Atlas Systems',
                'Push Notification'
            );
            
            showToast(`🚨 ${data.title || 'Security Alert'}`);
        };
    } catch (error) {
        console.error('Notification handler error:', error);
    }
}

// ============================================
// Notifications Panel
// ============================================

function openNotificationsPanel() {
    DOM.notificationsPanel.classList.add('active');
}

function closeNotificationsPanel() {
    DOM.notificationsPanel.classList.remove('active');
}

// ============================================
// Quick Actions
// ============================================

function toggleSystemArm() {
    AppState.systemArmed = !AppState.systemArmed;
    
    const status = AppState.systemArmed ? 'Armed' : 'Disarmed';
    DOM.systemStatus.textContent = status;
    DOM.systemStatus.className = `system-status ${AppState.systemArmed ? 'armed' : 'disarmed'}`;
    
    DOM.armBtn.querySelector('span').textContent = AppState.systemArmed ? 'Disarm' : 'Arm System';
    
    logSecurityEvent(
        'system',
        `System ${status}`,
        `Security system ${AppState.systemArmed ? 'activated' : 'deactivated'} manually`,
        'Control Panel'
    );
    
    showToast(`System ${status.toLowerCase()}`);
}

function showCamerasDemo() {
    showToast('Camera view coming soon');
}

function showHistoryDemo() {
    showToast('Full history coming soon');
}

// ============================================
// Event Listeners
// ============================================

function initEventListeners() {
    // Login Form
    DOM.loginForm.addEventListener('submit', handleLogin);
    DOM.togglePassword.addEventListener('click', togglePasswordVisibility);
    DOM.usePasswordBtn.addEventListener('click', switchToPasswordLogin);
    DOM.unlockBtn.addEventListener('click', authenticateWithBiometrics);
    
    // Dashboard
    DOM.lockBtn.addEventListener('click', lockApp);
    DOM.addNoteBtn.addEventListener('click', openAddActivityModal);
    DOM.notificationsBtn.addEventListener('click', openNotificationsPanel);
    DOM.profileBtn.addEventListener('click', openProfilePanel);
    
    // Quick Actions
    DOM.armBtn.addEventListener('click', toggleSystemArm);
    DOM.camerasBtn.addEventListener('click', showCamerasDemo);
    DOM.historyBtn.addEventListener('click', showHistoryDemo);
    
    // Activity Modal
    DOM.closeModalBtn.addEventListener('click', closeActivityModal);
    DOM.noteForm.addEventListener('submit', saveActivity);
    DOM.deleteNoteBtn.addEventListener('click', deleteActivity);
    
    // Profile Panel
    DOM.closeProfileBtn.addEventListener('click', closeProfilePanel);
    DOM.profileForm.addEventListener('submit', saveUserProfile);
    
    // Notifications Panel
    DOM.closePanelBtn.addEventListener('click', closeNotificationsPanel);
    DOM.registerPushBtn.addEventListener('click', registerPushNotifications);
    
    // Close on backdrop click
    DOM.noteModal.addEventListener('click', (e) => {
        if (e.target === DOM.noteModal) closeActivityModal();
    });
    
    DOM.notificationsPanel.addEventListener('click', (e) => {
        if (e.target === DOM.notificationsPanel) closeNotificationsPanel();
    });
    
    DOM.profilePanel.addEventListener('click', (e) => {
        if (e.target === DOM.profilePanel) closeProfilePanel();
    });
    
    // Keyboard
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (DOM.noteModal.classList.contains('active')) closeActivityModal();
            if (DOM.notificationsPanel.classList.contains('active')) closeNotificationsPanel();
            if (DOM.profilePanel.classList.contains('active')) closeProfilePanel();
        }
    });
}

// ============================================
// App Initialization
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
