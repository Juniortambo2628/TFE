/**
 * Authentication Form Utilities
 * Shared functions for authentication-related forms (forgot password, reset password, etc.)
 */

(function () {
  'use strict';

  /**
   * Show message in a form
   * @param {HTMLElement} messageDiv - Message container element
   * @param {string} message - Message to display
   * @param {string} type - Message type: 'success' or 'error'
   */
  function showMessage(messageDiv, message, type = 'error') {
    if (window.showAlert) {
        window.showAlert(
            type === 'success' ? 'Success' : 'Error',
            message,
            type
        );
        return;
    }

    if (!messageDiv) {
        // Fallback if no message div and no SweetAlert
        alert(message);
        return;
    }
    
    messageDiv.style.display = 'block';
    messageDiv.className = type === 'success' ? 'alert alert-success' : 'alert alert-danger';
    messageDiv.textContent = message;
  }

  /**
   * Handle form button loading state
   * @param {HTMLElement} submitBtn - Submit button element
   * @param {boolean} loading - Loading state
   * @param {string} loadingText - Text to show when loading
   * @param {string} normalText - Text to show when not loading
   */
  function setButtonLoading(submitBtn, loading, loadingText, normalText) {
    if (!submitBtn) return;
    
    submitBtn.disabled = loading;
    submitBtn.innerHTML = loading
      ? '<i class="fas fa-spinner fa-spin me-2"></i>' + loadingText
      : normalText;
  }

  /**
   * Initialize a simple authentication form
   * @param {string} formId - ID of the form element
   * @param {string} endpoint - API endpoint
   * @param {Function} getFormData - Function to get form data (receives form element, returns data object)
   * @param {Object} options - Additional options
   * @param {Function} options.validate - Optional validation function
   * @param {Function} options.onSuccess - Optional success callback
   * @param {string} options.loadingText - Loading button text
   * @param {string} options.normalText - Normal button text
   */
  window.initAuthForm = function (formId, endpoint, getFormData, options = {}) {
    const {
      validate = null,
      onSuccess = null,
      loadingText = 'Processing...',
      normalText = 'Submit',
    } = options;

    const form = document.getElementById(formId);
    if (!form) return;

    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      const submitBtn = form.querySelector('button[type="submit"]');
      const messageDiv = document.getElementById('message');

      if (!submitBtn) return;

      // Get form data
      const formData = getFormData(form);

      // Validate if validation function provided
      if (validate) {
        const validationError = validate(formData);
        if (validationError) {
          showMessage(messageDiv, validationError, 'error');
          return;
        }
      }

      // Use apiClient for consistent error handling
      window.apiClient.post(endpoint, formData, {
        onSuccess: (data) => {
          showMessage(messageDiv, data.message || 'Success', 'success');
          
          if (onSuccess) {
            onSuccess(data, form, messageDiv);
          } else {
            // Default: reset form
            form.reset();
          }
        },
        onError: (error) => {
          showMessage(messageDiv, error.message || 'An error occurred. Please try again.', 'error');
        },
        onLoading: (loading) => {
          setButtonLoading(submitBtn, loading, loadingText, normalText);
        },
      }).catch(() => {
        // Error already handled by apiClient
        setButtonLoading(submitBtn, false, loadingText, normalText);
      });
    });
  };
})();

