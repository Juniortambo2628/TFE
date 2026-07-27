/**
 * User Row Data Utility
 * 
 * Provides functions to extract data from user table rows
 */

(function () {
  'use strict';

  /**
   * Extract user data from a table row
   * @param {string} userId - User ID to find row for
   * @returns {Object|null} User data object or null if not found
   */
  function getUserRowData(userId) {
    const row = document.querySelector('tr[data-id="' + userId + '"]');
    if (!row) return null;

    const cells = row.querySelectorAll('td');
    return {
      name: cells[0]?.textContent.trim() || '',
      email: cells[1]?.textContent.trim() || '',
      country: cells[2]?.textContent.trim() || '',
      date: cells[3]?.textContent.trim() || '',
      status: cells[4]?.textContent.trim() || '',
    };
  }

  // Export to global scope
  window.userRowData = {
    get: getUserRowData,
  };
})();

