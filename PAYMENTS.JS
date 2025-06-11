// Payment processing with Stripe
class PaymentManager {
  constructor() {
    this.stripe = null;
    this.currentPlan = null;
    this.init();
  }

  async init() {
    try {
      // Initialize Stripe
      this.stripe = Stripe(CONFIG.STRIPE_PUBLISHABLE_KEY);
      console.log('Stripe initialized successfully');
    } catch (error) {
      console.error('Stripe initialization failed:', error);
    }
  }

  async upgradeToFamily() {
    try {
      const user = getCurrentUser();
      const family = getCurrentFamily();
      
      if (!user || !family) {
        throw new Error('Utente o famiglia non trovati');
      }

      showLoading(true, 'Preparazione checkout...');

      // Create checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: CONFIG.STRIPE_PLANS.family_yearly,
          customerId: user.id,
          familyId: family.id,
          successUrl: window.location.origin + '/success?session_id={CHECKOUT_SESSION_ID}',
          cancelUrl: window.location.origin + '/cancel'
        }),
      });

      if (!response.ok) {
        throw new Error('Errore nella creazione della sessione di pagamento');
      }

      const session = await response.json();
      
      showLoading(false);

      // Redirect to Stripe Checkout
      const result = await this.stripe.redirectToCheckout({
        sessionId: session.sessionId,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

    } catch (error) {
      showLoading(false);
      console.error('Upgrade to Family error:', error);
      showNotification(error.message, 'error');
    }
  }

  async upgradeToPremium() {
    try {
      const user = getCurrentUser();
      const family = getCurrentFamily();
      
      if (!user || !family) {
        throw new Error('Utente o famiglia non trovati');
      }

      showLoading(true, 'Preparazione checkout...');

      // Create checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: CONFIG.STRIPE_PLANS.premium_yearly,
          customerId: user.id,
          familyId: family.id,
          successUrl: window.location.origin + '/success?session_id={CHECKOUT_SESSION_ID}',
          cancelUrl: window.location.origin + '/cancel'
        }),
      });

      if (!response.ok) {
        throw new Error('Errore nella creazione della sessione di pagamento');
      }

      const session = await response.json();
      
      showLoading(false);

      // Redirect to Stripe Checkout
      const result = await this.stripe.redirectToCheckout({
        sessionId: session.sessionId,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

    } catch (error) {
      showLoading(false);
      console.error('Upgrade to Premium error:', error);
      showNotification(error.message, 'error');
    }
  }

  async handlePaymentSuccess(sessionId) {
    try {
      showLoading(true, 'Verifica pagamento...');

      // Verify payment with backend
      const response = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionId,
          userId: getCurrentUser()?.id,
          familyId: getCurrentFamily()?.id
        }),
      });

      if (!response.ok) {
        throw new Error('Errore nella verifica del pagamento');
      }

      const paymentData = await response.json();
      
      // Update subscription status
      if (auth) {
        await auth.updateSubscription(paymentData.plan);
      }

      showLoading(false);
      
      // Show success message
      this.showPaymentSuccessModal(paymentData);

    } catch (error) {
      showLoading(false);
      console.error('Payment verification error:', error);
      showNotification('Errore nella verifica del pagamento. Contatta il supporto.', 'error');
    }
  }

  showPaymentSuccessModal(paymentData) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="payment-success-header">
          <div class="success-icon">🎉</div>
          <h3>Pagamento completato con successo!</h3>
          <p>Benvenuto nel piano ${paymentData.plan}!</p>
        </div>
        
        <div class="payment-details">
          <div class="detail-item">
            <strong>Piano:</strong> ${paymentData.plan}
          </div>
          <div class="detail-item">
            <strong>Importo:</strong> €${paymentData.amount}
          </div>
          <div class="detail-item">
            <strong>Prossima fatturazione:</strong> ${new Date(paymentData.nextBilling).toLocaleDateString('it-IT')}
          </div>
        </div>

        <div class="premium-features">
          <h4>🌟 Funzionalità sbloccate:</h4>
          <ul>
            <li>✅ Famiglia illimitata</li>
            <li>✅ Tutti i template ADHD</li>
            <li>✅ Statistiche avanzate</li>
            <li>✅ Supporto prioritario</li>
            ${paymentData.plan === 'premium' ? `
              <li>✅ Consulenza mensile specialista</li>
              <li>✅ Analisi comportamentali AI</li>
            ` : ''}
          </ul>
        </div>

        <div class="modal-actions">
          <button class="btn btn-primary" onclick="this.closest('.modal').remove(); location.reload();">
            Inizia ad Usare
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  async cancelSubscription() {
    try {
      const confirmed = await showConfirmDialog(
        'Cancella Abbonamento',
        'Sei sicuro di voler cancellare il tuo abbonamento? Perderai l\'accesso alle funzionalità premium.',
        'Cancella Abbonamento',
        'Mantieni Abbonamento'
      );

      if (!confirmed) return;

      showLoading(true, 'Cancellazione abbonamento...');

      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: getCurrentUser()?.id,
          familyId: getCurrentFamily()?.id
        }),
      });

      if (!response.ok) {
        throw new Error('Errore nella cancellazione dell\'abbonamento');
      }

      const result = await response.json();

      // Update subscription status
      if (auth) {
        await auth.updateSubscription('free');
      }

      showLoading(false);
      showNotification('Abbonamento cancellato. Potrai continuare ad usare le funzionalità premium fino alla scadenza.', 'success');

    } catch (error) {
      showLoading(false);
      console.error('Cancel subscription error:', error);
      showNotification(error.message, 'error');
    }
  }

  async updatePaymentMethod() {
    try {
      showLoading(true, 'Preparazione aggiornamento...');

      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: getCurrentUser()?.id,
          returnUrl: window.location.origin
        }),
      });

      if (!response.ok) {
        throw new Error('Errore nell\'apertura del portale di gestione');
      }

      const session = await response.json();
      showLoading(false);

      // Redirect to Stripe Customer Portal
      window.location.href = session.url;

    } catch (error) {
      showLoading(false);
      console.error('Update payment method error:', error);
      showNotification(error.message, 'error');
    }
  }

  // Get subscription info
  async getSubscriptionInfo() {
    try {
      const response = await fetch('/api/subscription-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: getCurrentUser()?.id
        }),
      });

      if (!response.ok) {
        throw new Error('Errore nel recupero delle informazioni abbonamento');
      }

      return await response.json();

    } catch (error) {
      console.error('Get subscription info error:', error);
      return null;
    }
  }

  // Handle failed payments
  async handlePaymentFailed() {
    showNotification(
      'Il pagamento è fallito. Controlla il metodo di pagamento e riprova.',
      'error'
    );

    // Show payment retry modal
    this.showPaymentRetryModal();
  }

  showPaymentRetryModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="payment-failed-header">
          <div class="error-icon">❌</div>
          <h3>Pagamento Fallito</h3>
          <p>Non siamo riusciti a processare il tuo pagamento.</p>
        </div>
        
        <div class="retry-options">
          <h4>Cosa puoi fare:</h4>
          <ul>
            <li>Verifica i dati della carta di credito</li>
            <li>Controlla il saldo disponibile</li>
            <li>Prova con un altro metodo di pagamento</li>
            <li>Contatta la tua banca</li>
          </ul>
        </div>

        <div class="modal-actions">
          <button class="btn btn-outline" onclick="this.closest('.modal').remove()">
            Chiudi
          </button>
          <button class="btn btn-primary" onclick="this.closest('.modal').remove(); showUpgradeModal();">
            Riprova Pagamento
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  // Payment analytics
  trackPurchase(plan, amount) {
    // Google Analytics e-commerce tracking
    if (typeof gtag !== 'undefined') {
      gtag('event', 'purchase', {
        transaction_id: Date.now().toString(),
        value: amount,
        currency: 'EUR',
        items: [{
          item_id: plan,
          item_name: `ADHD Planner ${plan}`,
          category: 'Subscription',
          quantity: 1,
          price: amount
        }]
      });
    }

    // Facebook Pixel tracking
    if (typeof fbq !== 'undefined') {
      fbq('track', 'Purchase', {
        value: amount,
        currency: 'EUR',
        content_type: 'product',
        content_ids: [plan]
      });
    }
  }
}

