// ============================================
// 📦 FILE: script.js - FINANCIAL MASTERPLAN PRO
// ============================================

// ========== 🎯 VARIABEL GLOBAL ==========
let expenses = [];
let incomeRecords = [];
let appSettings = {
    targetAmount: 300000000,
    timelineYears: 3
};
let currentTimeline = {
    startDate: null,
    endDate: null,
    totalDays: 0,
    createdAt: null,
    lastUpdated: null
};
let currentView = 'dashboard';
let selectedCategory = 'keluarga';
let expenseChart = null;
let monthlyTrendChart = null;
let progressChart = null;
let incomeChart = null;
let checklistItems = JSON.parse(localStorage.getItem('financial_checklist') || '[]');

// ========== ⏰ SISTEM TIMELINE BARU ==========
// ⭐⭐ LETAKKAN INI SEBELUM fungsi initializeApp() ⭐⭐

function initTimelineSystem() {
    console.log("⏰ Initializing New Timeline System...");
    
    // Load dari localStorage
    const savedTimeline = localStorage.getItem('financial_timeline');
    
    if (savedTimeline) {
        try {
            currentTimeline = JSON.parse(savedTimeline);
            console.log("✅ Timeline loaded:", currentTimeline);
        } catch (e) {
            console.warn("❌ Error loading timeline, creating default");
            createDefaultTimeline();
        }
    } else {
        console.log("📅 No saved timeline, creating default");
        createDefaultTimeline();
    }
    
    // ⭐⭐ VALIDASI: Pastikan endDate ada ⭐⭐
    if (!currentTimeline.endDate) {
        console.warn("⚠️ Timeline missing endDate, recreating...");
        createDefaultTimeline();
    }
    
    console.log("🎯 Final timeline:", currentTimeline);
    
    return currentTimeline;
}

function actuallyInitTimeline() {
    console.log("🏗️ DOM ready, initializing timeline...");
    
    // 1. Load dari localStorage
    const savedTimeline = localStorage.getItem('financial_timeline');
    
    if (savedTimeline) {
        try {
            currentTimeline = JSON.parse(savedTimeline);
            console.log("✅ Timeline loaded:", currentTimeline);
        } catch (e) {
            console.warn("❌ Error loading timeline, creating default");
            createDefaultTimeline();
        }
    } else {
        createDefaultTimeline();
    }
    
    // 2. Setup event listeners untuk input
    setupTimelineInputListeners();
    
    // 3. Update UI
    updateTimelineUI();
    
    console.log("🎯 Timeline system ready");
}

function createDefaultTimeline() {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setFullYear(endDate.getFullYear() + 3);
    
    currentTimeline = {
        startDate: today.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        totalDays: calculateTotalDays(today, endDate),
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
    };
    
    saveTimelineToStorage();
    console.log("📅 Default timeline created");
}

function calculateTotalDays(startDate, endDate) {
    try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        
        const diffMs = end - start;
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        
        return Math.max(0, diffDays);
    } catch (e) {
        console.error("Error in calculateTotalDays:", e);
        return 0;
    }
}

function calculateRemainingDays() {
    // ⭐⭐ VALIDASI DULU ⭐⭐
    if (!currentTimeline || !currentTimeline.endDate) {
        console.warn("⚠️ [calculateRemainingDays] No timeline end date");
        return 1095; // Default 3 tahun dalam hari
    }
    
    const end = new Date(currentTimeline.endDate);
    const now = new Date();
    
    // Reset ke midnight
    end.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    
    const diffMs = end - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
}

function calculateTimelineProgress() {
    if (!currentTimeline.startDate || !currentTimeline.endDate) return 0;
    
    const start = new Date(currentTimeline.startDate);
    const end = new Date(currentTimeline.endDate);
    const now = new Date();
    
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    
    const totalMs = end - start;
    const passedMs = now - start;
    
    if (totalMs <= 0) return 100;
    return Math.min(100, Math.max(0, (passedMs / totalMs) * 100));
}

function saveTimelineToStorage() {
    localStorage.setItem('financial_timeline', JSON.stringify(currentTimeline));
    console.log("💾 Timeline saved to storage");
}

// ⭐⭐⭐ FUNGSI UTAMA SAVE TIMELINE ⭐⭐⭐
function saveTimeline() {
    console.log("💾 saveTimeline() called");
    
    // METHOD 1: Cari element dengan cara yang lebih robust
    let startInput, endInput;
    
    // Coba beberapa cara untuk dapatkan element
    startInput = document.getElementById('start-date');
    endInput = document.getElementById('end-date');
    
    // Jika tidak ketemu dengan getElementById, coba querySelector
    if (!startInput) startInput = document.querySelector('input#start-date');
    if (!endInput) endInput = document.querySelector('input#end-date');
    
    // Jika masih tidak ketemu, coba cari di tab settings
    if (!startInput || !endInput) {
        const settingsTab = document.getElementById('tab-settings');
        if (settingsTab) {
            if (!startInput) startInput = settingsTab.querySelector('#start-date');
            if (!endInput) endInput = settingsTab.querySelector('#end-date');
        }
    }
    
    // ⭐⭐ DEBUG: Tampilkan apa yang ditemukan ⭐⭐
    console.log("🔍 Element search results:", {
        startInput: startInput,
        endInput: endInput,
        startValue: startInput ? startInput.value : 'NOT FOUND',
        endValue: endInput ? endInput.value : 'NOT FOUND'
    });
    
    // ⭐⭐ VALIDASI: Jika element tidak ditemukan ⭐⭐
    if (!startInput || !endInput) {
        const errorMsg = `❌ Timeline input elements not found!\n` +
                        `Looking for: #start-date, #end-date\n` +
                        `Current tab: ${currentView}\n` +
                        `DOM ready: ${document.readyState}`;
        
        console.error(errorMsg);
        
        // Coba buka tab settings dulu
        if (currentView !== 'settings') {
            showTab('settings');
            setTimeout(saveTimeline, 500); // Coba lagi setelah 500ms
            return;
        }
        
        showAlert('error', 'Form timeline tidak ditemukan. Coba refresh halaman atau buka tab Settings dulu.');
        return;
    }
    
    // ⭐⭐ VALIDASI INPUT ⭐⭐
    if (!startInput.value || !endInput.value) {
        showAlert('warning', 'Harap isi tanggal mulai dan tanggal target');
        return;
    }
    
    const start = new Date(startInput.value);
    const end = new Date(endInput.value);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        showAlert('warning', 'Format tanggal tidak valid');
        return;
    }
    
    if (end <= start) {
        showAlert('warning', 'Tanggal target harus setelah tanggal mulai');
        return;
    }
    
    // ⭐⭐ SIMPAN DATA ⭐⭐
    currentTimeline.startDate = startInput.value;
    currentTimeline.endDate = endInput.value;
    currentTimeline.totalDays = calculateTotalDays(startInput.value, endInput.value);
    currentTimeline.lastUpdated = new Date().toISOString();
    
    localStorage.setItem('financial_timeline', JSON.stringify(currentTimeline));
    
    console.log("✅ Timeline saved:", currentTimeline);
    
    // ⭐⭐ UPDATE UI ⭐⭐
    updateHeaderRemainingDays();
    updateTimelineDisplay();
    
    showAlert('success', 
        `Timeline disimpan!\n` +
        `Mulai: ${formatDate(currentTimeline.startDate)}\n` +
        `Target: ${formatDate(currentTimeline.endDate)}\n` +
        `Total: ${currentTimeline.totalDays} hari`
    );
    
    // Update dashboard
    updateDashboard();
}


function updateTimelineUI() {
    console.log("🔄 Updating timeline UI...");
    
    // Tunggu sedikit untuk pastikan DOM ready
    setTimeout(() => {
        const startInput = document.getElementById('start-date');
        const endInput = document.getElementById('end-date');
        
        if (startInput && currentTimeline.startDate) {
            startInput.value = currentTimeline.startDate;
            console.log("✅ Set start-date to:", currentTimeline.startDate);
        }
        
        if (endInput && currentTimeline.endDate) {
            endInput.value = currentTimeline.endDate;
            console.log("✅ Set end-date to:", currentTimeline.endDate);
        }
        
        // Update display
        updateTimelineDisplay();
        
    }, 100);
}


function updateTimelineDisplay() {
    console.log("🔄 [updateTimelineDisplay] START");
    
    // Gunakan setTimeout untuk pastikan DOM ready
    setTimeout(() => {
        try {
            // ===== 1. GET ELEMENTS DENGAN SAFETY CHECK =====
            const startDisplayEl = document.getElementById('display-start-date');
            const endDisplayEl = document.getElementById('display-end-date');
            const daysDisplayEl = document.getElementById('display-days-left');
            const progressDisplayEl = document.getElementById('display-timeline-progress');
            
            console.log("🔍 [updateTimelineDisplay] Elements found:", {
                startDisplay: !!startDisplayEl,
                endDisplay: !!endDisplayEl,
                daysDisplay: !!daysDisplayEl,
                progressDisplay: !!progressDisplayEl
            });
            
            // ===== 2. VALIDASI DATA TIMELINE =====
            if (!currentTimeline || !currentTimeline.startDate || !currentTimeline.endDate) {
                console.warn("⚠️ [updateTimelineDisplay] Timeline data incomplete:", currentTimeline);
                
                // Set default values jika data tidak ada
                if (startDisplayEl) startDisplayEl.textContent = '-';
                if (endDisplayEl) endDisplayEl.textContent = '-';
                if (daysDisplayEl) daysDisplayEl.textContent = '0';
                if (progressDisplayEl) progressDisplayEl.textContent = '0%';
                
                return;
            }
            
            // ===== 3. HITUNG VALUES =====
            const daysLeft = calculateRemainingDays();
            const progress = calculateTimelineProgress();
            
            console.log("📊 [updateTimelineDisplay] Calculated values:", {
                daysLeft: daysLeft,
                progress: progress
            });
            
            // ===== 4. UPDATE ELEMENTS (DENGAN VALIDASI) =====
            // Start Date
            if (startDisplayEl) {
                try {
                    startDisplayEl.textContent = formatDate(currentTimeline.startDate);
                } catch (e) {
                    console.error("❌ Error updating start date:", e);
                    startDisplayEl.textContent = currentTimeline.startDate;
                }
            }
            
            // End Date
            if (endDisplayEl) {
                try {
                    endDisplayEl.textContent = formatDate(currentTimeline.endDate);
                } catch (e) {
                    console.error("❌ Error updating end date:", e);
                    endDisplayEl.textContent = currentTimeline.endDate;
                }
            }
            
            // Days Left
            if (daysDisplayEl) {
                daysDisplayEl.textContent = daysLeft;
                
                // Warna berdasarkan urgency
                if (daysLeft > 365) {
                    daysDisplayEl.style.color = '#2ecc71';
                } else if (daysLeft > 180) {
                    daysDisplayEl.style.color = '#f39c12';
                } else if (daysLeft > 90) {
                    daysDisplayEl.style.color = '#e67e22';
                } else {
                    daysDisplayEl.style.color = '#e74c3c';
                }
            }
            
            // Progress
            if (progressDisplayEl) {
                progressDisplayEl.textContent = progress.toFixed(1) + '%';
                
                // Warna berdasarkan progress
                if (progress >= 100) {
                    progressDisplayEl.style.color = '#2ecc71';
                } else if (progress >= 75) {
                    progressDisplayEl.style.color = '#27ae60';
                } else if (progress >= 50) {
                    progressDisplayEl.style.color = '#f39c12';
                } else if (progress >= 25) {
                    progressDisplayEl.style.color = '#3498db';
                } else {
                    progressDisplayEl.style.color = '#e74c3c';
                }
            }
            
            console.log("✅ [updateTimelineDisplay] COMPLETED");
            
        } catch (error) {
            console.error("❌ [updateTimelineDisplay] CRITICAL ERROR:", error);
            
            // Emergency fallback
            try {
                const daysEl = document.getElementById('display-days-left');
                if (daysEl) daysEl.textContent = 'Error';
            } catch (e) {
                console.error("Even fallback failed:", e);
            }
        }
    }, 100); // Delay untuk pastikan DOM siap
}

function updateTimelinePreview() {
    const daysLeft = calculateRemainingDays();
    const progress = calculateTimelineProgress();
    const totalDays = currentTimeline.totalDays || 0;
    
    // Format durasi
    let durationText = '';
    if (totalDays >= 365) {
        const years = Math.floor(totalDays / 365);
        const months = Math.floor((totalDays % 365) / 30);
        durationText = `${years} tahun`;
        if (months > 0) durationText += ` ${months} bulan`;
    } else if (totalDays >= 30) {
        const months = Math.floor(totalDays / 30);
        const days = totalDays % 30;
        durationText = `${months} bulan`;
        if (days > 0) durationText += ` ${days} hari`;
    } else {
        durationText = `${totalDays} hari`;
    }
    
    // Update elements
    const elements = {
        'preview-duration': durationText,
        'preview-days-left': daysLeft,
        'preview-progress': progress.toFixed(1) + '%'
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    });
}

// ⭐⭐⭐ HELPER FUNCTIONS ⭐⭐⭐
function setQuickTimeline(years) {
    const today = new Date();
    const startDate = new Date(today);
    const endDate = new Date(today);
    
    // Mulai dari hari ini
    startDate.setDate(today.getDate());
    endDate.setFullYear(today.getFullYear() + years);
    
    document.getElementById('start-date').value = startDate.toISOString().split('T')[0];
    document.getElementById('end-date').value = endDate.toISOString().split('T')[0];
    
    // Validasi
    validateTimelineInput();
}

function setQuickTimelineFromToday() {
    const today = new Date();
    document.getElementById('start-date').value = today.toISOString().split('T')[0];
    
    // Auto-set 3 tahun dari sekarang
    const endDate = new Date(today);
    endDate.setFullYear(endDate.getFullYear() + 3);
    document.getElementById('end-date').value = endDate.toISOString().split('T')[0];
    
    validateTimelineInput();
}

function validateTimelineInput() {
    const startInput = document.getElementById('start-date');
    const endInput = document.getElementById('end-date');
    const validationDiv = document.getElementById('timeline-validation');
    
    if (!startInput || !endInput || !validationDiv) return;
    
    if (!startInput.value || !endInput.value) {
        validationDiv.style.display = 'none';
        return;
    }
    
    const start = new Date(startInput.value);
    const end = new Date(endInput.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let message = '';
    let type = 'info';
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        message = '❌ Format tanggal tidak valid';
        type = 'error';
    } else if (end <= start) {
        message = '❌ Tanggal target harus setelah tanggal mulai';
        type = 'error';
    } else if (start > today) {
        message = '⚠️ Tanggal mulai di masa depan';
        type = 'warning';
    } else {
        const totalDays = calculateTotalDays(startInput.value, endInput.value);
        const years = Math.floor(totalDays / 365);
        const months = Math.floor((totalDays % 365) / 30);
        
        let durationText = '';
        if (years > 0) {
            durationText = `${years} tahun`;
            if (months > 0) durationText += ` ${months} bulan`;
        } else {
            durationText = `${totalDays} hari`;
        }
        
        message = `✅ Durasi: ${durationText}`;
        type = 'success';
    }
    
    validationDiv.innerHTML = message;
    validationDiv.style.display = 'block';
    validationDiv.className = `timeline-validation timeline-${type}`;
}


function resetToDefaultTimeline() {
    if (!confirm('Reset timeline ke default (3 tahun dari hari ini)?')) return;
    
    createDefaultTimeline();
    updateTimelineUI();
    updateTimelinePreview();
    updateHeaderRemainingDays();
    
    showAlert('success', 'Timeline direset ke 3 tahun dari hari ini');
}

// Event listeners untuk real-time validation
document.addEventListener('DOMContentLoaded', function() {
    const startInput = document.getElementById('start-date');
    const endInput = document.getElementById('end-date');
    
    if (startInput) {
        startInput.addEventListener('change', validateTimelineInput);
    }
    if (endInput) {
        endInput.addEventListener('change', validateTimelineInput);
    }
});

