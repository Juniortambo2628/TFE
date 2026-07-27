/**
 * Notification Badge Management
 * Fetches and displays notification counts for social and tribes
 */

(function () {
  'use strict';

  // Fetch and update notification counts
  async function updateNotificationCounts() {
    try {
      const baseUrl = (window.APP_BASE_URL || '/TFE').replace(/\/$/, '') + '/';
      const response = await fetch(baseUrl + 'api/notifications/counts.php');
      const data = await response.json();

      if (data.success) {
        // Update social badge
        const socialBadge = document.getElementById('socialNotificationBadge');
        if (socialBadge) {
          if (data.social > 0) {
            socialBadge.textContent = data.social >= 99 ? '99+' : data.social;
            socialBadge.style.display = 'flex';
          } else {
            socialBadge.style.display = 'none';
          }
        }

        // Update tribes badge
        const tribesBadge = document.getElementById('tribesNotificationBadge');
        if (tribesBadge) {
          if (data.tribes > 0) {
            tribesBadge.textContent = data.tribes >= 99 ? '99+' : data.tribes;
            tribesBadge.style.display = 'flex';
          } else {
            tribesBadge.style.display = 'none';
          }
        }
      } else {
        // Log error details if available
        if (data.debug) {
          console.error('Notification API Error:', data.debug);
          console.error('Stack trace:', data.trace);
        }
      }
    } catch (error) {
      console.error('Failed to fetch notification counts:', error);
    }
  }

  // Update counts on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateNotificationCounts);
  } else {
    updateNotificationCounts();
  }

  // Update counts every 30 seconds
  setInterval(updateNotificationCounts, 30000);

  // Expose function to global scope for manual updates
  window.updateNotificationCounts = updateNotificationCounts;
})();
