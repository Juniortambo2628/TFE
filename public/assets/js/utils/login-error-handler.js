/**
 * Login Error Handler Utility
 * 
 * Provides consistent error handling for login forms
 */

(function () {
  'use strict';
  console.log('login-error-handler.js loaded');

  /**
   * Handle fetch response errors consistently
   * @param {Response} response - Fetch response object
   * @returns {Promise<string>} Error message
   */
  async function handleLoginError(response) {
    const errorText = await response.text();
    let errorMessage = 'An error occurred. Please try again.';
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || errorMessage;
    } catch {
      // If not JSON, use the text
      errorMessage = errorText || errorMessage;
    }
    return errorMessage;
  }

  /**
   * Handle login form errors
   * @param {Error} error - Error object
   * @param {HTMLElement} submitBtn - Submit button element
   * @param {Function} showAlert - Alert display function (optional)
   */
  function handleLoginFormError(error, submitBtn, showAlert = null) {
    console.error('Login error:', error);
    const errorMessage = error.message || 'An error occurred. Please try again.';
    
    if (showAlert && typeof showAlert === 'function') {
      showAlert('danger', errorMessage);
    } else {
      alert(errorMessage);
    }
    
    if (submitBtn) {
      submitBtn.disabled = false;
      if (submitBtn.textContent) {
        submitBtn.textContent = submitBtn.textContent.replace('Signing in...', 'Sign In')
          .replace('Logging in...', 'Log In');
      }
    }
  }

  /**
   * Reset login button state
   * @param {HTMLElement} submitBtn - Submit button element
   * @param {HTMLElement} btnText - Button text element (optional)
   * @param {HTMLElement} btnSpinner - Button spinner element (optional)
   */
  function resetLoginButton(submitBtn, btnText = null, btnSpinner = null) {
    if (submitBtn) {
      submitBtn.disabled = false;
    }
    if (btnText) {
      btnText.style.display = 'inline-block';
    }
    if (btnSpinner) {
      btnSpinner.style.display = 'none';
    }
  }

  // Export to global scope
  window.loginErrorHandler = {
    handleLoginError,
    handleLoginFormError,
    resetLoginButton,
  };
})();

