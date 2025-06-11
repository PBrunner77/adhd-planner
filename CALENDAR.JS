// Calendar management
class CalendarManager {
  constructor() {
    this.currentDate = new Date();
    this.selectedDate = new Date();
    this.events = [];
    this.view = 'month'; // month, week, day
    this.init();
  }

  init() {
    this.loadEvents();
    this.renderCalendar();
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Update calendar when data changes
    document.addEventListener('task-created', () => this.loadEvents());
    document.addEventListener('task-updated', () => this.loadEvents());
    document.addEventListener('event-created', () => this.loadEvents());
  }

  async loadEvents() {
    try {
      const family = getCurrentFamily();
      if (!family) return;

      // Get start and end of current month
      const startOfMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
      const endOfMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);

      // Load events from database
      const { data: events } = await db.getEvents(
        family.id,
        startOfMonth.toISOString(),
        endOfMonth
		  endOfMonth.toISOString()
      );

      // Load tasks as events too
      const { data: tasks } = await db.getTasks(family.id, {});

      // Combine events and tasks
      this.events = [
        ...(events || []),
        ...(tasks || []).map(task => ({
          id: task.id,
          title: task.title,
          start_date: task.date + 'T' + (task.time || '09:00:00'),
          end_date: task.date + 'T' + (task.time || '09:00:00'),
          type: 'task',
          priority: task.priority,
          status: task.status,
          assignee_id: task.assignee_id
        }))
      ];

      this.renderCalendar();
    } catch (error) {
      console.error('Load events error:', error);
    }
  }

  renderCalendar() {
    const calendarGrid = document.getElementById('calendar-grid');
    if (!calendarGrid) return;

    // Update month display
    this.updateMonthDisplay();

    // Clear existing calendar
    calendarGrid.innerHTML = '';

    // Create calendar header
    this.createCalendarHeader(calendarGrid);

    // Create calendar days
    this.createCalendarDays(calendarGrid);
  }

  updateMonthDisplay() {
    const currentMonthElement = document.getElementById('current-month');
    if (currentMonthElement) {
      const monthNames = [
        'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
        'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
      ];
      
      currentMonthElement.textContent = 
        `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
    }
  }

  createCalendarHeader(container) {
    const header = document.createElement('div');
    header.className = 'calendar-header';

    const dayNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
    
    dayNames.forEach(dayName => {
      const dayElement = document.createElement('div');
      dayElement.className = 'calendar-day-header';
      dayElement.textContent = dayName;
      header.appendChild(dayElement);
    });

    container.appendChild(header);
  }

  createCalendarDays(container) {
    const daysContainer = document.createElement('div');
    daysContainer.className = 'calendar-days';

    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      const emptyDay = document.createElement('div');
      emptyDay.className = 'calendar-day other-month';
      daysContainer.appendChild(emptyDay);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayElement = this.createDayElement(year, month, day);
      daysContainer.appendChild(dayElement);
    }

    container.appendChild(daysContainer);
  }

  createDayElement(year, month, day) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    
    const currentDate = new Date(year, month, day);
    const today = new Date();
    
    // Check if it's today
    if (currentDate.toDateString() === today.toDateString()) {
      dayElement.classList.add('today');
    }

    // Add day number
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = day;
    dayElement.appendChild(dayNumber);

    // Add events for this day
    const dayEvents = this.getEventsForDay(currentDate);
    if (dayEvents.length > 0) {
      const eventsContainer = document.createElement('div');
      eventsContainer.className = 'day-events';
      
      dayEvents.slice(0, 3).forEach(event => { // Show max 3 events
        const eventDot = document.createElement('div');
        eventDot.className = 'event-dot';
        eventDot.style.backgroundColor = this.getEventColor(event);
        eventDot.title = event.title;
        eventsContainer.appendChild(eventDot);
      });

      if (dayEvents.length > 3) {
        const moreIndicator = document.createElement('div');
        moreIndicator.className = 'more-events';
        moreIndicator.textContent = `+${dayEvents.length - 3}`;
        eventsContainer.appendChild(moreIndicator);
      }

      dayElement.appendChild(eventsContainer);
    }

    // Add click handler
    dayElement.addEventListener('click', () => {
      this.selectDate(currentDate);
    });

    return dayElement;
  }

  getEventsForDay(date) {
    const dateString = date.toISOString().split('T')[0];
    return this.events.filter(event => {
      const eventDate = new Date(event.start_date).toISOString().split('T')[0];
      return eventDate === dateString;
    });
  }

  getEventColor(event) {
    if (event.type === 'task') {
      switch (event.priority) {
        case 'high': return CONFIG.ADHD_SETTINGS.COLOR_CODING.high_priority;
        case 'medium': return CONFIG.ADHD_SETTINGS.COLOR_CODING.medium_priority;
        case 'low': return CONFIG.ADHD_SETTINGS.COLOR_CODING.low_priority;
        default: return '#6B73FF';
      }
    }
    return '#6B73FF'; // Default event color
  }

  selectDate(date) {
    this.selectedDate = date;
    
    // Update selected day styling
    document.querySelectorAll('.calendar-day').forEach(day => {
      day.classList.remove('selected');
    });

    // Highlight selected day
    event.target.closest('.calendar-day').classList.add('selected');

    // Update today's events display
    this.updateTodaysEvents();
  }

  updateTodaysEvents() {
    const todayEventsContainer = document.getElementById('today-events');
    if (!todayEventsContainer) return;

    const dayEvents = this.getEventsForDay(this.selectedDate);
    
    if (dayEvents.length === 0) {
      todayEventsContainer.innerHTML = `
        <div class="no-events">
          <p>📅 Nessun evento per ${this.formatDate(this.selectedDate)}</p>
          <button class="btn btn-primary" onclick="addCalendarEvent()">
            + Aggiungi Evento
          </button>
        </div>
      `;
      return;
    }

    todayEventsContainer.innerHTML = dayEvents.map(event => `
      <div class="event-item" data-event-id="${event.id}">
        <div class="event-time">
          ${this.formatEventTime(event)}
        </div>
        <div class="event-content">
          <div class="event-title">${event.title}</div>
          <div class="event-meta">
            ${event.type === 'task' ? '📋 Attività' : '📅 Evento'}
            ${event.assignee_id ? '• ' + this.getAssigneeName(event.assignee_id) : ''}
          </div>
        </div>
        <div class="event-actions">
          <button class="btn btn-small" onclick="editEvent('${event.id}')">
            ✏️
          </button>
          ${event.type === 'task' ? `
            <button class="btn btn-small ${event.status === 'completed' ? 'btn-success' : ''}" 
                    onclick="toggleTaskComplete('${event.id}')">
              ${event.status === 'completed' ? '✅' : '◯'}
            </button>
          ` : ''}
        </div>
      </div>
    `).join('');
  }

  formatDate(date) {
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('it-IT', options);
  }

  formatEventTime(event) {
    const startTime = new Date(event.start_date);
    const endTime = new Date(event.end_date);
    
    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    
    if (event.type === 'task') {
      return startTime.toLocaleTimeString('it-IT', timeOptions);
    }
    
    return `${startTime.toLocaleTimeString('it-IT', timeOptions)} - ${endTime.toLocaleTimeString('it-IT', timeOptions)}`;
  }

  getAssigneeName(assigneeId) {
    const members = window.familyMembers || [];
    const member = members.find(m => m.id === assigneeId);
    return member ? member.name : 'Famiglia';
  }

  // Navigation methods
  previousMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.loadEvents();
  }

  nextMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.loadEvents();
  }

  goToToday() {
    this.currentDate = new Date();
    this.selectedDate = new Date();
    this.loadEvents();
  }

  // Event creation
  async createEvent(eventData) {
    try {
      const family = getCurrentFamily();
      if (!family) throw new Error('Famiglia non trovata');

      const event = {
        family_id: family.id,
        title: eventData.title,
        description: eventData.description || '',
        start_date: eventData.start_date,
        end_date: eventData.end_date,
        type: eventData.type || 'event',
        color: eventData.color || '#6B73FF',
        all_day: eventData.all_day || false,
        recurring: eventData.recurring || false,
        recurring_pattern: eventData.recurring_pattern || null
      };

      const { data, error } = await db.createEvent(event);
      
      if (error) throw new Error(error);

      // Refresh calendar
      this.loadEvents();
      
      // Trigger event for other components
      document.dispatchEvent(new CustomEvent('event-created', { detail: data }));
      
      showNotification('Evento creato con successo!', 'success');
      return { success: true, data };
    } catch (error) {
      console.error('Create event error:', error);
      showNotification(error.message, 'error');
      return { success: false, error: error.message };
    }
  }
}

// Calendar UI Functions
function previousMonth() {
  if (window.calendar) {
    calendar.previousMonth();
  }
}

function nextMonth() {
  if (window.calendar) {
    calendar.nextMonth();
  }
}

function addCalendarEvent() {
  const selectedDate = calendar.selectedDate || new Date();
  const dateString = selectedDate.toISOString().split('T')[0];
  
  // Pre-fill the task modal with selected date
  document.getElementById('task-date').value = dateString;
  document.getElementById('task-modal-title').textContent = '📅 Nuovo Evento';
  
  showTaskModal();
}

async function editEvent(eventId) {
  try {
    const event = calendar.events.find(e => e.id === eventId);
    if (!event) return;

    // Pre-fill modal with event data
    document.getElementById('task-title').value = event.title;
    document.getElementById('task-description').value = event.description || '';
    
    const eventDate = new Date(event.start_date);
    document.getElementById('task-date').value = eventDate.toISOString().split('T')[0];
    document.getElementById('task-time').value = eventDate.toTimeString().substring(0, 5);
    
    // Set modal in edit mode
    document.getElementById('task-modal-title').textContent = '✏️ Modifica Evento';
    document.getElementById('task-form').dataset.editId = eventId;
    
    showTaskModal();
  } catch (error) {
    console.error('Edit event error:', error);
    showNotification('Errore nel caricamento dell\'evento', 'error');
  }
}

async function toggleTaskComplete(taskId) {
  try {
    const task = calendar.events.find(e => e.id === taskId && e.type === 'task');
    if (!task) return;

    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    
    const { error } = await db.updateTask(taskId, { 
      status: newStatus,
      completed_at: newStatus === 'completed' ? new Date().toISOString() : null
    });

    if (error) throw new Error(error);

    // Update local data
    task.status = newStatus;
    
    // Refresh displays
    calendar.updateTodaysEvents();
    updateDashboardStats();
    
    // Show celebration for completion
    if (newStatus === 'completed') {
      showTaskCompletionCelebration(task.title);
    }
    
    showNotification(
      newStatus === 'completed' ? 'Attività completata! 🎉' : 'Attività riattivata',
      'success'
    );
  } catch (error) {
    console.error('Toggle task complete error:', error);
    showNotification('Errore nell\'aggiornamento dell\'attività', 'error');
  }
}

function showTaskCompletionCelebration(taskTitle) {
  // Create celebration animation
  const celebration = document.createElement('div');
  celebration.className = 'celebration-popup';
  celebration.innerHTML = `
    <div class="celebration-content">
      <div class="celebration-emoji">🎉</div>
      <div class="celebration-text">Fantastico!</div>
      <div class="celebration-subtitle">"${taskTitle}" completata</div>
    </div>
  `;
  
  document.body.appendChild(celebration);
  
  // Add animation styles
  celebration.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0);
    background: white;
    padding: 2rem;
    border-radius: 1rem;
    box-shadow: 0 20px 40px rgba(0,0,0,0.2);
    text-align: center;
    z-index: 10000;
    animation: celebrationPop 2s ease-out forwards;
  `;
  
  // Remove after animation
  setTimeout(() => {
    if (celebration.parentNode) {
      celebration.parentNode.removeChild(celebration);
    }
  }, 2000);
}

// Add celebration animation to CSS
const celebrationStyles = `
@keyframes celebrationPop {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.1);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
}

.celebration-emoji {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.celebration-text {
  font-size: 1.5rem;
  font-weight: bold;
  color: #4ECDC4;
  margin-bottom: 0.5rem;
}

.celebration-subtitle {
  color: #666;
  font-size: 0.9rem;
}
`;

// Inject celebration styles
const styleSheet = document.createElement('style');
styleSheet.textContent = celebrationStyles;
document.head.appendChild(styleSheet);

// Initialize calendar
window.calendar = new CalendarManager();
		