/**
 * 2FA Settings Management
 *
 * Handles enabling, disabling, and managing 2FA settings.
 */

(function () {
  'use strict';

  /**
   * Enable 2FA
   */
  function initEnable2FA() {
    const enableBtn = document.getElementById('enableBtn');
    if (!enableBtn) return;

    enableBtn.addEventListener('click', async () => {
      // Use apiClient for consistent error handling
      window.apiClient.post('2fa/enable.php', {}, {
        onSuccess: (data) => {
          // Display backup codes
          const codesHtml = (data.backup_codes || data.data?.backup_codes || [])
            .map(code => `<div class="mb-1">${code}</div>`)
            .join('');

          const backupCodesList = document.getElementById('backupCodesList');
          const backupCodesSection = document.getElementById('backupCodesSection');
          const messageDiv = document.getElementById('message');

          if (backupCodesList) backupCodesList.innerHTML = codesHtml;
          if (backupCodesSection) backupCodesSection.style.display = 'block';
          enableBtn.style.display = 'none';

          if (messageDiv) {
            messageDiv.style.display = 'block';
            messageDiv.className = 'alert alert-success';
            messageDiv.textContent = data.message || '2FA enabled successfully';
          }

          // Store codes for copy function
          window.backupCodes = data.backup_codes || data.data?.backup_codes;
        },
        onError: (error) => {
          alert('Failed to enable 2FA: ' + error.message);
        },
        onLoading: (loading) => {
          enableBtn.disabled = loading;
          enableBtn.innerHTML = loading
            ? '<i class="fas fa-spinner fa-spin me-2"></i>Enabling...'
            : '<i class="fas fa-shield-alt me-2"></i>Enable 2FA';
        },
      }).catch(() => {
        // Error already handled by apiClient
        enableBtn.disabled = false;
        enableBtn.innerHTML = '<i class="fas fa-shield-alt me-2"></i>Enable 2FA';
      });
    });
  }

  /**
   * Copy backup codes
   */
  function initCopyCodes() {
    const copyBtn = document.getElementById('copyCodesBtn');
    if (!copyBtn) return;

    copyBtn.addEventListener('click', () => {
      if (window.backupCodes) {
        const text = window.backupCodes.join('\n');
        navigator.clipboard.writeText(text).then(() => {
          alert('Backup codes copied to clipboard!');
        });
      }
    });
  }

  /**
   * Disable 2FA
   */
  function initDisable2FA() {
    const disableForm = document.getElementById('disableForm');
    if (!disableForm) return;

    disableForm.addEventListener('submit', async e => {
      e.preventDefault();

      const formData = new FormData(e.target);
      const password = formData.get('password');

      if (!confirm('Are you sure you want to disable 2FA?')) {
        return;
      }

      // Use apiClient for consistent error handling
      window.apiClient.post('2fa/disable.php', { password }, {
        onSuccess: (data) => {
          const messageDiv = document.getElementById('message');
          if (messageDiv) {
            messageDiv.style.display = 'block';
            messageDiv.className = 'alert alert-success';
            messageDiv.textContent = data.message || '2FA disabled successfully';
          }

          if (data.success) {
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          }
        },
        onError: (error) => {
          alert('Failed to disable 2FA: ' + error.message);
        },
      }).catch(() => {
        // Error already handled by apiClient
      });
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initEnable2FA();
      initCopyCodes();
      initDisable2FA();
    });
  } else {
    initEnable2FA();
    initCopyCodes();
    initDisable2FA();
  }
})();
