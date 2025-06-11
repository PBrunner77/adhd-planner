// Task management system
class TaskManager {
  constructor() {
    this.tasks = [];
    this.currentFilter = 'all';
    this.draggedTask = null;
    this.init();
  }

  init() {
    this.loadTasks();
    this.setupEventListeners();
    this.setupDragAndDrop();
  }

  setupEventListeners() {
    // Auto-save when typing
    document.addEventListener('input', (e) => {
      if (e.target.closest('#task-form')) {
        clearTimeout(this.autoSaveTimeout);
        this.autoSaveTimeout = setTimeout(() => {
          this.autoSaveDraft();
        }, 1000);
      }
    });

    // Listen for task updates from other components
    document.addEventListener('task-updated', (e) => {
      this.handleTaskUpdate(e.detail);
    });
  }

  setupDragAndDrop() {
    // Enable drag and drop for task reordering
    const tasksContainer = document.getElementById('tasks-container');
    if (tasksContainer) {
      tasksContainer.addEventListener('dragover', this.handleDragOver.bind(this));
      tasksContainer.addEventListener('drop', this.handleDrop.bind(this));
    }
  }

  async loadTasks() {
    try {
      const family = getCurrentFamily();
      if (!family) return;

      const { data: tasks, error } = await db.getTasks(family.id);
      
      if (error) throw new Error(error);

      this.tasks = tasks || [];
      this.renderTasks();
      this.updateTaskStats();
    } catch (error) {
      console.error('Load tasks error:', error);
      // Load from local storage as fallback
      this.loadTasksFromLocalStorage();
    }
  }

  loadTasksFromLocalStorage() {
    const family = getCurrentFamily();
    if (!family) return;

    this.tasks = db.getTasksFromLocalStorage(family.id);
    this.renderTasks();
    this.updateTaskStats();
  }

  renderTasks() {
    const container = document.getElementById('tasks-container');
    if (!container) return;

    const filteredTasks = this.getFilteredTasks();

    if (filteredTasks.length === 0) {
      container.innerHTML = this.getEmptyStateHTML();
      return;
    }

    // Group tasks by status for better organization
    const groupedTasks = this.groupTasksByStatus(filteredTasks);
    
    container.innerHTML = Object.entries(groupedTasks)
      .map(([status, tasks]) => this.renderTaskGroup(status, tasks))
      .join('');

    // Setup task interactions
    this.setupTaskInteractions();
  }

  getFilteredTasks() {
    let filtered = [...this.tasks];

    switch (this.currentFilter) {
      case 'today':
        const today = new Date().toISOString().split('T')[0];
        filtered = filtered.filter(task => task.date === today);
        break;
      case 'pending':
        filtered = filtered.filter(task => task.status === 'pending');
        break;
      case 'completed':
        filtered = filtered.filter(task => task.status === 'completed');
        break;
      case 'all':
      default:
        // No additional filtering
        break;
    }

    // Sort by priority and date
    return filtered.sort((a, b) => {
      // First by completion status
      if (a.status !== b.status) {
        return a.status === 'completed' ? 1 : -1;
      }
      
      // Then by priority
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (a.priority !== b.priority) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      
      // Finally by date
      return new Date(a.date) - new Date(b.date);
    });
  }

  groupTasksByStatus(tasks) {
    return tasks.reduce((groups, task) => {
      const status = task.status || 'pending';
      if (!groups[status]) groups[status] = [];
      groups[status].push(task);
      return groups;
    }, {});
  }

  renderTaskGroup(status, tasks) {
    const statusLabels = {
      pending: { label: 'Da completare', icon: '⏰', count: tasks.length },
      completed: { label: 'Completate', icon: '✅', count: tasks.length },
      in_progress: { label: 'In corso', icon: '🔄', count: tasks.length }
    };

    const statusInfo = statusLabels[status] || { label: status, icon: '📋', count: tasks.length };

    return `
      <div class="task-group" data-status="${status}">
        <div class="task-group-header">
          <span class="task-group-icon">${statusInfo.icon}</span>
          <span class="task-group-label">${statusInfo.label}</span>
          <span class="task-group-count">(${statusInfo.count})</span>
        </div>
        <div class="task-group-content">
          ${tasks.map(task => this.renderTask(task)).join('')}
        </div>
      </div>
    `;
  }

