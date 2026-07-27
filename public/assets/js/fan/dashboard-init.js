/**
 * Fan Dashboard Initialization
 *
 * Handles dashboard-specific initialization including dropdowns, sidebar, and notifications.
 */

(function () {
  'use strict';

  /**
   * Initialize dashboard
   */
  function initDashboard() {
    // User dropdown functionality is now handled by dashboard-header.js
    // Skip this to avoid conflicts
    // The dashboard-header.js file handles all dropdowns (profile, notifications, messages)

    // Hamburger menu for mobile sidebar toggle
    const hamburger = document.getElementById('dashboardHamburger');
    const sidebar = document.querySelector('.dashboard-sidebar');

    if (hamburger && sidebar) {
      hamburger.addEventListener('click', function () {
        sidebar.classList.toggle('mobile-open');
        document.body.classList.toggle('sidebar-open');
      });

      // Close sidebar when clicking outside on mobile
      document.addEventListener('click', function (e) {
        if (
          window.innerWidth <= 980 &&
          !sidebar.contains(e.target) &&
          !hamburger.contains(e.target) &&
          sidebar.classList.contains('mobile-open')
        ) {
          sidebar.classList.remove('mobile-open');
          document.body.classList.remove('sidebar-open');
        }
      });

      // Close sidebar when window is resized to desktop
      window.addEventListener('resize', function () {
        if (window.innerWidth > 980) {
          sidebar.classList.remove('mobile-open');
          document.body.classList.remove('sidebar-open');
        }
      });
    }

    // Notification and message buttons
    const notificationsBtn = document.getElementById('dashboardNotificationsBtn');
    const messagesBtn = document.getElementById('dashboardMessagesBtn');

    if (notificationsBtn) {
      notificationsBtn.addEventListener('click', function () {
        // Load notifications modal
        if (typeof loadNotificationsModal === 'function') {
          loadNotificationsModal();
        }
      });
    }

    if (messagesBtn) {
      messagesBtn.addEventListener('click', function () {
        // Load messages modal
        if (typeof loadMessagesModal === 'function') {
          loadMessagesModal();
        }
      });
    }

    // Enable floating nav on fan dashboard by initializing ssFloatingNav if available
    if (typeof ssFloatingNav === 'function') {
      try {
        ssFloatingNav();
      } catch (e) {
        console.warn('Floating nav init failed on fan dashboard:', e);
      }
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
  } else {
    initDashboard();
  }
})();
