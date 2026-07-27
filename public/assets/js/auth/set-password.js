/**
 * Set Password Form Handler
 *
 * Handles setting initial password for new users.
 * Expects window.SET_PASSWORD_CONFIG to be defined by PHP.
 */

(function () {
  'use strict';

  const config = window.SET_PASSWORD_CONFIG || {};

  // Use password toggle utility if available
  // Fallback for backwards compatibility with HTML onclick handlers
  if (window.passwordToggle && typeof window.passwordToggle.initById === 'function') {
    // Initialize password toggles for password fields
    window.togglePassword = function (fieldId) {
      const field = document.getElementById(fieldId);
      const icon = document.getElementById(fieldId + '-icon');
      if (field && icon) {
        window.passwordToggle.init(field, icon.parentElement);
      }
    };
  } else {
    // Fallback implementation
    window.togglePassword = function (fieldId) {
      const field = document.getElementById(fieldId);
      const icon = document.getElementById(fieldId + '-icon');
      if (!field || !icon) return;
      if (field.type === 'password') {
        field.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
      } else {
        field.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
      }
    };
  }

  /**
   * Initialize set password form
   */
  function initSetPassword() {
    const endpoint = config.setPasswordUrl || '../auth/set-password.php';
    
    window.initAuthForm(
      'setPasswordForm',
      endpoint,
      (form) => ({
        password: form.password.value,
        password_confirm: form.password_confirm.value,
      }),
      {
        normalText: 'Set Password',
        loadingText: 'Setting...',
        validate: (data) => {
          const form = document.getElementById('setPasswordForm');
          if (form.password.value.length < 8) {
            return 'Password must be at least 8 characters long';
          }
          if (form.password.value !== form.password_confirm.value) {
            return 'Passwords do not match';
          }
          return null;
        },
        onSuccess: (data, form) => {
          setTimeout(() => {
            window.location.href = data.redirect_url || '../fan/dashboard.php';
          }, 1000);
        },
      }
    );
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSetPassword);
  } else {
    initSetPassword();
  }
})();