// Payment UI Functions
function showUpgradeModal() {
  document.getElementById('upgrade-modal').classList.remove('hidden');
}

function closeUpgradeModal() {
  document.getElementById('upgrade-modal').classList.add('hidden');
}

function upgradeToFamily() {
  if (window.paymentManager) {
    paymentManager.upgradeToFamily();
  }
  closeUpgradeModal();
}

function upgradeToPremium() {
  if (window.paymentManager) {
    paymentManager.upgradeToPremium();
  }
  closeUpgradeModal();
}

// Handle URL parameters for payment results
function handlePaymentParams() {
  const urlParams = new URLSearchParams(window.location.search);
 const sessionId = urlParams.get('session_id');
  const cancelled = urlParams.get('cancelled');

  if (sessionId) {
    // Payment successful
    if (window.paymentManager) {
      paymentManager.handlePaymentSuccess(sessionId);
    }
    // Clean up URL
    window.history.replaceState({}, document.title, window.location.pathname);
  } else if (cancelled) {
    // Payment cancelled
    showNotification('Pagamento annullato. Puoi riprovare quando vuoi.', 'info');
    // Clean up URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

// Initialize payment manager
window.paymentManager = new PaymentManager();

// Handle payment params on page load
document.addEventListener('DOMContentLoaded', handlePaymentParams);

  