/**
 * Admin Template Helper
 *
 * Helper function to retrieve admin templates safely.
 * Expects window.ADMIN_TEMPLATES to be defined by PHP.
 */

(function () {
  'use strict';

  /**
   * Retrieve admin template safely
   * @param {string} name - Template name (profile, settings, export_progress)
   * @returns {string} HTML string
   */
  window.getAdminTemplate = function (name) {
    // Prefer JSON encoded templates on window (safe string)
    if (window.ADMIN_TEMPLATES && window.ADMIN_TEMPLATES[name]) {
      try {
        return JSON.parse(window.ADMIN_TEMPLATES[name]);
      } catch {
        // fallthrough to template tag
      }
    }

    const el = document.getElementById('tpl-' + name);
    return el ? el.innerHTML : '';
  };
})();
