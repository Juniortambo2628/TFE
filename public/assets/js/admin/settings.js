/**
 * Admin Settings Form Handlers
 *
 * Handles profile, password, and system settings form submissions.
 */

(function () {
  'use strict';

  /**
   * Initialize settings forms
   */
  function initSettings() {
    // Profile form submission
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
      profileForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const formData = new FormData(this);
        console.log('Updating profile...');

        if (window.dashboard && window.dashboard.showSuccess) {
          window.dashboard.showSuccess('Profile updated successfully!');
        }
      });
    }

    // Password form submission
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
      passwordForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const currentPassword = document.getElementById('currentPassword');
        const newPassword = document.getElementById('newPassword');
        const confirmPassword = document.getElementById('confirmPassword');

        if (!currentPassword || !newPassword || !confirmPassword) return;

        if (newPassword.value !== confirmPassword.value) {
          if (window.dashboard && window.dashboard.showError) {
            window.dashboard.showError('New passwords do not match!');
          }
          return;
        }

        if (newPassword.value.length < 8) {
          if (window.dashboard && window.dashboard.showError) {
            window.dashboard.showError('Password must be at least 8 characters long!');
          }
          return;
        }

        console.log('Changing password...');
        if (window.dashboard && window.dashboard.showSuccess) {
          window.dashboard.showSuccess('Password changed successfully!');
        }

        // Clear form
        this.reset();
      });
    }

    // System form submission
    const systemForm = document.getElementById('systemForm');
    if (systemForm) {
      systemForm.addEventListener('submit', function (e) {
        e.preventDefault();

        console.log('Saving system settings...');
        if (window.dashboard && window.dashboard.showSuccess) {
          window.dashboard.showSuccess('System settings saved successfully!');
        }
      });
    }
  }

  /**
   * Logout function
   */
  window.logout = function () {
    if (confirm('Are you sure you want to logout?')) {
      // Clear session cookie
      document.cookie = 'wctfe_admin_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

      // Redirect to login page
      window.location.href = 'login.php';
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSettings);
  } else {
    initSettings();
  }
})();
