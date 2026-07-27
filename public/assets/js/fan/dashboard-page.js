/**
 * Fan Dashboard Page
 *
 * Handles dashboard-specific functionality (user dropdown, etc.).
 */

(function () {
  'use strict';

  /**
   * Initialize dashboard page
   */
  function initDashboard() {
    // User dropdown functionality
    const userProfile = document.getElementById('dashboardUserProfile');
    const dropdownMenu = document.getElementById('dashboardDropdownMenu');

    if (userProfile && dropdownMenu) {
      userProfile.addEventListener('click', function (e) {
        e.stopPropagation();
        userProfile.classList.toggle('active');
        dropdownMenu.classList.toggle('show');
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', function (e) {
        if (!userProfile.contains(e.target) && !dropdownMenu.contains(e.target)) {
          userProfile.classList.remove('active');
          dropdownMenu.classList.remove('show');
        }
      });
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
  } else {
    initDashboard();
  }
})();
