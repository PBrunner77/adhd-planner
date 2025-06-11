// Main application logic
class AppManager {
  constructor() {
    this.currentPage = 'dashboard';
    this.isInitialized = false;
    this.offlineMode = false;
    this.init();
  }

  async init() {
    try {
      // Show loading screen
      showLoading(true, 'Inizializzazione app...');

      // Setup offline detection
      this.setupOfflineDetection();

      // Wait for all managers to initialize
      await this.waitForManagers();

      // Setup navigation
      this.setupNavigation();

      // Setup global event listeners
      this.setupEventListeners();

      // Check authentication state
      this.checkAuthState();

      // Initialize page based on URL
      this.initializePage();

      // Setup PWA features
      this.setupPWA();

      this.isInitialized = true;
      console.log('App initialized successfully');

    } catch (error) {
      console.error('App initialization error:', error);
      showNotification('Errore nell\'inizializzazione dell\'app', 'error');
    } finally {
      hideLoading();
    }
  }

  setupOfflineDetection() {
    // Detect online/offline status
    window.addEventListener('online', () => {
      this.offlineMode = false;
      this.handleOnlineMode();
    });

    window.addEventListener('offline', () => {
      this.offlineMode = true;
      this.handleOfflineMode();
    });

    // Initial state
    this.offlineMode = !navigator.onLine;
  }

  handleOnlineMode() {
    showNotification('Connessione ripristinata. Sincronizzazione in corso...', 'success');
    document.body.classList.remove('offline-mode');
    
    // Trigger sync for all managers
    if (window.db) db.syncOfflineQueue();
  }

  handleOfflineMode() {
    showNotification('Modalità offline attivata. I dati verranno sincronizzati alla riconnessione.', 'warning');
    document.body.classList.add('offline-mode');
  }

  async waitForManagers() {
    // Wait for critical managers to be ready
    const checkManagers = () => {
      return window.db && 
             window.auth && 
             window.taskManager && 
             window.calendar &&
             window.templateManager &&
             window.notificationManager &&
             window.paymentManager;
    };

    // Wait up to 10 seconds for managers
    let attempts = 0;
    while (!checkManagers() && attempts < 100) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (!checkManagers()) {
      throw new Error('Timeout nell\'inizializzazione dei componenti');
    }
  }

