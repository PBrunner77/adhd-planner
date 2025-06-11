// ADHD Templates management
class TemplateManager {
  constructor() {
    this.templates = [];
    this.init();
  }

  init() {
    this.loadTemplates();
    this.renderTemplates();
  }

  loadTemplates() {
    this.templates = [
      {
        id: 'morning-routine',
        title: 'Routine Mattutina',
        description: 'Inizia la giornata con calma e organizzazione',
        icon: '🌅',
        category: 'routine',
        duration: 60,
        color: '#FFE066',
        difficulty: 'facile',
        age_group: '6-12',
        tasks: [
          {
            title: 'Sveglia dolce e stretching',
            description: 'Alzati con calma, fai qualche stiramento',
            duration: 5,
            order: 1,
            tips: 'Usa una sveglia con suoni naturali, evita rumori forti'
          },
          {
            title: 'Igiene personale',
            description: 'Lavati viso e denti, vestiti',
            duration: 15,
            order: 2,
            tips: 'Prepara i vestiti la sera prima per evitare scelte mattutine'
          },
          {
            title: 'Colazione nutriente',
            description: 'Mangia con calma, evita distrazioni',
            duration: 20,
            order: 3,
            tips: 'Colazioni semplici e sempre uguali riducono le decisioni'
          },
          {
            title: 'Controllo zaino e materiali',
            description: 'Verifica che tutto sia nello zaino',
            duration: 5,
            order: 4,
            tips: 'Usa una checklist visiva attaccata vicino alla porta'
          },
          {
            title: 'Momento di connessione',
            description: 'Abbraccio e parole positive prima di uscire',
            duration: 5,
            order: 5,
            tips: 'Sempre 2-3 frasi positive per iniziare bene la giornata'
          }
        ]
      },
      {
        id: 'homework-time',
        title: 'Tempo Compiti',
        description: 'Studia con focus e pause strategiche',
        icon: '📚',
        category: 'school',
        duration: 90,
        color: '#4ECDC4',
        difficulty: 'media',
        age_group: '7-14',
        tasks: [
          {
            title: 'Preparazione spazio studio',
            description: 'Pulisci il tavolo, prepara tutto il necessario',
            duration: 5,
            order: 1,
            tips: 'Spazio sempre uguale, poche distrazioni visive'
          },
          {
            title: 'Revisione agenda e priorità',
            description: 'Guarda cosa devi fare, decidi da cosa iniziare',
            duration: 5,
            order: 2,
            tips: 'Inizia sempre dal compito più difficile quando sei fresco'
          },
          {
            title: 'Prima sessione di studio',
            description: 'Concentrati per 25 minuti su una materia',
            duration: 25,
            order: 3,
            tips: 'Timer visibile, fidget toy discreto se aiuta'
          },
          {
            title: 'Pausa attiva',
            description: 'Alzati, muoviti, bevi acqua',
            duration: 10,
            order: 4,
            tips: 'Movimento fisico aiuta a ricaricare l\'attenzione'
          },
          {
            title: 'Seconda sessione di studio',
            description: 'Altri 25 minuti su altra materia',
            duration: 25,
            order: 5,
            tips: 'Cambia materia per mantenere interesse'
          },
          {
            title: 'Pausa più lunga',
            description: 'Rilassati, fai merenda se necessario',
            duration: 15,
            order: 6,
            tips: 'Merenda proteica mantiene energia costante'
          },
          {
            title: 'Ultima sessione (se necessaria)',
            description: 'Completa i compiti rimanenti',
            duration: 20,
            order: 7,
            tips: 'Se troppo stanco, meglio rimandare a domani mattina'
          },
          {
            title: 'Riordino e preparazione domani',
            description: 'Sistema tutto per domani',
            duration: 5,
            order: 8,
            tips: 'Prepara zaino e materiali subito per evitare stress mattutino'
          }
        ]
      },
      {
        id: 'evening-routine',
        title: 'Routine Serale',
        description: 'Termina la giornata con calma per un sonno ristoratore',
        icon: '🌙',
        category: 'routine',
        duration: 75,
        color: '#6B73FF',
        difficulty: 'facile',
        age_group: '5-16',
        tasks: [
          {
            title: 'Cena in famiglia',
            description: 'Mangia con calma, condividi la giornata',
            duration: 30,
            order: 1,
            tips: 'No TV o dispositivi, focus sulla connessione familiare'
          },
          {
            title: 'Tempo libero guidato',
            description: 'Attività calme: lettura, puzzle, disegno',
            duration: 20,
            order: 2,
            tips: 'Evita schermi almeno 1 ora prima del sonno'
          },
          {
            title: 'Preparazione per domani',
            description: 'Controlla agenda, prepara vestiti',
            duration: 10,
            order: 3,
            tips: 'Coinvolgi il bambino nelle scelte per responsabilizzarlo'
          },
          {
            title: 'Routine igiene serale',
            description: 'Bagno o doccia, denti, pigiama',
            duration: 15,
            order: 4,
            tips: 'Sempre nello stesso ordine, crea un rituale rassicurante'
          },
          {
            title: 'Momento di lettura insieme',
            description: 'Leggi una storia o libro insieme',
            duration: 15,
            order: 5,
            tips: 'Voce calma, luce soffusa, contenuti positivi'
          },
          {
            title: 'Preparazione al sonno',
            description: 'Luci spente gradualmente, musica soft',
            duration: 10,
            order: 6,
            tips: 'White noise o musica classica possono aiutare'
          }
        ]
      },
      {
        id: 'weekend-planning',
        title: 'Pianificazione Weekend',
        description: 'Organizza il fine settimana bilanciando riposo e attività',
        icon: '🏖️',
        category: 'fun',
        duration: 30,
        color: '#FF6B6B',
        difficulty: 'facile',
        age_group: 'tutti',
        tasks: [
          {
            title: 'Revisione settimana passata',
            description: 'Cosa è andato bene? Cosa migliorare?',
            duration: 5,
            order: 1,
            tips: 'Focus sui successi, non sui fallimenti'
          },
          {
            title: 'Pianificazione attività divertenti',
            description: 'Scegli 2-3 attività che piacciono a tutti',
            duration: 10,
            order: 2,
            tips: 'Bilancia attività dentro e fuori casa'
          },
          {
            title: 'Compiti weekend (se necessari)',
            description: 'Pianifica quando fare eventuali compiti',
            duration: 5,
            order: 3,
            tips: 'Meglio il sabato mattina quando si è riposati'
          },
          {
            title: 'Tempo famiglia',
            description: 'Programma momenti solo per stare insieme',
            duration: 5,
            order: 4,
            tips: 'Anche solo 30 minuti senza distrazioni tecnologiche'
          },
          {
            title: 'Preparazione settimana successiva',
            description: 'Controllo agenda, shopping se necessario',
            duration: 5,
            order: 5,
            tips: 'Coinvolgi tutti nella pianificazione familiare'
          }
        ]
      },
      {
        id: 'crisis-management',
        title: 'Gestione Crisi ADHD',
        description: '
		description: 'Strategie per gestire momenti di crisi e sovraccarico emotivo',
        icon: '🆘',
        category: 'emergency',
        duration: 15,
        color: '#FF6B6B',
        difficulty: 'importante',
        age_group: 'tutti',
        tasks: [
          {
            title: 'Respira insieme',
            description: 'Respiri lenti e profondi: 4 secondi dentro, 4 fuori',
            duration: 2,
            order: 1,
            tips: 'Fai tu per primo, il bambino ti imiterà naturalmente'
          },
          {
            title: 'Ambiente sicuro',
            description: 'Porta in un luogo calmo, lontano da stimoli',
            duration: 1,
            order: 2,
            tips: 'Un angolo tranquillo di casa, sempre lo stesso posto'
          },
          {
            title: 'Validazione emotiva',
            description: 'Riconosci le sue emozioni senza giudicare',
            duration: 3,
            order: 3,
            tips: '"Vedo che sei molto arrabbiato, è normale sentirsi così"'
          },
          {
            title: 'Strategia di calma personalizzata',
            description: 'Usa la sua tecnica preferita: abbraccio, musica, fidget',
            duration: 5,
            order: 4,
            tips: 'Ogni bambino ha strategie diverse, scopri la sua'
          },
          {
            title: 'Dialogo quando calmo',
            description: 'Parla di cosa è successo, solo quando è più tranquillo',
            duration: 4,
            order: 5,
            tips: 'Non durante la crisi, ma dopo quando può ragionare'
          }
        ]
      },
      {
        id: 'focus-boost',
        title: 'Potenziamento Focus',
        description: 'Esercizi per migliorare attenzione e concentrazione',
        icon: '🎯',
        category: 'skills',
        duration: 20,
        color: '#9B59B6',
        difficulty: 'media',
        age_group: '8-16',
        tasks: [
          {
            title: 'Mindfulness per bambini',
            description: 'Esercizio di consapevolezza del respiro',
            duration: 5,
            order: 1,
            tips: 'Usa app come Headspace Kids o guided meditation'
          },
          {
            title: 'Gioco di attenzione visiva',
            description: 'Trova oggetti di un colore specifico nella stanza',
            duration: 3,
            order: 2,
            tips: 'Rende l\'allenamento dell\'attenzione divertente'
          },
          {
            title: 'Esercizio di memoria di lavoro',
            description: 'Ricorda sequenza di numeri o parole',
            duration: 5,
            order: 3,
            tips: 'Inizia con 3 elementi, aumenta gradualmente'
          },
          {
            title: 'Attività fine-motoria',
            description: 'Disegno dettagliato o costruzioni precise',
            duration: 7,
            order: 4,
            tips: 'Lego, origami, mandala sono ottimi per la concentrazione'
          }
        ]
      }
    ];
  }