// ========== SERVICE WORKER REGISTRATION (FIXED) ==========
function initServiceWorker() {
    if (!('serviceWorker' in navigator)) {
        console.log('❌ Service Worker not supported');
        return;
    }
    
    window.addEventListener('load', () => {
        // Register Service Worker
        navigator.serviceWorker.register('/financial-app/service-worker.js')
            .then(registration => {
                console.log('✅ Service Worker registered:', registration.scope);
                setupSWUpdates(registration);
                setupBackgroundSync();
            })
            .catch(error => {
                console.error('❌ Service Worker registration failed:', error);
            });
    });
}

function setupSWUpdates(registration) {
    // Check for updates
    registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('🔄 Service Worker update found!');
        
        newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('🔄 New content available!');
                showUpdateNotification();
            }
        });
    });
}

function setupBackgroundSync() {
    // Background Sync
    navigator.serviceWorker.ready
        .then(registration => {
            if ('sync' in registration) {
                return registration.sync.register('sync-financial-data');
            }
            return Promise.reject('Sync API not available');
        })
        .then(() => console.log('✅ Background sync registered'))
        .catch(err => console.log('⚠️ Background sync:', err));
}

function showUpdateNotification() {
    if (confirm('🔄 Update tersedia! Muat ulang aplikasi?')) {
        window.location.reload();
    }
}

// Check for updates periodically
function checkForUpdates() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration()
            .then(registration => registration?.update())
            .catch(console.error);
    }
}

// Initialize
initServiceWorker();
setInterval(checkForUpdates, 24 * 60 * 60 * 1000);
// ========== 🏠 FUNGSI INISIALISASI ==========
// ⭐⭐ REPLACE seluruh initializeApp() dengan ini: ⭐⭐
function initializeApp() {
    console.log('🚀 Financial Masterplan PRO - Initializing...');
    
    // ⭐⭐ CEK JIKA SUDAH DI-INITIALIZE ⭐⭐
    if (window.appInitialized) {
        console.log('⚠️ App sudah di-init, skip...');
        return;
    }
    
    try {
        // 1. Mark as initialized
        window.appInitialized = true;
        
        // 2. Inisialisasi timeline system
        initTimelineSystem();
        
        // 3. Load data lainnya
        loadFromLocalStorage();
        
        // 4. Setup event listeners
        setupEventListeners();
        
        // 5. Set tanggal default untuk form
        const today = new Date().toISOString().split('T')[0];
        const expenseDateInput = document.getElementById('expense-date');
        const incomeDateInput = document.getElementById('income-date');
        
        if (expenseDateInput) expenseDateInput.value = today;
        if (incomeDateInput) incomeDateInput.value = today;
        
        // 6. Update UI awal
        updateDashboard();
        showTab('dashboard');
        
        // 7. Setup charts - HAPUS TIMEOUT, langsung jalankan
        if (document.getElementById('expenseChart')) {
            updateExpenseChart();
        }
        
        // 8. Update header
        updateHeaderTarget();
        
        // 9. Setup daily checker
        setupDailyChecker();
        
        console.log('✅ Aplikasi siap digunakan!');
        
    } catch (error) {
        console.error('❌ Error during initialization:', error);
        // Jangan alert, bisa ganggu UX
    }
}

function safeSaveTimeline() {
    console.log("🛡️ [safeSaveTimeline] START - Current tab:", currentView);
    
    // Jika belum di tab settings, buka dulu
    if (currentView !== 'settings') {
        console.log("📂 [safeSaveTimeline] Opening settings tab first...");
        showTab('settings');
        
        // Tunggu tab render, lalu save
        setTimeout(() => {
            console.log("⏳ [safeSaveTimeline] Now executing saveTimeline()...");
            saveTimeline();
        }, 400); // 400ms cukup untuk DOM render
        
        return;
    }
    
    // Jika sudah di settings, save langsung
    console.log("✅ [safeSaveTimeline] Already in settings, saving directly");
    saveTimeline();
}

// Safe wrapper untuk saveSettings
function safeSaveSettings() {
    console.log("🛡️ [safeSaveSettings] SIMPLE VERSION");
    
    // Cek apakah di tab settings
    if (currentView !== 'settings') {
        console.log("📂 Opening settings tab...");
        
        // Buka tab settings
        showTab('settings');
        
        // Tunggu 500ms lalu save
        setTimeout(() => {
            console.log("⏰ Now saving...");
            saveSettings();
        }, 500);
        
        return;
    }
    
    // Jika sudah di settings, save langsung
    console.log("✅ Already in settings, saving...");
    saveSettings();
}

function actuallyInitializeApp() {
    console.log('🚀 Financial Masterplan PRO - Initializing...');
    
    try {
        // 1. Load data dari localStorage
        loadFromLocalStorage();
        
        // 2. Setup event listeners
        setupEventListeners();
        
        // 3. Set tanggal default untuk form
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('expense-date').value = today;
        document.getElementById('income-date').value = today;
        
        // 4. Update UI awal
        updateDashboard(); // ⭐ INI SUDAH include updateHeaderRemainingDays()
        showTab('dashboard');
        
        // 5. Setup chart setelah delay (pastikan DOM ready)
        setTimeout(() => {
            console.log('🎨 Initializing charts...');
            updateExpenseChart();
        }, 100);
        
        // 6. ⭐⭐ SETUP DAILY CHECKER (untuk update otomatis) ⭐⭐
        setupDailyChecker();
        
        console.log('✅ Aplikasi siap digunakan!');
        
    } catch (error) {
        console.error('❌ Error during initialization:', error);
        alert("Terjadi kesalahan inisialisasi. Buka console untuk detail.");
    }
}

// ===== SIMPLE TIMELINE SYSTEM =====
const timeline = {
    startDate: null,
    endDate: null,
    mode: 'fixed' // 'fixed' atau 'dynamic'
};

function initTimeline() {
    console.log("⏰ Initializing Simple Timeline...");
    
    // Load dari localStorage
    const saved = localStorage.getItem('timelineData');
    if (saved) {
        Object.assign(timeline, JSON.parse(saved));
    } else {
        // Default: 3 tahun dari hari ini
        const today = new Date();
        const endDate = new Date(today);
        endDate.setFullYear(endDate.getFullYear() + 3);
        
        timeline.startDate = today.toISOString().split('T')[0];
        timeline.endDate = endDate.toISOString().split('T')[0];
        timeline.mode = 'fixed';
        
        saveTimelineData();
    }
    
    // Update UI
    updateTimelineUI();
    updateCountdown();
}

function saveTimelineData() {
    localStorage.setItem('timelineData', JSON.stringify(timeline));
}

function calculateDaysLeft() {
    if (!timeline.endDate) return 0;
    
    const end = new Date(timeline.endDate);
    const now = new Date();
    
    // Reset ke midnight
    end.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    
    const diffMs = end - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
}

function calculateProgress() {
    if (!timeline.startDate || !timeline.endDate) return 0;
    
    const start = new Date(timeline.startDate);
    const end = new Date(timeline.endDate);
    const now = new Date();
    
    const totalMs = end - start;
    const passedMs = now - start;
    
    return totalMs > 0 ? Math.min(100, Math.max(0, (passedMs / totalMs * 100))) : 0;
}

function updateCountdown() {
    const daysLeft = calculateDaysLeft();
    const progress = calculateProgress();
    
    // Update header
    const daysEl = document.getElementById('days-left');
    const targetEl = document.getElementById('target-date-display');
    
    if (daysEl) {
        daysEl.textContent = daysLeft;
        
        // Simple color coding
        if (daysLeft <= 30) daysEl.style.color = '#e74c3c';
        else if (daysLeft <= 90) daysEl.style.color = '#f39c12';
        else daysEl.style.color = '#27ae60';
    }
    
    if (targetEl && timeline.endDate) {
        targetEl.textContent = `Target: ${formatDate(timeline.endDate)}`;
    }
    
    // Update progress bar
    const progressBar = document.getElementById('main-progress-bar');
    const progressText = document.getElementById('main-progress-text');
    
    if (progressBar) {
        progressBar.style.width = progress + '%';
    }
    
    if (progressText) {
        progressText.textContent = progress.toFixed(1) + '%';
    }
    
    console.log(`⏰ Timeline: ${daysLeft} days left, ${progress.toFixed(1)}% progress`);
}

function saveTimeline() {
    console.log("💾 [saveTimeline] START - Current tab:", currentView);
    
    // ===== 1. VALIDASI TAB AKTIF =====
    const settingsTab = document.getElementById('tab-settings');
    const isSettingsActive = settingsTab && settingsTab.classList.contains('active');
    
    if (!isSettingsActive) {
        console.error("❌ [saveTimeline] ERROR: Called from wrong tab!");
        console.log("   Current tab ID:", currentView);
        console.log("   Settings tab active?", isSettingsActive);
        
        // Auto-correct: Redirect to safe version
        console.log("   ↳ Redirecting to safeSaveTimeline()...");
        safeSaveTimeline();
        return;
    }
    
    // ===== 2. GET INPUT ELEMENTS DENGAN MULTIPLE METHODS =====
    let startInput, endInput;
    
    // Method 1: Direct getElementById (primary)
    startInput = document.getElementById('start-date');
    endInput = document.getElementById('end-date');
    
    // Method 2: Query within settings tab (fallback)
    if (!startInput || !endInput) {
        console.warn("⚠️ [saveTimeline] Inputs not found by ID, trying querySelector...");
        startInput = document.querySelector('input#start-date');
        endInput = document.querySelector('input#end-date');
    }
    
    // Method 3: Force search in settings tab
    if (!startInput || !endInput) {
        if (settingsTab) {
            console.warn("⚠️ [saveTimeline] Searching within settings tab...");
            startInput = settingsTab.querySelector('#start-date');
            endInput = settingsTab.querySelector('#end-date');
        }
    }
    
    // ===== 3. VALIDASI ELEMENTS =====
    if (!startInput || !endInput) {
        const errorDetails = {
            startInput: startInput,
            endInput: endInput,
            settingsTab: settingsTab,
            tabContent: document.querySelector('.tab-content.active')?.id
        };
        
        console.error("❌ [saveTimeline] CRITICAL: Input elements not found!", errorDetails);
        
        // Emergency fix: Try again after delay
        setTimeout(() => {
            console.log("🔄 [saveTimeline] Retrying after timeout...");
            saveTimeline();
        }, 200);
        
        showAlert('error', 'Form tidak ditemukan. Coba lagi atau refresh halaman.');
        return;
    }
    
    console.log("✅ [saveTimeline] Input elements FOUND:", {
        startValue: startInput.value,
        endValue: endInput.value
    });
    
    // ===== 4. VALIDASI INPUT VALUES =====
    if (!startInput.value || !endInput.value) {
        showAlert('warning', 'Harap isi tanggal mulai dan tanggal target');
        
        // Highlight empty fields
        if (!startInput.value) {
            startInput.style.border = '2px solid #e74c3c';
            startInput.focus();
        } else if (!endInput.value) {
            endInput.style.border = '2px solid #e74c3c';
            endInput.focus();
        }
        
        return;
    }
    
    // Reset border if was red
    startInput.style.border = '';
    endInput.style.border = '';
    
    // ===== 5. VALIDASI TANGGAL =====
    const start = new Date(startInput.value);
    const end = new Date(endInput.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check valid dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        showAlert('warning', 'Format tanggal tidak valid');
        return;
    }
    
    // Check start <= end
    if (end <= start) {
        showAlert('warning', 'Tanggal target harus SETELAH tanggal mulai');
        
        // Auto-swap if user might have reversed them
        if (confirm('Tanggal terbalik. Tukar tanggal mulai dan target?')) {
            const temp = startInput.value;
            startInput.value = endInput.value;
            endInput.value = temp;
            saveTimeline(); // Recursive call with swapped values
        }
        return;
    }
    
    // Check if start date is in future
    if (start > today) {
        if (!confirm('⚠️ Tanggal mulai di masa depan.\nApakah Anda yakin?')) {
            return;
        }
    }
    
    // Check if end date is too far (100 years)
    const hundredYears = new Date();
    hundredYears.setFullYear(hundredYears.getFullYear() + 100);
    if (end > hundredYears) {
        if (!confirm('⚠️ Tanggal target lebih dari 100 tahun!\nApakah ini benar?')) {
            return;
        }
    }
    
    // ===== 6. HITUNG TOTAL HARI =====
    const totalDays = calculateTotalDays(startInput.value, endInput.value);
    
    if (totalDays <= 0) {
        showAlert('warning', 'Durasi timeline tidak valid');
        return;
    }
    
    // ===== 7. SIMPAN KE TIMELINE OBJECT =====
    currentTimeline = {
        startDate: startInput.value,
        endDate: endInput.value,
        totalDays: totalDays,
        createdAt: currentTimeline.createdAt || new Date().toISOString(),
        lastUpdated: new Date().toISOString()
    };
    
    // ===== 8. SIMPAN KE LOCALSTORAGE =====
    try {
        localStorage.setItem('financial_timeline', JSON.stringify(currentTimeline));
        console.log("💾 [saveTimeline] Saved to localStorage:", currentTimeline);
    } catch (e) {
        console.error("❌ [saveTimeline] localStorage error:", e);
        showAlert('error', 'Gagal menyimpan. Storage mungkin penuh.');
        return;
    }
    
    // ===== 9. UPDATE UI =====
    updateHeaderRemainingDays();
    updateTimelineDisplay();
    updateTimelinePreview();
    
    // Update dashboard untuk perhitungan kebutuhan bulanan baru
    updateDashboard();
    
    // ===== 10. TAMPILKAN KONFIRMASI =====
    const durationText = totalDays >= 365 
        ? `${Math.floor(totalDays/365)} tahun ${totalDays%365} hari`
        : `${totalDays} hari`;
    
    showAlert('success', 
        `✅ TIMELINE DISIMPAN\n\n` +
        `📅 Mulai: ${formatDate(currentTimeline.startDate)}\n` +
        `🎯 Target: ${formatDate(currentTimeline.endDate)}\n` +
        `⏳ Durasi: ${durationText}\n` +
        `📊 Sisa: ${calculateRemainingDays()} hari`
    );
    
    console.log("✅ [saveTimeline] COMPLETED successfully");
}

function updateTimelineUI() {
    const startInput = document.getElementById('start-date');
    const endInput = document.getElementById('end-date');
    const modeSelect = document.getElementById('timeline-mode');
    
    if (startInput) startInput.value = timeline.startDate;
    if (endInput) endInput.value = timeline.endDate;
    if (modeSelect) modeSelect.value = timeline.mode;
    
    // Update preview
    updatePreview();
}

function setupTimelineInputListeners() {
    // Tunggu DOM siap
    setTimeout(() => {
        const startInput = document.getElementById('start-date');
        const endInput = document.getElementById('end-date');
        
        if (startInput) {
            startInput.addEventListener('change', function() {
                console.log("📅 Start date changed:", this.value);
                validateTimelineInput();
            });
        }
        
        if (endInput) {
            endInput.addEventListener('change', function() {
                console.log("🎯 End date changed:", this.value);
                validateTimelineInput();
            });
        }
        
        console.log("✅ Timeline input listeners setup");
    }, 200);
}


function updatePreview() {
    const daysLeft = calculateDaysLeft();
    const progress = calculateProgress();
    
    // Hitung durasi dalam tahun/bulan
    if (timeline.startDate && timeline.endDate) {
        const start = new Date(timeline.startDate);
        const end = new Date(timeline.endDate);
        const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
        
        let durationText = '';
        if (diffMonths >= 24) {
            durationText = `${Math.floor(diffMonths / 12)} tahun ${diffMonths % 12} bulan`;
        } else {
            durationText = `${diffMonths} bulan`;
        }
        
        const durationEl = document.getElementById('preview-duration');
        if (durationEl) durationEl.textContent = durationText;
    }
    
    const daysEl = document.getElementById('preview-days-left');
    const progressEl = document.getElementById('preview-progress');
    
    if (daysEl) daysEl.textContent = daysLeft;
    if (progressEl) progressEl.textContent = progress.toFixed(1) + '%';
}

