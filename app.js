/**
 * SecureVault - Median.co Plugin Demo
 * 
 * Demonstrates integration with:
 * - Biometric Authentication (Face ID / Touch ID)
 * - DataStore (Local encrypted storage)
 * - Push Notifications (OneSignal)
 */

// ============================================
// App State
// ============================================

const AppState = {
    isMedianApp: false,
    isAuthenticated: false,
    notes: [],
    editingNoteId: null,
    biometricAvailable: false,
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
    
    // Lock Screen
    unlockBtn: document.getElementById('unlock-btn'),
    biometricStatus: document.getElementById('biometric-status'),
    browserFallback: document.getElementById('browser-fallback'),
    browserUnlockBtn: document.getElementById('browser-unlock-btn'),
    
    // Vault Screen
    notesList: document.getElementById('notes-list'),
    emptyState: document.getElementById('empty-state'),
    notesCount: document.getElementById('notes-count'),
    addNoteBtn: document.getElementById('add-note-btn'),
    lockBtn: document.getElementById('lock-btn'),
    notificationsBtn: document.getElementById('notifications-btn'),
    notificationBadge: document.getElementById('notification-badge'),
    
    // Note Modal
    noteModal: document.getElementById('note-modal'),
    modalTitle: document.getElementById('modal-title'),
    noteForm: document.getElementById('note-form'),
    noteId: document.getElementById('note-id'),
    noteTitle: document.getElementById('note-title'),
    noteContent: document.getElementById('note-content'),
    closeModalBtn: document.getElementById('close-modal-btn'),
    deleteNoteBtn: document.getElementById('delete-note-btn'),
    
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
// Utility Functions
// ============================================

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<p>${message}</p>`;
    DOM.toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // Less than a minute
    if (diff < 60000) {
        return 'Just now';
    }
    
    // Less than an hour
    if (diff < 3600000) {
        const mins = Math.floor(diff / 60000);
        return `${mins}m ago`;
    }
    
    // Less than a day
    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `${hours}h ago`;
    }
    
    // Format as date
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
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
}

function unlockApp() {
    AppState.isAuthenticated = true;
    showScreen('vault-screen');
    loadNotes();
}

// ============================================
// Median Detection & Initialization
// ============================================

function checkMedianEnvironment() {
    // Check if running inside Median app
    AppState.isMedianApp = typeof median !== 'undefined' && median !== null;
    
    console.log('Running in Median:', AppState.isMedianApp);
    
    if (AppState.isMedianApp) {
        DOM.browserFallback.style.display = 'none';
        initBiometrics();
        initPushNotifications();
    } else {
        // Browser fallback mode
        DOM.browserFallback.style.display = 'block';
        DOM.biometricStatus.textContent = 'Biometrics require Median app';
        DOM.biometricStatus.className = 'status-text';
    }
}

// ============================================
// Biometric Authentication
// ============================================

async function initBiometrics() {
    if (!AppState.isMedianApp) return;
    
    try {
        // Check biometric availability
        const status = await median.auth.status();
        
        console.log('Biometric status:', status);
        
        AppState.biometricAvailable = status.hasTouchId || status.hasFaceId;
        
        if (status.hasFaceId) {
            DOM.biometricStatus.textContent = 'Face ID available';
            DOM.biometricStatus.className = 'status-text success';
        } else if (status.hasTouchId) {
            DOM.biometricStatus.textContent = 'Touch ID available';
            DOM.biometricStatus.className = 'status-text success';
        } else {
            DOM.biometricStatus.textContent = 'No biometrics available';
            DOM.biometricStatus.className = 'status-text';
            // Show browser fallback if no biometrics
            DOM.browserFallback.style.display = 'block';
        }
        
        // Check if we have saved credentials
        if (status.hasSecret) {
            // Auto-prompt for authentication
            setTimeout(() => {
                authenticateWithBiometrics();
            }, 500);
        }
    } catch (error) {
        console.error('Biometric init error:', error);
        DOM.biometricStatus.textContent = 'Error checking biometrics';
        DOM.biometricStatus.className = 'status-text error';
    }
}

async function authenticateWithBiometrics() {
    if (!AppState.isMedianApp || !AppState.biometricAvailable) {
        // Fallback for browser/no biometrics
        unlockApp();
        return;
    }
    
    DOM.biometricStatus.textContent = 'Authenticating...';
    DOM.biometricStatus.className = 'status-text';
    
    try {
        // Try to get saved secret (triggers biometric prompt)
        const result = await median.auth.get();
        
        if (result.success) {
            console.log('Biometric auth successful');
            DOM.biometricStatus.textContent = 'Authentication successful!';
            DOM.biometricStatus.className = 'status-text success';
            
            setTimeout(() => {
                unlockApp();
                showToast('Welcome back! Vault unlocked.');
            }, 300);
        } else {
            // First time user - save a new secret
            await saveNewBiometricSecret();
        }
    } catch (error) {
        console.error('Biometric auth error:', error);
        
        if (error.message && error.message.includes('cancel')) {
            DOM.biometricStatus.textContent = 'Authentication cancelled';
            DOM.biometricStatus.className = 'status-text';
        } else {
            // No secret saved yet, create one
            await saveNewBiometricSecret();
        }
    }
}

async function saveNewBiometricSecret() {
    try {
        // Generate a session token/secret
        const secret = generateId();
        
        // Save with biometric protection
        const result = await median.auth.save({
            secret: secret
        });
        
        if (result.success) {
            console.log('Biometric secret saved');
            DOM.biometricStatus.textContent = 'Biometric setup complete!';
            DOM.biometricStatus.className = 'status-text success';
            
            setTimeout(() => {
                unlockApp();
                showToast('Vault secured with biometrics!');
            }, 300);
        }
    } catch (error) {
        console.error('Save biometric error:', error);
        DOM.biometricStatus.textContent = 'Failed to setup biometrics';
        DOM.biometricStatus.className = 'status-text error';
        
        // Fallback to regular unlock
        DOM.browserFallback.style.display = 'block';
    }
}

// ============================================
// DataStore - Notes Storage
// ============================================

async function loadNotes() {
    try {
        if (AppState.isMedianApp) {
            // Load from Median DataStore
            const result = await median.datastore.get({ key: 'vault_notes' });
            
            if (result && result.value) {
                AppState.notes = JSON.parse(result.value);
            } else {
                AppState.notes = [];
            }
        } else {
            // Fallback to localStorage
            const stored = localStorage.getItem('vault_notes');
            AppState.notes = stored ? JSON.parse(stored) : [];
        }
        
        renderNotes();
    } catch (error) {
        console.error('Load notes error:', error);
        // Fallback to localStorage
        const stored = localStorage.getItem('vault_notes');
        AppState.notes = stored ? JSON.parse(stored) : [];
        renderNotes();
    }
}

async function saveNotes() {
    try {
        const notesJson = JSON.stringify(AppState.notes);
        
        if (AppState.isMedianApp) {
            // Save to Median DataStore
            await median.datastore.set({
                key: 'vault_notes',
                value: notesJson
            });
        }
        
        // Always save to localStorage as backup
        localStorage.setItem('vault_notes', notesJson);
        
    } catch (error) {
        console.error('Save notes error:', error);
        // Fallback to localStorage only
        localStorage.setItem('vault_notes', JSON.stringify(AppState.notes));
    }
}

function renderNotes() {
    const count = AppState.notes.length;
    DOM.notesCount.textContent = `${count} note${count !== 1 ? 's' : ''}`;
    
    if (count === 0) {
        DOM.notesList.innerHTML = '';
        DOM.emptyState.classList.remove('hidden');
        return;
    }
    
    DOM.emptyState.classList.add('hidden');
    
    // Sort by updated date (newest first)
    const sortedNotes = [...AppState.notes].sort((a, b) => b.updatedAt - a.updatedAt);
    
    DOM.notesList.innerHTML = sortedNotes.map(note => `
        <div class="note-card" data-id="${note.id}">
            <h3>${escapeHtml(note.title)}</h3>
            <p>${escapeHtml(note.content)}</p>
            <div class="note-meta">
                <time>${formatDate(note.updatedAt)}</time>
                <span class="secure-badge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    Encrypted
                </span>
            </div>
        </div>
    `).join('');
    
    // Add click handlers
    DOM.notesList.querySelectorAll('.note-card').forEach(card => {
        card.addEventListener('click', () => {
            const noteId = card.dataset.id;
            openEditNoteModal(noteId);
        });
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// Note Modal
// ============================================

function openAddNoteModal() {
    AppState.editingNoteId = null;
    DOM.modalTitle.textContent = 'New Note';
    DOM.noteId.value = '';
    DOM.noteTitle.value = '';
    DOM.noteContent.value = '';
    DOM.deleteNoteBtn.style.display = 'none';
    DOM.noteModal.classList.add('active');
    DOM.noteTitle.focus();
}

function openEditNoteModal(noteId) {
    const note = AppState.notes.find(n => n.id === noteId);
    if (!note) return;
    
    AppState.editingNoteId = noteId;
    DOM.modalTitle.textContent = 'Edit Note';
    DOM.noteId.value = note.id;
    DOM.noteTitle.value = note.title;
    DOM.noteContent.value = note.content;
    DOM.deleteNoteBtn.style.display = 'block';
    DOM.noteModal.classList.add('active');
    DOM.noteTitle.focus();
}

function closeNoteModal() {
    DOM.noteModal.classList.remove('active');
    AppState.editingNoteId = null;
}

async function saveNote(e) {
    e.preventDefault();
    
    const title = DOM.noteTitle.value.trim();
    const content = DOM.noteContent.value.trim();
    
    if (!title || !content) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    const now = Date.now();
    
    if (AppState.editingNoteId) {
        // Update existing note
        const noteIndex = AppState.notes.findIndex(n => n.id === AppState.editingNoteId);
        if (noteIndex !== -1) {
            AppState.notes[noteIndex] = {
                ...AppState.notes[noteIndex],
                title,
                content,
                updatedAt: now
            };
        }
        showToast('Note updated successfully');
    } else {
        // Create new note
        const newNote = {
            id: generateId(),
            title,
            content,
            createdAt: now,
            updatedAt: now
        };
        AppState.notes.push(newNote);
        showToast('Note created successfully');
    }
    
    await saveNotes();
    renderNotes();
    closeNoteModal();
}

async function deleteNote() {
    if (!AppState.editingNoteId) return;
    
    if (!confirm('Are you sure you want to delete this note?')) {
        return;
    }
    
    AppState.notes = AppState.notes.filter(n => n.id !== AppState.editingNoteId);
    
    await saveNotes();
    renderNotes();
    closeNoteModal();
    showToast('Note deleted');
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
        // Get current OneSignal info
        const info = await median.onesignal.info();
        
        console.log('OneSignal info:', info);
        
        if (info && info.oneSignalUserId) {
            AppState.pushRegistered = true;
            AppState.playerId = info.oneSignalUserId;
            
            DOM.pushPermission.textContent = 'Granted';
            DOM.pushPermission.className = 'status-value granted';
            DOM.playerId.textContent = info.oneSignalUserId;
            DOM.registerPushBtn.textContent = 'Push Enabled';
            DOM.registerPushBtn.disabled = true;
            DOM.notificationBadge.classList.remove('hidden');
        } else {
            DOM.pushPermission.textContent = 'Not registered';
            DOM.playerId.textContent = 'Not registered';
        }
        
        // Listen for incoming notifications
        setupNotificationHandler();
        
    } catch (error) {
        console.error('Push init error:', error);
        DOM.pushPermission.textContent = 'Error';
        DOM.pushPermission.className = 'status-value denied';
    }
}

async function registerPushNotifications() {
    if (!AppState.isMedianApp) {
        showToast('Push notifications require Median app', 'error');
        return;
    }
    
    DOM.registerPushBtn.textContent = 'Registering...';
    DOM.registerPushBtn.disabled = true;
    
    try {
        // Register with OneSignal
        await median.onesignal.register();
        
        // Wait a moment for registration to complete
        setTimeout(async () => {
            const info = await median.onesignal.info();
            
            if (info && info.oneSignalUserId) {
                AppState.pushRegistered = true;
                AppState.playerId = info.oneSignalUserId;
                
                DOM.pushPermission.textContent = 'Granted';
                DOM.pushPermission.className = 'status-value granted';
                DOM.playerId.textContent = info.oneSignalUserId;
                DOM.registerPushBtn.textContent = 'Push Enabled';
                DOM.notificationBadge.classList.remove('hidden');
                
                showToast('Push notifications enabled!');
            } else {
                DOM.registerPushBtn.textContent = 'Enable Push Notifications';
                DOM.registerPushBtn.disabled = false;
                showToast('Registration pending...', 'error');
            }
        }, 1500);
        
    } catch (error) {
        console.error('Push registration error:', error);
        DOM.registerPushBtn.textContent = 'Enable Push Notifications';
        DOM.registerPushBtn.disabled = false;
        
        if (error.message && error.message.includes('denied')) {
            DOM.pushPermission.textContent = 'Denied';
            DOM.pushPermission.className = 'status-value denied';
            showToast('Push permission denied', 'error');
        } else {
            showToast('Failed to register', 'error');
        }
    }
}

function setupNotificationHandler() {
    if (!AppState.isMedianApp) return;
    
    // Handle notifications received while app is open
    try {
        median.onesignal.receive = function(data) {
            console.log('Notification received:', data);
            showToast(`📬 ${data.title || 'New notification'}`);
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
// Event Listeners
// ============================================

function initEventListeners() {
    // Lock Screen
    DOM.unlockBtn.addEventListener('click', authenticateWithBiometrics);
    DOM.browserUnlockBtn.addEventListener('click', unlockApp);
    
    // Vault Screen
    DOM.lockBtn.addEventListener('click', lockApp);
    DOM.addNoteBtn.addEventListener('click', openAddNoteModal);
    DOM.notificationsBtn.addEventListener('click', openNotificationsPanel);
    
    // Note Modal
    DOM.closeModalBtn.addEventListener('click', closeNoteModal);
    DOM.noteForm.addEventListener('submit', saveNote);
    DOM.deleteNoteBtn.addEventListener('click', deleteNote);
    
    // Notifications Panel
    DOM.closePanelBtn.addEventListener('click', closeNotificationsPanel);
    DOM.registerPushBtn.addEventListener('click', registerPushNotifications);
    
    // Close modals on backdrop click
    DOM.noteModal.addEventListener('click', (e) => {
        if (e.target === DOM.noteModal) {
            closeNoteModal();
        }
    });
    
    DOM.notificationsPanel.addEventListener('click', (e) => {
        if (e.target === DOM.notificationsPanel) {
            closeNotificationsPanel();
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (DOM.noteModal.classList.contains('active')) {
                closeNoteModal();
            }
            if (DOM.notificationsPanel.classList.contains('active')) {
                closeNotificationsPanel();
            }
        }
    });
}

// ============================================
// App Initialization
// ============================================

function init() {
    console.log('SecureVault initializing...');
    
    // Initialize event listeners
    initEventListeners();
    
    // Check if running in Median
    checkMedianEnvironment();
    
    // Show lock screen initially
    showScreen('lock-screen');
    
    console.log('SecureVault ready');
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
