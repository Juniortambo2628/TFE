/**
 * Forgot Password Form Handler
 *
 * Handles forgot password form submission.
 */

(function () {
  'use strict';

  /**
   * Initialize forgot password form
   */
  function initForgotPassword() {
    window.initAuthForm(
      'forgotPasswordForm',
      'forgot-password.php',
      (form) => ({ email: form.email.value }),
      {
        normalText: 'Send Reset Link',
        loadingText: 'Sending...',
        onSuccess: (data, form, messageDiv) => {
          form.reset();
          if (data.reset_link) {
            // Development mode - show the link
            messageDiv.innerHTML +=
              '<br><br><strong>Development Mode:</strong><br><a href="' +
              data.reset_link +
              '">Click here to reset password</a>';
          }
        },
      }
    );
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initForgotPassword);
  } else {
    initForgotPassword();
  }
})();