function resetToDefault() {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setFullYear(endDate.getFullYear() + 3);
    
    timeline.startDate = today.toISOString().split('T')[0];
    timeline.endDate = endDate.toISOString().split('T')[0];
    timeline.mode = 'fixed';
    
    saveTimelineData();
    updateTimelineUI();
    updateCountdown();
    
    alert('🔄 Timeline direset ke 3 tahun dari hari ini');
}

// ⭐⭐ FUNGSI UNTUK DAILY CHECKER ⭐⭐
function setupDailyChecker() {
    console.log('⏰ Setting up daily checker...');
    
    // Update pertama kali
    checkAndUpdateDaily();
    
    // Setup interval: cek setiap 1 jam
    setInterval(checkAndUpdateDaily, 60 * 60 * 1000);
    
    // Juga cek setiap kali user kembali ke tab
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            checkAndUpdateDaily();
        }
    });
}

// ⭐⭐ FUNGSI CHECK DAILY UPDATE ⭐⭐
function checkAndUpdateDaily() {
    try {
        const today = new Date().toDateString(); // Format: "Mon Dec 30 2024"
        const lastUpdate = localStorage.getItem('lastDailyUpdate');
        
        // Jika hari berubah, update counter
        if (lastUpdate !== today) {
            console.log('📅 New day detected! Updating counters...');
            
            // Update sisa hari
            updateHeaderRemainingDays();
            
            // Simpan tanggal update terakhir
            localStorage.setItem('lastDailyUpdate', today);
            
            // Juga update dashboard untuk perhitungan ulang
            updateDashboard();
        }
    } catch (error) {
        console.error('Error in daily check:', error);
    }
}

function setupEventListeners() {
    // Event listeners untuk form
    document.getElementById('expense-desc').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addExpense();
    });
    
    document.getElementById('expense-amount').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addExpense();
    });
    
    document.getElementById('income-amount').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addIncome();
    });
    
    // Import file change event
    document.getElementById('import-file').addEventListener('change', function(e) {
        if (e.target.files[0]) {
            previewImportData(e.target.files[0]);
        }
    });
}

function loadFromLocalStorage() {
    try {
        const savedExpenses = localStorage.getItem('financial_expenses');
        const savedIncome = localStorage.getItem('financial_income');
        const savedSettings = localStorage.getItem('financial_settings');
        const savedChecklist = localStorage.getItem('financial_checklist');
        checklistItems = savedChecklist ? JSON.parse(savedChecklist) : [];

        expenses = savedExpenses ? JSON.parse(savedExpenses) : [];
        incomeRecords = savedIncome ? JSON.parse(savedIncome) : [];
        appSettings = savedSettings ? JSON.parse(savedSettings) : {
            targetAmount: 300000000
            // ⭐⭐ HAPUS timelineYears ⭐⭐
        };
        
        console.log("📂 Data loaded:", {
            expenses: expenses.length,
            income: incomeRecords.length,
            target: appSettings.targetAmount
        });
        
        // ⭐⭐ TIMELINE SUDAH DI INIT DI initTimelineSystem() ⭐⭐
        // Jadi tidak perlu init lagi di sini
        
        // Update header
        updateHeaderTarget();
        
        // ⭐⭐ TUNDA updateHeaderRemainingDays() sedikit ⭐⭐
        // Biarkan timeline system init dulu
        setTimeout(() => {
            updateHeaderRemainingDays();
        }, 100);
        
        // Update UI lainnya
        if (currentView === 'dashboard') updateDashboardTitle();
        if (currentView === 'investments') updateSimulationTitle();
        
        renderExpenseList();
        renderIncomeList();
        updateDashboardTitle();
        
    } catch (error) {
        console.error("Error loading data:", error);
    }
}

function saveToLocalStorage() {
    try {
        localStorage.setItem('financial_expenses', JSON.stringify(expenses));
        localStorage.setItem('financial_income', JSON.stringify(incomeRecords));
        localStorage.setItem('financial_settings', JSON.stringify(appSettings));
        localStorage.setItem('financial_checklist', JSON.stringify(checklistItems));
        console.log('💾 Data saved to localStorage');
    } catch (error) {
        console.error('Error saving data:', error);
    }
}

// ========== 📊 INISIALISASI CHART ==========

function initializeExpenseChart() {
  const canvas = document.getElementById('expenseChart');
  if (!canvas) {
    console.error('❌ Canvas "expenseChart" belum ada di DOM!');
    return null; // Jangan crash aplikasi
  }
  
  // Pastikan ini benar-benar canvas element
  if (canvas.getContext === undefined) {
    console.error('❌ Element bukan canvas:', canvas);
    return null;
  }
  const ctx = canvas.getContext('2d');
  if (expenseChart && typeof expenseChart.destroy === 'function') {
    console.log('🧹 Destroying old expense chart...');
    expenseChart.destroy();
    expenseChart = null; 
  }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  expenseChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: ['#2ecc71', '#3498db', '#9b59b6', '#f1c40f', '#e74c3c']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });

  return expenseChart;
}

function initializeMonthlyTrendChart() {
  const canvas = document.getElementById('monthlyTrendChart');
  const ctx = canvas.getContext('2d');
  
  if (monthlyTrendChart && typeof monthlyTrendChart.destroy === 'function') {
    monthlyTrendChart.destroy();
    monthlyTrendChart = null;  
  }
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  monthlyTrendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
      datasets: [{
        label: 'Pengeluaran',
        data: [],
        borderColor: '#e74c3c',
        backgroundColor: 'rgba(231, 76, 60, 0.1)',
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true } }
    }
  });
}

function initializeProgressChart() {
  const canvas = document.getElementById('progressChart');
  const ctx = canvas.getContext('2d');
  
  if (progressChart && typeof progressChart.destroy === 'function') {
    progressChart.destroy();
    progressChart = null;  
  }
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  progressChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Target', 'Terkumpul', 'Kekurangan'],
      datasets: [{
        label: 'Rp (Juta)',
        data: [],
        backgroundColor: ['#3498db', '#2ecc71', '#e74c3c']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return 'Rp ' + (value / 1000000) + 'Jt';
            }
          }
        }
      }
    }
  });
}

// ========== 📊 FUNGSI DASHBOARD & UI ==========
function showTab(tabId) {
    console.log(`📱 [showTab] Switching to tab: "${tabId}"`);
    
    // ===== 1. VALIDASI INPUT =====
    const validTabs = ['dashboard', 'expenses', 'income', 'checklists', 'investments', 'settings'];
    if (!validTabs.includes(tabId)) {
        console.error(`❌ [showTab] Invalid tab ID: "${tabId}"`);
        return;
    }
    
    // ===== 2. SEMBUNYIKAN SEMUA TAB =====
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
        tab.style.opacity = '0';
        tab.style.transition = 'opacity 0.3s ease';
    });
    
    // ===== 3. NON-AKTIFKAN SEMUA NAV ITEM =====
    document.querySelectorAll('.nav-item').forEach(nav => {
        nav.classList.remove('active');
        // nav.style.opacity = '1';
        nav.style.transform = 'scale(0.95)';
        nav.style.transition = 'all 0.3s ease';
    });
    
    // ===== 4. AKTIFKAN TAB YANG DIPILIH =====
    const targetTab = document.getElementById(`tab-${tabId}`);
    if (!targetTab) {
        console.error(`❌ [showTab] Target tab not found: "tab-${tabId}"`);
        
        // Fallback: coba aktifkan dashboard
        if (tabId !== 'dashboard') {
            console.log(`   ↳ Falling back to dashboard...`);
            showTab('dashboard');
        }
        return;
    }
    
    targetTab.classList.add('active');
    setTimeout(() => {
        targetTab.style.opacity = '1';
    }, 50);
    
    console.log(`✅ [showTab] Tab activated: #tab-${tabId}`);
    
    // ===== 5. AKTIFKAN NAV ITEM YANG SESUAI =====
    const navItems = document.querySelectorAll('.nav-item');
    let navFound = false;
    
    navItems.forEach(nav => {
        const tabName = getTabName(tabId);
        
        // Cek dengan berbagai metode
        const matches = 
            nav.textContent.includes(tabName) ||
            nav.getAttribute('data-tab') === tabId ||
            nav.getAttribute('onclick')?.includes(`'${tabId}'`);
        
        if (matches) {
            nav.classList.add('active');
            nav.style.opacity = '1';
            nav.style.transform = 'scale(1)';
            navFound = true;
            console.log(`✅ [showTab] Nav item activated: ${nav.textContent.trim()}`);
        }
    });
    
    if (!navFound) {
        console.warn(`⚠️ [showTab] No nav item found for tab: "${tabId}"`);
    }
    
    // ===== 6. UPDATE CURRENT VIEW =====
    currentView = tabId;
    console.log(`🔄 [showTab] Current view set to: "${currentView}"`);
    
    // ===== 7. SPECIAL HANDLING PER TAB =====
    switch(tabId) {
        case 'dashboard':
            console.log("📊 [showTab] Dashboard initialization...");
            
            // Update dashboard data
            updateDashboard();
            updateDashboardTitle();
            
            // Setup charts dengan delay untuk pastikan DOM ready
            setTimeout(() => {
                if (!expenseChart) {
                    console.log("🎨 Initializing expense chart...");
                    initializeExpenseChart();
                }
                
                // Set default chart tab
                switchChartTab('categories');
                
                console.log("✅ [showTab] Dashboard ready");
            }, 200);
            break;
            
        case 'expenses':
            console.log("💸 [showTab] Expenses tab initialization...");
            renderExpenseList();
            console.log("✅ [showTab] Expenses ready");
            break;
            
        case 'income':
            console.log("💰 [showTab] Income tab initialization...");
            renderIncomeList();
            
            // Update chart dengan delay
            setTimeout(() => {
                updateIncomeChart();
                console.log("✅ [showTab] Income chart updated");
            }, 150);
            break;
            
        case 'checklists':
            console.log("✅ [showTab] Checklists tab initialization...");
            renderChecklist();
            console.log("✅ [showTab] Checklists ready");
            break;
            
        case 'investments':
            console.log("📈 [showTab] Investments tab initialization...");
            updateSimulation();
            updateSimulationTitle();
            console.log("✅ [showTab] Investments ready");
            break;
            
        case 'settings':
            console.log("⚙️ [showTab] Settings tab SPECIAL INITIALIZATION");
            
            // ⭐⭐⭐ CRITICAL: Wait for DOM to render fully ⭐⭐⭐
            setTimeout(() => {
                console.log("🔄 [showTab] Initializing settings form elements...");
                
                // 1. Target Amount Input
                const targetInput = document.getElementById('target-amount-input');
                if (targetInput) {
                    if (appSettings.targetAmount) {
                        const valueInJuta = (appSettings.targetAmount / 1000000).toFixed(0);
                        targetInput.value = valueInJuta;
                        console.log(`   ✅ Target input filled: ${valueInJuta} juta`);
                    } else {
                        targetInput.value = '300'; // Default
                    }
                } else {
                    console.error(`   ❌ target-amount-input not found in DOM`);
                }
                
                // 2. Timeline Start Date
                const startInput = document.getElementById('start-date');
                if (startInput) {
                    if (currentTimeline && currentTimeline.startDate) {
                        startInput.value = currentTimeline.startDate;
                        console.log(`   ✅ Start date filled: ${currentTimeline.startDate}`);
                    } else {
                        // Set default: today
                        const today = new Date().toISOString().split('T')[0];
                        startInput.value = today;
                        console.log(`   ✅ Start date set to today: ${today}`);
                    }
                } else {
                    console.error(`   ❌ start-date input not found in DOM`);
                }
                
                // 3. Timeline End Date
                const endInput = document.getElementById('end-date');
                if (endInput) {
                    if (currentTimeline && currentTimeline.endDate) {
                        endInput.value = currentTimeline.endDate;
                        console.log(`   ✅ End date filled: ${currentTimeline.endDate}`);
                    } else {
                        // Set default: 3 years from today
                        const today = new Date();
                        const future = new Date(today);
                        future.setFullYear(today.getFullYear() + 3);
                        endInput.value = future.toISOString().split('T')[0];
                        console.log(`   ✅ End date set to default: ${endInput.value}`);
                    }
                } else {
                    console.error(`   ❌ end-date input not found in DOM`);
                }
                
                // 4. Update all timeline displays
                updateTimelineDisplay();
                updateTimelinePreview();
                
                // 5. Setup validation listeners
                setupDateInputEnhancements();
                
                // 6. Update data counts
                document.getElementById('data-count-income').textContent = incomeRecords.length;
                document.getElementById('data-count-expense').textContent = expenses.length;
                
                // 7. Update last backup time
                const lastBackup = localStorage.getItem('lastBackupTime');
                if (lastBackup) {
                    document.getElementById('last-backup-time').textContent = 
                        new Date(lastBackup).toLocaleDateString('id-ID');
                }
                
                console.log("✅ [showTab] Settings tab fully initialized");
                
                // Debug: log all found elements
                debugFormElements();
                
            }, 200); // 200ms cukup untuk DOM render
            
            break;
            
        default:
            console.warn(`⚠️ [showTab] No special handling for tab: "${tabId}"`);
    }
    
    // ===== 8. SCROLL KE ATAS DENGAN ANIMASI =====
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
    
    // ===== 9. UPDATE URL HASH (Optional - untuk bookmarking) =====
    // history.pushState(null, null, `#${tabId}`);
    
    // ===== 10. LOG COMPLETION =====
    console.log(`✅ [showTab] COMPLETED for tab: "${tabId}"`);
    console.log("=".repeat(50));
}

// Debug function untuk cek semua timeline elements
function debugTimelineElements() {
    console.log("=== DEBUG TIMELINE ELEMENTS ===");
    
    const elements = [
        'display-start-date',
        'display-end-date', 
        'display-days-left',
        'display-timeline-progress',
        'start-date',
        'end-date'
    ];
    
    elements.forEach(id => {
        const el = document.getElementById(id);
        console.log(`${id}:`, el ? `✅ FOUND` : '❌ NOT FOUND');
        if (el) {
            console.log(`   Value: ${el.value || el.textContent}`);
            console.log(`   Parent: ${el.parentElement?.id || 'N/A'}`);
        }
    });
    
    console.log("Current timeline:", currentTimeline);
    console.log("Current view:", currentView);
    console.log("Active tab:", document.querySelector('.tab-content.active')?.id);
    console.log("==============================");
}

// Panggil di console: debugTimelineElements()

function getTabName(tabId) {
    const names = {
        'dashboard': 'Dashboard',
        'expenses': 'Pengeluaran',
        'income': 'Pendapatan',
        'checklists': 'Checklist',
        'investments': 'Simulasi',
        'settings': 'Pengaturan'
    };
    
    const name = names[tabId];
    if (!name) {
        console.warn(`⚠️ [getTabName] Unknown tab ID: "${tabId}"`);
        return tabId;
    }
    
    return name;
}

