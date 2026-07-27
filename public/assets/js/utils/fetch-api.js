/**
 * Fetch API Utility
 * 
 * Provides consistent API fetching with error handling
 */

(function () {
  'use strict';

  /**
   * Make an API call with consistent error handling
   * @param {string} url - Full URL or endpoint (relative to BASE_URL if provided)
   * @param {string} baseUrl - Optional base URL (defaults to empty string)
   * @returns {Promise<Object>} API response data
   */
  function fetchAPI(url, baseUrl = '') {
    const fullUrl = url.startsWith('http') ? url : (baseUrl + url);
    return fetch(fullUrl)
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
      })
      .catch(error => {
        console.error('API fetch error:', error);
        return { success: false, error: error.message };
      });
  }

  // Export to global scope
  window.fetchAPI = fetchAPI;
})();

