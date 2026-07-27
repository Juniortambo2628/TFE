/**
 * Reset Password Form Handler
 *
 * Handles password reset form submission.
 */

(function () {
  'use strict';

  /**
   * Initialize reset password form
   */
  function initResetPassword() {
    window.initAuthForm(
      'resetPasswordForm',
      'reset-password.php',
      (form) => ({
        password: form.password.value,
        token: form.token.value,
      }),
      {
        normalText: 'Reset Password',
        loadingText: 'Resetting...',
        validate: (data) => {
          const form = document.getElementById('resetPasswordForm');
          if (form.password.value !== form.confirm_password.value) {
            return 'Passwords do not match';
          }
          return null;
        },
        onSuccess: (data, form) => {
          form.reset();
          setTimeout(() => {
            window.location.href = '../auth/login.php?reset=1';
          }, 2000);
        },
      }
    );
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initResetPassword);
  } else {
    initResetPassword();
  }
})();
