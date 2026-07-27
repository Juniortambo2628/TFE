/**
 * Fan Dashboard Header
 *
 * Handles dropdowns (user, notifications, messages) and logout.
 * Expects window.LOGOUT_URL to be defined by PHP.
 */

import { showConfirm } from '../shared/ui-utils.js';

(function () {
  'use strict';

  const logoutUrl = window.LOGOUT_URL || '../auth/logout.php?redirect=landing';

  /**
   * Close all dropdowns
   */
  function closeAllDropdowns() {
    const dropdowns = document.querySelectorAll('.dashboard-dropdown-menu');
    const profileBtn = document.getElementById('dashboardUserProfile');

    dropdowns.forEach(dropdown => {
      dropdown.classList.remove('show');
      dropdown.style.display = 'none';
    });

    if (profileBtn) {
      profileBtn.classList.remove('active');
    }
  }

  /**
   * Close specific dropdown (exclude one from closing)
   */
  function closeOtherDropdowns(excludeDropdown) {
    const dropdowns = document.querySelectorAll('.dashboard-dropdown-menu');
    const profileBtn = document.getElementById('dashboardUserProfile');

    dropdowns.forEach(dropdown => {
      if (dropdown !== excludeDropdown) {
        dropdown.classList.remove('show');
        dropdown.style.display = 'none';
      }
    });

    // Remove active state from profile if its dropdown is being closed
    if (profileBtn && excludeDropdown !== document.getElementById('dashboardDropdownMenu')) {
      profileBtn.classList.remove('active');
    }
  }

  /**
   * Initialize dropdowns
   */
  function initDropdowns() {
    // User profile dropdown
    const userProfileBtn = document.getElementById('dashboardUserProfile');
    const userDropdownMenu = document.getElementById('dashboardDropdownMenu');

    if (userProfileBtn && userDropdownMenu) {
      // Remove any existing event listeners by cloning
      const newBtn = userProfileBtn.cloneNode(true);
      userProfileBtn.parentNode.replaceChild(newBtn, userProfileBtn);
      const btn = document.getElementById('dashboardUserProfile');
      
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Toggle this dropdown
        const isOpen = userDropdownMenu.classList.contains('show');
        
        // Close other dropdowns first
        closeOtherDropdowns(userDropdownMenu);
        
        // Then toggle this one
        if (isOpen) {
          userDropdownMenu.classList.remove('show');
          userDropdownMenu.style.display = 'none';
          btn.classList.remove('active');
        } else {
          userDropdownMenu.classList.add('show');
          userDropdownMenu.style.display = 'block';
          btn.classList.add('active');
        }
      });
    }

    // Notification dropdown
    const notificationBtn = document.getElementById('dashboardNotificationsBtn');
    const notificationDropdown = document.getElementById('dashboardNotificationsDropdown');

    if (notificationBtn && notificationDropdown) {
      notificationBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        
        // Toggle this dropdown
        const isOpen = notificationDropdown.classList.contains('show');
        
        // Close other dropdowns first
        closeOtherDropdowns(notificationDropdown);
        
        // Then toggle this one
        if (isOpen) {
          notificationDropdown.classList.remove('show');
          notificationDropdown.style.display = 'none';
        } else {
          notificationDropdown.classList.add('show');
          notificationDropdown.style.display = 'block';
        }
      });
    }

    // Messages dropdown
    const messagesBtn = document.getElementById('dashboardMessagesBtn');
    const messagesDropdown = document.getElementById('dashboardMessagesDropdown');

    if (messagesBtn && messagesDropdown) {
      messagesBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        
        // Toggle this dropdown
        const isOpen = messagesDropdown.classList.contains('show');
        
        // Close other dropdowns first
        closeOtherDropdowns(messagesDropdown);
        
        // Then toggle this one
        if (isOpen) {
          messagesDropdown.classList.remove('show');
          messagesDropdown.style.display = 'none';
        } else {
          messagesDropdown.classList.add('show');
          messagesDropdown.style.display = 'block';
        }
      });
    }

    // Logout button
    const logoutBtn = document.getElementById('dashboardLogoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function (e) {
        e.preventDefault();
        
        showConfirm('Logout', 'Are you sure you want to logout?', 'Yes, logout')
        .then((result) => {
          if (result.isConfirmed) {
            window.location.href = logoutUrl;
          }
        });
      });
    }

    // Close dropdowns when clicking outside
    document.addEventListener('click', function (e) {
      const clickedElement = e.target;
      const isInUserProfile = clickedElement.closest('.dashboard-user-profile') || clickedElement.closest('#dashboardDropdownMenu');
      const isInNotification = clickedElement.closest('.dashboard-notification-btn') || clickedElement.closest('#dashboardNotificationsDropdown');
      const isInMessages = clickedElement.closest('.dashboard-messages-btn') || clickedElement.closest('#dashboardMessagesDropdown');
      
      if (!isInUserProfile && !isInNotification && !isInMessages) {
        closeAllDropdowns();
      }
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDropdowns);
  } else {
    initDropdowns();
  }
})();
