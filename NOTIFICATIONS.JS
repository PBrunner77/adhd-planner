// Notifications and reminders system
class NotificationManager {
  constructor() {
    this.notifications = [];
    this.reminders = [];
    this.permission = 'default';
    this.init();
  }

  init() {
    this.requestNotificationPermission();
    this.loadScheduledReminders();
    this.setupServiceWorker();
    this.startReminderService();
  }

  async requestNotificationPermission() {
    if ('Notification' in window) {
      this.permission = await Notification.requestPermission();
      
      if (this.permission === 'granted') {
	    showNotification('Notifiche attivate! Ti ricorderemo le attività importanti.', 'success');
      } else if (this.permission === 'denied') {
        showNotification('Notifiche disattivate. Puoi attivarle dalle impostazioni del browser.', 'warning');
      }
    }
  }

  setupServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        console.log('Service Worker ready for notifications');
      });
    }
  }

  startReminderService() {
    // Check for due reminders every minute
    setInterval(() => {
      this.checkDueReminders();
    }, 60000);

    // Check immediately
    this.checkDueReminders();
  }

  scheduleTaskReminder(task) {
    if (!task.reminder_enabled || !task.date || !task.time) return;

    const reminderTime = this.calculateReminderTime(task);
    if (!reminderTime || reminderTime <= new Date()) return;

    const reminder = {
      id: `task_${task.id}`,
      type: 'task',
      title: task.title,
      message: `È ora di: ${task.title}`,
      scheduledTime: reminderTime,
      taskId: task.id,
      data: {
        task: task,
        url: window.location.origin + '?task=' + task.id
      }
    };

    this.reminders.push(reminder);
    this.saveReminders();

    console.log(`Promemoria programmato per: ${reminderTime.toLocaleString()}`);
  }

  calculateReminderTime(task) {
    try {
      const taskDateTime = new Date(`${task.date}T${task.time}`);
      const reminderMinutes = task.reminder_minutes || CONFIG.SETTINGS.DEFAULT_REMINDER_MINUTES;
      return new Date(taskDateTime.getTime() - (reminderMinutes * 60000));
    } catch (error) {
      console.error('Error calculating reminder time:', error);
      return null;
    }
  }

  checkDueReminders() {
    const now = new Date();
    const dueReminders = this.reminders.filter(reminder => 
      reminder.scheduledTime <= now && !reminder.sent
    );

    dueReminders.forEach(reminder => {
      this.sendReminder(reminder);
      reminder.sent = true;
    });

    if (dueReminders.length > 0) {
      this.saveReminders();
    }

    // Clean up old reminders (older than 24 hours)
    this.cleanupOldReminders();
  }

  sendReminder(reminder) {
    try {
      // Show browser notification
      if (this.permission === 'granted') {
        this.showBrowserNotification(reminder);
      }

      // Show in-app notification
      this.showInAppNotification(reminder);

      // Play notification sound
      this.playNotificationSound();

      // Log reminder
      console.log('Reminder sent:', reminder);
    } catch (error) {
      console.error('Error sending reminder:', error);
    }
  }

  showBrowserNotification(reminder) {
    const notification = new Notification(reminder.title, {
      body: reminder.message,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: reminder.id,
      data: reminder.data,
      requireInteraction: true,
      actions: [
        {
          action: 'complete',
          title: '✅ Completa',
          icon: '/icons/complete.png'
        },
        {
          action: 'snooze',
          title: '⏰ Rimanda 10min',
          icon: '/icons/snooze.png'
        }
      ]
    });

    notification.onclick = () => {
      window.focus();
      if (reminder.data.url) {
        window.location.href = reminder.data.url;
      }
      notification.close();
    };

    // Auto close after 10 seconds
    setTimeout(() => {
      notification.close();
    }, 10000);
  }

  showInAppNotification(reminder) {
    const notificationElement = document.createElement('div');
    notificationElement.className = 'reminder-notification';
    notificationElement.innerHTML = `
      <div class="reminder-content">
        <div class="reminder-icon">⏰</div>
        <div class="reminder-text">
          <div class="reminder-title">${reminder.title}</div>
          <div class="reminder-message">${reminder.message}</div>
        </div>
        <div class="reminder-actions">
          <button class="btn btn-small btn-success" onclick="completeTaskFromReminder('${reminder.taskId}')">
            ✅
          </button>
          <button class="btn btn-small" onclick="snoozeReminder('${reminder.id}')">
            ⏰
          </button>
          <button class="btn btn-small" onclick="dismissReminder(this)">
            ✕
          </button>
        </div>
      </div>
    `;

    // Add to notification container
    const container = document.getElementById('notification-container');
    if (container) {
      container.appendChild(notificationElement);

      // Auto remove after 30 seconds
      setTimeout(() => {
        if (notificationElement.parentNode) {
          notificationElement.parentNode.removeChild(notificationElement);
        }
      }, 30000);
    }
  }

  playNotificationSound() {
    try {
      // Create notification sound
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.05, audioContext.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('Notification sound not supported');
    }
  }

  cancelTaskReminder(taskId) {
    this.reminders = this.reminders.filter(reminder => 
      reminder.taskId !== taskId
    );
    this.saveReminders();
  }

  snoozeReminder(reminderId, minutes = 10) {
    const reminder = this.reminders.find(r => r.id === reminderId);
    if (reminder) {
      const newTime = new Date(Date.now() + (minutes * 60000));
      reminder.scheduledTime = newTime;
      reminder.sent = false;
      this.saveReminders();
      
      showNotification(`Promemoria rimandato di ${minutes} minuti`, 'info');
    }
  }

  saveReminders() {
    try {
      localStorage.setItem('adhd_planner_reminders', JSON.stringify(this.reminders));
    } catch (error) {
      console.error('Error saving reminders:', error);
    }
  }

  loadScheduledReminders() {
    try {
      const saved = localStorage.getItem('adhd_planner_reminders');
      if (saved) {
        this.reminders = JSON.parse(saved).map(reminder => ({
          ...reminder,
          scheduledTime: new Date(reminder.scheduledTime)
        }));
      }
    } catch (error) {
      console.error('Error loading reminders:', error);
      this.reminders = [];
    }
  }

  cleanupOldReminders() {
    const twentyFourHoursAgo = new Date(Date.now() - (24 * 60 * 60 * 1000));
    const oldCount = this.reminders.length;
    
    this.reminders = this.reminders.filter(reminder => 
      reminder.scheduledTime > twentyFourHoursAgo
    );

    if (this.reminders.length !== oldCount) {
      this.saveReminders();
    }
  }

  // Daily motivation notifications
  scheduleDailyMotivation() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0); // 8 AM

    const motivationalMessages = [
      "🌟 Oggi è un nuovo giorno pieno di possibilità!",
      "💪 Ricorda: ogni piccolo passo conta!",
      "🎯 Focus su una cosa alla volta, ce la fai!",
      "🌈 Il tuo cervello ADHD è unico e speciale!",
      "✨ Oggi fai qualcosa che ti rende orgoglioso!"
    ];

    const message = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

    const reminder = {
      id: `motivation_${Date.now()}`,
      type: 'motivation',
      title: 'Motivazione del giorno',
      message: message,
      scheduledTime: tomorrow,
      recurring: true
    };

    this.reminders.push(reminder);
    this.saveReminders();
  }

  // Break reminders for focus sessions
  scheduleBreakReminder(minutes = 25) {
    const breakTime = new Date(Date.now() + (minutes * 60000));
    
    const reminder = {
      id: `break_${Date.now()}`,
      type: 'break',
      title: 'Pausa!',
      message: '🧘‍♀️ È ora di fare una pausa. Alzati, muoviti, respira!',
      scheduledTime: breakTime
    };

    this.reminders.push(reminder);
    this.saveReminders();

    showNotification(`Pausa programmata tra ${minutes} minuti`, 'info');
  }

  // Weekly summary notification
  scheduleWeeklySummary() {
    const now = new Date();
    const nextSunday = new Date(now);
    nextSunday.setDate(now.getDate() + (7 - now.getDay()));
    nextSunday.setHours(19, 0, 0, 0); // Sunday 7 PM

    const reminder = {
      id: `weekly_summary_${Date.now()}`,
      type: 'summary',
      title: 'Riassunto settimanale',
      message: '📊 Tempo di rivedere i tuoi progressi della settimana!',
      scheduledTime: nextSunday,
      recurring: true
    };

    this.reminders.push(reminder);
    this.saveReminders();
  }

  // Get notification statistics
  getNotificationStats() {
    const stats = {
      total_sent: 0,
      task_reminders: 0,
      motivational: 0,
      breaks: 0,
      completion_rate: 0
    };

    // This would typically come from a more persistent storage
    const sentReminders = this.reminders.filter(r => r.sent);
    stats.total_sent = sentReminders.length;
    stats.task_reminders = sentReminders.filter(r => r.type === 'task').length;
    stats.motivational = sentReminders.filter(r => r.type === 'motivation').length;
    stats.breaks = sentReminders.filter(r => r.type === 'break').length;

    return stats;
  }
}