  setupNavigation() {
    // Handle browser back/forward buttons
    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.page) {
        this.showPage(e.state.page, false);
      }
    });

    // Setup keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      this.handleKeyboardShortcuts(e);
    });
  }

  setupEventListeners() {
    // Auto-save user activity timestamp
    ['click', 'keypress', 'scroll', 'mousemove'].forEach(event => {
      document.addEventListener(event, () => {
        if (auth) auth.updateLastActivity();
      }, { passive: true });
    });

    // Handle visibility change (tab switching)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.handlePageHidden();
      } else {
        this.handlePageVisible();
      }
    });

    // Handle window beforeunload
    window.addEventListener('beforeunload', (e) => {
      this.handleBeforeUnload(e);
    });

    // Global error handler
    window.addEventListener('error', (e) => {
      this.handleGlobalError(e);
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (e) => {
      this.handleUnhandledRejection(e);
    });
  }

  handleKeyboardShortcuts(e) {
    // Only handle shortcuts when no input is focused
    if (document.activeElement.tagName === 'INPUT' || 
        document.activeElement.tagName === 'TEXTAREA') {
      return;
    }

    // Ctrl/Cmd + key shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'n':
          e.preventDefault();
          createNewTask();
          break;
        case 'f':
          e.preventDefault();
          document.getElementById('search-input')?.focus();
          break;
        case '/':
          e.preventDefault();
          this.showHelpModal();
          break;
      }
    }

    // Number keys for navigation
    if (e.key >= '1' && e.key <= '5') {
      const pages = ['dashboard', 'calendar', 'tasks', 'family', 'templates'];
      const pageIndex = parseInt(e.key) - 1;
      if (pages[pageIndex]) {
        this.showPage(pages[pageIndex]);
      }
    }

    // Escape key
    if (e.key === 'Escape') {
      this.closeAllModals();
    }
  }

  handlePageHidden() {
    // Pause any running timers or intervals when tab is hidden
    console.log('Page hidden - pausing background tasks');
  }

  handlePageVisible() {
    // Resume tasks when tab becomes visible
    console.log('Page visible - resuming background tasks');
    
    // Check for missed notifications
    if (window.notificationManager) {
      notificationManager.checkDueReminders();
    }
  }

  handleBeforeUnload(e) {
    // Check for unsaved changes
    const hasUnsavedChanges = this.checkUnsavedChanges();
    
    if (hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue = 'Hai modifiche non salvate. Sei sicuro di voler uscire?';
      return e.returnValue;
    }
  }

  handleGlobalError(e) {
    console.error('Global error:', e.error);
    
    // Don't show notification for minor errors
    if (e.error && e.error.name !== 'ChunkLoadError') {
      showNotification('Si è verificato un errore imprevisto', 'error');
    }
  }

  handleUnhandledRejection(e) {
    console.error('Unhandled promise rejection:', e.reason);
    
    // Prevent the default browser behavior
    e.preventDefault();
  }

  checkAuthState() {
    if (auth && auth.currentUser) {
      // User is logged in
      this.initializeUserInterface();
    } else {
      // User needs to log in
      auth.showAuth();
    }
  }

  async initializeUserInterface() {
    try {
      // Load initial data
      await this.loadInitialData();
      
      // Update UI
      this.updateDashboard();
      
      // Setup auto-refresh
      this.setupAutoRefresh();
      
    } catch (error) {
      console.error('UI initialization error:', error);
    }
  }

  async loadInitialData() {
    const family = getCurrentFamily();
    if (!family) return;

    try {
      // Load data in parallel
      await Promise.all([
        this.loadTodaysData(),
        this.loadFamilyMembers(),
        this.loadRecentActivity()
      ]);
    } catch (error) {
      console.error('Data loading error:', error);
    }
  }

  async loadTodaysData() {
    const today = new Date().toISOString().split('T')[0];
    
    if (window.taskManager) {
      // Load today's tasks
      const { data: tasks } = await db.getTasks(getCurrentFamily().id, { date: today });
      window.todaysTasks = tasks || [];
    }

    if (window.calendar) {
      // Load today's events
      const { data: events } = await db.getEvents(
        getCurrentFamily().id,
        today + 'T00:00:00Z',
        today + 'T23:59:59Z'
      );
      window.todaysEvents = events || [];
    }
  }

  async loadFamilyMembers() {
    try {
      const { data: members } = await db.supabase
        .from('family_members')
        .select('*')
        .eq('family_id', getCurrentFamily().id);
      
      window.familyMembers = members || [];
    } catch (error) {
      console.error('Load family members error:', error);
      window.familyMembers = [];
    }
  }

  async loadRecentActivity() {
    // Load recent activities for dashboard
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data: recentTasks } = await db.getTasks(getCurrentFamily().id, {});
      
      window.recentActivity = (recentTasks || [])
        .filter(task => new Date(task.updated_at || task.created_at) > weekAgo)
        .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
        .slice(0, 10);
    } catch (error) {
      console.error('Load recent activity error:', error);
      window.recentActivity = [];
    }
  }

  setupAutoRefresh() {
    // Refresh data every 5 minutes
    setInterval(() => {
      if (!document.hidden && !this.offlineMode) {
        this.refreshData();
      }
    }, 5 * 60 * 1000);
  }

  async refreshData() {
    try {
      await this.loadTodaysData();
      this.updateDashboard();
    } catch (error) {
      console.error('Data refresh error:', error);
    }
  }

  initializePage() {
    // Check URL hash for initial page
    const hash = window.location.hash.replace('#', '');
    const validPages = ['dashboard', 'calendar', 'tasks', 'family', 'templates'];
    
    if (hash && validPages.includes(hash)) {
      this.showPage(hash);
    } else {
      this.showPage('dashboard');
    }
  }

  showPage(pageName, updateHistory = true) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
      page.classList.remove('active');
    });

    // Show requested page
    const targetPage = document.getElementById(`${pageName}-page`);
    if (targetPage) {
      targetPage.classList.add('active');
      this.currentPage = pageName;

      // Update navigation
      this.updateNavigation(pageName);

      // Update URL
      if (updateHistory) {
        window.history.pushState({ page: pageName }, '', `#${pageName}`);
      }

      // Update page title
      this.updatePageTitle(pageName);

      // Page-specific initialization
      this.initializePageContent(pageName);
    }
  }

  updateNavigation(activePage) {
    // Update bottom navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.remove('active');
    });

    const activeTab = document.querySelector(`[onclick="showPage('${activePage}')"]`);
    if (activeTab) {
      activeTab.classList.add('active');
    }
  }

  updatePageTitle(pageName) {
    const titles = {
      dashboard: 'Dashboard - ADHD Family Planner',
      calendar: 'Calendario - ADHD Family Planner',
      tasks: 'Attività - ADHD Family Planner',
      family: 'Famiglia - ADHD Family Planner',
      templates: 'Template - ADHD Family Planner'
    };

    document.title = titles[pageName] || 'ADHD Family Planner';
  }

  initializePageContent(pageName) {
    switch (pageName) {
      case 'dashboard':
        this.updateDashboard();
        break;
      case 'calendar':
        if (window.calendar) calendar.renderCalendar();
        break;
      case 'tasks':
        if (window.taskManager) taskManager.renderTasks();
        break;
      case 'family':
        this.updateFamilyPage();
        break;
      case 'templates':
        if (window.templateManager) templateManager.renderTemplates();
        break;
    }
  }

  updateDashboard() {
    this.updateDashboardStats();
    this.updateTodaysSchedule();
    this.updateFamilyOverview();
  }

  updateDashboardStats() {
    const tasks = window.todaysTasks || [];
    const completed = tasks.filter(task => task.status === 'completed');
    const pending = tasks.filter(task => task.status === 'pending');

    // Update stat cards
    const completedElement = document.getElementById('completed-today');
    const pendingElement = document.getElementById('pending-today');
    
    if (completedElement) completedElement.textContent = completed.length;
    if (pendingElement) pendingElement.textContent = pending.length;

    // Update streak
    this.updateStreakDisplay();
  }

  updateTodaysSchedule() {
    const container = document.getElementById('today-schedule');
    if (!container) return;

    const tasks = window.todaysTasks || [];
    const events = window.todaysEvents || [];
    
    // Combine and sort by time
    const allItems = [
      ...tasks.map(task => ({ ...task, type: 'task' })),
      ...events.map(event => ({ ...event, type: 'event' }))
    ].sort((a, b) => {
      const timeA = a.time || a.start_date || '00:00';
      const timeB = b.time || b.start_date || '00:00';
      return timeA.localeCompare(timeB);
    });

    if (allItems.length === 0) {
      container.innerHTML = `
        <div class="empty-schedule">
          <p>🌈 Nessuna attività programmata per oggi!</p>
          <button class="btn btn-primary" onclick="createNewTask()">
            + Aggiungi Attività
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = allItems.slice(0, 5).map(item => `
      <div class="schedule-item ${item.status === 'completed' ? 'completed' : ''}">
        <div class="schedule-time">
          ${this.formatScheduleTime(item)}
        </div>
        <div class="schedule-content">
          <div class="schedule-title">${item.title}</div>
          <div class="schedule-meta">
            ${item.type === 'task' ? '📋' : '📅'} 
            ${item.assignee_id ? this.getAssigneeName(item.assignee_id) : 'Famiglia'}
          </div>
        </div>
        <div class="schedule-actions">
          ${item.type === 'task' ? `
            <button class="btn btn-small ${item.status === 'completed' ? 'btn-success' : ''}" 
                    onclick="toggleTaskStatus('${item.id}')">
              ${item.status === 'completed' ? '✅' : '◯'}
            </button>
          ` : ''}
        </div>
      </div>
    `).join('');
  }

  updateFamilyOverview() {
    const container = document.getElementById('family-overview');
    if (!container) return;

    const members = window.familyMembers || [];

    if (members.length === 0) {
      container.innerHTML = `
        <div class="family-empty">
          <p>👨‍👩‍👧‍👦 Aggiungi i membri della tua famiglia per iniziare!</p>
          <button class="btn btn-primary" onclick="addFamilyMember()">
            + Aggiungi Membro
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = members.map(member => {
      const memberTasks = (window.todaysTasks || []).filter(task => task.assignee_id === member.id);
      const completedTasks = memberTasks.filter(task => task.status === 'completed');
      const completionRate = memberTasks.length > 0 ? Math.round((completedTasks.length / memberTasks.length) * 100) : 0;

      return `
        <div class="family-member-card">
          <div class="member-avatar">
            ${member.avatar || member.name.charAt(0)}
          </div>
          <div class="member-name">${member.name}</div>
          <div class="member-role">${member.role || 'Famiglia'}</div>
          <div class="member-progress">
            <div class="progress-bar" style="width: ${completionRate}%"></div>
          </div>
          <div class="member-stats">
            ${completedTasks.length}/${memberTasks.length} completate
          </div>
        </div>
      `;
    }).join('');
  }

  updateFamilyPage() {
    const container = document.getElementById('family-members');
    if (!container) return;

    const members = window.familyMembers || [];

    container.innerHTML = members.map(member => `
      <div class="family-member-detail">
        <div class="member-header">
          <div class="member-avatar-large">
            ${member.avatar || member.name.charAt(0)}
          </div>
          <div class="member-info">
            <h3>${member.name}</h3>
            <p>${member.role || 'Membro famiglia'}</p>
            <p class="member-age">
              ${member.age ? `${member.age} anni` : ''}
              ${member.adhd_diagnosis ? '• Diagnosi ADHD' : ''}
            </p>
          </div>
          <div class="member-actions">
            <button class="btn btn-small" onclick="editFamilyMember('${member.id}')">
              ✏️ Modifica
            </button>
          </div>
        </div>
        
        <div class="member-stats-detail">
          <div class="stat-item">
            <span class="stat-label">Attività questa settimana:</span>
            <span class="stat-value">${this.getMemberWeeklyTasks(member.id)}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Tasso di completamento:</span>
            <span class="stat-value">${this.getMemberCompletionRate(member.id)}%</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  updateStreakDisplay() {
    // Calculate current streak
    let streak = 0;
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      const dayTasks = (window.todaysTasks || []).filter(task => task.date === dateString);
      const completedTasks = dayTasks.filter(task => task.status === 'completed');
      
      if (dayTasks.length > 0 && completedTasks.length > 0) {
        streak++;
      } else if (dayTasks.length > 0) {
        break;
      }
    }

    const streakElement = document.getElementById('streak-days');
    if (streakElement) streakElement.textContent = streak;
  }

  // Helper methods
  formatScheduleTime(item) {
    if (item.type === 'task' && item.time) {
      return item.time;
    } else if (item.type === 'event' && item.start_date) {
      const date = new Date(item.start_date);
      return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    }
    return '00:00';
  }

  getAssigneeName(assigneeId) {
    const members = window.familyMembers || [];
    const member = members.find(m => m.id === assigneeId);
    return member ? member.name : 'Famiglia';
  }

  getMemberWeeklyTasks(memberId) {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const memberTasks = (window.recentActivity || []).filter(task => 
      task.assignee_id === memberId && new Date(task.created_at) > weekAgo
    );
    
    return memberTasks.length;
  }

  getMemberCompletionRate(memberId) {
    const memberTasks = (window.todaysTasks || []).filter(task => task.assignee_id === memberId);
    const completedTasks = memberTasks.filter(task => task.status === 'completed');
    
    return memberTasks.length > 0 ? Math.round((completedTasks.length / memberTasks.length) * 100) : 0;
  }

  checkUnsavedChanges() {
    // Check if any forms have unsaved changes
    const forms = document.querySelectorAll('form[data-changed="true"]');
    return forms.length > 0;
  }

  closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
      modal.classList.add('hidden');
    });
  }

  showHelpModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close-btn" onclick="this.closest('.modal').remove()">&times;</span>
        
        <h3>⌨️ Scorciatoie da Tastiera</h3>
        
        <div class="shortcuts-list">
          <div class="shortcut-item">
            <kbd>Ctrl</kbd> + <kbd>N</kbd>
            <span>Nuova attività</span>
          </div>
          <div class="shortcut-item">
            <kbd>Ctrl</kbd> + <kbd>F</kbd>
            <span>Cerca</span>
          </div>
          <div class="shortcut-item">
            <kbd>1-5</kbd>
            <span>Naviga tra le pagine</span>
          </div>
          <div class="shortcut-item">
            <kbd>Esc</kbd>
            <span>Chiudi modali</span>
          </div>
        </div>

        <h4>📞 Supporto</h4>
        <p>Hai bisogno di aiuto? Contattaci a: <a href="mailto:${CONFIG.API_ENDPOINTS.SUPPORT_EMAIL}">${CONFIG.API_ENDPOINTS.SUPPORT_EMAIL}</a></p>
        
        <div class="modal-actions">
          <button class="btn btn-primary" onclick="this.closest('.modal').remove()">
            Chiudi
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  setupPWA() {
    // Setup service worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('SW registered:', registration);
        })
        .catch(error => {
          console.log('SW registration failed:', error);
        });
    }

    // Handle PWA install prompt
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      this.showInstallBanner();
    });

    // Handle PWA install
    window.addEventListener('appinstalled', () => {
      showNotification('App installata con successo!', 'success');
      this.hideInstallBanner();
    });
  }

  showInstallBanner() {
    const banner = document.createElement('div');
    banner.id = 'install-banner';
    banner.className = 'install-banner';
    banner.innerHTML = `
      <div class="install-content">
        <span class="install-icon">📱</span>
        <span class="install-text">Installa ADHD Planner sul tuo dispositivo!</span>
        <button class="btn btn-small btn-primary" onclick="installPWA()">
          Installa
        </button>
        <button class="btn btn-small" onclick="dismissInstallBanner()">
          ✕
        </button>
      </div>
    `;

    document.body.appendChild(banner);
  }

  hideInstallBanner() {
    const banner = document.getElementById('install-banner');
    if (banner) {
      banner.remove();
    }
  }
}

// Global navigation functions
function showPage(pageName) {
  if (window.app) {
    app.showPage(pageName);
  }
}

// Global family functions
function addFamilyMember() {
  // Check if user can add more members
  if (!auth.canAddUnlimitedMembers()) {
    showNotification('Limite membri famiglia raggiunto. Passa a Premium per membri illimitati.', 'warning');
    showUpgradeModal();
    return;
  }

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close-btn" onclick="this.closest('.modal').remove()">&times;</span>
      
      <h3>👤 Aggiungi Membro Famiglia</h3>
      
      <form onsubmit="saveFamilyMember(event)">
        <div class="input-group">
          <label>Nome</label>
          <input type="text" id="member-name" required placeholder="Nome del membro">
        </div>
        
        <div class="form-row">
          <div class="input-group">
            <label>Età</label>
            <input type="number" id="member-age" min="0" max="100" placeholder="Età">
          </div>
          <div class="input-group">
            <label>Ruolo</label>
            <select id="member-role">
              <option value="bambino">Bambino</option>
              <option value="genitore">Genitore</option>
              <option value="nonno">Nonno/Nonna</option>
              <option value="altro">Altro</option>
            </select>
          </div>
        </div>

        <div class="checkbox-group">
          <input type="checkbox" id="member-adhd">
          <label for="member-adhd">Ha una diagnosi ADHD</label>
        </div>

        <div class="input-group">
          <label>Note (opzionale)</label>
          <textarea id="member-notes" placeholder="Note aggiuntive..."></textarea>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn btn-outline" onclick="this.closest('.modal').remove()">
            Annulla
          </button>
          <button type="submit" class="btn btn-primary">
            Aggiungi Membro
          </button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);
}

async function saveFamilyMember(event) {
  event.preventDefault();

  const form = event.target;
  const memberData = {
    family_id: getCurrentFamily().id,
    name: form.querySelector('#member-name').value.trim(),
    age: parseInt(form.querySelector('#member-age').value) || null,
    role: form.querySelector('#member-role').value,
    adhd_diagnosis: form.querySelector('#member-adhd').checked,
    notes: form.querySelector('#member-notes').value.trim() || null
  };

  if (!memberData.name) {
    showNotification('Il nome è obbligatorio', 'error');
    return;
  }

  try {
    const { data, error } = await db.addFamilyMember(memberData);
    
    if (error) throw new Error(error);

    // Add to local array
    if (!window.familyMembers) window.familyMembers = [];
    window.familyMembers.push(data);

    // Update UI
    if (window.app) app.updateFamilyOverview();

    showNotification(`${memberData.name} aggiunto alla famiglia!`, 'success');
    form.closest('.modal').remove();

  } catch (error) {
    console.error('Save family member error:', error);
    showNotification(error.message, 'error');
  }
}

// PWA functions
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  deferredPrompt = e;
});

function installPWA() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      }
      deferredPrompt = null;
    });
  }
}

function dismissInstallBanner() {
  const banner = document.getElementById('install-banner');
  if (banner) {
    banner.remove();
  }
}

// Settings functions
function showSettings() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close-btn" onclick="this.closest('.modal').remove()">&times;</span>
      
      <h3>⚙️ Impostazioni</h3>
      
      <div class="settings-section">
        <h4>🔔 Notifiche</h4>
        <div class="setting-item">
          <label>
            <input type="checkbox" id="setting-notifications" ${window.notificationManager?.permission === 'granted' ? 'checked' : ''}>
            Abilita notifiche
          </label>
        </div>
        <div class="setting-item">
          <label>
            <input type="checkbox" id="setting-daily-motivation" checked>
            Motivazione giornaliera
          </label>
		   </div>
      </div>

      <div class="settings-section">
        <h4>🎨 Aspetto</h4>
        <div class="setting-item">
          <label for="setting-theme">Tema:</label>
          <select id="setting-theme">
            <option value="auto">Automatico</option>
            <option value="light">Chiaro</option>
            <option value="dark">Scuro</option>
          </select>
        </div>
        <div class="setting-item">
          <label for="setting-font-size">Dimensione testo:</label>
          <select id="setting-font-size">
            <option value="small">Piccolo</option>
            <option value="medium" selected>Medio</option>
            <option value="large">Grande</option>
          </select>
        </div>
      </div>

      <div class="settings-section">
        <h4>👨‍👩‍👧‍👦 Famiglia</h4>
        <div class="setting-item">
          <label for="setting-family-name">Nome famiglia:</label>
          <input type="text" id="setting-family-name" value="${getCurrentFamily()?.name || ''}">
        </div>
        <div class="setting-item">
          <label for="setting-timezone">Fuso orario:</label>
          <select id="setting-timezone">
            <option value="Europe/Rome" selected>Roma (UTC+1)</option>
            <option value="Europe/London">Londra (UTC+0)</option>
            <option value="America/New_York">New York (UTC-5)</option>
          </select>
        </div>
      </div>

      <div class="settings-section">
        <h4>💾 Dati</h4>
        <div class="setting-buttons">
          <button class="btn btn-outline" onclick="exportUserData()">
            📤 Esporta Dati
          </button>
          <button class="btn btn-outline" onclick="clearLocalData()">
            🗑️ Cancella Cache
          </button>
        </div>
      </div>

      <div class="modal-actions">
        <button class="btn btn-outline" onclick="this.closest('.modal').remove()">
          Annulla
        </button>
        <button class="btn btn-primary" onclick="saveSettings()">
          Salva Impostazioni
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  
  // Load current settings
  loadCurrentSettings();
}

function loadCurrentSettings() {
  const settings = JSON.parse(localStorage.getItem('adhd_planner_settings') || '{}');
  
  // Apply saved settings to form
  Object.entries(settings).forEach(([key, value]) => {
    const element = document.getElementById(`setting-${key}`);
    if (element) {
      if (element.type === 'checkbox') {
        element.checked = value;
      } else {
        element.value = value;
      }
    }
  });
}

async function saveSettings() {
  const settings = {};
  
  // Collect settings from form
  document.querySelectorAll('[id^="setting-"]').forEach(element => {
    const key = element.id.replace('setting-', '');
    const value = element.type === 'checkbox' ? element.checked : element.value;
    settings[key] = value;
  });

  // Save to localStorage
  localStorage.setItem('adhd_planner_settings', JSON.stringify(settings));

  // Apply settings
  applySettings(settings);

  // Update family name if changed
  if (settings['family-name'] && getCurrentFamily()) {
    try {
      await db.supabase
        .from('families')
        .update({ name: settings['family-name'] })
        .eq('id', getCurrentFamily().id);
      
      // Update local data
      const currentFamily = getCurrentFamily();
      currentFamily.name = settings['family-name'];
      localStorage.setItem('adhd_planner_family', JSON.stringify(currentFamily));
      
      // Update UI
      if (window.app) app.updateDashboard();
    } catch (error) {
      console.error('Update family name error:', error);
    }
  }

  showNotification('Impostazioni salvate!', 'success');
  document.querySelector('.modal').remove();
}

function applySettings(settings) {
  // Apply theme
  if (settings.theme) {
    document.body.className = settings.theme === 'dark' ? 'dark-theme' : '';
  }

  // Apply font size
  if (settings['font-size']) {
    document.documentElement.className = `font-size-${settings['font-size']}`;
  }

  // Update notifications
  if (settings.notifications && window.notificationManager) {
    notificationManager.requestNotificationPermission();
  }

  // Setup daily motivation
  if (settings['daily-motivation'] && window.notificationManager) {
    notificationManager.scheduleDailyMotivation();
  }
}

function showHelp() {
  if (window.app) {
    app.showHelpModal();
  }
}

function exportUserData() {
  try {
    const userData = {
      user: getCurrentUser(),
      family: getCurrentFamily(),
      familyMembers: window.familyMembers || [],
      tasks: window.todaysTasks || [],
      settings: JSON.parse(localStorage.getItem('adhd_planner_settings') || '{}'),
      exportDate: new Date().toISOString()
    };

    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `adhd_planner_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    showNotification('Dati esportati con successo!', 'success');
  } catch (error) {
    console.error('Export data error:', error);
    showNotification('Errore nell\'esportazione dei dati', 'error');
  }
}

async function clearLocalData() {
  const confirmed = await showConfirmDialog(
    'Cancella Cache',
    'Sei sicuro di voler cancellare tutti i dati locali? Questa azione non è reversibile.',
    'Cancella',
    'Annulla'
  );

  if (confirmed) {
    // Clear localStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('adhd_planner_')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));

    showNotification('Cache cancellata. Ricarica la pagina.', 'success');
    
    // Reload page after 2 seconds
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  }
}

// Utility functions
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Initialize app
window.app = new AppManager();

// Load settings on startup
document.addEventListener('DOMContentLoaded', () => {
  const settings = JSON.parse(localStorage.getItem('adhd_planner_settings') || '{}');
  applySettings(settings);
});