  renderTemplates() {
    const container = document.getElementById('templates-grid');
    if (!container) return;

    container.innerHTML = this.templates.map(template => this.renderTemplate(template)).join('');
  }

  renderTemplate(template) {
    const difficultyLabels = {
      'facile': '🟢 Facile',
      'media': '🟡 Media', 
      'importante': '🔴 Importante'
    };

    return `
      <div class="template-card" onclick="useTemplate('${template.id}')">
        <div class="template-header" style="background: linear-gradient(135deg, ${template.color}, ${this.darkenColor(template.color)})">
          <div class="template-icon">${template.icon}</div>
          <div class="template-title">${template.title}</div>
          <div class="template-description">${template.description}</div>
        </div>
        
        <div class="template-body">
          <div class="template-meta">
            <div class="template-meta-item">
              <span class="meta-label">⏱️ Durata:</span>
              <span class="meta-value">${template.duration} min</span>
            </div>
            <div class="template-meta-item">
              <span class="meta-label">📊 Difficoltà:</span>
              <span class="meta-value">${difficultyLabels[template.difficulty]}</span>
            </div>
            <div class="template-meta-item">
              <span class="meta-label">👶 Età:</span>
              <span class="meta-value">${template.age_group} anni</span>
            </div>
            <div class="template-meta-item">
              <span class="meta-label">📋 Attività:</span>
              <span class="meta-value">${template.tasks.length}</span>
            </div>
          </div>

          <div class="template-tasks-preview">
            <h4>Anteprima attività:</h4>
            <ul class="template-tasks">
              ${template.tasks.slice(0, 3).map(task => `
                <li class="template-task">
                  <span class="task-order">${task.order}</span>
                  <span class="task-name">${task.title}</span>
                  <span class="task-duration">${task.duration}min</span>
                </li>
              `).join('')}
              ${template.tasks.length > 3 ? `
                <li class="template-task more-tasks">
                  <span class="more-indicator">+${template.tasks.length - 3} altre attività...</span>
                </li>
              ` : ''}
            </ul>
          </div>

          <div class="template-actions">
            <button class="btn btn-primary" onclick="event.stopPropagation(); useTemplate('${template.id}')">
              🚀 Usa Template
            </button>
            <button class="btn btn-outline" onclick="event.stopPropagation(); previewTemplate('${template.id}')">
              👁️ Anteprima
            </button>
          </div>
        </div>
      </div>
    `;
  }

