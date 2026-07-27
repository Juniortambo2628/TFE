/**
 * Global Form Configuration
 * Centralized configuration for easy customization across all form components
 *
 * Usage: Modify these settings to customize form behavior without touching individual scripts
 */

window.FORM_CONFIG = {
  // ===== FORM IDENTIFICATION =====
  formId: 'registerForm', // Main form element ID (change to match your form)
  modalId: 'registrationModal', // Modal container ID (change to match your modal)

  // ===== MULTI-STEP CONFIGURATION =====
  totalSteps: 4, // Number of form steps
  startStep: 1, // Initial step to display

  // ===== AUTO-SAVE & STATE MANAGEMENT =====
  enableAutoSave: true, // Enable automatic form state saving
  autoSaveInterval: 30000, // Auto-save interval in milliseconds (30 seconds)
  enableResume: true, // Allow users to resume incomplete forms
  resumeExpiry: 7, // Days before saved form data expires

  // ===== STORAGE CONFIGURATION =====
  storagePrefix: 'form_', // Prefix for localStorage keys (prevents conflicts)
  storageKeys: {
    formState: 'state', // Form data storage key
    recentCountries: 'recent_countries', // Recent country selections key
    darkMode: 'dark_mode', // Dark mode preference key
    analytics: 'analytics', // Form analytics key
  },

  // ===== DROPDOWN OPTIMIZATION =====
  dropdown: {
    enableVirtualScroll: true, // Enable virtual scrolling for performance
    visibleItems: 10, // Number of items to render at once
    itemHeight: 40, // Height of each dropdown item (pixels)
    searchDebounceTime: 200, // Debounce delay for search (milliseconds)
    enableFuzzySearch: true, // Enable fuzzy/smart search matching
    enableCaching: true, // Cache search results
    maxCacheSize: 50, // Maximum number of cached search terms
    useWebWorker: false, // Use Web Worker for search (advanced)
  },

  // ===== POPULAR/RECENT COUNTRIES =====
  countries: {
    enableRecentPopular: true, // Show recent/popular countries at top
    popularCountries: [
      // Most common countries (customize for your audience)
      'United States',
      'United Kingdom',
      'Canada',
      'Australia',
      'India',
      'Germany',
      'France',
      'Spain',
      'Italy',
      'Japan',
    ],
    maxRecentCountries: 5, // Maximum recent countries to remember
  },

  // ===== VALIDATION CONFIGURATION =====
  validation: {
    enableRealTime: true, // Enable real-time validation
    validationDebounceTime: 300, // Debounce delay for validation (milliseconds)
    enableEnhanced: true, // Enable advanced validation rules
    showInlineErrors: true, // Show errors inline with fields
    scrollToError: true, // Scroll to first error on validation failure
  },

  // ===== SMART DEFAULTS =====
  smartDefaults: {
    enableIPDetection: true, // Auto-detect country from IP
    enableLocalStorage: true, // Remember form data
    enableAutoComplete: true, // Browser autocomplete
  },

  // ===== MICRO-INTERACTIONS =====
  interactions: {
    enableAnimations: true, // Enable form animations
    enableHaptic: false, // Enable haptic feedback (mobile)
    animationSpeed: 300, // Animation duration (milliseconds)
    enableSuccessAnimation: true, // Show success animation on submission
  },

  // ===== DARK MODE =====
  darkMode: {
    enabled: true, // Enable dark mode feature
    default: false, // Start in dark mode
    rememberPreference: true, // Remember user's dark mode choice
  },

  // ===== PROGRESS TRACKING =====
  progress: {
    showPercentage: true, // Show completion percentage
    showTimeEstimate: true, // Show estimated time remaining
    timePerStep: 1, // Estimated minutes per step
  },

  // ===== ANALYTICS & TRACKING =====
  analytics: {
    enabled: true, // Track form interactions
    trackFieldFocus: true, // Track which fields users interact with
    trackTimePerStep: true, // Track time spent on each step
    trackDropoffPoints: true, // Track where users abandon form
  },

  // ===== API CONFIGURATION =====
  api: {
    submitEndpoint: '/api/register', // Form submission endpoint
    method: 'POST', // HTTP method
    countryDataEndpoint: null, // Optional: fetch countries from API
    ipDetectionEndpoint: 'https://ipapi.co/json/', // IP detection service
  },

  // ===== ERROR MESSAGES =====
  messages: {
    requiredField: 'This field is required',
    invalidEmail: 'Please enter a valid email address',
    invalidPhone: 'Please enter a valid phone number',
    invalidWebsite: 'Please enter a valid website URL',
    genericError: 'An error occurred. Please try again.',
    networkError: 'Network error. Please check your connection.',
    submitSuccess: 'Form submitted successfully!',
    resumeSuccess: 'Form data restored successfully!',
    autoSaveSuccess: 'Progress saved automatically',
  },

  // ===== THEME COLORS (can override CSS variables) =====
  colors: {
    primary: '#ffd700', // Primary brand color
    secondary: '#333333', // Secondary/dark color
    accent: '#0dcaf0', // Accent/highlight color
    success: '#28a745', // Success state
    error: '#dc3545', // Error state
    warning: '#ffc107', // Warning state
    info: '#17a2b8', // Info state
  },

  // ===== CALLBACKS (optional event handlers) =====
  callbacks: {
    onStepChange: null, // Called when step changes: function(stepNumber) {}
    onValidation: null, // Called after validation: function(isValid, errors) {}
    onSubmitStart: null, // Called before submission: function(formData) {}
    onSubmitSuccess: null, // Called on successful submission: function(response) {}
    onSubmitError: null, // Called on submission error: function(error) {}
    onAutoSave: null, // Called after auto-save: function(savedData) {}
    onResume: null, // Called when form is resumed: function(savedData) {}
  },

  // ===== CUSTOM VALIDATION RULES =====
  customValidation: {
    // Add custom validation rules here
    // Example:
    // customField: function(value) {
    //     return value.length > 5 ? true : 'Must be longer than 5 characters';
    // }
  },

  // ===== FEATURE FLAGS =====
  features: {
    multiStep: true, // Enable multi-step functionality
    progressIndicator: true, // Show progress indicator
    stepNavigation: true, // Allow clicking on steps to navigate
    keyboardNavigation: true, // Enable keyboard shortcuts
    printSummary: false, // Add print summary button
    downloadData: false, // Add download form data button
  },

  // ===== ACCESSIBILITY =====
  accessibility: {
    announceStepChange: true, // Announce step changes to screen readers
    announceValidation: true, // Announce validation errors
    highContrast: false, // High contrast mode
    reducedMotion: false, // Respect prefers-reduced-motion
  },

  // ===== DEBUG & DEVELOPMENT =====
  debug: {
    enabled: false, // Enable debug logging
    verboseLogging: false, // Detailed console logs
    showPerformanceMetrics: false, // Log performance metrics
  },
};