function updateDashboard() {
    console.log("🔄 updateDashboard() dijalankan");
    
    try {
        // 1. Hitung total tabungan
        const totalIncome = incomeRecords.reduce((sum, item) => sum + item.amount, 0);
        const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
        const totalSaved = Math.max(0, totalIncome - totalExpenses);
        
        // 2. Update tabungan di UI
        document.getElementById('total-saved').textContent = formatCurrency(totalSaved);
        document.getElementById('current-month-balance').textContent = formatCurrency(totalSaved);
        document.getElementById('actual-per-month').textContent = formatCurrency(totalSaved);
        
        // 3. Hitung progress terhadap target
        const target = appSettings.targetAmount || 300000000;
        const progressPercentage = Math.min(100, (totalSaved / target) * 100);
        
        document.getElementById('main-progress-bar').style.width = `${progressPercentage}%`;
        document.getElementById('main-progress-text').textContent = `${progressPercentage.toFixed(1)}%`;
        document.getElementById('overall-progress').textContent = `${progressPercentage.toFixed(1)}%`;
        
        // ⭐⭐⭐ 4. HITUNG BERDASARKAN TIMELINE BARU ⭐⭐⭐
        const remainingDays = calculateRemainingDays(); // Dari timeline system
        const monthsLeft = Math.max(1, remainingDays / 30.44); // Rata-rata hari per bulan
        
        // Update sisa hari di header (sudah ada di updateHeaderRemainingDays())
        // const daysElement = document.getElementById('days-left');
        // if (daysElement) daysElement.textContent = remainingDays;
        
        // ⭐⭐⭐ 5. Hitung kebutuhan bulanan BERDASARKAN TIMELINE ⭐⭐⭐
        const neededPerMonth = Math.max(0, (target - totalSaved) / monthsLeft);
        
        document.getElementById('needed-per-month').textContent = formatCurrency(neededPerMonth);
        
        console.log('📊 Dashboard updated (NEW SYSTEM):', {
            saved: formatCurrency(totalSaved),
            target: formatCurrency(target),
            progress: progressPercentage.toFixed(1) + '%',
            remainingDays: remainingDays,
            monthsLeft: monthsLeft.toFixed(1),
            neededMonthly: formatCurrency(neededPerMonth)
        });
        
        // 6. Update charts
        if (expenseChart) updateExpenseChart();
        if (progressChart) updateProgressChart();
        
    } catch (error) {
        console.error("❌ Error di updateDashboard:", error);
    }
}

function switchChartTab(chartType) {
  console.log("Mengaktifkan chart:", chartType);
  
  // Update UI tab
  document.querySelectorAll('.chart-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelector(`.chart-tab[data-chart="${chartType}"]`).classList.add('active');
  
  // Sembunyikan semua chart, tampilkan yang aktif
  document.getElementById('expenseChart').style.display = 'none';
  document.getElementById('monthlyTrendChart').style.display = 'none';
  document.getElementById('progressChart').style.display = 'none';
  
  // ⭐⭐ PERBAIKAN: INISIALISASI & UPDATE CHART ⭐⭐
  if (chartType === 'categories') {
    if (!expenseChart) {
      // Buat chart expense jika belum ada
      const canvas = document.getElementById('expenseChart');
      const ctx = canvas.getContext('2d');
      expenseChart = new Chart(ctx, {
        type: 'doughnut',
        data: { labels: [], datasets: [{}] }
      });
    }
    document.getElementById('expenseChart').style.display = 'block';
    updateExpenseChart();
  } 
  else if (chartType === 'monthly') {
    // ⭐⭐ FIX: TIDAK ADA initializeMonthlyTrendChart() ⭐⭐
    document.getElementById('monthlyTrendChart').style.display = 'block';
    
    // ⭐⭐ TAMBAH: Force show canvas ⭐⭐
    const canvas = document.getElementById('monthlyTrendChart');
    if (canvas) {
      canvas.style.display = 'block';
      canvas.style.width = '100%';
      canvas.style.height = '350px';
    }
    
    updateMonthlyTrendChart(); // Langsung panggil fungsi update
  } 
  else if (chartType === 'progress') {
    if (!progressChart) {
      // Buat chart progress jika belum ada
      const canvas = document.getElementById('progressChart');
      const ctx = canvas.getContext('2d');
      progressChart = new Chart(ctx, {
        type: 'bar',
        data: { labels: [], datasets: [{}] }
      });
    }
    document.getElementById('progressChart').style.display = 'block';
    updateProgressChart();
  }
  
  // Update summary yang sesuai
  document.getElementById('categories-summary').style.display = 'none';
  document.getElementById('monthly-summary').style.display = 'none';
  document.getElementById('progress-summary').style.display = 'none';
  document.getElementById(`${chartType}-summary`).style.display = 'block';
}

function calculateProgress() {
    const totalIncome = incomeRecords.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
    const totalSaved = totalIncome - totalExpenses;
    const target = appSettings.targetAmount || 300000000;
    
    return {
        saved: totalSaved,
        target: target,
        percentage: Math.min(100, (totalSaved / target) * 100),
        needed: Math.max(0, target - totalSaved)
    };
}

function formatCurrency(amount) {
    if (isNaN(amount)) amount = 0;
    return 'Rp ' + Math.round(amount).toLocaleString('id-ID');
}

function showAlert(type, message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = `<strong>${type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️'}</strong> ${message}`;
    
    // Tambah ke konten
    const container = document.querySelector('.content-area');
    container.insertBefore(alertDiv, container.firstChild);
    
    // Hapus setelah 5 detik
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

function closeModal() {
    document.getElementById('notification-modal').style.display = 'none';
}

function showNotifications() {
    const modal = document.getElementById('notification-modal');
    const list = document.getElementById('notification-list');
    
    // Buat notifikasi dummy
    list.innerHTML = `
        <div class="alert alert-info">
            <strong>📊 Progress:</strong> Anda telah mencapai 15% dari target.
        </div>
        <div class="alert alert-warning">
            <strong>⚠️ Pengeluaran:</strong> Pengeluaran bulan ini melebihi anggaran.
        </div>
    `;
    
    modal.style.display = 'flex';
    document.getElementById('notification-count').textContent = '0';
}

// ========== 💸 FUNGSI PENGELUARAN ==========
function addExpense() {
    const desc = document.getElementById('expense-desc').value.trim();
    const amount = parseInt(document.getElementById('expense-amount').value);
    const date = document.getElementById('expense-date').value;
    const category = document.getElementById('selected-category').value;
    
    if (!desc || isNaN(amount) || amount <= 0) {
        showAlert('warning', 'Harap isi deskripsi dan jumlah dengan benar.');
        return;
    }
    
    const newExpense = {
        id: generateId(),
        description: desc,
        amount: amount,
        date: date,
        category: category,
        createdAt: new Date().toISOString()
    };
    
    expenses.push(newExpense);
    saveToLocalStorage();
    
    // Reset form
    document.getElementById('expense-desc').value = '';
    document.getElementById('expense-amount').value = '';
    
    // Update UI
    renderExpenseList();
    updateDashboard();
    
    showAlert('success', `Pengeluaran ${desc} sebesar ${formatCurrency(amount)} berhasil ditambahkan.`);
}

function deleteExpense(id) {
    if (!confirm('Hapus pengeluaran ini?')) return;
    
    expenses = expenses.filter(expense => expense.id !== id);
    saveToLocalStorage();
    
    renderExpenseList();
    updateDashboard();
    
    showAlert('success', 'Pengeluaran berhasil dihapus.');
}

function selectCategory(element, category) {
    // Hapus aktif dari semua kategori
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Aktifkan kategori yang dipilih
    element.classList.add('active');
    document.getElementById('selected-category').value = category;
}

function filterExpensesByMonth() {
    renderExpenseList();
}

function renderExpenseList() {
    const container = document.getElementById('expense-list-container');
    const filter = document.getElementById('expense-month-filter').value;
    
    // Filter expenses
    let filteredExpenses = [...expenses];
    
    if (filter !== 'all') {
        if (filter === 'current') {
            const currentMonth = new Date().toISOString().slice(0, 7);
            filteredExpenses = expenses.filter(exp => exp.date.startsWith(currentMonth));
        } else {
            filteredExpenses = expenses.filter(exp => exp.date.startsWith(filter));
        }
    }
    
    // Urutkan berdasarkan tanggal (terbaru pertama)
    filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Hitung total
    const total = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    document.getElementById('expense-total-display').textContent = formatCurrency(total);
    document.getElementById('data-count-expense').textContent = expenses.length;
    
    // Render list
    if (filteredExpenses.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Belum ada pengeluaran.</p>';
        return;
    }
    
    let html = '';
    filteredExpenses.forEach(expense => {
        const categoryIcons = {
            'keluarga': '👨‍👩‍👧‍👦',
            'kebutuhan': '🛒',
            'hiburan': '🎉',
            'investasi': '📈',
            'lainnya': '📦'
        };
        
        html += `
            <div class="expense-item">
                <div>
                    <strong>${categoryIcons[expense.category] || '📦'} ${expense.description}</strong><br>
                    <small style="color: #666;">${formatDate(expense.date)} • ${expense.category}</small>
                </div>
                <div style="text-align: right;">
                    <div style="color: #e74c3c; font-weight: bold;">${formatCurrency(expense.amount)}</div>
                    <button onclick="deleteExpense('${expense.id}')" style="background: none; border: none; color: #999; cursor: pointer; font-size: 0.8em;">Hapus</button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ========== 💰 FUNGSI PENDAPATAN ==========
function addIncome() {
    const source = document.getElementById('income-source').value;
    const amount = parseInt(document.getElementById('income-amount').value);
    const date = document.getElementById('income-date').value;
    const notes = document.getElementById('income-notes').value.trim();
    
    if (isNaN(amount) || amount <= 0) {
        showAlert('warning', 'Harap isi jumlah pendapatan dengan benar.');
        return;
    }
    
    const sourceNames = {
        'gaji_utama': 'Gaji Utama',
        'freelance': 'Freelance',
        'bonus': 'Bonus/THR',
        'investasi': 'Hasil Investasi',
        'lainnya': 'Lainnya'
    };
    
    const newIncome = {
        id: Date.now(),
        source: source,
        sourceName: sourceNames[source] || 'Lainnya',
        amount: amount,
        date: date,
        notes: notes,
        createdAt: new Date().toISOString()
    };
    
    incomeRecords.push(newIncome);
    saveToLocalStorage();
    
    // Reset form
    document.getElementById('income-amount').value = '';
    document.getElementById('income-notes').value = '';
    
    // Update UI
    renderIncomeList();
    updateDashboard();
    updateIncomeChart();
    
    showAlert('success', `Pendapatan ${sourceNames[source]} sebesar ${formatCurrency(amount)} berhasil ditambahkan.`);
}

function filterIncomeByMonth() {
    renderIncomeList();
}

function deleteIncome(id) {
    if (!confirm('Hapus pendapatan ini?')) return;
    
    incomeRecords = incomeRecords.filter(income => income.id !== id);
    saveToLocalStorage();
    
    renderIncomeList();
    updateDashboard();
    
    showAlert('success', 'Pendapatan berhasil dihapus.');
}

function renderIncomeList() {
    const container = document.getElementById('income-history-container');
    const filter = document.getElementById('income-month-filter').value;
    
    // Filter income
    let filteredIncome = [...incomeRecords];
    
    if (filter !== 'all') {
        if (filter === 'current') {
            const currentMonth = new Date().toISOString().slice(0, 7);
            filteredIncome = incomeRecords.filter(inc => inc.date.startsWith(currentMonth));
        } else {
            filteredIncome = incomeRecords.filter(inc => inc.date.startsWith(filter));
        }
    }
    
    // Urutkan berdasarkan tanggal (terbaru pertama)
    filteredIncome.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Hitung total
    const total = filteredIncome.reduce((sum, inc) => sum + inc.amount, 0);
    document.getElementById('yearly-income-total').textContent = formatCurrency(total);
    
    // Hitung total bulan ini
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyTotal = incomeRecords
        .filter(inc => inc.date.startsWith(currentMonth))
        .reduce((sum, inc) => sum + inc.amount, 0);
    
    document.getElementById('monthly-income-total').textContent = formatCurrency(monthlyTotal);
    document.getElementById('data-count-income').textContent = incomeRecords.length;
    
    // Cari sumber terbesar
    if (incomeRecords.length > 0) {
        const sourceTotals = {};
        incomeRecords.forEach(inc => {
            sourceTotals[inc.sourceName] = (sourceTotals[inc.sourceName] || 0) + inc.amount;
        });
        
        const largestSource = Object.entries(sourceTotals).reduce((a, b) => a[1] > b[1] ? a : b);
        document.getElementById('largest-income-source').textContent = `${largestSource[0]} (${formatCurrency(largestSource[1])})`;
    }
    
    // Render list
    if (filteredIncome.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Belum ada pendapatan.</p>';
        return;
    }
    
    let html = '';
    filteredIncome.forEach(income => {
        const sourceIcons = {
            'Gaji Utama': '💰',
            'Freelance': '💼',
            'Bonus/THR': '🎁',
            'Hasil Investasi': '📈',
            'Lainnya': '📦'
        };
        
        html += `
            <div class="expense-item">
                <div>
                    <strong>${sourceIcons[income.sourceName] || '💰'} ${income.sourceName}</strong><br>
                    <small style="color: #666;">${formatDate(income.date)}</small>
                    ${income.notes ? `<br><small style="color: #888;">${income.notes}</small>` : ''}
                </div>
                <div style="text-align: right;">
                    <div style="color: #27ae60; font-weight: bold;">${formatCurrency(income.amount)}</div>
                    <!-- ⭐⭐ TAMBAH TOMBOL HAPUS SAMA PERSIS DENGAN EXPENSE ⭐⭐ -->
                    <button onclick="deleteIncome(${income.id})" 
                            style="background: none; border: none; color: #999; cursor: pointer; font-size: 0.8em;">
                        Hapus
                    </button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function updateIncomeChart() {
    const ctx = document.getElementById('incomeChart').getContext('2d');
    
    // Group income by source
    const sourceData = {};
    incomeRecords.forEach(income => {
        sourceData[income.sourceName] = (sourceData[income.sourceName] || 0) + income.amount;
    });
    
    const labels = Object.keys(sourceData);
    const data = Object.values(sourceData);
    
    // Warna untuk chart
    const backgroundColors = [
        '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6'
    ];
    
    if (incomeChart) {
        incomeChart.destroy();
    }
    
    incomeChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                },
                title: {
                    display: true,
                    text: 'Pendapatan per Sumber'
                }
            }
        }
    });
}

// ========== ✅ FUNGSI CHECKLIST ==========
function addChecklistItem() {
    const container = document.getElementById('master-checklist');
    if (!container) return;
    
    const id = 'checklist_' + Date.now();
    
    // SIMPAN KE LOCALSTORAGE (TEXT KOSONG)
    let items = JSON.parse(localStorage.getItem('checklist') || '[]');
    items.push({
        id: id,
        text: '', // TEXT KOSONG
        completed: false,
        isNew: true,
        createdAt: new Date().toISOString()
    });
    localStorage.setItem('checklist', JSON.stringify(items));
    
    // BUAT ELEMENT DENGAN PLACEHOLDER
    container.insertAdjacentHTML('beforeend', 
        `<div class="checklist-item-custom new-checklist-item" id="${id}">
            <input type="checkbox" onchange="toggleChecklistItem('${id}')">
            <input type="text" 
                   class="checklist-input-new" 
                   placeholder="📝 Ketik checklist item di sini..."
                   onfocus="this.placeholder=''"
                   onblur="if(!this.value) this.placeholder='📝 Ketik checklist item di sini...'; saveChecklistText('${id}', this.value)"
                   onkeypress="if(event.key === 'Enter') { this.blur(); }">
            <button onclick="deleteChecklistItem('${id}')" 
                    style="background:#e74c3c;color:white;border:none;border-radius:4px;padding:5px 10px;margin-left:10px;cursor:pointer;">
                Hapus
            </button>
        </div>`
    );
    
    // AUTO FOCUS DAN SELECT
    setTimeout(() => {
        const input = document.querySelector(`#${id} .checklist-input-new`);
        if (input) {
            input.focus();
            // Real-time save saat typing
            input.addEventListener('input', function() {
                saveChecklistText(id, this.value);
            });
        }
    }, 100);
}

// FUNGSI AUTO CLEAR
function clearIfDefault(input, id) {
    if (input.value === 'Ketik di sini...' || 
        input.value === 'Item checklist baru') {
        input.value = ''; // ⭐ KOSONGKAN SAAT DIKLIK
    }
}

function toggleChecklistItem(id) {
    let items = JSON.parse(localStorage.getItem('checklist') || '[]');
    let item = items.find(i => i.id === id);
    
    if (item) {
        item.completed = !item.completed;
        localStorage.setItem('checklist', JSON.stringify(items)); // ⭐ SIMPAN!
        
        // Update UI
        let el = document.getElementById(id);
        if (el) {
            el.classList.toggle('completed');
        }
    }
}