  renderTask(task) {
    const assigneeName = this.getAssigneeName(task.assignee_id);
    const isOverdue = this.isTaskOverdue(task);
    const timeUntilDue = this.getTimeUntilDue(task);

    return `
      <div class="task-item ${task.status === 'completed' ? 'completed' : ''} priority-${task.priority} ${isOverdue ? 'overdue' : ''}" 
           data-task-id="${task.id}"
           draggable="true">
        
        <div class="task-checkbox ${task.status === 'completed' ? 'checked' : ''}" 
             onclick="toggleTaskStatus('${task.id}')">
          ${task.status === 'completed' ? '✓' : ''}
        </div>
        
        <div class="task-content">
          <div class="task-title ${task.status === 'completed' ? 'completed' : ''}">
            ${task.title}
          </div>
          
          ${task.description ? `
            <div class="task-description">${task.description}</div>
          ` : ''}
          
          <div class="task-meta">
            <span class="task-date">
              📅 ${this.formatTaskDate(task.date)}
              ${timeUntilDue ? `• ${timeUntilDue}` : ''}
            </span>
            
            ${task.time ? `
              <span class="task-time">⏰ ${task.time}</span>
            ` : ''}
            
            ${assigneeName ? `
              <span class="task-assignee">👤 ${assigneeName}</span>
            ` : ''}
            
            <span class="task-category category-${task.category}">
              ${this.getCategoryIcon(task.category)} ${this.getCategoryLabel(task.category)}
            </span>
            
            ${task.duration ? `
              <span class="task-duration">⏱️ ${task.duration}min</span>
            ` : ''}
          </div>
          
          ${task.recurring ? `
            <div class="task-recurring">🔄 Ricorrente</div>
          ` : ''}
        </div>
        
        <div class="task-actions">
          <button class="task-action-btn" onclick="editTask('${task.id}')" title="Modifica">
            ✏️
          </button>
          
          <button class="task-action-btn" onclick="duplicateTask('${task.id}')" title="Duplica">
            📋
          </button>
          
          <button class="task-action-btn delete" onclick="deleteTask('${task.id}')" title="Elimina">
            🗑️
          </button>
        </div>
      </div>
    `;
  }

  setupTaskInteractions() {
    // Setup drag and drop for each task
    document.querySelectorAll('.task-item[draggable]').forEach(task => {
      task.addEventListener('dragstart', this.handleDragStart.bind(this));
      task.addEventListener('dragend', this.handleDragEnd.bind(this));
    });
  }

  handleDragStart(e) {
    this.draggedTask = e.target;
    e.target.style.opacity = '0.5';
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
  }

  handleDragEnd(e) {
    e.target.style.opacity = '';
    this.draggedTask = null;
  }

