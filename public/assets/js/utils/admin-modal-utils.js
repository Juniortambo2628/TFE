/**
 * Admin Modal Utilities
 * Shared functions for admin modal initialization and management
 */

(function () {
  'use strict';

  /**
   * Initialize a Bootstrap modal
   * @param {string} modalId - ID of the modal element
   * @returns {Object|null} Bootstrap Modal instance or null
   */
  window.initAdminModal = function (modalId) {
    if (typeof bootstrap === 'undefined') {
      console.warn('Bootstrap not loaded yet - cannot initialize modal');
      return null;
    }

    const modalElement = document.getElementById(modalId);
    if (!modalElement) {
      console.warn(`Modal element with ID "${modalId}" not found`);
      return null;
    }

    return new bootstrap.Modal(modalElement);
  };

  /**
   * Show a modal, initializing it if necessary
   * @param {Object|null} modalInstance - Existing modal instance or null
   * @param {string} modalId - ID of the modal element
   * @returns {Object|null} Modal instance (may be newly created)
   */
  window.showAdminModal = function (modalInstance, modalId) {
    if (modalInstance) {
      modalInstance.show();
      return modalInstance;
    }

    if (typeof bootstrap === 'undefined') {
      console.warn('Bootstrap not loaded yet - cannot show modal');
      return null;
    }

    const newInstance = window.initAdminModal(modalId);
    if (newInstance) {
      newInstance.show();
    }
    return newInstance;
  };

  /**
   * Initialize modal on DOM ready
   * @param {string} modalId - ID of the modal element
   * @param {Function} callback - Optional callback with modal instance
   */
  window.initModalOnReady = function (modalId, callback) {
    function init() {
      const modal = window.initAdminModal(modalId);
      if (callback) {
        callback(modal);
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  };

  /**
   * Handle API response and update modal content
   * @param {Response} response - Fetch response
   * @param {HTMLElement} contentElement - Element to update with content
   * @param {Function} successCallback - Function to render success content (receives data)
   * @param {string} errorMessage - Error message to show on failure
   */
  window.handleModalApiResponse = async function (
    response,
    contentElement,
    successCallback,
    errorMessage = 'An error occurred'
  ) {
    if (!contentElement) {
      console.error('Content element not provided');
      return;
    }

    try {
      const data = await response.json();

      if (data.success && successCallback) {
        contentElement.innerHTML = successCallback(data);
      } else {
        contentElement.innerHTML = `<div class="alert alert-danger">${
          data.message || 'Failed to load data'
        }</div>`;
      }
    } catch (error) {
      console.error('Error:', error);
      contentElement.innerHTML = `<div class="alert alert-danger">${errorMessage}</div>`;
    }
  };
})();