function deleteChecklistItem(id) {
    if (!confirm('Hapus item ini?')) return;
    
    let items = JSON.parse(localStorage.getItem('checklist') || '[]');
    items = items.filter(i => i.id !== id);
    localStorage.setItem('checklist', JSON.stringify(items)); // ⭐ SIMPAN!
    
    document.getElementById(id)?.remove();
}

function renderChecklist() {
    const container = document.getElementById('master-checklist');
    if (!container) return;
    
    // LOAD DARI LOCALSTORAGE
    let items = JSON.parse(localStorage.getItem('checklist') || '[]');
    
    // JIKA KOSONG, BUAT DEFAULT (DENGAN PLACEHOLDER)
    if (items.length === 0) {
        items = [
            { id: 'check1', text: 'Buat anggaran bulanan', completed: false },
            { id: 'check2', text: 'Tabung 30% dari pendapatan', completed: false },
            { id: 'check3', text: 'Bayar semua tagihan tepat waktu', completed: true },
            { id: 'check4', text: 'Review investasi bulanan', completed: false }
        ];
        localStorage.setItem('checklist', JSON.stringify(items));
    }
    
    // RENDER - GUNAKAN PLACEHOLDER JIKA TEXT KOSONG
    let html = '';
    items.forEach(item => {
        const inputValue = item.text || ''; // Kosong jika tidak ada text
        const placeholder = item.text ? '' : '📝 Ketik checklist item di sini...';
        
        html += `<div class="checklist-item-custom ${item.completed ? 'completed' : ''}" id="${item.id}">
            <input type="checkbox" ${item.completed ? 'checked' : ''} onchange="toggleChecklistItem('${item.id}')">
            <input type="text" 
                   class="checklist-input" 
                   value="${inputValue.replace(/"/g, '&quot;')}"
                   placeholder="${placeholder}"
                   onfocus="if(this.placeholder) this.placeholder=''"
                   onblur="saveChecklistText('${item.id}', this.value)"
                   onkeypress="if(event.key === 'Enter') this.blur();">
            <button onclick="deleteChecklistItem('${item.id}')" 
                    style="background:#e74c3c;color:white;border:none;border-radius:4px;padding:5px 10px;margin-left:10px;cursor:pointer;">
                Hapus
            </button>
        </div>`;
    });
    
    container.innerHTML = html;
    setTimeout(setupChecklistEvents, 100);
}

function saveChecklistText(id, text) {
    console.log('Saving:', id, text); // Debug
    
    let items = JSON.parse(localStorage.getItem('checklist') || '[]');
    let item = items.find(i => i.id === id);
    
    if (item) {
        item.text = text;
        localStorage.setItem('checklist', JSON.stringify(items)); // ⭐ SIMPAN!
        console.log('✅ Saved to localStorage');
    } else {
        console.log('❌ Item not found:', id);
    }
}

// 3. FUNGSI YANG HILANG - INI YANG PERLU DITAMBAH!
function saveChecklistItem(id, text) {
    // CARI ITEM DI ARRAY
    const itemIndex = checklistItems.findIndex(item => item.id === id);
    
    if (itemIndex !== -1) {
        // UPDATE TEXT
        checklistItems[itemIndex].text = text;
        checklistItems[itemIndex].lastUpdated = new Date().toISOString();
        
        // SIMPAN KE LOCALSTORAGE
        localStorage.setItem('financial_checklist', JSON.stringify(checklistItems));
        console.log(`✅ Checklist item "${text}" disimpan`);
    }
}

function setupChecklistEvents() {
    document.querySelectorAll('.checklist-input').forEach(input => {
        // Real-time save saat typing (opsional)
        input.addEventListener('input', function() {
            const id = this.closest('.checklist-item-custom').id;
            saveChecklistText(id, this.value);
        });
        
        // Save saat tekan Enter
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                this.blur();
            }
        });
    });
}

// ========== 📈 FUNGSI SIMULASI INVESTASI ==========
function updateSimulation() {
    const monthlySaving = parseInt(document.getElementById('saving-slider').value);
    const annualReturn = parseInt(document.getElementById('return-slider').value);
    
    // Update slider values
    document.getElementById('saving-slider-value').textContent = formatCurrency(monthlySaving);
    document.getElementById('return-slider-value').textContent = annualReturn + '%';
    
    // ⭐⭐⭐ HITUNG BERDASARKAN TIMELINE DURASI ⭐⭐⭐
    // Pakai totalDays dari timeline, bukan timelineYears
    const totalDays = currentTimeline.totalDays || 1095; // Default 3 tahun
    const years = totalDays / 365; // Konversi hari ke tahun
    
    // Hitung simulasi
    const simulatedTotal = calculateCompoundInterest(0, monthlySaving, annualReturn, years);
    const target = appSettings.targetAmount || 300000000;
    const gap = simulatedTotal - target;
    
    // Update UI
    document.getElementById('simulated-total').textContent = formatCurrency(simulatedTotal);
    document.getElementById('gap-amount').textContent = formatCurrency(Math.abs(gap));
    
    if (gap >= 0) {
        document.getElementById('target-status').textContent = 'TERCAPAI';
        document.getElementById('target-status').style.color = '#27ae60';
    } else {
        document.getElementById('target-status').textContent = 'BELUM TERCAPAI';
        document.getElementById('target-status').style.color = '#e74c3c';
    }
    
    console.log("📈 Simulation updated:", {
        years: years.toFixed(1),
        totalDays: totalDays,
        simulated: formatCurrency(simulatedTotal),
        target: formatCurrency(target)
    });
}

function runInvestmentSimulation() {
    // Fungsi untuk menjalankan simulasi lengkap
    updateSimulation();
}

function calculateCompoundInterest(principal, monthly, annualRate, years) {
    const monthlyRate = annualRate / 100 / 12;
    const months = years * 12; // Years sudah dalam desimal
    let total = principal;
    
    for (let i = 0; i < months; i++) {
        total = total * (1 + monthlyRate) + monthly;
    }
    
    return total;
}

// ========== ⚙️ FUNGSI PENGATURAN ==========
// GANTI fungsi saveSettings() dengan ini (baris ~2401):
function saveSettings() {
    console.log("💾 [saveSettings] SUPER SAFE VERSION");
    
    // METHOD 1: Cek dulu apakah kita di tab settings
    const settingsTab = document.getElementById('tab-settings');
    const isSettingsActive = settingsTab && settingsTab.classList.contains('active');
    
    console.log("🔍 Debug Info:", {
        currentView: currentView,
        isSettingsActive: isSettingsActive,
        settingsTab: settingsTab,
        activeTab: document.querySelector('.tab-content.active')?.id
    });
    
    // Jika tidak di settings, redirect ke safe version
    if (!isSettingsActive || currentView !== 'settings') {
        console.error("❌ ERROR: Called from wrong tab!");
        safeSaveSettings();
        return;
    }
    
    // METHOD 2: Cari input dengan MULTIPLE METHODS
    let targetInput = null;
    
    // Try method 1: getElementById
    targetInput = document.getElementById('target-amount-input');
    
    // Try method 2: querySelector
    if (!targetInput) {
        console.warn("⚠️ Method 1 failed, trying querySelector...");
        targetInput = document.querySelector('#target-amount-input');
    }
    
    // Try method 3: Cari di dalam settings tab
    if (!targetInput && settingsTab) {
        console.warn("⚠️ Method 2 failed, searching within settings tab...");
        targetInput = settingsTab.querySelector('#target-amount-input');
    }
    
    // Try method 4: Cari semua input dan filter
    if (!targetInput) {
        console.warn("⚠️ Method 3 failed, searching all inputs...");
        const allInputs = document.querySelectorAll('input');
        allInputs.forEach(input => {
            if (input.id === 'target-amount-input' || 
                input.getAttribute('placeholder')?.includes('contoh') ||
                input.type === 'number') {
                targetInput = input;
            }
        });
    }
    
    // ⭐⭐⭐ CRITICAL CHECK ⭐⭐⭐
    if (!targetInput) {
        console.error("❌ CRITICAL ERROR: target-amount-input NOT FOUND AFTER ALL METHODS!");
        
        // EMERGENCY: Create temporary input
        const emergencyHTML = `
            <div id="emergency-target-form" style="
                background: #fff3cd; 
                padding: 20px; 
                border-radius: 10px; 
                margin: 20px 0;
                border: 2px solid #ffc107;
            ">
                <h4 style="color: #856404;">🆘 EMERGENCY INPUT</h4>
                <p>Form target tidak ditemukan. Silakan isi manual:</p>
                <input type="number" id="emergency-target" 
                       placeholder="Masukkan target (juta)" 
                       value="300"
                       style="padding: 10px; width: 100%; margin: 10px 0; font-size: 16px;">
                <button onclick="saveSettingsEmergency()" 
                        style="background: #28a745; color: white; padding: 12px 20px; 
                               border: none; border-radius: 5px; cursor: pointer;">
                    💾 Simpan Target Emergency
                </button>
            </div>
        `;
        
        // Tambahkan ke content area
        const contentArea = document.querySelector('.content-area');
        if (contentArea) {
            contentArea.insertAdjacentHTML('beforeend', emergencyHTML);
        }
        
        showAlert('error', 
            'Form target tidak ditemukan.\n' +
            'Emergency input telah dibuat di bawah halaman.\n' +
            'Silakan isi dan klik "Simpan Target Emergency".'
        );
        return;
    }
    
    // ⭐⭐⭐ SEKARANG BARU AMAN UNTUK AKSES .value ⭐⭐⭐
    console.log("✅ SUCCESS: Input element found!", {
        id: targetInput.id,
        value: targetInput.value,
        type: targetInput.type
    });
    
    const inputValue = targetInput.value; // ← SEKARANG AMAN!
    
    // Validasi input
    if (!inputValue || inputValue.trim() === '') {
        showAlert('warning', 'Harap isi target dana');
        targetInput.focus();
        return;
    }
    
    const numericValue = parseFloat(inputValue);
    if (isNaN(numericValue) || numericValue <= 0) {
        showAlert('warning', 'Target harus berupa angka positif');
        targetInput.focus();
        return;
    }
    
    // Simpan data
    appSettings.targetAmount = numericValue * 1000000;
    
    try {
        localStorage.setItem('financial_settings', JSON.stringify(appSettings));
        console.log("✅ Settings saved:", appSettings);
    } catch (e) {
        console.error("❌ Error saving settings:", e);
        showAlert('error', 'Gagal menyimpan. Storage mungkin penuh.');
        return;
    }
    
    // Update UI
    updateDashboard();
    updateHeaderTarget();
    
    // Update judul
    const titleElement = document.getElementById('dashboard-target-title');
    if (titleElement) {
        titleElement.innerHTML = `Progress Menuju Rp ${numericValue} Juta`;
    }
    
    const simTitleElement = document.getElementById('simulation-target-title');
    if (simTitleElement) {
        simTitleElement.innerHTML = `Simulasi Mencapai Rp ${numericValue} Juta`;
    }
    
    showAlert('success', `Target Rp ${numericValue} juta berhasil disimpan!`);
    
    // Hapus emergency form jika ada
    const emergencyForm = document.getElementById('emergency-target-form');
    if (emergencyForm) {
        emergencyForm.remove();
    }
}

// ⭐⭐⭐ EMERGENCY SAVE FUNCTION ⭐⭐⭐
function saveSettingsEmergency() {
    console.log("🆘 Emergency save triggered");
    
    const emergencyInput = document.getElementById('emergency-target');
    if (!emergencyInput || !emergencyInput.value) {
        alert('Harap isi target terlebih dahulu!');
        return;
    }
    
    const numericValue = parseFloat(emergencyInput.value) || 300;
    const targetAmount = numericValue * 1000000;
    
    appSettings.targetAmount = targetAmount;
    
    // Simpan ke localStorage
    localStorage.setItem('financial_settings', JSON.stringify(appSettings));
    
    // Update UI
    updateDashboard();
    updateHeaderTarget();
    
    // Update judul
    const titleElement = document.getElementById('dashboard-target-title');
    if (titleElement) {
        titleElement.innerHTML = `Progress Menuju Rp ${numericValue} Juta`;
    }
    
    const simTitleElement = document.getElementById('simulation-target-title');
    if (simTitleElement) {
        simTitleElement.innerHTML = `Simulasi Mencapai Rp ${numericValue} Juta`;
    }
    
    // Hapus emergency form
    const emergencyForm = document.getElementById('emergency-target-form');
    if (emergencyForm) {
        emergencyForm.remove();
    }
    
    // Tampilkan konfirmasi
    alert(`✅ Target Rp ${numericValue} juta berhasil disimpan!\n\nHalaman akan reload...`);
    
    // Reload halaman untuk pastikan UI update
    setTimeout(() => {
        location.reload();
    }, 1500);
}

function updateDashboardTitle() {
    const titleElement = document.getElementById('dashboard-target-title');
    if (titleElement) {
        const targetInMillions = (appSettings.targetAmount / 1000000).toFixed(0);
        titleElement.innerHTML = `Progress Menuju Rp ${targetInMillions} Juta`;
        console.log('✅ Dashboard title updated');
    }
}

// Fungsi untuk update Target di header
// ⭐⭐ PASTIKAN updateHeaderTarget() ADA DAN BEKERJA ⭐⭐
function updateHeaderTarget() {
    console.log("🔄 updateHeaderTarget() called");
    
    const target = appSettings.targetAmount || 300000000;
    const targetInJuta = (target / 1000000).toFixed(0);
    
    const headerTargetElement = document.getElementById('header-target');
    if (headerTargetElement) {
        headerTargetElement.textContent = `Rp ${targetInJuta} Juta`;
        console.log('🎯 Header target updated:', targetInJuta + ' juta');
    } else {
        console.warn('⚠️ Header target element not found, trying again...');
        // Coba lagi setelah delay
        setTimeout(updateHeaderTarget, 500);
    }
}

// Fungsi untuk update Sisa Hari di header
function updateHeaderRemainingDays() {
    try {
        // ⭐⭐ VALIDASI: Pastikan timeline ada endDate ⭐⭐
        if (!currentTimeline || !currentTimeline.endDate) {
            console.warn("⚠️ [updateHeaderRemainingDays] No end date, using default 3 years");
            
            // Fallback: 3 tahun dari sekarang
            const today = new Date();
            const fallbackDate = new Date(today);
            fallbackDate.setFullYear(today.getFullYear() + 3);
            
            const daysLeft = calculateTotalDays(today.toISOString().split('T')[0], 
                                              fallbackDate.toISOString().split('T')[0]);
            
            updateDaysElement(daysLeft);
            return daysLeft;
        }
        
        // Normal calculation
        const end = new Date(currentTimeline.endDate);
        const now = new Date();
        
        end.setHours(0, 0, 0, 0);
        now.setHours(0, 0, 0, 0);
        
        const diffMs = end - now;
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        const remainingDays = Math.max(0, diffDays);
        
        updateDaysElement(remainingDays);
        return remainingDays;
        
    } catch (error) {
        console.error("❌ Error in updateHeaderRemainingDays:", error);
        
        // Emergency fallback
        const fallbackDays = 1095; // 3 tahun
        updateDaysElement(fallbackDays);
        return fallbackDays;
    }
}

// Helper function untuk update UI
function updateDaysElement(days) {
    const daysElement = document.getElementById('days-left');
    if (daysElement) {
        daysElement.textContent = days;
        
        // Warna berdasarkan urgency
        if (days > 720) {
            daysElement.style.color = '#2ecc71';
        } else if (days > 360) {
            daysElement.style.color = '#f39c12';
        } else if (days > 90) {
            daysElement.style.color = '#e67e22';
        } else {
            daysElement.style.color = '#e74c3c';
        }
    }
}