  darkenColor(color) {
    // Simple color darkening function
    const hex = color.replace('#', '');
    const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - 30);
    const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - 30);
    const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - 30);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  getTemplate(templateId) {
    return this.templates.find(t => t.id === templateId);
  }

  async useTemplate(templateId) {
    try {
      const template = this.getTemplate(templateId);
      if (!template) throw new Error('Template non trovato');

      const family = getCurrentFamily();
      if (!family) throw new Error('Famiglia non trovata');

      // Ask user for date
      const targetDate = await this.askForTemplateDate();
      if (!targetDate) return;

      // Ask for assignee
      const assigneeId = await this.askForAssignee();

      showLoading(true, 'Creazione attività in corso...');

      // Create all tasks from template
      const createdTasks = [];
      let currentTime = this.getStartTime(targetDate);

      for (const taskTemplate of template.tasks) {
        const taskData = {
          title: taskTemplate.title,
          description: taskTemplate.description,
          date: targetDate,
          time: currentTime,
          duration: taskTemplate.duration,
          priority: template.difficulty === 'importante' ? 'high' : 'medium',
          category: template.category,
          assignee_id: assigneeId,
          template_id: template.id,
          template_order: taskTemplate.order
        };

        const result = await taskManager.createTask(taskData);
        if (result.success) {
          createdTasks.push(result.data);
          // Update time for next task
          currentTime = this.addMinutes(currentTime, taskTemplate.duration);
        }
      }

      showLoading(false);

      if (createdTasks.length > 0) {
        showNotification(
          `Template "${template.title}" applicato con successo! Create ${createdTasks.length} attività.`,
          'success'
        );

        // Switch to tasks page to show created tasks
        showPage('tasks');
        
        // Show template success modal with tips
        this.showTemplateSuccessModal(template, createdTasks);
      } else {
        throw new Error('Nessuna attività creata');
      }

    } catch (error) {
      showLoading(false);
      console.error('Use template error:', error);
      showNotification(error.message, 'error');
    }
  }

  async askForTemplateDate() {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.innerHTML = `
        <div class="modal-content">
          <h3>📅 Per quando vuoi programmare queste attività?</h3>
          <div class="input-group">
            <label>Seleziona data:</label>
            <input type="date" id="template-date" value="${new Date().toISOString().split('T')[0]}">
          </div>
          <div class="modal-actions">
            <button class="btn btn-outline" onclick="this.closest('.modal').resolve(null)">Annulla</button>
            <button class="btn btn-primary" onclick="this.closest('.modal').resolve(document.getElementById('template-date').value)">Conferma</button>
          </div>
        </div>
      `;

      modal.resolve = (result) => {
        document.body.removeChild(modal);
        resolve(result);
      };

      document.body.appendChild(modal);
    });
  }

  async askForAssignee() {
    return new Promise((resolve) => {
      const members = window.familyMembers || [];
      
      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.innerHTML = `
        <div class="modal-content">
          <h3>👤 A chi vuoi assegnare queste attività?</h3>
          <div class="input-group">
            <label>Seleziona membro famiglia:</label>
            <select id="template-assignee">
              <option value="">Tutta la famiglia</option>
              ${members.map(member => `
                <option value="${member.id}">${member.name}</option>
              `).join('')}
            </select>
          </div>
          <div class="modal-actions">
            <button class="btn btn-outline" onclick="this.closest('.modal').resolve(null)">Annulla</button>
            <button class="btn btn-primary" onclick="this.closest('.modal').resolve(document.getElementById('template-assignee').value)">Conferma</button>
          </div>
        </div>
      `;

      modal.resolve = (result) => {
        document.body.removeChild(modal);
        resolve(result);
      };

      document.body.appendChild(modal);
    });
  }

  getStartTime(date) {
    const now = new Date();
    const targetDate = new Date(date);
    
    // If it's today and after 6 AM, start from current time + 30 minutes
    if (targetDate.toDateString() === now.toDateString() && now.getHours() >= 6) {
      const startTime = new Date(now.getTime() + 30 * 60000);
      return startTime.toTimeString().substring(0, 5);
    }
    
    // Otherwise start from 7:00 AM
    return '07:00';
  }

  addMinutes(timeString, minutes) {
    const [hours, mins] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, mins + minutes);
    return date.toTimeString().substring(0, 5);
  }

  showTemplateSuccessModal(template, tasks) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="success-header">
          <div class="success-icon">🎉</div>
          <h3>Template applicato con successo!</h3>
          <p>Hai creato ${tasks.length} attività per "${template.title}"</p>
        </div>
        
        <div class="template-tips">
          <h4>💡 Suggerimenti per il successo:</h4>
          <ul>
            ${template.tasks.slice(0, 3).map(task => 
              task.tips ? `<li><strong>${task.title}:</strong> ${task.tips}</li>` : ''
            ).filter(tip => tip).join('')}
          </ul>
        </div>

        <div class="success-actions">
          <button class="btn btn-outline" onclick="this.closest('.modal').remove()">
            Chiudi
          </button>
          <button class="btn btn-primary" onclick="this.closest('.modal').remove(); showPage('tasks');">
            Vai alle Attività
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Auto remove after 10 seconds
    setTimeout(() => {
      if (modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    }, 10000);
  }

  previewTemplate(templateId) {
    const template = this.getTemplate(templateId);
    if (!template) return;

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 600px;">
        <span class="close-btn" onclick="this.closest('.modal').remove()">&times;</span>
        
        <div class="template-preview-header">
          <div class="preview-icon">${template.icon}</div>
          <h3>${template.title}</h3>
          <p>${template.description}</p>
        </div>

        <div class="template-preview-meta">
          <div class="meta-grid">
            <div class="meta-item">
              <strong>⏱️ Durata totale:</strong> ${template.duration} minuti
            </div>
            <div class="meta-item">
              <strong>📊 Difficoltà:</strong> ${template.difficulty}
            </div>
            <div class="meta-item">
              <strong>👶 Età consigliata:</strong> ${template.age_group} anni
            </div>
            <div class="meta-item">
              <strong>📋 Numero attività:</strong> ${template.tasks.length}
            </div>
          </div>
        </div>

        <div class="template-preview-tasks">
          <h4>📋 Dettaglio attività:</h4>
          <div class="preview-tasks-list">
            ${template.tasks.map((task, index) => `
              <div class="preview-task-item">
                <div class="task-number">${index + 1}</div>
                <div class="task-content">
                  <div class="task-title">${task.title}</div>
                  <div class="task-description">${task.description}</div>
                  ${task.tips ? `<div class="task-tip">💡 ${task.tips}</div>` : ''}
                </div>
                <div class="task-duration">${task.duration}min</div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="preview-actions">
          <button class="btn btn-outline" onclick="this.closest('.modal').remove()">
            Chiudi
          </button>
          <button class="btn btn-primary" onclick="this.closest('.modal').remove(); useTemplate('${template.id}')">
            🚀 Usa Questo Template
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  // Create custom template
  createCustomTemplate(templateData) {
    const customTemplate = {
      id: `custom_${Date.now()}`,
      title: templateData.title,
      description: templateData.description,
      icon: templateData.icon || '⭐',
      category: 'custom',
      duration: templateData.tasks.reduce((total, task) => total + task.duration, 0),
      color: templateData.color || '#6B73FF',
      difficulty: templateData.difficulty || 'media',
      age_group: templateData.age_group || 'tutti',
      tasks: templateData.tasks,
      custom: true,
      created_by: getCurrentUser()?.id,
      created_at: new Date().toISOString()
    };

    this.templates.push(customTemplate);
    this.saveCustomTemplate(customTemplate);
    this.renderTemplates();

    showNotification('Template personalizzato creato!', 'success');
    return customTemplate;
  }

  saveCustomTemplate(template) {
    const customTemplates = JSON.parse(localStorage.getItem('adhd_planner_custom_templates') || '[]');
    customTemplates.push(template);
    localStorage.setItem('adhd_planner_custom_templates', JSON.stringify(customTemplates));
  }

  loadCustomTemplates() {
    const customTemplates = JSON.parse(localStorage.getItem('adhd_planner_custom_templates') || '[]');
    this.templates.push(...customTemplates);
  }

  // Template analytics
  getTemplateUsageStats() {
    const usage = JSON.parse(localStorage.getItem('adhd_planner_template_usage') || '{}');
    return Object.entries(usage)
      .map(([templateId, count]) => ({
        template: this.getTemplate(templateId),
        usage_count: count
      }))
      .filter(item => item.template)
      .sort((a, b) => b.usage_count - a.usage_count);
  }

  trackTemplateUsage(templateId) {
    const usage = JSON.parse(localStorage.getItem('adhd_planner_template_usage') || '{}');
    usage[templateId] = (usage[templateId] || 0) + 1;
    localStorage.setItem('adhd_planner_template_usage', JSON.stringify(usage));
  }

  // Search templates
  searchTemplates(query) {
    if (!query.trim()) {
      this.renderTemplates();
      return;
    }

    const filtered = this.templates.filter(template =>
      template.title.toLowerCase().includes(query.toLowerCase()) ||
      template.description.toLowerCase().includes(query.toLowerCase()) ||
      template.category.toLowerCase().includes(query.toLowerCase()) ||
      template.tasks.some(task => 
        task.title.toLowerCase().includes(query.toLowerCase())
      )
    );

    this.renderFilteredTemplates(filtered);
  }

  renderFilteredTemplates(templates) {
    const container = document.getElementById('templates-grid');
    if (!container) return;

    if (templates.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <h3 class="empty-title">Nessun template trovato</h3>
          <p class="empty-subtitle">Prova con termini di ricerca diversi</p>
        </div>
      `;
      return;
    }

    container.innerHTML = templates.map(template => this.renderTemplate(template)).join('');
  }

  // Filter by category
  filterByCategory(category) {
    if (category === 'all') {
      this.renderTemplates();
      return;
    }

    const filtered = this.templates.filter(template => template.category === category);
    this.renderFilteredTemplates(filtered);
  }
}

