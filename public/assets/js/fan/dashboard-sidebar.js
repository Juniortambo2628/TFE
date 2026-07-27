/**
 * Fan Dashboard Sidebar
 *
 * Handles sidebar toggle and mobile behavior.
 */

(function () {
  'use strict';

  /**
   * Toggle sidebar
   */
  window.toggleSidebar = function () {
    const sidebar = document.querySelector('.dashboard-sidebar');
    if (sidebar) {
      sidebar.classList.toggle('mobile-open');
    }
  };

  /**
   * Close sidebar when clicking outside on mobile
   */
  document.addEventListener('click', function (e) {
    const sidebar = document.querySelector('.dashboard-sidebar');
    const hamburger = document.querySelector('.dashboard-hamburger');

    if (!sidebar || !hamburger) return;

    if (window.innerWidth <= 768 && !sidebar.contains(e.target) && !hamburger.contains(e.target)) {
      sidebar.classList.remove('mobile-open');
    }
  });

  /**
   * Handle window resize
   */
  window.addEventListener('resize', function () {
    const sidebar = document.querySelector('.dashboard-sidebar');
    if (sidebar && window.innerWidth > 768) {
      sidebar.classList.remove('mobile-open');
    }
  });
})();
