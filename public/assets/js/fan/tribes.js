/**
 * Tribes Page
 *
 * Handles tribe functionality.
 */

(function () {
  'use strict';

  const BASE_URL = (window.APP_BASE_URL || '/TFE').replace(/\/$/, '') + '/';

  /**
   * Show notification
   */
  function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Style the notification
    notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            font-size: 14px;
            font-weight: 500;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  /**
   * Create tribe
   */
  window.createTribe = function () {
    // Implement tribe creation functionality
    alert('Tribe creation functionality will be implemented');
  };

  /**
   * Join tribe
   */
  window.joinTribe = function (tribeId, event) {
    const button = event ? event.target : null;
    if (!button) return;

    const originalText = button.textContent;

    // Use apiClient for consistent error handling
    window.apiClient.post('tribes.php', {
      action: 'join',
      tribe_id: tribeId,
    }, {
      onSuccess: (data) => {
        // Update button state
        button.textContent = 'Leave Tribe';
        button.classList.add('joined');
        button.onclick = e => window.leaveTribe(tribeId, e);

        // Show success message
        showNotification('Successfully joined the tribe!', 'success');

        // Update member count if available
        const memberCountElement = button
          .closest('.tribe-card')
          ?.querySelector('.tribe-members span');
        if (memberCountElement) {
          const currentCount = parseInt(memberCountElement.textContent) || 0;
          memberCountElement.textContent = currentCount + 1 + ' members';
        }
      },
      onError: (error) => {
        showNotification(error.message || 'Failed to join tribe', 'error');
        button.textContent = originalText;
      },
      onLoading: (loading) => {
        button.disabled = loading;
        button.textContent = loading ? 'Joining...' : originalText;
      },
    }).catch(() => {
      // Error already handled by apiClient
      button.disabled = false;
      button.textContent = originalText;
    });
  };

  /**
   * Leave tribe
   */
  window.leaveTribe = function (tribeId, event) {
    const button = event ? event.target : null;
    if (!button) return;

    const originalText = button.textContent;

    // Use apiClient for consistent error handling
    window.apiClient.post('tribes.php', {
      action: 'leave',
      tribe_id: tribeId,
    }, {
      onSuccess: (data) => {
        // Update button state
        button.textContent = 'Join Tribe';
        button.classList.remove('joined');
        button.onclick = e => window.joinTribe(tribeId, e);

        // Show success message
        showNotification('Successfully left the tribe!', 'success');

        // Update member count if available
        const memberCountElement = button
          .closest('.tribe-card')
          ?.querySelector('.tribe-members span');
        if (memberCountElement) {
          const currentCount = parseInt(memberCountElement.textContent) || 0;
          memberCountElement.textContent = Math.max(0, currentCount - 1) + ' members';
        }
      },
      onError: (error) => {
        showNotification(error.message || 'Failed to leave tribe', 'error');
        button.textContent = originalText;
      },
      onLoading: (loading) => {
        button.disabled = loading;
        button.textContent = loading ? 'Leaving...' : originalText;
      },
    }).catch(() => {
      // Error already handled by apiClient
      button.disabled = false;
      button.textContent = originalText;
    });
  };

  /**
   * View tribe
   */
  window.viewTribe = function (tribeId) {
    // Implement tribe viewing functionality
    alert('Tribe viewing functionality will be implemented for tribe ID: ' + tribeId);
  };

  /**
   * Filter tribes
   */
  window.filterTribes = function (category) {
    // Implement tribe filtering functionality
    alert('Tribe filtering functionality will be implemented for category: ' + category);
  };

  /**
   * Search tribes
   */
  window.searchTribes = function (query) {
    // Implement tribe search functionality
    alert('Tribe search functionality will be implemented for query: ' + query);
  };
})();