// Template UI Functions
function useTemplate(templateId) {
  if (window.templateManager) {
    templateManager.useTemplate(templateId);
    // Track usage
    templateManager.trackTemplateUsage(templateId);
  }
}

function previewTemplate(templateId) {
  if (window.templateManager) {
    templateManager.previewTemplate(templateId);
  }
}

function searchTemplates() {
  const searchInput = document.getElementById('template-search');
  if (searchInput && window.templateManager) {
    templateManager.searchTemplates(searchInput.value);
  }
}

function filterTemplatesByCategory(category) {
  if (window.templateManager) {
    templateManager.filterByCategory(category);
  }

  // Update filter buttons
  document.querySelectorAll('.template-filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`[onclick="filterTemplatesByCategory('${category}')"]`)?.classList.add('active');
}

function showCreateTemplateModal() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close-btn" onclick="this.closest('.modal').remove()">&times;</span>
      
      <h3>✨ Crea Template Personalizzato</h3>
      
      <form id="custom-template-form" onsubmit="createCustomTemplate(event)">
        <div class="input-group">
          <label>Titolo Template</label>
          <input type="text" id="custom-title" required placeholder="Nome del tuo template">
        </div>
        
        <div class="input-group">
          <label>Descrizione</label>
          <textarea id="custom-description" placeholder="Descrivi a cosa serve questo template"></textarea>
        </div>
        
        <div class="form-row">
          <div class="input-group">
            <label>Icona</label>
            <input type="text" id="custom-icon" placeholder="🌟" maxlength="2">
          </div>
          <div class="input-group">
            <label>Colore</label>
            <input type="color" id="custom-color" value="#6B73FF">
          </div>
        </div>

        <div class="form-row">
          <div class="input-group">
            <label>Difficoltà</label>
            <select id="custom-difficulty">
              <option value="facile">Facile</option>
              <option value="media">Media</option>
              <option value="importante">Importante</option>
            </select>
          </div>
          <div class="input-group">
            <label>Età</label>
            <input type="text" id="custom-age" placeholder="6-12" value="tutti">
          </div>
        </div>

        <div class="template-tasks-builder">
          <h4>Attività del Template</h4>
          <div id="template-tasks-list">
            <!-- Tasks will be added here -->
          </div>
          <button type="button" class="btn btn-outline" onclick="addTemplateTask()">
            + Aggiungi Attività
          </button>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn btn-outline" onclick="this.closest('.modal').remove()">
            Annulla
          </button>
          <button type="submit" class="btn btn-primary">
            Crea Template
          </button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);
  
  // Add first task by default
  addTemplateTask();
}

