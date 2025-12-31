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
let currentView = 'dashboard';
let selectedCategory = 'keluarga';
let expenseChart = null;
let monthlyTrendChart = null;
let progressChart = null;
let incomeChart = null;

// ========== 🏠 FUNGSI INISIALISASI ==========
// ⭐⭐ REPLACE seluruh initializeApp() dengan ini: ⭐⭐
function initializeApp() {
    // TUNGGU sampai DOM benar-benar ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            actuallyInitializeApp();
        });
    } else {
        actuallyInitializeApp();
    }
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
        
        expenses = savedExpenses ? JSON.parse(savedExpenses) : [];
        incomeRecords = savedIncome ? JSON.parse(savedIncome) : [];
        appSettings = savedSettings ? JSON.parse(savedSettings) : {
            targetAmount: 300000000,
            timelineYears: 3
        };

        // ⭐⭐ UPDATE HEADER SETELAH LOAD DATA ⭐⭐
        updateHeaderTarget();        // 1. Target di header 🎯
        updateHeaderRemainingDays(); // 2. Sisa hari di header 📅
        
        if (currentView === 'dashboard') updateDashboardTitle();
        if (currentView === 'investments') updateSimulationTitle();
        
        // Update UI dengan data yang di-load
        // updateDashboard(); // ⭐ KALAU INI DICOMMENT, BIARKAN SAJA
        renderExpenseList();
        renderIncomeList();
        updateDashboardTitle();
        
        console.log('📂 Data loaded from localStorage');
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

