/**
 * Password Toggle Utility
 * 
 * Provides reusable password visibility toggle functionality
 */

(function () {
  'use strict';
  console.log('password-toggle.js loaded');

  /**
   * Initialize password toggle for a password input
   * @param {HTMLElement} passwordInput - Password input element
   * @param {HTMLElement} toggleButton - Toggle button element
   */
  function initPasswordToggle(passwordInput, toggleButton) {
    if (!passwordInput || !toggleButton) return;

    toggleButton.addEventListener('click', function () {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);

      const icon = this.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
      }
    });
  }

  /**
   * Initialize password toggle by IDs
   * @param {string} passwordInputId - ID of password input element
   * @param {string} toggleButtonId - ID of toggle button element
   */
  function initPasswordToggleById(passwordInputId, toggleButtonId) {
    const passwordInput = document.getElementById(passwordInputId);
    const toggleButton = document.getElementById(toggleButtonId);
    initPasswordToggle(passwordInput, toggleButton);
  }

  // Export to global scope
  window.passwordToggle = {
    init: initPasswordToggle,
    initById: initPasswordToggleById,
  };
})();