function addTemplateTask() {
  const tasksList = document.getElementById('template-tasks-list');
  const taskCount = tasksList.children.length + 1;

  const taskElement = document.createElement('div');
  taskElement.className = 'template-task-builder';
  taskElement.innerHTML = `
    <div class="task-builder-header">
      <span class="task-number">${taskCount}</span>
      <button type="button" class="btn btn-small delete" onclick="this.closest('.template-task-builder').remove(); updateTaskNumbers()">
        🗑️
      </button>
    </div>
    <div class="task-builder-content">
      <div class="input-group">
        <input type="text" placeholder="Nome attività" class="task-title-input" required>
      </div>
      <div class="input-group">
        <textarea placeholder="Descrizione attività" class="task-description-input"></textarea>
      </div>
      <div class="form-row">
        <div class="input-group">
          <label>Durata (min)</label>
          <input type="number" class="task-duration-input" value="15" min="1" max="120">
        </div>
      </div>
      <div class="input-group">
        <textarea placeholder="Suggerimento per questa attività" class="task-tip-input"></textarea>
      </div>
    </div>
  `;

  tasksList.appendChild(taskElement);
}

function updateTaskNumbers() {
  document.querySelectorAll('.template-task-builder .task-number').forEach((element, index) => {
    element.textContent = index + 1;
  });
}

