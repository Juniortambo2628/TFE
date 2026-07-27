/**
 * 2FA Verification Handler
 *
 * Handles 2FA code input, verification, and backup code usage.
 */

(function () {
  'use strict';

  let codeInputs;

  /**
   * Initialize code inputs
   */
  function initCodeInputs() {
    codeInputs = document.querySelectorAll('.code-input');

    if (codeInputs.length === 0) return;

    codeInputs.forEach((input, index) => {
      input.addEventListener('input', e => {
        if (e.target.value.length === 1 && index < codeInputs.length - 1) {
          codeInputs[index + 1].focus();
        }
      });

      input.addEventListener('keydown', e => {
        if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
          codeInputs[index - 1].focus();
        }
      });

      // Only allow numbers
      input.addEventListener('keypress', e => {
        if (!/[0-9]/.test(e.key)) {
          e.preventDefault();
        }
      });
    });

    // Auto-submit when all 6 digits entered
    if (codeInputs[5]) {
      codeInputs[5].addEventListener('input', () => {
        if (codeInputs[5].value.length === 1) {
          const form = document.getElementById('2faForm');
          if (form) {
            form.dispatchEvent(new Event('submit'));
          }
        }
      });
    }

    // Focus first input on load
    if (codeInputs[0]) {
      codeInputs[0].focus();
    }
  }

  /**
   * Initialize 2FA form submission
   */
  function init2FAForm() {
    const form = document.getElementById('2faForm');
    if (!form) return;

    form.addEventListener('submit', async e => {
      e.preventDefault();

      if (!codeInputs || codeInputs.length === 0) return;

      const code = Array.from(codeInputs)
        .map(input => input.value)
        .join('');
      const emailInput = e.target.querySelector('input[name="email"]');
      const email = emailInput ? emailInput.value : '';
      const messageDiv = document.getElementById('message');

      if (!messageDiv) return;

      if (code.length !== 6) {
        messageDiv.style.display = 'block';
        messageDiv.className = 'alert alert-danger';
        messageDiv.textContent = 'Please enter all 6 digits';
        return;
      }

      // Use apiClient for consistent error handling
      window.apiClient.post('2fa/verify-code.php', { email, code }, {
        onSuccess: (data) => {
          messageDiv.style.display = 'block';
          messageDiv.className = 'alert alert-success';
          messageDiv.textContent = data.message || 'Verification successful';

          if (data.success || data.redirect_url) {
            setTimeout(() => {
              window.location.href = data.redirect_url || '../fan/dashboard.php';
            }, 1000);
          }
        },
        onError: (error) => {
          messageDiv.style.display = 'block';
          messageDiv.className = 'alert alert-danger';
          messageDiv.textContent = error.message || 'An error occurred. Please try again.';
        },
      }).catch(() => {
        // Error already handled by apiClient
      });
    });
  }

  /**
   * Initialize resend code button
   */
  function initResendCode() {
    const resendBtn = document.getElementById('resendBtn');
    if (!resendBtn) return;

    resendBtn.addEventListener('click', async () => {
      const emailInput = document.querySelector('input[name="email"]');
      if (!emailInput) return;

      const email = emailInput.value;
      const messageDiv = document.getElementById('message');

      resendBtn.disabled = true;
      resendBtn.textContent = 'Sending...';

      try {
        const response = await fetch('../api/2fa/send-code.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (messageDiv) {
          messageDiv.style.display = 'block';
          messageDiv.className = 'alert alert-success';
          messageDiv.textContent = 'New code sent!';
        }

        // Clear inputs
        if (codeInputs) {
          codeInputs.forEach(input => (input.value = ''));
          if (codeInputs[0]) codeInputs[0].focus();
        }
      } catch {
        alert('Failed to resend code');
      } finally {
        resendBtn.disabled = false;
        resendBtn.textContent = 'Resend Code';
      }
    });
  }

  /**
   * Initialize backup code section
   */
  function initBackupCode() {
    const useBackupBtn = document.getElementById('useBackupCode');
    const backupCodeSection = document.getElementById('backupCodeSection');
    const backupCodeForm = document.getElementById('backupCodeForm');

    if (useBackupBtn && backupCodeSection) {
      useBackupBtn.addEventListener('click', e => {
        e.preventDefault();
        backupCodeSection.style.display = 'block';
      });
    }

    if (backupCodeForm) {
      backupCodeForm.addEventListener('submit', async e => {
        e.preventDefault();

        const formData = new FormData(e.target);
        const email = formData.get('email');
        const code = formData.get('backup_code');

        try {
          const response = await fetch('../api/2fa/verify-code.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code }),
          });

          const data = await response.json();

          const messageDiv = document.getElementById('message');
          if (messageDiv) {
            messageDiv.style.display = 'block';
            messageDiv.className = 'alert ' + (data.success ? 'alert-success' : 'alert-danger');
            messageDiv.textContent = data.message;
          }

          if (data.success) {
            setTimeout(() => {
              window.location.href = data.redirect_url;
            }, 1000);
          }
        } catch {
          alert('Verification failed');
        }
      });
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initCodeInputs();
      init2FAForm();
      initResendCode();
      initBackupCode();
    });
  } else {
    initCodeInputs();
    init2FAForm();
    initResendCode();
    initBackupCode();
  }
})();