function checkAndUpdateDaily() {
    try {
        const today = new Date().toDateString();
        const lastUpdate = localStorage.getItem('lastDailyUpdate');
        
        // Jika hari berubah, update counter
        if (lastUpdate !== today) {
            console.log('📅 New day detected! Updating counters...');
            
            // ⭐⭐⭐ UPDATE BERDASARKAN TIMELINE SYSTEM ⭐⭐⭐
            updateHeaderRemainingDays();
            
            // Update timeline display di settings page
            updateTimelineDisplay();
            updateTimelinePreview();
            
            // Update dashboard untuk perhitungan ulang
            updateDashboard();
            
            // Simpan tanggal update terakhir
            localStorage.setItem('lastDailyUpdate', today);
            
            console.log('🔄 Daily update completed');
        }
    } catch (error) {
        console.error('Error in daily check:', error);
    }
}

function updateSimulationTitle() {
    const titleElement = document.getElementById('simulation-target-title');
    if (titleElement) {
        const targetInMillions = (appSettings.targetAmount / 1000000).toFixed(0);
        titleElement.innerHTML = `Simulasi Mencapai Rp ${targetInMillions} Juta`;
        console.log('✅ Simulation title updated');
    }
}

function saveSettings() {
    console.log("💾 [saveSettings] SIMPLE FIX VERSION");
    
    // ⭐⭐ SOLUSI SEDERHANA: TIDAK PERLU CARI ELEMENT ⭐⭐
    // Karena kita tahu element ADA dari debug di atas
    
    // Langsung ambil value dengan cara yang AMAN
    let targetValue = "300"; // Default
    
    try {
        // Coba ambil dari element
        const targetInput = document.getElementById('target-amount-input');
        if (targetInput && targetInput.value) {
            targetValue = targetInput.value;
            console.log("✅ Got value from input:", targetValue);
        } else {
            console.warn("⚠️ Using default value 300");
        }
    } catch (e) {
        console.warn("⚠️ Error getting input value, using default:", e);
    }
    
    // Convert ke number
    const numericValue = parseFloat(targetValue) || 300;
    
    // Update app settings
    appSettings.targetAmount = numericValue * 1000000;
    
    // Simpan ke localStorage
    try {
        localStorage.setItem('financial_settings', JSON.stringify(appSettings));
        console.log("✅ Settings saved successfully!");
    } catch (e) {
        console.error("❌ Error saving to localStorage:", e);
        showAlert('error', 'Gagal menyimpan data. Coba lagi.');
        return;
    }
    
    // ⭐⭐ UPDATE SEMUA UI YANG PERLU ⭐⭐
    
    // 1. Update dashboard progress
    updateDashboard();
    
    // 2. Update target di header 🎯
    updateHeaderTarget();
    
    // 3. Update judul dashboard
    const dashboardTitle = document.getElementById('dashboard-target-title');
    if (dashboardTitle) {
        dashboardTitle.innerHTML = `Progress Menuju Rp ${numericValue} Juta`;
        console.log("✅ Dashboard title updated");
    }
    
    // 4. Update judul simulasi
    const simTitle = document.getElementById('simulation-target-title');
    if (simTitle) {
        simTitle.innerHTML = `Simulasi Mencapai Rp ${numericValue} Juta`;
        console.log("✅ Simulation title updated");
    }
    
    // 5. Tampilkan konfirmasi
    showAlert('success', 
        `🎯 TARGET BERHASIL DISIMPAN!\n\n` +
        `Jumlah: Rp ${numericValue} Juta\n` +
        `Timeline: ${calculateRemainingDays()} hari tersisa`
    );
    
    console.log("✅ saveSettings completed successfully!");
}

function resetAllData() {
    if (!confirm('Yakin ingin menghapus SEMUA data? Tindakan ini tidak dapat dibatalkan!')) {
        return;
    }
    
    expenses = [];
    incomeRecords = [];
    appSettings = {
        targetAmount: 300000000,
        timelineYears: 3
    };
    
    // Clear localStorage
    localStorage.removeItem('financial_expenses');
    localStorage.removeItem('financial_income');
    localStorage.removeItem('financial_settings');
    localStorage.removeItem('financial_checklist');
    
    // Reset UI
    renderExpenseList();
    renderIncomeList();
    updateDashboard();
    
    // Reset form inputs
    document.getElementById('expense-desc').value = '';
    document.getElementById('expense-amount').value = '';
    document.getElementById('income-amount').value = '';
    document.getElementById('income-notes').value = '';
    
    showAlert('success', 'Semua data berhasil direset.');
}

function exportData() {
    const data = {
        version: '3.1',
        exportDate: new Date().toISOString(),
        expenses: expenses,
        income: incomeRecords,
        settings: appSettings,
        metadata: {
            totalExpenses: expenses.length,
            totalIncome: incomeRecords.length,
            totalSaved: incomeRecords.reduce((s, i) => s + i.amount, 0) - expenses.reduce((s, e) => s + e.amount, 0)
        }
    };
    
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
    
    showAlert('success', 'Data berhasil di-export. File akan didownload.');
}

function importData() {
    const fileInput = document.getElementById('import-file');
    
    if (!fileInput.files[0]) {
        showAlert('warning', 'Pilih file backup terlebih dahulu.');
        return;
    }
    
    const file = fileInput.files[0];
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // Validasi data
            if (!importedData.version || !importedData.expenses || !importedData.income) {
                throw new Error('Format file tidak valid.');
            }
            
            // Preview data
            previewImportData(importedData);
            
        } catch (error) {
            showAlert('warning', `Error membaca file: ${error.message}`);
        }
    };
    
    reader.onerror = function() {
        showAlert('warning', 'Gagal membaca file.');
    };
    
    reader.readAsText(file);
}

function previewImportData(data) {
    const previewDiv = document.getElementById('import-preview');
    
    if (typeof data === 'object' && data.expenses && data.income) {
        previewDiv.innerHTML = `
            <div class="alert alert-info">
                <h4>📋 Preview Data:</h4>
                <p><strong>Pendapatan:</strong> ${data.income.length} transaksi</p>
                <p><strong>Pengeluaran:</strong> ${data.expenses.length} transaksi</p>
                <p><strong>Versi:</strong> ${data.version || 'Tidak diketahui'}</p>
                <p><strong>Tanggal export:</strong> ${data.exportDate ? new Date(data.exportDate).toLocaleDateString('id-ID') : 'Tidak diketahui'}</p>
                
                <div style="margin-top: 15px;">
                    <button class="btn btn-blue" onclick="confirmImport(${JSON.stringify(data).replace(/"/g, '&quot;')})">
                        ✅ Konfirmasi Import
                    </button>
                    <button class="btn" onclick="cancelImport()" style="margin-left: 10px;">
                        ❌ Batal
                    </button>
                </div>
            </div>
        `;
        previewDiv.style.display = 'block';
    } else if (data instanceof File) {
        // File object, akan diproses oleh importData()
        previewDiv.innerHTML = '<p>Memproses file...</p>';
        previewDiv.style.display = 'block';
    }
}

// ========== 🎨 FUNGSI CHART & VISUALISASI ==========

// ========== PWA OFFLINE SUPPORT ==========

// Check if app is installed as PWA
function checkPWAStatus() {
    if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('📱 Running as installed PWA');
        document.body.classList.add('pwa-mode');
    }
}

// Initialize PWA features
document.addEventListener('DOMContentLoaded', checkPWAStatus);

function initializeCharts() {
    // Inisialisasi semua chart
    const expenseCtx = document.getElementById('expenseChart').getContext('2d');
    const monthlyCtx = document.getElementById('monthlyTrendChart').getContext('2d');
    const progressCtx = document.getElementById('progressChart').getContext('2d');
    
    // Chart 1: Pengeluaran per Kategori
    expenseChart = new Chart(expenseCtx, {
        type: 'pie',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                title: {
                    display: true,
                    text: 'Pengeluaran per Kategori'
                }
            }
        }
    });
    
    // Chart 2: Trend Bulanan
    monthlyTrendChart = new Chart(monthlyCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Pengeluaran',
                data: [],
                borderColor: '#e74c3c',
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Trend Pengeluaran Bulanan'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'Rp ' + value.toLocaleString('id-ID');
                        }
                    }
                }
            }
        }
    });
    
    // Chart 3: Progress Goal
    progressChart = new Chart(progressCtx, {
        type: 'doughnut',
        data: {
            labels: ['Tercapai', 'Sisa'],
            datasets: [{
                data: [0, 100],
                backgroundColor: ['#2ecc71', '#ecf0f1']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Progress Target'
                }
            }
        }
    });
    
    // Update data chart
    updateExpenseChart();
    updateMonthlyTrendChart();
    updateProgressChart();
}

function updateExpenseChart() {
    try {
        console.log('🔄 updateExpenseChart() called');
        
        // 1. CEK APAKAH CANVAS ELEMENT ADA DI DOM
        const canvas = document.getElementById('expenseChart');
        if (!canvas) {
            console.warn('⚠️ Canvas "expenseChart" tidak ditemukan di DOM');
            // Coba lagi dalam 200ms jika masih loading
            setTimeout(updateExpenseChart, 200);
            return;
        }
        
        // 2. CEK APAKAH INI BENAR-BENAR CANVAS ELEMENT
        if (typeof canvas.getContext !== 'function') {
            console.error('❌ Element dengan ID "expenseChart" bukan canvas:', canvas);
            return;
        }
        
        // 3. CEK DAN INISIALISASI CHART JIKA PERLU
        if (!expenseChart || typeof expenseChart.destroy !== 'function') {
            console.log('📊 Membuat chart baru...');
            
            // Destroy chart lama jika ada (safety)
            if (expenseChart && expenseChart.destroy) {
                try {
                    expenseChart.destroy();
                } catch (e) {
                    console.log('Chart lama sudah di-destroy');
                }
            }
            
            // Buat chart baru
            const ctx = canvas.getContext('2d');
            expenseChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: [],
                    datasets: [{
                        data: [],
                        backgroundColor: ['#2ecc71', '#3498db', '#9b59b6', '#f1c40f', '#e74c3c'],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                usePointStyle: true
                            }
                        }
                    }
                }
            });
            console.log('✅ Chart baru berhasil dibuat');
        }
        
        // 4. HITUNG DATA DARI EXPENSES
        const categories = {
            'keluarga': { total: 0, displayName: 'Keluarga' },
            'kebutuhan': { total: 0, displayName: 'Kebutuhan' },
            'hiburan': { total: 0, displayName: 'Hiburan' },
            'investasi': { total: 0, displayName: 'Investasi' },
            'lainnya': { total: 0, displayName: 'Lainnya' }
        };
        
        let totalExpenses = 0;
        expenses.forEach(exp => {
            const category = exp.category || 'lainnya';
            if (categories[category]) {
                categories[category].total += exp.amount;
                totalExpenses += exp.amount;
            } else {
                categories['lainnya'].total += exp.amount;
                totalExpenses += exp.amount;
            }
        });
        
        // 5. FILTER HANYA KATEGORI YANG ADA DATANYA
        const labels = [];
        const data = [];
        const backgroundColors = [];
        const colorMap = {
            'keluarga': '#e74c3c',
            'kebutuhan': '#3498db',
            'hiburan': '#9b59b6',
            'investasi': '#2ecc71',
            'lainnya': '#f39c12'
        };
        
        Object.entries(categories).forEach(([key, value]) => {
            if (value.total > 0) {
                labels.push(value.displayName);
                data.push(value.total);
                backgroundColors.push(colorMap[key] || '#95a5a6');
            }
        });
        
        // 6. UPDATE CHART DATA
        if (expenseChart && expenseChart.data) {
            expenseChart.data.labels = labels;
            expenseChart.data.datasets[0].data = data;
            expenseChart.data.datasets[0].backgroundColor = backgroundColors;
            
            // Update chart dengan animasi
            expenseChart.update('active');
            console.log('📈 Chart updated with', data.length, 'categories');
        }
        
        // 7. UPDATE SUMMARY DI DASHBOARD
        const summaryDiv = document.getElementById('categories-summary');
        if (summaryDiv) {
            if (data.length > 0) {
                // Cari kategori terbesar
                let maxIndex = 0;
                let maxValue = 0;
                data.forEach((value, index) => {
                    if (value > maxValue) {
                        maxValue = value;
                        maxIndex = index;
                    }
                });
                
                // Hitung persentase
                const percentages = data.map(value => 
                    totalExpenses > 0 ? ((value / totalExpenses) * 100).toFixed(1) : 0
                );
                
                summaryDiv.innerHTML = `
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
                        <div style="background: #f8f9fa; padding: 10px; border-radius: 8px;">
                            <strong>📊 Total</strong><br>
                            ${formatCurrency(totalExpenses)}
                        </div>
                        <div style="background: #f8f9fa; padding: 10px; border-radius: 8px;">
                            <strong>🏆 Terbesar</strong><br>
                            ${labels[maxIndex]} (${percentages[maxIndex]}%)
                        </div>
                        <div style="background: #f8f9fa; padding: 10px; border-radius: 8px;">
                            <strong>📦 Kategori</strong><br>
                            ${data.length} dari 5
                        </div>
                    </div>
                    <div style="margin-top: 15px; font-size: 0.9em; color: #666;">
                        <strong>Detail per Kategori:</strong>
                        <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 5px;">
                            ${labels.map((label, index) => `
                                <span style="background: ${backgroundColors[index]}; color: white; padding: 3px 8px; border-radius: 12px; font-size: 0.8em;">
                                    ${label}: ${formatCurrency(data[index])} (${percentages[index]}%)
                                </span>
                            `).join('')}
                        </div>
                    </div>
                `;
            } else {
                summaryDiv.innerHTML = `
                    <div style="text-align: center; padding: 30px; color: #95a5a6;">
                        <div style="font-size: 3em; margin-bottom: 10px;">📊</div>
                        <p><strong>Belum ada data pengeluaran</strong></p>
                        <p style="font-size: 0.9em;">Tambahkan pengeluaran pertama Anda di tab "💸 Pengeluaran"</p>
                    </div>
                `;
            }
        }
        
    } catch (error) {
        console.error('❌ Error dalam updateExpenseChart:', error);
        
        // Fallback: Update summary saja jika chart error
        const summaryDiv = document.getElementById('categories-summary');
        if (summaryDiv) {
            const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
            summaryDiv.innerHTML = `
                <div style="color: #e74c3c;">
                    <strong>⚠️ Chart tidak dapat ditampilkan</strong><br>
                    <small>Total pengeluaran: ${formatCurrency(total)}</small>
                </div>
            `;
        }
    }
}

function updateMonthlyTrendChart() {
    try {
        console.log('📊 updateMonthlyTrendChart() - FIX DISPLAY');
        
        // ⭐⭐ 1. FORCE SHOW CANVAS ⭐⭐
        const canvas = document.getElementById('monthlyTrendChart');
        if (!canvas) {
            console.error('❌ Canvas tidak ditemukan!');
            return;
        }
        
        // HAPUS display: none dan set size
        canvas.style.display = 'block';
        canvas.style.width = '100%';
        canvas.style.height = '350px';
        console.log('✅ Canvas di-show');
        
        // ⭐⭐ 2. DESTROY CHART LAMA ⭐⭐
        if (monthlyTrendChart) {
            try {
                monthlyTrendChart.destroy();
            } catch (e) {
                console.log('Chart sudah di-destroy');
            }
            monthlyTrendChart = null;
        }
        
        // ⭐⭐ 3. BUAT CHART SANGAT SIMPLE DULU ⭐⭐
        const ctx = canvas.getContext('2d');
        
        // Data dummy untuk test
        const labels = ['Jan 2025', 'Feb 2025', 'Mar 2025', 'Apr 2025'];
        const incomeData = [5000000, 7000000, 6000000, 8000000];
        const expenseData = [3000000, 4000000, 3500000, 5000000];
        
        monthlyTrendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: '💰 Pendapatan',
                        data: incomeData,
                        borderColor: '#2ecc71',
                        backgroundColor: 'rgba(46, 204, 113, 0.1)',
                        tension: 0.3,
                        borderWidth: 2
                    },
                    {
                        label: '💸 Pengeluaran',
                        data: expenseData,
                        borderColor: '#e74c3c',
                        backgroundColor: 'rgba(231, 76, 60, 0.1)',
                        tension: 0.3,
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'Rp ' + (value / 1000000).toFixed(0) + ' Jt';
                            }
                        }
                    }
                }
            }
        });
        
        console.log('✅ Chart TEST berhasil dibuat!');
        
        // ⭐⭐ 4. SETELAH 1 DETIK, UPDATE DENGAN DATA ASLI ⭐⭐
        setTimeout(() => {
            updateMonthlyTrendChartWithRealData();
        }, 1000);
        
    } catch (error) {
        console.error('❌ Error in updateMonthlyTrendChart:', error);
    }
}

