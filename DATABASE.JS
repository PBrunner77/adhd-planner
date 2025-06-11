// Database management with Supabase
class DatabaseManager {
  constructor() {
    this.supabase = null;
    this.isOffline = false;
    this.offlineQueue = [];
    this.init();
  }

  async init() {
    try {
      // Initialize Supabase (will be imported via CDN)
      const { createClient } = supabase;
      this.supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
      
      // Set up offline detection
      this.setupOfflineDetection();
      
      // Set up auto-sync
      this.setupAutoSync();
      
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      this.handleOfflineMode();
    }
  }

  setupOfflineDetection() {
    window.addEventListener('online', () => {
      this.isOffline = false;
      this.syncOfflineQueue();
      showNotification('Connessione ripristinata. Sincronizzazione in corso...', 'success');
    });

    window.addEventListener('offline', () => {
      this.isOffline = true;
      showNotification('Modalità offline attivata. I dati verranno sincronizzati alla riconnessione.', 'warning');
    });
  }

  setupAutoSync() {
    // Auto-save every 30 seconds
    setInterval(() => {
      if (!this.isOffline && this.offlineQueue.length === 0) {
        this.autoSaveLocalData();
      }
    }, CONFIG.SETTINGS.AUTO_SAVE_INTERVAL);
  }

  handleOfflineMode() {
    this.isOffline = true;
    console.log('Running in offline mode');
  }

