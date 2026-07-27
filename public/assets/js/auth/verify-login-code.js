/**
 * Verify Login Code Handler
 *
 * Handles email login code verification.
 * Expects window.VERIFY_CODE_CONFIG to be defined by PHP.
 */

(function () {
  'use strict';

  const config = window.VERIFY_CODE_CONFIG || {};

  /**
   * Initialize code input formatting
   */
  function initCodeInput() {
    const codeInput = document.getElementById('code');
    if (!codeInput) return;

    codeInput.addEventListener('input', function () {
      this.value = this.value.replace(/\D/g, '').substring(0, 6);
    });
  }

  /**
   * Initialize form submission
   */
  function initVerifyForm() {
    const endpoint = (config.verifyUrl || '../auth/verify-login-code.php').replace(/^\.\.\//, 'api/').replace(/^api\/api\//, 'api/');
    
    window.initAuthForm(
      'verifyCodeForm',
      endpoint,
      (form) => ({
        email: form.email.value,
        code: form.code.value,
      }),
      {
        normalText: 'Verify Code',
        loadingText: 'Verifying...',
        validate: (data) => {
          const form = document.getElementById('verifyCodeForm');
          if (form.code.value.length !== 6) {
            return 'Please enter a 6-digit code';
          }
          return null;
        },
        onSuccess: (data) => {
          setTimeout(() => {
            window.location.href = data.redirect_url || '../fan/dashboard.php';
          }, 1000);
        },
      }
    );
  }

  /**
   * Initialize resend code button
   */
  function initResendCode() {
    const resendBtn = document.getElementById('resendCode');
    if (!resendBtn) return;

    resendBtn.addEventListener('click', async function (e) {
      e.preventDefault();

      const emailInput = document.getElementById('email');
      const errorDiv = document.getElementById('codeError');

      if (!emailInput || !errorDiv) return;

      const email = emailInput.value;

      // Use apiClient for consistent error handling
      const endpoint = (config.requestCodeUrl || '../auth/request-login-code.php').replace(/^\.\.\//, 'api/').replace(/^api\/api\//, 'api/');
      
      window.apiClient.post(endpoint, { email }, {
        onSuccess: () => {
          errorDiv.classList.remove('alert-danger');
          errorDiv.classList.add('alert-success');
          errorDiv.textContent = 'New code sent to your email!';
          errorDiv.style.display = 'block';

          setTimeout(() => {
            errorDiv.style.display = 'none';
          }, 3000);
        },
        onError: (error) => {
          errorDiv.classList.remove('alert-success');
          errorDiv.classList.add('alert-danger');
          errorDiv.textContent = error.message || 'Failed to resend code. Please try again.';
          errorDiv.style.display = 'block';
        },
        onLoading: (loading) => {
          resendBtn.disabled = loading;
          resendBtn.textContent = loading ? 'Sending...' : 'Resend Code';
        },
      }).catch(() => {
        // Error already handled by apiClient
        resendBtn.disabled = false;
        resendBtn.textContent = 'Resend Code';
      });
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initCodeInput();
      initVerifyForm();
      initResendCode();
    });
  } else {
    initCodeInput();
    initVerifyForm();
    initResendCode();
  }
})();