// Global notification functions
function showNotification(message, type = 'info', duration = 5000) {
  const container = document.getElementById('notification-container');
  if (!container) return;

  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-icon">${icons[type] || icons.info}</span>
      <span class="notification-message">${message}</span>
      <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
  `;

  container.appendChild(notification);

  // Auto remove
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.animation = 'slideOutRight 0.3s ease-out forwards';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }
  }, duration);
}

function showLoading(show = true, message = 'Caricamento...') {
  const loadingScreen = document.getElementById('loading-screen');
  if (!loadingScreen) return;

  if (show) {
    loadingScreen.querySelector('p').textContent = message;
    loadingScreen.classList.remove('hidden');
  } else {
    loadingScreen.classList.add('hidden');
  }
}

function hideLoading() {
  showLoading(false);
}

// Reminder interaction functions
async function completeTaskFromReminder(taskId) {
  if (window.taskManager) {
    await taskManager.toggleTaskStatus(taskId);
  }
  
  // Remove the reminder notification
  document.querySelectorAll('.reminder-notification').forEach(notification => {
    if (notification.innerHTML.includes(taskId)) {
      notification.remove();
    }
  });
}

function snoozeReminder(reminderId) {
  if (window.notificationManager) {
    notificationManager.snoozeReminder(reminderId, 10);
  }
  
  // Remove the reminder notification
  document.querySelectorAll('.reminder-notification').forEach(notification => {
    if (notification.innerHTML.includes(reminderId)) {
      notification.remove();
    }
  });
}

function dismissReminder(element) {
  element.closest('.reminder-notification').remove();
}

// Schedule reminder functions
function scheduleTaskReminder(task) {
  if (window.notificationManager) {
    notificationManager.scheduleTaskReminder(task);
  }
}

function cancelTaskReminder(taskId) {
  if (window.notificationManager) {
    notificationManager.cancelTaskReminder(taskId);
  }
}

function startFocusSession(minutes = 25) {
  if (window.notificationManager) {
    notificationManager.scheduleBreakReminder(minutes);
  }
  
  showNotification(`Sessione di focus iniziata! Pausa tra ${minutes} minuti.`, 'success');
}

function scheduleDailyMotivation() {
  if (window.notificationManager) {
    notificationManager.scheduleDailyMotivation();
  }
}

// Notification styles
const notificationStyles = `
@keyframes slideOutRight {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

.reminder-notification {
  background: linear-gradient(135deg, #6B73FF, #9B59B6);
  color: white;
  border-radius: var(--border-radius-lg);
  padding: var(--space-lg);
  margin-bottom: var(--space-sm);
  box-shadow: var(--shadow-lg);
  animation: slideInRight 0.3s ease-out;
}

.reminder-content {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.reminder-icon {
  font-size: 2rem;
  background: rgba(255, 255, 255, 0.2);
  padding: var(--space-sm);
  border-radius: 50%;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.reminder-text {
  flex: 1;
}

.reminder-title {
  font-weight: bold;
  font-size: var(--font-size-lg);
  margin-bottom: var(--space-xs);
}

.reminder-message {
  opacity: 0.9;
}

.reminder-actions {
  display: flex;
  gap: var(--space-sm);
}

.reminder-actions .btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  min-width: auto;
  padding: var(--space-sm);
}

.reminder-actions .btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.reminder-actions .btn-success {
  background: var(--success-color);
  border-color: var(--success-color);
}

.notification-content {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.notification-icon {
  font-size: 1.2rem;
}

.notification-message {
  flex: 1;
}

.notification-close {
  background: none;
  border: none;
  color: inherit;
  font-size: 1.2rem;
  cursor: pointer;
  padding: var(--space-xs);
  opacity: 0.7;
  transition: opacity 0.2s;
}

.notification-close:hover {
  opacity: 1;
}

/* Focus session timer */
.focus-timer {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: var(--space-xl);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-lg);
  text-align: center;
  z-index: 10000;
}

.timer-display {
  font-size: 3rem;
  font-weight: bold;
  color: var(--primary-color);
  margin-bottom: var(--space-lg);
  font-family: 'Courier New', monospace;
}

.timer-controls {
  display: flex;
  gap: var(--space-md);
  justify-content: center;
}
`;

// Inject notification styles
const notificationStyleSheet = document.createElement('style');
notificationStyleSheet.textContent = notificationStyles;
document.head.appendChild(notificationStyleSheet);

// Initialize notification manager
window.notificationManager = new NotificationManager();