  // User Authentication
  async signUp(email, password, familyName) {
    try {
      if (this.isOffline) {
        throw new Error('Registrazione non disponibile offline');
      }

      const { user, error } = await this.supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            family_name: familyName
          }
        }
      });

      if (error) throw error;

      // Create family record
      await this.createFamily(user.id, familyName);
      
      return { user, error: null };
    } catch (error) {
	console.error('Sign up error:', error);
      return { user: null, error: error.message };
    }
  }

  async signIn(email, password) {
    try {
      if (this.isOffline) {
        throw new Error('Accesso non disponibile offline');
      }

      const { user, error } = await this.supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (error) throw error;

      // Load user data
      await this.loadUserData(user.id);
      
      return { user, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { user: null, error: error.message };
    }
  }

  async signOut() {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;
      
      // Clear local storage
      localStorage.clear();
      
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error: error.message };
    }
  }

  // Family Management
  async createFamily(userId, familyName) {
    const familyData = {
      id: generateUUID(),
      owner_id: userId,
      name: familyName,
      created_at: new Date().toISOString(),
      settings: {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: 'it',
        notifications_enabled: true
      }
    };

    if (this.isOffline) {
      this.queueOfflineOperation('create', 'families', familyData);
      this.saveToLocalStorage('family', familyData);
      return { data: familyData, error: null };
    }

    try {
      const { data, error } = await this.supabase
        .from('families')
        .insert([familyData])
        .select()
        .single();

      if (error) throw error;

      this.saveToLocalStorage('family', data);
      return { data, error: null };
    } catch (error) {
      console.error('Create family error:', error);
      return { data: null, error: error.message };
    }
  }

  async getFamilyData(familyId) {
    // Try local storage first
    const localData = this.getFromLocalStorage('family');
    if (localData && this.isOffline) {
      return { data: localData, error: null };
    }

    try {
      const { data, error } = await this.supabase
        .from('families')
        .select(`
          *,
          family_members(*),
          tasks(*),
          events(*)
        `)
        .eq('id', familyId)
        .single();

      if (error) throw error;

      this.saveToLocalStorage('family', data);
      return { data, error: null };
    } catch (error) {
      console.error('Get family data error:', error);
      return { data: localData, error: error.message };
    }
  }

  // Family Members
  async addFamilyMember(memberData) {
    const member = {
      id: generateUUID(),
      ...memberData,
      created_at: new Date().toISOString()
    };

    if (this.isOffline) {
      this.queueOfflineOperation('create', 'family_members', member);
      this.saveToLocalStorage(`member_${member.id}`, member);
      return { data: member, error: null };
    }

    try {
      const { data, error } = await this.supabase
        .from('family_members')
        .insert([member])
        .select()
        .single();

      if (error) throw error;

      this.saveToLocalStorage(`member_${data.id}`, data);
      return { data, error: null };
    } catch (error) {
      console.error('Add family member error:', error);
      return { data: null, error: error.message };
    }
  }

  async updateFamilyMember(memberId, updates) {
    const updatedData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    if (this.isOffline) {
      this.queueOfflineOperation('update', 'family_members', updatedData, memberId);
      const currentData = this.getFromLocalStorage(`member_${memberId}`);
      const newData = { ...currentData, ...updatedData };
      this.saveToLocalStorage(`member_${memberId}`, newData);
      return { data: newData, error: null };
    }

    try {
      const { data, error } = await this.supabase
        .from('family_members')
        .update(updatedData)
        .eq('id', memberId)
        .select()
        .single();

      if (error) throw error;

      this.saveToLocalStorage(`member_${data.id}`, data);
      return { data, error: null };
    } catch (error) {
      console.error('Update family member error:', error);
      return { data: null, error: error.message };
    }
  }

  // Tasks Management
  async createTask(taskData) {
    const task = {
      id: generateUUID(),
      ...taskData,
      created_at: new Date().toISOString(),
      status: 'pending'
    };

    if (this.isOffline) {
      this.queueOfflineOperation('create', 'tasks', task);
      this.saveToLocalStorage(`task_${task.id}`, task);
      return { data: task, error: null };
    }

    try {
      const { data, error } = await this.supabase
        .from('tasks')
        .insert([task])
        .select()
        .single();

      if (error) throw error;

      this.saveToLocalStorage(`task_${data.id}`, data);
      return { data, error: null };
    } catch (error) {
      console.error('Create task error:', error);
      return { data: null, error: error.message };
    }
  }

  async updateTask(taskId, updates) {
    const updatedData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    if (this.isOffline) {
      this.queueOfflineOperation('update', 'tasks', updatedData, taskId);
      const currentData = this.getFromLocalStorage(`task_${taskId}`);
      const newData = { ...currentData, ...updatedData };
      this.saveToLocalStorage(`task_${taskId}`, newData);
      return { data: newData, error: null };
    }

    try {
      const { data, error } = await this.supabase
        .from('tasks')
        .update(updatedData)
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;

      this.saveToLocalStorage(`task_${data.id}`, data);
      return { data, error: null };
    } catch (error) {
      console.error('Update task error:', error);
      return { data: null, error: error.message };
    }
  }

  async getTasks(familyId, filters = {}) {
    // Try local storage first
    const localTasks = this.getTasksFromLocalStorage(familyId, filters);
    if (localTasks.length > 0 && this.isOffline) {
      return { data: localTasks, error: null };
    }

    try {
      let query = this.supabase
        .from('tasks')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.date) {
        query = query.eq('date', filters.date);
      }
      if (filters.assignee_id) {
        query = query.eq('assignee_id', filters.assignee_id);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Save to local storage
      data.forEach(task => {
        this.saveToLocalStorage(`task_${task.id}`, task);
      });

      return { data, error: null };
    } catch (error) {
      console.error('Get tasks error:', error);
      return { data: localTasks, error: error.message };
    }
  }

  // Events Management
  async createEvent(eventData) {
    const event = {
      id: generateUUID(),
      ...eventData,
      created_at: new Date().toISOString()
    };

    if (this.isOffline) {
      this.queueOfflineOperation('create', 'events', event);
      this.saveToLocalStorage(`event_${event.id}`, event);
      return { data: event, error: null };
    }

    try {
      const { data, error } = await this.supabase
        .from('events')
        .insert([event])
        .select()
        .single();

      if (error) throw error;

      this.saveToLocalStorage(`event_${data.id}`, data);
      return { data, error: null };
    } catch (error) {
      console.error('Create event error:', error);
      return { data: null, error: error.message };
    }
  }

  async getEvents(familyId, startDate, endDate) {
    try {
      const { data, error } = await this.supabase
        .from('events')
        .select('*')
        .eq('family_id', familyId)
        .gte('start_date', startDate)
        .lte('end_date', endDate)
        .order('start_date', { ascending: true });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Get events error:', error);
      return { data: [], error: error.message };
    }
  }

  // Local Storage Helpers
  saveToLocalStorage(key, data) {
    try {
      localStorage.setItem(`adhd_planner_${key}`, JSON.stringify(data));
    } catch (error) {
      console.error('Local storage save error:', error);
    }
  }

  getFromLocalStorage(key) {
    try {
      const data = localStorage.getItem(`adhd_planner_${key}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Local storage get error:', error);
      return null;
    }
  }

  getTasksFromLocalStorage(familyId, filters = {}) {
    const tasks = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('adhd_planner_task_')) {
        try {
          const task = JSON.parse(localStorage.getItem(key));
          if (task.family_id === familyId) {
            // Apply filters
            let includeTask = true;
            if (filters.date && task.date !== filters.date) includeTask = false;
            if (filters.assignee_id && task.assignee_id !== filters.assignee_id) includeTask = false;
            if (filters.status && task.status !== filters.status) includeTask = false;
            
            if (includeTask) tasks.push(task);
          }
        } catch (error) {
          console.error('Error parsing task from localStorage:', error);
        }
      }
    }
    return tasks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  // Offline Queue Management
  queueOfflineOperation(operation, table, data, id = null) {
    this.offlineQueue.push({
      id: generateUUID(),
      operation,
      table,
      data,
      recordId: id,
      timestamp: new Date().toISOString()
    });
    
    this.saveToLocalStorage('offline_queue', this.offlineQueue);
  }

  async syncOfflineQueue() {
    if (this.offlineQueue.length === 0) return;

    console.log(`Syncing ${this.offlineQueue.length} offline operations...`);
    
    const operations = [...this.offlineQueue];
    this.offlineQueue = [];

    for (const operation of operations) {
      try {
        await this.executeOfflineOperation(operation);
      } catch (error) {
        console.error('Failed to sync operation:', operation, error);
        // Re-queue failed operations
        this.offlineQueue.push(operation);
      }
    }

    this.saveToLocalStorage('offline_queue', this.offlineQueue);
    
    if (this.offlineQueue.length === 0) {
      showNotification('Sincronizzazione completata con successo!', 'success');
    } else {
      showNotification(`${this.offlineQueue.length} operazioni non sincronizzate`, 'warning');
    }
  }

  async executeOfflineOperation(operation) {
    const { operation: op, table, data, recordId } = operation;

    switch (op) {
      case 'create':
        const { error: createError } = await this.supabase
          .from(table)
          .insert([data]);
        if (createError) throw createError;
        break;

      case 'update':
        const { error: updateError } = await this.supabase
          .from(table)
          .update(data)
          .eq('id', recordId);
        if (updateError) throw updateError;
        break;

      case 'delete':
        const { error: deleteError } = await this.supabase
          .from(table)
          .delete()
          .eq('id', recordId);
        if (deleteError) throw deleteError;
        break;
    }
  }

  autoSaveLocalData() {
    // This method can be used to periodically backup critical data
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const backupData = {
      timestamp: new Date().toISOString(),
      family: this.getFromLocalStorage('family'),
      user: currentUser
    };

    this.saveToLocalStorage('backup', backupData);
  }

  // Statistics and Analytics
  async getStatistics(familyId, startDate, endDate) {
    try {
      const { data: tasks, error } = await this.supabase
        .from('tasks')
        .select('*')
        .eq('family_id', familyId)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (error) throw error;

      const stats = {
        total_tasks: tasks.length,
        completed_tasks: tasks.filter(t => t.status === 'completed').length,
        pending_tasks: tasks.filter(t => t.status === 'pending').length,
        completion_rate: 0
      };

      if (stats.total_tasks > 0) {
        stats.completion_rate = Math.round((stats.completed_tasks / stats.total_tasks) * 100);
      }

      return { data: stats, error: null };
    } catch (error) {
      console.error('Get statistics error:', error);
      return { data: null, error: error.message };
    }
  }
}

// Utility Functions
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Initialize database manager
const db = new DatabaseManager();
🔐 AUTH.JS - Gestione Autenticazione
Copy// Authentication management
class AuthManager {
  constructor() {
    this.currentUser = null;
    this.currentFamily = null;
    this.subscriptionTier = 'free';
    this.init();
  }

  init() {
    // Check for existing session
    this.checkExistingSession();
    
    // Set up session monitoring
    this.setupSessionMonitoring();
  }

  checkExistingSession() {
    const userData = localStorage.getItem('adhd_planner_user');
    const familyData = localStorage.getItem('adhd_planner_family');
    
    if (userData && familyData) {
      try {
        this.currentUser = JSON.parse(userData);
        this.currentFamily = JSON.parse(familyData);
        this.subscriptionTier = this.currentUser.subscription_tier || 'free';
        
        // Verify session is still valid
        this.verifySession();
      } catch (error) {
        console.error('Session data corrupted:', error);
        this.clearSession();
      }
    }
  }

  async verifySession() {
    try {
      if (!db.supabase) return;
      
      const { data: { user } } = await db.supabase.auth.getUser();
      
      if (user) {
        this.updateUserSession(user);
        this.showApp();
      } else {
        this.clearSession();
        this.showAuth();
      }
    } catch (error) {
      console.error('Session verification failed:', error);
      this.showAuth();
    }
  }

  setupSessionMonitoring() {
    // Monitor auth state changes
    if (db.supabase) {
      db.supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          this.handleSignIn(session.user);
        } else if (event === 'SIGNED_OUT') {
          this.handleSignOut();
        }
      });
    }

    // Session timeout check
    setInterval(() => {
      this.checkSessionTimeout();
    }, 60000); // Check every minute
  }

  checkSessionTimeout() {
    if (!this.currentUser) return;

    const lastActivity = localStorage.getItem('adhd_planner_last_activity');
    if (lastActivity) {
      const timeDiff = Date.now() - parseInt(lastActivity);
      const timeoutMs = CONFIG.SETTINGS.SESSION_TIMEOUT_HOURS * 60 * 60 * 1000;
      
      if (timeDiff > timeoutMs) {
        this.handleSessionTimeout();
      }
    }
  }

  handleSessionTimeout() {
    showNotification('Sessione scaduta. Effettua nuovamente l\'accesso.', 'warning');
    this.signOut();
  }

  updateLastActivity() {
    localStorage.setItem('adhd_planner_last_activity', Date.now().toString());
  }

  async signUp(email, password, familyName) {
    try {
      showLoading(true);
      
      const { user, error } = await db.signUp(email, password, familyName);
      
      if (error) {
        throw new Error(error);
      }

      if (user) {
        showNotification(
          'Account creato con successo! Controlla la tua email per confermare l\'account.',
          'success'
        );
        
        // Don't automatically sign in - wait for email confirmation
        closeAuthModal();
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      showNotification(error.message, 'error');
      return { success: false, error: error.message };
    } finally {
      showLoading(false);
    }
  }

  async signIn(email, password) {
    try {
      showLoading(true);
      
      const { user, error } = await db.signIn(email, password);
      
      if (error) {
        throw new Error(error);
      }

      if (user) {
        await this.handleSignIn(user);
        showNotification('Accesso effettuato con successo!', 'success');
        closeAuthModal();
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      showNotification(error.message, 'error');
      return { success: false, error: error.message };
    } finally {
      showLoading(false);
    }
  }

  async handleSignIn(user) {
    this.currentUser = user;
    this.updateLastActivity();
    
    // Load family data
    await this.loadFamilyData(user.id);
    
    // Save session
    localStorage.setItem('adhd_planner_user', JSON.stringify(user));
    
    // Show app
    this.showApp();
    
    // Initialize app data
    await this.initializeUserData();
  }

  async loadFamilyData(userId) {
    try {
      // First try to find existing family
      const { data: families } = await db.supabase
        .from('families')
        .select('*')
        .eq('owner_id', userId)
        .limit(1);

      if (families && families.length > 0) {
        this.currentFamily = families[0];
        this.subscriptionTier = families[0].subscription_tier || 'free';
      } else {
        // Create default family if none exists
        const familyName = this.currentUser.user_metadata?.family_name || 'La mia famiglia';
        const { data: newFamily } = await db.createFamily(userId, familyName);
        this.currentFamily = newFamily;
        this.subscriptionTier = 'free';
      }

      localStorage.setItem('adhd_planner_family', JSON.stringify(this.currentFamily));
    } catch (error) {
      console.error('Load family data error:', error);
      // Create minimal family data for offline use
      this.currentFamily = {
        id: generateUUID(),
        owner_id: userId,
        name: 'La mia famiglia',
        subscription_tier: 'free'
      };
    }
  }

  async initializeUserData() {
    try {
      // Load initial data
      await Promise.all([
        this.loadTodaysTasks(),
        this.loadFamilyMembers(),
        this.loadTodaysEvents()
      ]);
      
      // Update UI
      this.updateUserInterface();
    } catch (error) {
      console.error('Initialize user data error:', error);
    }
  }

  async loadTodaysTasks() {
    const today = new Date().toISOString().split('T')[0];
    const { data: tasks } = await db.getTasks(this.currentFamily.id, { date: today });
    
    if (tasks) {
      window.todaysTasks = tasks;
      updateDashboardStats();
    }
  }

  async loadFamilyMembers() {
    try {
      const { data: members } = await db.supabase
        .from('family_members')
        .select('*')
        .eq('family_id', this.currentFamily.id);
      
      window.familyMembers = members || [];
      updateFamilyOverview();
    } catch (error) {
      console.error('Load family members error:', error);
      window.familyMembers = [];
    }
  }

  async loadTodaysEvents() {
    const today = new Date().toISOString().split('T')[0];
    const { data: events } = await db.getEvents(
      this.currentFamily.id,
      today + 'T00:00:00Z',
      today + 'T23:59:59Z'
    );
    
    if (events) {
      window.todaysEvents = events;
    }
  }

  updateUserInterface() {
    // Update user name in navigation
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
      userNameElement.textContent = this.currentFamily.name;
    }

    // Update family name in dashboard
    const familyNameElement = document.getElementById('family-name');
    if (familyNameElement) {
      familyNameElement.textContent = this.currentFamily.name;
    }

    // Show/hide premium features based on subscription
    this.updateSubscriptionUI();
  }

  updateSubscriptionUI() {
    const isPremium = this.subscriptionTier !== 'free';
    
    // Show/hide premium features
    const premiumFeatures = document.querySelectorAll('.premium-feature');
    premiumFeatures.forEach(feature => {
      feature.style.display = isPremium ? 'block' : 'none';
    });

    // Update upgrade button
    const upgradeBtn = document.querySelector('.btn[onclick="showUpgradeModal()"]');
    if (upgradeBtn) {
      upgradeBtn.style.display = isPremium ? 'none' : 'inline-flex';
    }
  }

  async signOut() {
    try {
      showLoading(true);
      
      const { error } = await db.signOut();
      
      if (error) {
        throw new Error(error);
      }

      this.handleSignOut();
      showNotification('Disconnessione effettuata con successo', 'success');
    } catch (error) {
      console.error('Sign out error:', error);
      showNotification(error.message, 'error');
    } finally {
      showLoading(false);
    }
  }

  handleSignOut() {
    this.currentUser = null;
    this.currentFamily = null;
    this.subscriptionTier = 'free';
    
    this.clearSession();
    this.showAuth();
  }

  clearSession() {
    // Clear all stored data
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('adhd_planner_')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  showAuth() {
    document.getElementById('app').classList.add('hidden');
    document.getElementById('auth-modal').classList.remove('hidden');
    hideLoading();
  }

  showApp() {
    document.getElementById('auth-modal').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    hideLoading();
  }

  // Subscription Management
  async updateSubscription(newTier) {
    try {
      this.subscriptionTier = newTier;
      
      // Update family record
      if (this.currentFamily) {
        this.currentFamily.subscription_tier = newTier;
        localStorage.setItem('adhd_planner_family', JSON.stringify(this.currentFamily));
        
        // Update in database
        if (!db.isOffline) {
          await db.supabase
            .from('families')
            .update({ subscription_tier: newTier })
            .eq('id', this.currentFamily.id);
        }
      }
      
      this.updateSubscriptionUI();
      showNotification(`Abbonamento aggiornato a ${newTier}!`, 'success');
    } catch (error) {
      console.error('Update subscription error:', error);
      showNotification('Errore nell\'aggiornamento dell\'abbonamento', 'error');
    }
  }

  // Permission Checks
  canAccessPremiumFeatures() {
    return this.subscriptionTier === 'premium' || this.subscriptionTier === 'family';
  }

  canAddUnlimitedMembers() {
    if (this.subscriptionTier === 'free') {
      const memberCount = window.familyMembers ? window.familyMembers.length : 0;
      return memberCount < 2; // Free tier limited to 2 members
    }
    return true;
  }

  canCreateUnlimitedTasks() {
    if (this.subscriptionTier === 'free') {
      const todayTaskCount = window.todaysTasks ? window.todaysTasks.length : 0;
      return todayTaskCount < 10; // Free tier limited to 10 tasks per day
    }
    return true;
  }

  // Getters
  getCurrentUser() {
    return this.currentUser;
  }

  getCurrentFamily() {
    return this.currentFamily;
  }

  getSubscriptionTier() {
    return this.subscriptionTier;
  }
}

// Auth UI Functions
function showLoginForm() {
  document.getElementById('login-form').classList.remove('hidden');
  document.getElementById('register-form').classList.add('hidden');
}

function showRegisterForm() {
  document.getElementById('register-form').classList.remove('hidden');
  document.getElementById('login-form').classList.add('hidden');
}

function closeAuthModal() {
  document.getElementById('auth-modal').classList.add('hidden');
}

async function handleLogin(event) {
  event.preventDefault();
  
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  
  await auth.signIn(email, password);
}

async function handleRegister(event) {
  event.preventDefault();
  
  const familyName = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  
  if (password.length < 6) {
    showNotification('La password deve contenere almeno 6 caratteri', 'error');
    return;
  }
  
  await auth.signUp(email, password, familyName);
}

function toggleUserMenu() {
  const dropdown = document.getElementById('user-dropdown');
  dropdown.classList.toggle('hidden');
  
  // Close dropdown when clicking outside
  document.addEventListener('click', function closeDropdown(e) {
    if (!e.target.closest('.user-menu')) {
      dropdown.classList.add('hidden');
      document.removeEventListener('click', closeDropdown);
    }
  });
}

function logout() {
  auth.signOut();
}

// Utility functions
function getCurrentUser() {
  return auth ? auth.getCurrentUser() : null;
}

function getCurrentFamily() {
  return auth ? auth.getCurrentFamily() : null;
}

function getSubscriptionTier() {
  return auth ? auth.getSubscriptionTier() : 'free';
}

// Initialize auth manager
const auth = new AuthManager();