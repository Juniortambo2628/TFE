/**
 * Admin Sidebar Management
 *
 * Handles sidebar toggle and section navigation in admin dashboard.
 */

(function () {
  'use strict';

  /**
   * Toggle sidebar visibility
   */
  window.toggleSidebar = function () {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      sidebar.classList.toggle('show');
    }
  };

  /**
   * Close sidebar when clicking outside on mobile
   */
  document.addEventListener('click', function (event) {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.querySelector('.sidebar-toggle');

    if (!sidebar || !toggle) return;

    if (
      window.innerWidth <= 768 &&
      !sidebar.contains(event.target) &&
      !toggle.contains(event.target)
    ) {
      sidebar.classList.remove('show');
    }
  });

  /**
   * Show section function (for settings)
   * @param {string} sectionName - Name of the section to show
   */
  window.showSection = function (sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll('.dashboard-section');
    sections.forEach(section => {
      section.style.display = 'none';
    });

    // Show selected section
    const targetSection = document.getElementById(sectionName + '-section');
    if (targetSection) {
      targetSection.style.display = 'block';
    }

    // Update active nav link
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
    navLinks.forEach(link => {
      link.classList.remove('active');
    });

    if (event && event.target) {
      event.target.classList.add('active');
    }

    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
      const sidebar = document.getElementById('sidebar');
      if (sidebar) {
        sidebar.classList.remove('show');
      }
    }
  };
})();