// Fungsi terpisah untuk data real
function updateMonthlyTrendChartWithRealData() {
    try {
        console.log('📊 Loading real data...');
        
        if (!monthlyTrendChart) return;
        
        // Hitung data real
        const monthlyData = {};
        
        // Proses income
        incomeRecords.forEach(item => {
            try {
                const date = new Date(item.date);
                const key = `${date.getFullYear()}-${date.getMonth()}`;
                if (!monthlyData[key]) {
                    monthlyData[key] = { income: 0, expense: 0 };
                }
                monthlyData[key].income += item.amount || 0;
            } catch (e) {
                console.warn('Error income:', e);
            }
        });
        
        // Proses expense
        expenses.forEach(item => {
            try {
                const date = new Date(item.date);
                const key = `${date.getFullYear()}-${date.getMonth()}`;
                if (!monthlyData[key]) {
                    monthlyData[key] = { income: 0, expense: 0 };
                }
                monthlyData[key].expense += item.amount || 0;
            } catch (e) {
                console.warn('Error expense:', e);
            }
        });
        
        // Sort keys
        const sortedKeys = Object.keys(monthlyData).sort();
        const labels = [];
        const incomeData = [];
        const expenseData = [];
        
        sortedKeys.forEach(key => {
            const [year, month] = key.split('-');
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 
                               'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
            labels.push(`${monthNames[parseInt(month)]} ${year}`);
            incomeData.push(monthlyData[key].income);
            expenseData.push(monthlyData[key].expense);
        });
        
        // Update chart dengan data real
        monthlyTrendChart.data.labels = labels.length > 0 ? labels : ['Belum ada data'];
        monthlyTrendChart.data.datasets[0].data = incomeData.length > 0 ? incomeData : [0];
        monthlyTrendChart.data.datasets[1].data = expenseData.length > 0 ? expenseData : [0];
        monthlyTrendChart.update();
        
        console.log('✅ Real data loaded:', {
            labels: labels,
            income: incomeData,
            expense: expenseData
        });
        
    } catch (error) {
        console.error('❌ Error loading real data:', error);
    }
}

// Helper function untuk nama bulan
function getMonthName(monthIndex) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 
                   'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return months[monthIndex] || '???';
}

// Fungsi terpisah untuk summary
function updateMonthlySummary(incomeData, expenseData, balanceData) {
    const summaryDiv = document.getElementById('monthly-summary');
    if (!summaryDiv) return;
    
    const totalIncome = incomeData.reduce((a, b) => a + b, 0);
    const totalExpense = expenseData.reduce((a, b) => a + b, 0);
    const totalBalance = totalIncome - totalExpense;
    
    // Cari bulan tertinggi
    const maxIncome = Math.max(...incomeData);
    const maxExpense = Math.max(...expenseData);
    const maxIncomeMonth = incomeData.indexOf(maxIncome);
    const maxExpenseMonth = expenseData.indexOf(maxExpense);
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 
                       'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    
    summaryDiv.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 15px;">
            <div style="background: #f0f8f0; padding: 10px; border-radius: 8px; border-left: 4px solid #2ecc71;">
                <div style="font-size: 0.9em; opacity: 0.8;">💰 Pendapatan</div>
                <div style="font-weight: bold; font-size: 1.1em;">${formatCurrency(totalIncome)}</div>
            </div>
            <div style="background: #fff0f0; padding: 10px; border-radius: 8px; border-left: 4px solid #e74c3c;">
                <div style="font-size: 0.9em; opacity: 0.8;">💸 Pengeluaran</div>
                <div style="font-weight: bold; font-size: 1.1em;">${formatCurrency(totalExpense)}</div>
            </div>
            <div style="background: #f0f4f8; padding: 10px; border-radius: 8px; border-left: 4px solid #3498db;">
                <div style="font-size: 0.9em; opacity: 0.8;">📊 Saldo</div>
                <div style="font-weight: bold; font-size: 1.1em; color: ${totalBalance >= 0 ? '#27ae60' : '#e74c3c'}">
                    ${formatCurrency(totalBalance)}
                </div>
            </div>
        </div>
        
        <div style="font-size: 0.9em; color: #666;">
            <div style="margin-bottom: 5px;">
                <strong>🏆 Tertinggi:</strong> 
                Pendapatan: ${monthNames[maxIncomeMonth]} (${formatCurrency(maxIncome)})
            </div>
            <div>
                <strong>📉 Tertinggi:</strong> 
                Pengeluaran: ${monthNames[maxExpenseMonth]} (${formatCurrency(maxExpense)})
            </div>
        </div>
    `;
}

function updateProgressChart() {
    try {
        console.log('🎯 updateProgressChart() called - WITH EMOJIS');
        
        // Safety check
        const canvas = document.getElementById('progressChart');
        if (!canvas || !canvas.getContext) {
            console.warn('⏳ Menunggu canvas progressChart...');
            setTimeout(updateProgressChart, 100);
            return;
        }
        
        // ⭐⭐⭐ PERHITUNGAN YANG BENAR & LOGIS ⭐⭐⭐
        const totalIncome = incomeRecords.reduce((sum, item) => sum + (item.amount || 0), 0);
        const totalExpenses = expenses.reduce((sum, item) => sum + (item.amount || 0), 0);
        const totalSaved = Math.max(0, totalIncome - totalExpenses);
        
        const target = appSettings.targetAmount || 300000000;
        
        // Progress percentage
        const progressPercent = Math.min(100, ((totalSaved / target) * 100) || 0).toFixed(1);
        const percentNum = parseFloat(progressPercent);
        
        console.log('📊 Data:', {
            'Pendapatan Total': formatCurrency(totalIncome),
            'Pengeluaran Total': formatCurrency(totalExpenses),
            'Tabungan Saat Ini': formatCurrency(totalSaved),
            'Target': formatCurrency(target),
            'Progress': progressPercent + '%'
        });
        
        // ⭐⭐⭐ EMOTICON BERDASARKAN PROGRESS ⭐⭐⭐
        let statusEmoji = '😟';
        let statusText = 'Mulai menabung!';
        let statusColor = '#e74c3c';
        
        if (percentNum >= 100) {
            statusEmoji = '🎉';
            statusText = 'TARGET TERCAPAI!';
            statusColor = '#2ecc71';
        } else if (percentNum >= 75) {
            statusEmoji = '👍';
            statusText = 'Sangat baik!';
            statusColor = '#27ae60';
        } else if (percentNum >= 50) {
            statusEmoji = '📈';
            statusText = 'Setengah jalan!';
            statusColor = '#f39c12';
        } else if (percentNum >= 25) {
            statusEmoji = '⚡';
            statusText = 'Teruskan!';
            statusColor = '#3498db';
        }
        
        // ⭐⭐⭐ DATA CHART YANG BENAR & LOGIS ⭐⭐⭐
        // Grafik harus menunjukkan: TARGET vs TERKUMPUL (BUKAN kekurangan)
        const chartData = [
            totalSaved,  // TERKUMPUL - Berapa yang sudah ada
            target       // TARGET - Berapa yang harus dicapai
        ];
        
        // Warna yang logis: Hijau untuk terkumpul, Abu-abu untuk target
        const backgroundColors = [
            statusColor,  // ⭐ WARNA SESUAI STATUS EMOTICON
            'rgba(189, 195, 199, 0.5)'  // ABU-ABU transparan untuk TARGET
        ];
        
        // Label yang jelas (tanpa emoticon di chart label)
        const chartLabels = [
            `Terkumpul (${progressPercent}%)`,
            `Target (100%)`
        ];
        
        // Inisialisasi atau update chart
        if (!progressChart || !progressChart.update) {
            console.log('🔄 Membuat progress chart baru...');
            const ctx = canvas.getContext('2d');
            
            // Destroy chart lama jika ada
            if (progressChart && progressChart.destroy) {
                progressChart.destroy();
            }
            
            // Buat chart baru dengan visualisasi yang jelas
            progressChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: chartLabels,
                    datasets: [{
                        label: 'Jumlah (Rupiah)',
                        data: chartData,
                        backgroundColor: backgroundColors,
                        borderColor: [
                            statusColor === '#2ecc71' ? '#27ae60' : 
                            statusColor === '#f39c12' ? '#d35400' : 
                            statusColor === '#3498db' ? '#2980b9' : 
                            '#c0392b',
                            '#95a5a6'
                        ],
                        borderWidth: 1,
                        barPercentage: 0.6,
                        borderRadius: 5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y', // Horizontal bars
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label;
                                    const value = context.parsed.x;
                                    
                                    if (label.includes('Terkumpul')) {
                                        return `${statusEmoji} Tabungan terkumpul: ${formatCurrency(value)}`;
                                    } else {
                                        return `🎯 Target total: ${formatCurrency(value)}`;
                                    }
                                },
                                afterLabel: function(context) {
                                    if (context.label.includes('Terkumpul')) {
                                        const needed = target - totalSaved;
                                        if (needed > 0) {
                                            return `📊 Masih perlu: ${formatCurrency(needed)}`;
                                        } else {
                                            return `🎉 Target tercapai!`;
                                        }
                                    }
                                    return '';
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            beginAtZero: true,
                            max: Math.max(target * 1.1, totalSaved * 1.2), // Beri ruang ekstra
                            ticks: {
                                callback: function(value) {
                                    if (value >= 1000000) {
                                        return 'Rp ' + (value / 1000000).toFixed(0) + ' Jt';
                                    }
                                    return 'Rp ' + value.toLocaleString();
                                },
                                font: {
                                    size: 11
                                }
                            },
                            title: {
                                display: true,
                                text: 'Jumlah (Rupiah)'
                            }
                        },
                        y: {
                            ticks: {
                                font: {
                                    size: 13,
                                    weight: 'bold'
                                }
                            },
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        } else {
            // Update chart yang sudah ada
            progressChart.data.labels = chartLabels;
            progressChart.data.datasets[0].data = chartData;
            progressChart.data.datasets[0].backgroundColor = backgroundColors;
        }
        
        // Update chart
        progressChart.update('active');
        
        // ⭐⭐⭐ UPDATE SUMMARY DENGAN EMOTICON BESAR ⭐⭐⭐
        const summaryDiv = document.getElementById('progress-summary');
        if (summaryDiv) {
            const needed = Math.max(0, target - totalSaved);
            const remainingDays = calculateRemainingDays();
            const monthsLeft = Math.max(1, remainingDays / 30.44); // Konversi hari ke bulan
            const neededPerMonth = needed / monthsLeft;
            
            // Tampilkan juga total pendapatan & pengeluaran
            const totalIncomeAllTime = incomeRecords.reduce((sum, item) => sum + (item.amount || 0), 0);
            const totalExpensesAllTime = expenses.reduce((sum, item) => sum + (item.amount || 0), 0);
            
            summaryDiv.innerHTML = `
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="font-size: 3em;">${statusEmoji}</div>
                    <h3 style="color: ${statusColor}; margin: 10px 0;">${statusText}</h3>
                    <div style="font-size: 2em; font-weight: bold; color: #2c3e50;">
                        ${progressPercent}%
                    </div>
                    <small>Progress menuju target Rp ${(target/1000000).toFixed(0)} juta</small>
                </div>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                    <div style="margin-bottom: 15px;">
                        <div style="font-size: 0.9em; color: #7f8c8d; margin-bottom: 5px;">📊 Asal Tabungan:</div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                            <div style="background: #e8f6ef; padding: 10px; border-radius: 5px; text-align: center;">
                                <div style="font-size: 1.2em; margin-bottom: 5px;">💰</div>
                                <div style="font-size: 0.85em; color: #27ae60;">Total Pendapatan</div>
                                <div style="font-weight: bold;">${formatCurrency(totalIncomeAllTime)}</div>
                            </div>
                            <div style="background: #ffebee; padding: 10px; border-radius: 5px; text-align: center;">
                                <div style="font-size: 1.2em; margin-bottom: 5px;">💸</div>
                                <div style="font-size: 0.85em; color: #e74c3c;">Total Pengeluaran</div>
                                <div style="font-weight: bold;">${formatCurrency(totalExpensesAllTime)}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="border-top: 1px solid #eee; padding-top: 15px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; align-items: center;">
                            <span style="color: ${statusColor}; font-weight: bold; font-size: 1.1em;">
                                ${statusEmoji} Tabungan Saat Ini
                            </span>
                            <strong style="font-size: 1.2em;">${formatCurrency(totalSaved)}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; align-items: center;">
                            <span style="font-weight: bold;">🎯 Target Akhir</span>
                            <strong>${formatCurrency(target)}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; align-items: center; color: ${needed > 0 ? '#e74c3c' : '#2ecc71'};">
                            <span style="font-weight: bold;">📉 Sisa yang Perlu</span>
                            <strong style="font-size: 1.1em;">${formatCurrency(needed)}</strong>
                        </div>
                    </div>
                </div>
                
                <div style="background: ${statusColor}15; padding: 15px; border-radius: 8px; border-left: 4px solid ${statusColor};">
                    <div style="margin-bottom: 10px;">
                        <div style="font-weight: bold; color: ${statusColor}; margin-bottom: 8px;">
                            📅 Rencana Bulanan
                        </div>
                       <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span>⏳ Sisa Waktu:</span>
                            <strong>${monthsLeft.toFixed(1)} bulan (${(monthsLeft/12).toFixed(1)} tahun)</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span>💰 Perlu Tabung/Bulan:</span>
                            <strong style="color: ${neededPerMonth > 0 ? '#e74c3c' : '#2ecc71'}; font-size: 1.1em;">
                                ${formatCurrency(neededPerMonth)}
                            </strong>
                        </div>
                    </div>
                    
                    <!-- ⭐⭐ TIPS BERDASARKAN PROGRESS ⭐⭐ -->
                    <div style="margin-top: 15px; padding-top: 10px; border-top: 1px dashed rgba(0,0,0,0.1);">
                        <div style="font-size: 0.9em; color: #666;">
                            <strong>💡 Tips:</strong> ${getProgressTip(percentNum)}
                        </div>
                    </div>
                </div>
            `;
        }
        
        console.log('✅ Progress chart updated dengan emoticon:', { 
            statusEmoji: statusEmoji,
            statusText: statusText,
            percent: progressPercent + '%'
        });
        
    } catch (error) {
        console.error('❌ Error in updateProgressChart:', error);
    }
}

// Fungsi summary yang diperbaiki
function updateProgressSummary(totalSaved, target, progressPercent) {
    const summaryDiv = document.getElementById('progress-summary');
    if (!summaryDiv) return;
    
    const needed = Math.max(0, target - totalSaved);
    
    // ⭐⭐⭐ PAKAI TIMELINE SYSTEM BARU ⭐⭐⭐
    const remainingDays = calculateRemainingDays();
    const monthsLeft = Math.max(1, remainingDays / 30.44);
    const neededPerMonth = needed / monthsLeft;
    
    const totalIncome = incomeRecords.reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + (item.amount || 0), 0);
    
    // Hitung timeline durasi
    const timelineYears = currentTimeline.totalDays ? (currentTimeline.totalDays / 365).toFixed(1) : '3';
    
    summaryDiv.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <div style="font-size: 2.5em;">${progressPercent >= 100 ? '🎉' : '📈'}</div>
            <div style="font-size: 2em; font-weight: bold; color: #2c3e50; margin: 10px 0;">
                ${progressPercent}%
            </div>
            <div style="color: #7f8c8d;">Dari target Rp ${(target/1000000).toFixed(0)} juta</div>
        </div>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
            <div style="margin-bottom: 15px;">
                <div style="font-weight: bold; color: #2c3e50; margin-bottom: 8px;">📊 Perhitungan Tabungan:</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div style="background: #e8f6ef; padding: 8px; border-radius: 5px;">
                        <div style="font-size: 0.85em; color: #27ae60;">💰 Total Pendapatan</div>
                        <div>${formatCurrency(totalIncome)}</div>
                    </div>
                    <div style="background: #ffebee; padding: 8px; border-radius: 5px;">
                        <div style="font-size: 0.85em; color: #e74c3c;">💸 Total Pengeluaran</div>
                        <div>${formatCurrency(totalExpenses)}</div>
                    </div>
                </div>
            </div>
            
            <div style="border-top: 1px solid #eee; padding-top: 15px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span style="color: #2ecc71; font-weight: bold;">✅ Tabungan Saat Ini:</span>
                    <strong>${formatCurrency(totalSaved)}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span>🎯 Target Akhir:</span>
                    <strong>${formatCurrency(target)}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: ${needed > 0 ? '#e74c3c' : '#2ecc71'};">
                    <span>📉 Sisa yang Perlu Ditabung:</span>
                    <strong>${formatCurrency(needed)}</strong>
                </div>
            </div>
            
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed #ddd;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span>⏳ Sisa Waktu:</span>
                    <strong>${monthsLeft.toFixed(1)} bulan</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span>📅 Total Timeline:</span>
                    <strong>${timelineYears} tahun (${currentTimeline.totalDays || 1095} hari)</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>💰 Perlu Tabung/Bulan:</span>
                    <strong style="color: ${neededPerMonth > 0 ? '#e74c3c' : '#2ecc71'}">
                        ${formatCurrency(neededPerMonth)}
                    </strong>
                </div>
            </div>
        </div>
    `;
}