  handleDragOver(e) {
    if (e.preventDefault) {
      e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
  }

  handleDrop(e) {
    if (e.stopPropagation) {
      e.stopPropagation();
    }

    const targetTask = e.target.closest('.task-item');
    if (targetTask && this.draggedTask && targetTask !== this.draggedTask) {
      // Reorder tasks
      const draggedId = this.draggedTask.dataset.taskId;
      const targetId = targetTask.dataset.taskId;
      
      this.reorderTasks(draggedId, targetId);
    }

    return false;
  }

  async reorderTasks(draggedId, targetId) {
    try {
      // Update task order in local array
      const draggedIndex = this.tasks.findIndex(t => t.id === draggedId);
      const targetIndex = this.tasks.findIndex(t => t.id === targetId);

      if (draggedIndex !== -1 && targetIndex !== -1) {
        const draggedTask = this.tasks.splice(draggedIndex, 1)[0];
        this.tasks.splice(targetIndex, 0, draggedTask);

        // Update order values
        this.tasks.forEach((task, index) => {
          task.order = index;
        });

        // Save to database
        await this.saveBatchTaskUpdates(this.tasks.map(task => ({ 
          id: task.id, 
          order: task.order 
        })));

        this.renderTasks();
      }
    } catch (error) {
      console.error('Reorder tasks error:', error);
      showNotification('Errore nel riordinamento delle attività', 'error');
    }
  }

  async saveBatchTaskUpdates(updates) {
    // For now, update one by one - could be optimized with batch API
    for (const update of updates) {
      await db.updateTask(update.id, { order: update.order });
    }
  }

  getEmptyStateHTML() {
    const emptyMessages = {
      all: {
        icon: '📋',
        title: 'Nessuna attività ancora',
        subtitle: 'Inizia creando la tua prima attività!'
      },
      today: {
        icon: '🌅',
        title: 'Giornata libera!',
        subtitle: 'Non hai attività programmate per oggi'
      },
      pending: {
        icon: '✅',
        title: 'Tutto fatto!',
        subtitle: 'Non hai attività in sospeso'
      },
      completed: {
        icon: '🎉',
        title: 'Nessuna attività completata',
        subtitle: 'Completa alcune attività per vederle qui'
      }
    };

    const message = emptyMessages[this.currentFilter] || emptyMessages.all;

    return `
      <div class="empty-state">
        <div class="empty-icon">${message.icon}</div>
        <h3 class="empty-title">${message.title}</h3>
        <p class="empty-subtitle">${message.subtitle}</p>
        <button class="btn btn-primary" onclick="createNewTask()">
          + Crea Nuova Attività
        </button>
      </div>
    `;
  }

  // Helper methods
  getAssigneeName(assigneeId) {
    if (!assigneeId) return null;
    const members = window.familyMembers || [];
    const member = members.find(m => m.id === assigneeId);
    return member ? member.name : 'Sconosciuto';
  }

  isTaskOverdue(task) {
    if (task.status === 'completed') return false;
    
    const taskDate = new Date(task.date);
    const now = new Date();
    
    // If task has time, include it in comparison
    if (task.time) {
      const [hours, minutes] = task.time.split(':');
      taskDate.setHours(parseInt(hours), parseInt(minutes));
    } else {
      taskDate.setHours(23, 59); // End of day if no time specified
    }
    
    return taskDate < now;
  }

  getTimeUntilDue(task) {
    if (task.status === 'completed') return null;
    
    const taskDate = new Date(task.date);
    const now = new Date();
    
    if (task.time) {
      const [hours, minutes] = task.time.split(':');
      taskDate.setHours(parseInt(hours), parseInt(minutes));
    }
    
    const diffMs = taskDate - now;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMs < 0) return 'Scaduta';
    if (diffHours < 1) return 'Entro 1 ora';
    if (diffHours < 24) return `Tra ${diffHours} ore`;
    if (diffDays === 1) return 'Domani';
    if (diffDays < 7) return `Tra ${diffDays} giorni`;
    
    return null;
  }

  formatTaskDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === now.toDateString()) return 'Oggi';
    if (date.toDateString() === tomorrow.toDateString()) return 'Domani';
    if (date.toDateString() === yesterday.toDateString()) return 'Ieri';
    
    return date.toLocaleDateString('it-IT', { 
      weekday: 'short',
	  month: 'short', 
      day: 'numeric' 
    });
  }

  getCategoryIcon(category) {
    const icons = {
      routine: '📋',
      school: '🏫',
      chores: '🏠',
      fun: '🎉',
      health: '🏥',
      other: '📦'
    };
    return icons[category] || '📋';
  }

  getCategoryLabel(category) {
    const labels = {
      routine: 'Routine',
      school: 'Scuola',
      chores: 'Casa',
      fun: 'Divertimento',
      health: 'Salute',
      other: 'Altro'
    };
    return labels[category] || 'Altro';
  }

  updateTaskStats() {
    // Update dashboard stats
    const today = new Date().toISOString().split('T')[0];
    const todayTasks = this.tasks.filter(task => task.date === today);
    const completedToday = todayTasks.filter(task => task.status === 'completed');
    const pendingToday = todayTasks.filter(task => task.status === 'pending');

    // Update dashboard elements
    const completedElement = document.getElementById('completed-today');
    const pendingElement = document.getElementById('pending-today');
    
    if (completedElement) completedElement.textContent = completedToday.length;
    if (pendingElement) pendingElement.textContent = pendingToday.length;

    // Calculate streak
    this.updateStreakCounter();
  }

  updateStreakCounter() {
    let streak = 0;
    const today = new Date();
    
    // Count consecutive days with completed tasks
    for (let i = 0; i < 30; i++) { // Check last 30 days
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      const dayTasks = this.tasks.filter(task => task.date === dateString);
      const completedTasks = dayTasks.filter(task => task.status === 'completed');
      
      if (dayTasks.length > 0 && completedTasks.length > 0) {
        streak++;
      } else if (dayTasks.length > 0) {
        break; // Break streak if there were tasks but none completed
      }
      // Continue if no tasks scheduled (don't break streak)
    }

    const streakElement = document.getElementById('streak-days');
    if (streakElement) streakElement.textContent = streak;
  }

  // Task CRUD operations
  async createTask(taskData) {
    try {
      const family = getCurrentFamily();
      if (!family) throw new Error('Famiglia non trovata');

      // Check premium limits
      if (!auth.canCreateUnlimitedTasks()) {
        throw new Error('Limite attività giornaliere raggiunto. Passa a Premium per attività illimitate.');
      }

      const task = {
        family_id: family.id,
        title: taskData.title.trim(),
        description: taskData.description?.trim() || null,
        date: taskData.date,
        time: taskData.time || null,
        duration: taskData.duration || CONFIG.ADHD_SETTINGS.DEFAULT_TASK_DURATION,
        priority: taskData.priority || 'medium',
        category: taskData.category || 'other',
        assignee_id: taskData.assignee_id || null,
        recurring: taskData.recurring || false,
        reminder_enabled: taskData.reminder_enabled || false,
        reminder_minutes: taskData.reminder_minutes || CONFIG.SETTINGS.DEFAULT_REMINDER_MINUTES,
        order: this.tasks.length
      };

      const { data, error } = await db.createTask(task);
      
      if (error) throw new Error(error);

      // Add to local array
      this.tasks.unshift(data);
      
      // Schedule reminder if enabled
      if (data.reminder_enabled) {
        scheduleTaskReminder(data);
      }

      // Handle recurring tasks
      if (data.recurring) {
        await this.createRecurringInstances(data);
      }

      this.renderTasks();
      this.updateTaskStats();
      
      // Trigger event for other components
      document.dispatchEvent(new CustomEvent('task-created', { detail: data }));
      
      showNotification('Attività creata con successo!', 'success');
      return { success: true, data };
    } catch (error) {
      console.error('Create task error:', error);
      showNotification(error.message, 'error');
      return { success: false, error: error.message };
    }
  }

  async updateTask(taskId, updates) {
    try {
      const { data, error } = await db.updateTask(taskId, updates);
      
      if (error) throw new Error(error);

      // Update local array
      const index = this.tasks.findIndex(t => t.id === taskId);
      if (index !== -1) {
        this.tasks[index] = { ...this.tasks[index], ...data };
      }

      this.renderTasks();
      this.updateTaskStats();
      
      // Trigger event for other components
      document.dispatchEvent(new CustomEvent('task-updated', { detail: data }));
      
      return { success: true, data };
    } catch (error) {
      console.error('Update task error:', error);
      showNotification('Errore nell\'aggiornamento dell\'attività', 'error');
      return { success: false, error: error.message };
    }
  }

  async deleteTask(taskId) {
    try {
      const taskIndex = this.tasks.findIndex(t => t.id === taskId);
      if (taskIndex === -1) throw new Error('Attività non trovata');

      const task = this.tasks[taskIndex];
      
      // Confirm deletion
      const confirmed = await showConfirmDialog(
        'Elimina Attività',
        `Sei sicuro di voler eliminare "${task.title}"?`,
        'Elimina',
        'Annulla'
      );

      if (!confirmed) return { success: false };

      // Delete from database
      const { error } = await db.supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw new Error(error);

      // Remove from local array
      this.tasks.splice(taskIndex, 1);

      // Cancel any scheduled reminders
      cancelTaskReminder(taskId);

      this.renderTasks();
      this.updateTaskStats();
      
      showNotification('Attività eliminata', 'success');
      return { success: true };
    } catch (error) {
      console.error('Delete task error:', error);
      showNotification(error.message, 'error');
      return { success: false, error: error.message };
    }
  }

  async duplicateTask(taskId) {
    try {
      const originalTask = this.tasks.find(t => t.id === taskId);
      if (!originalTask) throw new Error('Attività non trovata');

      // Create duplicate with modified title and tomorrow's date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const duplicateData = {
        ...originalTask,
        title: `${originalTask.title} (copia)`,
        date: tomorrow.toISOString().split('T')[0],
        status: 'pending',
        completed_at: null
      };

      // Remove fields that shouldn't be duplicated
      delete duplicateData.id;
      delete duplicateData.created_at;
      delete duplicateData.updated_at;

      const result = await this.createTask(duplicateData);
      
      if (result.success) {
        showNotification('Attività duplicata con successo!', 'success');
      }

      return result;
    } catch (error) {
      console.error('Duplicate task error:', error);
      showNotification('Errore nella duplicazione dell\'attività', 'error');
      return { success: false, error: error.message };
    }
  }

  async toggleTaskStatus(taskId) {
    try {
      const task = this.tasks.find(t => t.id === taskId);
      if (!task) throw new Error('Attività non trovata');

      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      const updates = {
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null
      };

      const result = await this.updateTask(taskId, updates);
      
      if (result.success && newStatus === 'completed') {
        // Show celebration animation
        showTaskCompletionCelebration(task.title);
        
        // Update streak and stats
        this.updateTaskStats();
        
        // Play completion sound (if enabled)
        playCompletionSound();
      }

      return result;
    } catch (error) {
      console.error('Toggle task status error:', error);
      showNotification('Errore nell\'aggiornamento dello stato', 'error');
      return { success: false, error: error.message };
    }
  }

  async createRecurringInstances(task) {
    try {
      // Create next 7 instances for daily recurring tasks
      if (task.recurring) {
        const instances = [];
        const startDate = new Date(task.date);
        
        for (let i = 1; i <= 7; i++) {
          const instanceDate = new Date(startDate);
          instanceDate.setDate(instanceDate.getDate() + i);
          
          const instance = {
            ...task,
            id: generateUUID(),
            date: instanceDate.toISOString().split('T')[0],
            parent_task_id: task.id,
            status: 'pending',
            completed_at: null
          };
          
          delete instance.created_at;
          delete instance.updated_at;
          
          instances.push(instance);
        }

        // Save instances to database
        for (const instance of instances) {
          await db.createTask(instance);
        }
      }
    } catch (error) {
      console.error('Create recurring instances error:', error);
    }
  }

  // Auto-save draft functionality
  autoSaveDraft() {
    const form = document.getElementById('task-form');
    if (!form) return;

    const formData = new FormData(form);
    const draftData = {
      title: formData.get('title'),
      description: formData.get('description'),
      date: formData.get('date'),
      time: formData.get('time'),
      duration: formData.get('duration'),
      priority: formData.get('priority'),
      category: formData.get('category'),
      assignee_id: formData.get('assignee_id')
    };

    localStorage.setItem('adhd_planner_task_draft', JSON.stringify(draftData));
  }

  loadDraft() {
    const draftData = localStorage.getItem('adhd_planner_task_draft');
    if (!draftData) return;

    try {
      const draft = JSON.parse(draftData);
      
      // Fill form fields
      Object.entries(draft).forEach(([key, value]) => {
        const field = document.getElementById(`task-${key}`);
        if (field && value) {
          field.value = value;
        }
      });

      showNotification('Bozza ripristinata', 'info');
    } catch (error) {
      console.error('Load draft error:', error);
    }
  }

  clearDraft() {
    localStorage.removeItem('adhd_planner_task_draft');
  }

  // Filter management
  setFilter(filter) {
    this.currentFilter = filter;
    
    // Update filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    document.querySelector(`[onclick="filterTasks('${filter}')"]`)?.classList.add('active');
    
    this.renderTasks();
  }

  // Task search
  searchTasks(query) {
    if (!query.trim()) {
      this.renderTasks();
      return;
    }

    const searchResults = this.tasks.filter(task => 
      task.title.toLowerCase().includes(query.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(query.toLowerCase()))
    );

    this.renderFilteredTasks(searchResults);
  }

  renderFilteredTasks(tasks) {
    const container = document.getElementById('tasks-container');
    if (!container) return;

    if (tasks.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <h3 class="empty-title">Nessun risultato</h3>
          <p class="empty-subtitle">Prova con termini di ricerca diversi</p>
        </div>
      `;
      return;
    }

    container.innerHTML = tasks.map(task => this.renderTask(task)).join('');
    this.setupTaskInteractions();
  }

  // Export functionality
  exportTasks(format = 'csv') {
    try {
      const exportData = this.tasks.map(task => ({
        Titolo: task.title,
        Descrizione: task.description || '',
        Data: task.date,
        Ora: task.time || '',
        Durata: task.duration || '',
        Priorità: task.priority,
        Categoria: this.getCategoryLabel(task.category),
        Assegnata: this.getAssigneeName(task.assignee_id) || '',
        Stato: task.status === 'completed' ? 'Completata' : 'Da fare',
        'Data Creazione': new Date(task.created_at).toLocaleDateString('it-IT')
      }));

      if (format === 'csv') {
        this.exportToCSV(exportData);
      } else if (format === 'json') {
        this.exportToJSON(exportData);
      }

      showNotification(`Attività esportate in formato ${format.toUpperCase()}`, 'success');
    } catch (error) {
      console.error('Export tasks error:', error);
      showNotification('Errore nell\'esportazione', 'error');
    }
  }

  exportToCSV(data) {
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n');

    this.downloadFile(csvContent, 'attivita-adhd.csv', 'text/csv');
  }

  exportToJSON(data) {
    const jsonContent = JSON.stringify(data, null, 2);
    this.downloadFile(jsonContent, 'attivita-adhd.json', 'application/json');
  }

  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

// Task UI Functions
function createNewTask() {
  // Reset form
  document.getElementById('task-form').reset();
  document.getElementById('task-form').removeAttribute('data-edit-id');
  document.getElementById('task-modal-title').textContent = '✨ Nuova Attività';

  // Set default date to today
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('task-date').value = today;

  // Load family members for assignee dropdown
  loadFamilyMembersInDropdown();

  // Load draft if available
  taskManager.loadDraft();

  showTaskModal();
}

function editTask(taskId) {
  const task = taskManager.tasks.find(t => t.id === taskId);
  if (!task) return;

  // Fill form with task data
  document.getElementById('task-title').value = task.title;
  document.getElementById('task-description').value = task.description || '';
  document.getElementById('task-date').value = task.date;
  document.getElementById('task-time').value = task.time || '';
  document.getElementById('task-duration').value = task.duration || 30;
  document.getElementById('task-assignee').value = task.assignee_id || '';
  document.getElementById('task-priority').value = task.priority;
  document.getElementById('task-category').value = task.category;
  document.getElementById('task-reminder').checked = task.reminder_enabled;
  document.getElementById('task-recurring').checked = task.recurring;

  // Set form in edit mode
  document.getElementById('task-form').dataset.editId = taskId;
  document.getElementById('task-modal-title').textContent = '✏️ Modifica Attività';

  loadFamilyMembersInDropdown();
  showTaskModal();
}

function duplicateTask(taskId) {
  taskManager.duplicateTask(taskId);
}

async function deleteTask(taskId) {
  await taskManager.deleteTask(taskId);
}

async function toggleTaskStatus(taskId) {
  await taskManager.toggleTaskStatus(taskId);
}

function filterTasks(filter) {
  taskManager.setFilter(filter);
}

function showTaskModal() {
  document.getElementById('task-modal').classList.remove('hidden');
  document.getElementById('task-title').focus();
}

function closeTaskModal() {
  document.getElementById('task-modal').classList.add('hidden');
  taskManager.clearDraft();
}

async function saveTask(event) {
  event.preventDefault();
  
  const form = event.target;
  const formData = new FormData(form);
  const editId = form.dataset.editId;

  const taskData = {
    title: formData.get('title').trim(),
    description: formData.get('description')?.trim(),
    date: formData.get('date'),
    time: formData.get('time') || null,
    duration: parseInt(formData.get('duration')) || 30,
    assignee_id: formData.get('assignee_id') || null,
    priority: formData.get('priority'),
    category: formData.get('category'),
    reminder_enabled: formData.has('reminder_enabled'),
    recurring: formData.has('recurring')
  };

  // Validation
  if (!taskData.title) {
    showNotification('Il titolo è obbligatorio', 'error');
    return;
  }

  if (!taskData.date) {
    showNotification('La data è obbligatoria', 'error');
    return;
  }

  let result;
  if (editId) {
    result = await taskManager.updateTask(editId, taskData);
  } else {
    result = await taskManager.createTask(taskData);
  }

  if (result.success) {
    closeTaskModal();
    taskManager.clearDraft();
  }
}

function loadFamilyMembersInDropdown() {
  const select = document.getElementById('task-assignee');
  if (!select) return;

  // Clear existing options except the first one
  const firstOption = select.querySelector('option[value=""]');
  select.innerHTML = '';
  select.appendChild(firstOption);

  // Add family members
  const members = window.familyMembers || [];
  members.forEach(member => {
    const option = document.createElement('option');
    option.value = member.id;
    option.textContent = member.name;
    select.appendChild(option);
  });
}

function addQuickTask() {
  const taskTitle = prompt('Nome attività rapida:');
  if (!taskTitle?.trim()) return;

  const today = new Date().toISOString().split('T')[0];
  const quickTaskData = {
    title: taskTitle.trim(),
    date: today,
    priority: 'medium',
    category: 'other'
  };

  taskManager.createTask(quickTaskData);
}

// Utility functions for task management
function playCompletionSound() {
  if (!window.completionAudio) {
    // Create audio context for completion sound
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Audio not supported');
    }
  }
}

async function showConfirmDialog(title, message, confirmText = 'Conferma', cancelText = 'Annulla') {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 400px;">
        <h3>${title}</h3>
        <p style="margin: 1rem 0;">${message}</p>
        <div class="modal-actions">
          <button class="btn btn-outline" onclick="this.closest('.modal').resolve(false)">${cancelText}</button>
          <button class="btn btn-primary" onclick="this.closest('.modal').resolve(true)">${confirmText}</button>
        </div>
      </div>
    `;

    modal.resolve = (result) => {
      document.body.removeChild(modal);
      resolve(result);
    };

    // Handle escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        modal.resolve(false);
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);

    document.body.appendChild(modal);
  });
}

// Initialize task manager
window.taskManager = new TaskManager();