function createCustomTemplate(event) {
  event.preventDefault();

  const form = event.target;
  const tasks = [];

  // Collect tasks data
  document.querySelectorAll('.template-task-builder').forEach((taskElement, index) => {
    const title = taskElement.querySelector('.task-title-input').value.trim();
    const description = taskElement.querySelector('.task-description-input').value.trim();
    const duration = parseInt(taskElement.querySelector('.task-duration-input').value);
    const tip = taskElement.querySelector('.task-tip-input').value.trim();

    if (title) {
      tasks.push({
        title,
        description,
        duration,
        order: index + 1,
        tips: tip || null
      });
    }
  });

  if (tasks.length === 0) {
    showNotification('Aggiungi almeno una attività al template', 'error');
    return;
  }

  const templateData = {
    title: form.querySelector('#custom-title').value.trim(),
    description: form.querySelector('#custom-description').value.trim(),
    icon: form.querySelector('#custom-icon').value || '⭐',
    color: form.querySelector('#custom-color').value,
    difficulty: form.querySelector('#custom-difficulty').value,
    age_group: form.querySelector('#custom-age').value.trim(),
    tasks
  };

  if (window.templateManager) {
    templateManager.createCustomTemplate(templateData);
  }

  form.closest('.modal').remove();
}

// Add styles for template builder
const templateBuilderStyles = `
.template-task-builder {
  border: 2px solid var(--neutral-200);
  border-radius: var(--border-radius);
  padding: var(--space-md);
  margin-bottom: var(--space-md);
  background: var(--neutral-100);
}

.task-builder-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-md);
}

.task-number {
  background: var(--primary-color);
  color: white;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.template-preview-header {
  text-align: center;
  margin-bottom: var(--space-lg);
}

.preview-icon {
  font-size: 3rem;
  margin-bottom: var(--space-sm);
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-md);
  margin: var(--space-lg) 0;
}

.preview-tasks-list {
  max-height: 400px;
  overflow-y: auto;
}

.preview-task-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-md);
  padding: var(--space-md);
  border-bottom: 1px solid var(--neutral-200);
}

.preview-task-item:last-child {
  border-bottom: none;
}

.task-content {
  flex: 1;
}

.task-title {
  font-weight: 600;
  margin-bottom: var(--space-xs);
}

.task-description {
  color: var(--neutral-600);
  margin-bottom: var(--space-xs);
}

.task-tip {
  background: var(--warning-light);
  padding: var(--space-sm);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  color: var(--neutral-700);
}

.success-header {
  text-align: center;
  margin-bottom: var(--space-lg);
}

.success-icon {
  font-size: 3rem;
  margin-bottom: var(--space-sm);
}

.template-tips {
  background: var(--neutral-100);
  padding: var(--space-lg);
  border-radius: var(--border-radius);
  margin: var(--space-lg) 0;
}

.template-tips h4 {
  margin-bottom: var(--space-md);
}

.template-tips ul {
  list-style: none;
  padding: 0;
}

.template-tips li {
  margin-bottom: var(--space-sm);
  padding-left: var(--space-md);
  position: relative;
}

.template-tips li::before {
  content: '💡';
  position: absolute;
  left: 0;
}
`;

// Inject template builder styles
const templateStyleSheet = document.createElement('style');
templateStyleSheet.textContent = templateBuilderStyles;
document.head.appendChild(templateStyleSheet);

// Initialize template manager
window.templateManager = new TemplateManager();