// Helper function - PASTIKAN INI ADA
function getProgressTip(percent) {
    if (percent >= 100) return 'Target tercapai! Pertimbangkan untuk meningkatkan target atau mulai investasi.';
    if (percent >= 75) return 'Tinggal sedikit lagi! Hindari pengeluaran besar bulan ini.';
    if (percent >= 50) return 'Setengah jalan! Evaluasi pengeluaran untuk percepat tabungan.';
    if (percent >= 25) return 'Bagus! Pertahankan konsistensi menabung.';
    return 'Fokus pada pendapatan tambahan dan kurangi pengeluaran tidak penting.';
}

function updateChartSummaries() {
    // Update semua summary
    const categoriesDiv = document.getElementById('categories-summary');
    const monthlyDiv = document.getElementById('monthly-summary');
    const progressDiv = document.getElementById('progress-summary');
    
    if (categoriesDiv && categoriesDiv.style.display !== 'none') {
        // Trigger update untuk summary yang aktif
        if (document.querySelector('.chart-tab[data-chart="categories"]').classList.contains('active')) {
            updateExpenseChart();
        }
    }
}

// ========== 📅 FUNGSI UTILITAS & HELPER ==========
function getCurrentMonth() {
    const now = new Date();
    return now.toISOString().slice(0, 7); // YYYY-MM
}

function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (e) {
        return dateString;
    }
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function validateNumberInput(value) {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0;
}

// ========== 🚀 START APLIKASI ==========
// Fungsi konfirmasi import (harus di global scope)
window.confirmImport = function(data) {
    if (!confirm('Import data akan mengganti semua data yang ada. Lanjutkan?')) {
        return;
    }
    
    expenses = data.expenses || [];
    incomeRecords = data.income || [];
    appSettings = data.settings || {
        targetAmount: 300000000,
        timelineYears: 3
    };
    
    saveToLocalStorage();
    
    // Update UI
    renderExpenseList();
    renderIncomeList();
    updateDashboard();
    
    // Hide preview
    document.getElementById('import-preview').style.display = 'none';
    document.getElementById('import-file').value = '';
    
    showAlert('success', 'Data berhasil di-import!');
};

window.cancelImport = function() {
    document.getElementById('import-preview').style.display = 'none';
    document.getElementById('import-file').value = '';
};

// Start aplikasi ketika DOM siap
document.addEventListener('DOMContentLoaded', function() {
    // Check jika Chart.js sudah load
    if (typeof Chart === 'undefined') {
        console.error('Chart.js belum load!');
        document.body.innerHTML += '<div style="background: #f8d7da; color: #721c24; padding: 20px; margin: 20px; border-radius: 5px;">Error: Chart.js gagal load. Pastikan internet aktif.</div>';
        return;
    }
    
    initializeApp();
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp(); // DOM sudah siap
}

// Fungsi helper untuk checklist
window.saveChecklistItem = function(id, text) {
    console.log(`Checklist item ${id} disimpan: ${text}`);
    // Implementasi save ke localStorage jika perlu
};

// ========== 📱 QR CODE FUNCTION ==========
function generateQRCode() {
    console.log("=== Auto-Generate QR ===");
    
    const qrContainer = document.getElementById('qrCode');
    if (!qrContainer) return;
    
    // Clear container
    qrContainer.innerHTML = '<p>Generating QR... ⏳</p>';
    
    // AUTO-DETECT URL
    let urlToEncode;
    const qrTextInput = document.getElementById('qrText');
    
    if (qrTextInput && qrTextInput.value.trim() !== '') {
        // Pakai input user jika ada
        urlToEncode = qrTextInput.value.trim();
    } else {
        // Auto-generate URL GitHub Pages Anda
        // Ganti dengan URL GitHub Pages Anda yang sebenarnya
        urlToEncode = "https://linzhijun87-ui.github.io/financial-app/";
        
        // OPSI: Auto-detect jika sedang di GitHub Pages
        if (window.location.hostname.includes('github.io')) {
            urlToEncode = window.location.href;
        }
        
        // Update input field juga
        if (qrTextInput) {
            qrTextInput.value = urlToEncode;
        }
    }
    
    console.log("Generating QR for:", urlToEncode);
    
    // Generate QR Code
    try {
        qrContainer.innerHTML = '';
        
        new QRCode(qrContainer, {
            text: urlToEncode,
            width: 200,
            height: 200,
            colorDark: document.body.classList.contains('dark-mode') ? "#ffffff" : "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
        
        console.log("✅ QR Code generated!");
        
        // Auto-add download button
        setTimeout(() => {
            const canvas = qrContainer.querySelector('canvas');
            if (canvas) {
                const downloadBtn = document.createElement('button');
                downloadBtn.innerHTML = '📥 Download QR';
                downloadBtn.className = 'btn';
                downloadBtn.style.cssText = `
                    margin-top: 15px;
                    padding: 10px 20px;
                    background: #4CAF50;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                `;
                
                downloadBtn.onclick = function() {
                    const link = document.createElement('a');
                    link.download = 'financial-app-qr.png';
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                };
                
                qrContainer.appendChild(downloadBtn);
                
                // Tambah text URL
                const urlText = document.createElement('p');
                urlText.innerHTML = `<small>URL: <code>${urlToEncode}</code></small>`;
                urlText.style.marginTop = '10px';
                urlText.style.fontSize = '12px';
                qrContainer.appendChild(urlText);
            }
        }, 500);
        
    } catch (error) {
        console.error("Error:", error);
        qrContainer.innerHTML = `<p style="color:red">❌ Error: ${error.message}</p>`;
    }
}

// Load QRCode library jika mau
function loadQRCodeLibrary() {
    if (typeof QRCode === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js';
        document.head.appendChild(script);
        console.log('QRCode library loading...');
    }
}

// Tambah di script-fixed.js
function exportDataToQR() {
    const allData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        expenses: JSON.parse(localStorage.getItem('expenses') || '[]'),
        income: JSON.parse(localStorage.getItem('income') || '[]'),
        checklists: JSON.parse(localStorage.getItem('checklists') || '[]'),
        settings: JSON.parse(localStorage.getItem('settings') || '{}')
    };
    
    const encodedData = btoa(JSON.stringify(allData)); // Encode to base64
    document.getElementById('qrText').value = encodedData;
    generateQRCode();
    
    // Add decode button
    const container = document.getElementById('qrCode');
    const decodeBtn = document.createElement('button');
    decodeBtn.textContent = '📥 Import Data dari QR Ini';
    decodeBtn.onclick = () => {
        const data = prompt('Paste encoded data dari QR:');
        if (data) {
            try {
                const decoded = JSON.parse(atob(data));
                // Save to localStorage
                localStorage.setItem('expenses', JSON.stringify(decoded.expenses));
                localStorage.setItem('income', JSON.stringify(decoded.income));
                localStorage.setItem('checklists', JSON.stringify(decoded.checklists));
                localStorage.setItem('settings', JSON.stringify(decoded.settings));
                alert('✅ Data imported! Page will reload.');
                location.reload();
            } catch (e) {
                alert('❌ Invalid data format');
            }
        }
    };
    container.appendChild(decodeBtn);
}

// ⭐⭐⭐ FUNGSI UNTUK DAPATKAN TOTAL TAHUN DARI TIMELINE ⭐⭐⭐
function getTimelineYears() {
    if (!currentTimeline.totalDays) return 3; // Fallback
    return currentTimeline.totalDays / 365;
}

// ⭐⭐⭐ FUNGSI UNTUK DAPATKAN BULAN TERSISA ⭐⭐⭐
function getRemainingMonths() {
    const remainingDays = calculateRemainingDays();
    return Math.max(1, remainingDays / 30.44);
}

function migrateOldData() {
    // Jika ada timelineYears di appSettings, konversi ke timeline system
    if (appSettings.timelineYears) {
        console.log("🔄 Migrating old timelineYears:", appSettings.timelineYears);
        
        // Jika timeline sudah ada, jangan timpa
        if (!currentTimeline.endDate) {
            const today = new Date();
            const endDate = new Date(today);
            endDate.setFullYear(today.getFullYear() + appSettings.timelineYears);
            
            currentTimeline = {
                startDate: today.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                totalDays: appSettings.timelineYears * 365,
                createdAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
            };
            
            localStorage.setItem('financial_timeline', JSON.stringify(currentTimeline));
            console.log("✅ Migrated to new timeline system");
        }
        
        // ⭐⭐⭐ OPSIONAL: Hapus timelineYears dari appSettings ⭐⭐⭐
        // delete appSettings.timelineYears;
        // localStorage.setItem('financial_settings', JSON.stringify(appSettings));
    }
}

// Emergency fix untuk timeline yang corrupt
function fixTimelineEmergency() {
    console.log("🆘 Applying emergency timeline fix...");
    
    const today = new Date();
    const endDate = new Date(today);
    endDate.setFullYear(today.getFullYear() + 3);
    
    currentTimeline = {
        startDate: today.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        totalDays: 1095,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem('financial_timeline', JSON.stringify(currentTimeline));
    
    console.log("✅ Timeline fixed:", currentTimeline);
    updateHeaderRemainingDays();
    alert("Timeline diperbaiki! Refresh halaman.");
}

// Panggil di console browser: fixTimelineEmergency()

// Auto load saat buka tab settings
document.addEventListener('DOMContentLoaded', function() {
    // Load library saat pertama kali
    setTimeout(loadQRCodeLibrary, 2000);
});

// ===== ENHANCED FUNCTIONS =====

// Target Preset
function setTargetPreset(amountInMillions) {
    document.getElementById('target-amount-input').value = amountInMillions;
    showValidationMessage(`Target diset ke Rp ${amountInMillions} juta`, 'success');
}

// Enhanced Timeline Save with Animation
function safeSaveTimeline() {
    console.log("💾 Saving timeline with animation...");
    
    // Show loading state
    const saveBtn = document.querySelector('[onclick*="safeSaveTimeline"]');
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '⏳ Menyimpan...';
    saveBtn.disabled = true;
    
    // Open settings if needed
    if (currentView !== 'settings') {
        showTab('settings');
        setTimeout(() => {
            actuallySaveTimeline(saveBtn, originalText);
        }, 400);
    } else {
        actuallySaveTimeline(saveBtn, originalText);
    }
}

function actuallySaveTimeline(saveBtn, originalText) {
    try {
        saveTimeline();
        showValidationMessage('Timeline berhasil disimpan!', 'success');
        
        // Animate timeline summary update
        animateTimelineUpdate();
        
    } catch (error) {
        showValidationMessage('Gagal menyimpan timeline', 'error');
    } finally {
        // Restore button
        setTimeout(() => {
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
        }, 1000);
    }
}

// Validation Message Helper
function showValidationMessage(message, type) {
    const validationDiv = document.getElementById('timeline-validation');
    if (validationDiv) {
        validationDiv.textContent = message;
        validationDiv.className = `validation-message ${type}`;
        validationDiv.style.display = 'block';
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            validationDiv.style.display = 'none';
        }, 3000);
    }
}

// Animation for timeline update
function animateTimelineUpdate() {
    const elements = ['display-days-left', 'display-timeline-progress'];
    
    elements.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.style.transform = 'scale(1.1)';
            el.style.transition = 'transform 0.3s';
            
            setTimeout(() => {
                el.style.transform = 'scale(1)';
            }, 300);
        }
    });
}

// Enhanced Date Input Interaction
function setupDateInputEnhancements() {
    console.log("🎯 Setting up date input enhancements...");
    
    const startInput = document.getElementById('start-date');
    const endInput = document.getElementById('end-date');
    
    if (!startInput || !endInput) {
        console.warn("⚠️ Date inputs not found, retrying in 500ms...");
        setTimeout(setupDateInputEnhancements, 500);
        return;
    }
    
    console.log("✅ Date inputs found, setting up listeners...");
    
    // Real-time validation on change
    [startInput, endInput].forEach(input => {
        // Remove existing listeners first (avoid duplicates)
        const newInput = input.cloneNode(true);
        input.parentNode.replaceChild(newInput, input);
        
        // Add new listeners
        newInput.addEventListener('change', function() {
            console.log(`📅 ${this.id} changed to: ${this.value}`);
            
            // Validate
            validateTimelineInput();
            
            // Update preview
            updateTimelinePreview();
            
            // Visual feedback
            this.style.borderColor = '#3498db';
            this.style.boxShadow = '0 0 0 2px rgba(52, 152, 219, 0.2)';
            
            setTimeout(() => {
                this.style.borderColor = '';
                this.style.boxShadow = '';
            }, 1000);
        });
        
        // Focus effects
        newInput.addEventListener('focus', function() {
            this.style.borderColor = '#3498db';
            this.style.boxShadow = '0 0 0 3px rgba(52, 152, 219, 0.2)';
            this.style.transform = 'scale(1.02)';
        });
        
        newInput.addEventListener('blur', function() {
            this.style.borderColor = '';
            this.style.boxShadow = '';
            this.style.transform = 'scale(1)';
        });
    });
    
    console.log("✅ Date input enhancements setup complete");
}

// Clear Cache Function
function clearLocalStorage() {
    if (confirm('Hapus cache browser? Aplikasi akan refresh.')) {
        localStorage.clear();
        showAlert('info', 'Cache dihapus. Aplikasi akan refresh...');
        setTimeout(() => location.reload(), 1000);
    }
}

// Initialize enhancements
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        setupDateInputEnhancements();
    }, 1000);
});

// Debug helper untuk cek semua form elements
function debugFormElements() {
    console.log("=== DEBUG FORM ELEMENTS (Settings Tab) ===");
    
    const criticalElements = [
        'target-amount-input',
        'start-date',
        'end-date',
        'timeline-validation',
        'display-start-date',
        'display-end-date',
        'display-days-left',
        'display-timeline-progress'
    ];
    
    criticalElements.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            console.log(`✅ ${id}:`, {
                type: el.tagName,
                value: el.value || el.textContent || 'N/A',
                visible: el.offsetParent !== null,
                parent: el.parentElement?.id || 'N/A'
            });
        } else {
            console.log(`❌ ${id}: NOT FOUND IN DOM`);
        }
    });
    
    console.log("Current timeline:", currentTimeline);
    console.log("App settings:", appSettings);
    console.log("Active tab element:", document.querySelector('.tab-content.active')?.id);
    console.log("=========================================");
}

// Panggil di console: debugFormElements()