/**
 * Utility function to get configuration value
 * @param {string} path - Dot notation path (e.g., 'dropdown.enableVirtualScroll')
 * @param {*} defaultValue - Default value if path not found
 * @returns {*} Configuration value
 */
window.getFormConfig = function (path, defaultValue = null) {
  const keys = path.split('.');
  let value = window.FORM_CONFIG;

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return defaultValue;
    }
  }

  return value;
};

/**
 * Utility function to update configuration value
 * @param {string} path - Dot notation path
 * @param {*} value - New value
 */
window.setFormConfig = function (path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  let obj = window.FORM_CONFIG;

  for (const key of keys) {
    if (!(key in obj)) {
      obj[key] = {};
    }
    obj = obj[key];
  }

  obj[lastKey] = value;
};

/**
 * Apply theme colors to CSS custom properties
 */
window.applyFormTheme = function () {
  const root = document.documentElement;
  const colors = window.FORM_CONFIG.colors;

  if (colors.primary) {
    root.style.setProperty('--form-primary-color', colors.primary);
  }
  if (colors.secondary) {
    root.style.setProperty('--form-secondary-color', colors.secondary);
  }
  if (colors.accent) {
    root.style.setProperty('--form-accent-color', colors.accent);
  }

  // Apply other colors as needed
};

// Auto-apply theme on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', window.applyFormTheme);
} else {
  window.applyFormTheme();
}

// Log configuration in debug mode
if (window.FORM_CONFIG.debug.enabled) {
  console.log('Form Configuration Loaded:', window.FORM_CONFIG);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.FORM_CONFIG;
}