function saveToLocalStorage() {
    try {
        localStorage.setItem('financial_expenses', JSON.stringify(expenses));
        localStorage.setItem('financial_income', JSON.stringify(incomeRecords));
        localStorage.setItem('financial_settings', JSON.stringify(appSettings));
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
    // Sembunyikan semua tab
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Non-aktifkan semua nav item
    document.querySelectorAll('.nav-item').forEach(nav => {
        nav.classList.remove('active');
    });
    
    // Aktifkan tab yang dipilih
    document.getElementById(`tab-${tabId}`).classList.add('active');
    
    // Aktifkan nav item yang sesuai
    document.querySelectorAll('.nav-item').forEach(nav => {
        if (nav.textContent.includes(getTabName(tabId))) {
            nav.classList.add('active');
        }
    });
    
    currentView = tabId;
    
    // Update konten tab spesifik
    switch(tabId) {
        case 'dashboard':
            updateDashboard();
            updateDashboardTitle();
            if (!expenseChart) initializeExpenseChart();
            switchChartTab('categories');
            break;
        case 'expenses':
            renderExpenseList();
            break;
        case 'income':
            renderIncomeList();
            updateIncomeChart();
            break;
        case 'checklists':
            renderChecklist();
            break;
        case 'investments':
            updateSimulation();
            updateSimulationTitle();
            break;
    }
    
    // Scroll ke atas
    window.scrollTo(0, 0);
}

function getTabName(tabId) {
    const names = {
        'dashboard': 'Dashboard',
        'expenses': 'Pengeluaran',
        'income': 'Pendapatan',
        'checklists': 'Checklist',
        'investments': 'Simulasi',
        'settings': 'Pengaturan'
    };
    return names[tabId] || tabId;
}

function updateDashboard() {
    console.log("🔄 updateDashboard() dijalankan");
    
    try {
        // 1. Hitung total tabungan
        const totalIncome = incomeRecords.reduce((sum, item) => sum + item.amount, 0);
        const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
        const totalSaved = Math.max(0, totalIncome - totalExpenses); // Tidak boleh negatif
        
        // 2. Update tabungan di UI
        document.getElementById('total-saved').textContent = formatCurrency(totalSaved);
        document.getElementById('current-month-balance').textContent = formatCurrency(totalSaved);
        document.getElementById('actual-per-month').textContent = formatCurrency(totalSaved);
        
        // 3. Hitung progress
        const target = appSettings.targetAmount || 300000000;
        const progressPercentage = Math.min(100, (totalSaved / target) * 100);
        
        document.getElementById('main-progress-bar').style.width = `${progressPercentage}%`;
        document.getElementById('main-progress-text').textContent = `${progressPercentage.toFixed(1)}%`;
        document.getElementById('overall-progress').textContent = `${progressPercentage.toFixed(1)}%`;
        
        // 4. ⭐⭐ HITUNG SISA HARI DINAMIS ⭐⭐
        const timelineYears = appSettings.timelineYears || 3;
        const targetDate = new Date();
        targetDate.setFullYear(targetDate.getFullYear() + timelineYears);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset waktu
        
        const diffTime = targetDate.getTime() - today.getTime();
        const remainingDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        
        // Update sisa hari di header
        const daysElement = document.getElementById('days-left');
        if (daysElement) {
            daysElement.textContent = remainingDays;
            
            // Warna berdasarkan urgency
            if (remainingDays > 720) {
                daysElement.style.color = '#2ecc71';
            } else if (remainingDays > 360) {
                daysElement.style.color = '#f39c12';
            } else if (remainingDays > 90) {
                daysElement.style.color = '#e67e22';
            } else {
                daysElement.style.color = '#e74c3c';
            }
        }
        
        // 5. Hitung kebutuhan bulanan BERDASARKAN HARI DINAMIS
        const monthsLeftDynamic = remainingDays / 30.44; // Rata-rata hari per bulan
        const neededPerMonth = Math.max(0, (target - totalSaved) / Math.max(1, monthsLeftDynamic));
        
        document.getElementById('needed-per-month').textContent = formatCurrency(neededPerMonth);
        
        console.log('📊 Dashboard updated:', {
            saved: formatCurrency(totalSaved),
            target: formatCurrency(target),
            progress: progressPercentage.toFixed(1) + '%',
            remainingDays: remainingDays,
            neededMonthly: formatCurrency(neededPerMonth)
        });
        
        // 6. Update chart jika ada data
        if (expenseChart) updateExpenseChart();
        if (monthlyTrendChart) updateMonthlyTrendChart();
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
    const id = 'checklist_' + Date.now();
    
    const itemHTML = `
        <div class="checklist-item-custom" id="${id}">
            <input type="checkbox" onchange="toggleChecklistItem('${id}')">
            <input type="text" placeholder="Item checklist baru" onblur="saveChecklistItem('${id}', this.value)">
            <button onclick="deleteChecklistItem('${id}')" style="background: #e74c3c; color: white; border: none; border-radius: 4px; padding: 5px 10px; margin-left: 10px; cursor: pointer;">Hapus</button>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', itemHTML);
}

function toggleChecklistItem(id) {
    const item = document.getElementById(id);
    const checkbox = item.querySelector('input[type="checkbox"]');
    
    if (checkbox.checked) {
        item.classList.add('completed');
    } else {
        item.classList.remove('completed');
    }
}

function deleteChecklistItem(id) {
    if (!confirm('Hapus item checklist ini?')) return;
    document.getElementById(id).remove();
}

function renderChecklist() {
    // Implementasi render checklist jika ada data tersimpan
    const container = document.getElementById('master-checklist');
    
    // Contoh checklist default
    const defaultChecklist = [
        { id: 'check1', text: 'Buat anggaran bulanan', completed: false },
        { id: 'check2', text: 'Tabung 30% dari pendapatan', completed: false },
        { id: 'check3', text: 'Bayar semua tagihan tepat waktu', completed: true },
        { id: 'check4', text: 'Review investasi bulanan', completed: false }
    ];
    
    let html = '';
    defaultChecklist.forEach(item => {
        html += `
            <div class="checklist-item-custom ${item.completed ? 'completed' : ''}" id="${item.id}">
                <input type="checkbox" ${item.completed ? 'checked' : ''} onchange="toggleChecklistItem('${item.id}')">
                <input type="text" value="${item.text}" onblur="saveChecklistItem('${item.id}', this.value)">
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ========== 📈 FUNGSI SIMULASI INVESTASI ==========
function updateSimulation() {
    const monthlySaving = parseInt(document.getElementById('saving-slider').value);
    const annualReturn = parseInt(document.getElementById('return-slider').value);
    
    // Update slider values
    document.getElementById('saving-slider-value').textContent = formatCurrency(monthlySaving);
    document.getElementById('return-slider-value').textContent = annualReturn + '%';
    
    // Hitung simulasi
    const years = appSettings.timelineYears || 3;
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
}

function runInvestmentSimulation() {
    // Fungsi untuk menjalankan simulasi lengkap
    updateSimulation();
}

function calculateCompoundInterest(principal, monthly, annualRate, years) {
    const monthlyRate = annualRate / 100 / 12;
    const months = years * 12;
    let total = principal;
    
    for (let i = 0; i < months; i++) {
        total = total * (1 + monthlyRate) + monthly;
    }
    
    return total;
}

// ========== ⚙️ FUNGSI PENGATURAN ==========
function saveSettings() {
  const targetInput = document.getElementById('target-amount-input');
  const yearsInput = document.getElementById('timeline-years-input');
  
  // Validasi input
  if (!targetInput || !yearsInput) {
    showAlert('Tab Pengaturan tidak ditemukan di HTML.', 'error');
    return;
  }
  
  const targetMillion = parseFloat(targetInput.value);
  const years = parseInt(yearsInput.value);
  
  if (isNaN(targetMillion) || targetMillion <= 0 || isNaN(years) || years <= 0) {
    showAlert('Harap masukkan angka yang valid untuk target dan jangka waktu.', 'warning');
    return;
  }
  
  // Simpan ke appSettings (di script-rapi.js variable-nya adalah appSettings)
  appSettings.targetAmount = targetMillion * 1000000; // Konversi juta ke rupiah
  appSettings.timelineYears = years;
  
  // Simpan ke localStorage
  saveToLocalStorage();
  
  // Perbarui UI
//   updateDashboard(); // Fungsi ini akan menghitung ulang progress
  showAlert('Pengaturan berhasil disimpan! Target diperbarui.', 'success');
  
  // Update judul dashboard agar menampilkan target baru
//   updateDashboardTitle();
}

function updateDashboardTitle() {
  const titleElement = document.getElementById('dashboard-target-title');
  if (titleElement) {
    const targetInMillions = (appSettings.targetAmount / 1000000).toFixed(0);
    titleElement.innerHTML = `Progress Menuju Rp ${targetInMillions} Juta`;
    console.log('✅ Judul diupdate via ID');
  }
}

// Fungsi untuk update Target di header
function updateHeaderTarget() {
    const target = appSettings.targetAmount || 300000000;
    const targetInJuta = (target / 1000000).toFixed(0);
    
    const headerTargetElement = document.getElementById('header-target');
    if (headerTargetElement) {
        headerTargetElement.textContent = `Rp ${targetInJuta} Juta`;
        console.log('🎯 Header target updated to:', targetInJuta + ' juta');
    }
}

// Fungsi untuk update Sisa Hari di header
function updateHeaderRemainingDays() {
    try {
        const timelineYears = appSettings.timelineYears || 3;
        const targetDate = new Date();
        targetDate.setFullYear(targetDate.getFullYear() + timelineYears);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const diffTime = targetDate.getTime() - today.getTime();
        const remainingDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        
        const daysElement = document.getElementById('days-left');
        if (daysElement) {
            daysElement.textContent = remainingDays;
            
            // Warna
            if (remainingDays > 720) daysElement.style.color = '#2ecc71';
            else if (remainingDays > 360) daysElement.style.color = '#f39c12';
            else if (remainingDays > 90) daysElement.style.color = '#e67e22';
            else daysElement.style.color = '#e74c3c';
        }
        
        return remainingDays;
        
    } catch (error) {
        console.error('Error calculating days:', error);
        return (appSettings.timelineYears || 3) * 12 * 30; // Fallback static
    }
}

function checkAndUpdateDaily() {
    const today = new Date().toDateString(); // "Mon Dec 30 2024"
    const lastUpdate = localStorage.getItem('lastDailyUpdate');
    
    if (lastUpdate !== today) {
        console.log('🔄 Daily update detected, updating counters...');
        updateHeaderRemainingDays();
        localStorage.setItem('lastDailyUpdate', today);
    }
}

function updateSimulationTitle() {
  const titleElement = document.getElementById('simulation-target-title');
  if (titleElement) {
    const targetInMillions = (appSettings.targetAmount / 1000000).toFixed(0);
    titleElement.innerHTML = `Simulasi Mencapai Rp ${targetInMillions} Juta`;
  }
}

function saveSettings() {
    const targetInput = document.getElementById('target-amount-input').value;
    const yearsInput = document.getElementById('timeline-years-input').value;
    
    let targetAmount = 300000000;
    let timelineYears = 3;
    
    // Parse target amount
    if (targetInput.includes('jt') || targetInput.includes('juta')) {
        targetAmount = parseFloat(targetInput) * 1000000;
    } else if (targetInput.includes('m') || targetInput.includes('M')) {
        targetAmount = parseFloat(targetInput) * 1000000000;
    } else {
        targetAmount = parseFloat(targetInput) * 1000000; // Asumsi angka dalam juta
    }
    
    timelineYears = parseInt(yearsInput);
    
    if (isNaN(targetAmount) || targetAmount <= 0 || isNaN(timelineYears) || timelineYears <= 0) {
        showAlert('warning', 'Harap isi target dan timeline dengan benar.');
        return;
    }
    
    appSettings.targetAmount = targetAmount;
    appSettings.timelineYears = timelineYears;
    
    saveToLocalStorage();
    
    // ⭐⭐ UPDATE SEMUA YANG PERLU ⭐⭐
    updateDashboard();           // 1. Progress bar & tabungan
    updateDashboardTitle();      // 2. Judul dashboard
    updateSimulationTitle();     // 3. Judul simulasi
    
    // ⭐⭐ TAMBAH 2 BARIS INI: ⭐⭐
    updateHeaderTarget();        // 4. Target di header 🎯
    updateHeaderRemainingDays(); // 5. Sisa hari di header 📅
    
    showAlert('success', `Target Rp ${formatCurrency(targetAmount)} dalam ${timelineYears} tahun berhasil disimpan.`);
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
            const monthsLeft = (appSettings.timelineYears || 3) * 12;
            const neededPerMonth = needed / Math.max(1, monthsLeft);
            
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
                            <strong>${monthsLeft} bulan (${appSettings.timelineYears || 3} tahun)</strong>
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
    const monthsLeft = (appSettings.timelineYears || 3) * 12;
    const neededPerMonth = needed / Math.max(1, monthsLeft);
    
    const totalIncome = incomeRecords.reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + (item.amount || 0), 0);
    
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
                    <strong>${monthsLeft} bulan</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>📅 Perlu Tabung/Bulan:</span>
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
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
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

// Auto load saat buka tab settings
document.addEventListener('DOMContentLoaded', function() {
    // Load library saat pertama kali
    setTimeout(loadQRCodeLibrary, 2000);
});