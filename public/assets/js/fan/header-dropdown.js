/**
 * Fan Dashboard Header Dropdown
 *
 * Handles user dropdown and notifications dropdown in fan dashboard header.
 */

(function () {
  'use strict';

  /**
   * Initialize dropdown functionality
   */
  function initDropdowns() {
    // User dropdown
    const userProfileBtn = document.getElementById('dashboardUserProfile');
    const userDropdownMenu = document.getElementById('dashboardDropdownMenu');

    if (userProfileBtn && userDropdownMenu) {
      userProfileBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        userDropdownMenu.classList.toggle('show');
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', function (e) {
        if (!userProfileBtn.contains(e.target) && !userDropdownMenu.contains(e.target)) {
          userDropdownMenu.classList.remove('show');
        }
      });
    }

    // Notifications dropdown
    const notificationsBtn = document.getElementById('notificationsDropdownBtn');
    const notificationsMenu = document.getElementById('notificationsDropdownMenu');

    if (notificationsBtn && notificationsMenu) {
      notificationsBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        notificationsMenu.classList.toggle('show');
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', function (e) {
        if (!notificationsBtn.contains(e.target) && !notificationsMenu.contains(e.target)) {
          notificationsMenu.classList.remove('show');
        }
      });
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDropdowns);
  } else {
    initDropdowns();
  }
})();
