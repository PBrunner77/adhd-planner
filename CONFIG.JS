// Configuration file for ADHD Planner
const CONFIG = {
  // App Info
  APP_NAME: 'ADHD Family Planner',
  APP_VERSION: '1.0.0',
  
  // Supabase Configuration (Replace with your actual values)
  SUPABASE_URL: 'https://sxbvmhcpqqrepvjztozz.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4YnZtaGNwcXFyZXB2anp0b3p6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NDc2NzgsImV4cCI6MjA2NTEyMzY3OH0.w_naeq_j_UmuxjKGqtI7cyEmQPnp9-8pJIW7wqgVgR8',
  
  // Stripe Configuration (Replace with your actual keys)
  STRIPE_PUBLISHABLE_KEY: 'pk_test_your_stripe_key',
  
  // Plan IDs (Create these in Stripe)
  STRIPE_PLANS: {
    family_monthly: 'price_family_monthly',
    family_yearly: 'price_family_yearly', 
    premium_monthly: 'price_premium_monthly',
    premium_yearly: 'price_premium_yearly'
  },
  
  // App Settings
  SETTINGS: {
    MAX_FAMILY_MEMBERS: 8,
    MAX_TASKS_PER_DAY: 50,
    DEFAULT_REMINDER_MINUTES: 15,
    SESSION_TIMEOUT_HOURS: 24,
    AUTO_SAVE_INTERVAL: 30000, // 30 seconds
    NOTIFICATION_DURATION: 5000, // 5 seconds
  },
  
  // Feature Flags
  FEATURES: {
    CALENDAR_SYNC: false, // Enable when Google Calendar API is set up
    AI_SUGGESTIONS: false, // Enable in future versions
    VIDEO_CALLS: false, // Premium feature
    ANALYTICS: true,
    OFFLINE_MODE: true,
    PUSH_NOTIFICATIONS: true
  },
  
  // ADHD-specific settings
  ADHD_SETTINGS: {
    DEFAULT_TASK_DURATION: 30, // minutes
    BREAK_REMINDER_INTERVAL: 25, // Pomodoro-style
    MAX_CONCURRENT_TASKS: 3,
    COLOR_CODING: {
      high_priority: '#FF6B6B',
      medium_priority: '#FFE066', 
      low_priority: '#4ECDC4',
      completed: '#A8E6CF'
    }
  },
  
  // Email Configuration (Using EmailJS)
  EMAIL_CONFIG: {
    SERVICE_ID: 'your_emailjs_service_id',
    TEMPLATE_ID: 'your_emailjs_template_id',
    USER_ID: 'your_emailjs_user_id'
  },
  
  // API Endpoints
  API_ENDPOINTS: {
    SUPPORT_EMAIL: 'supporto@adhdfocushub.com',
    FEEDBACK_WEBHOOK: 'https://your-webhook-url.com/feedback',
    ANALYTICS_ENDPOINT: 'https://your-analytics-endpoint.com'
  }
};

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
} else {
  window.CONFIG = CONFIG;
}