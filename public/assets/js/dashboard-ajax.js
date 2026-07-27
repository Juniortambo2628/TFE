/**
 * Dashboard AJAX Handler
 * Handles live updates for notifications, messages, and user dropdown
 */

(function () {
  'use strict';

   // Skip initialization if in admin mode
  if (window.ADMIN_MODE) {
    return;
  }

  // Configuration
  const baseUrl = (window.APP_BASE_URL || '/TFE').replace(/\/$/, '') + '/';
  const CONFIG = {
    notificationsEndpoint: baseUrl + 'api/notifications.php',
    messagesEndpoint: baseUrl + 'api/messages.php',
    bookingsEndpoint: baseUrl + 'api/bookings.php',
    updateInterval: 30000, // 30 seconds
    fadeSpeed: 300,
  };

  // State
  let updateTimer = null;
  let activeDropdown = null;

  /**
   * Initialize dashboard
   */
  function init() {
    // Setup dropdown toggles
    setupDropdowns();

    // Load initial data
    loadNotifications();
    loadMessages();
    loadBookingData();

    // Setup periodic updates
    startPeriodicUpdates();

    // Setup logout handler
    setupLogoutHandler();
  }

  /**
   * Load booking data
   */
  async function loadBookingData() {
    try {
      const response = await fetch(CONFIG.bookingsEndpoint);
      const data = await response.json();

      if (data.success && data.booking) {
        updateBookingDisplay(data.booking, data.payment_schedule);
      }
    } catch (error) {
      console.error('Error loading booking data:', error);
    }
  }

  /**
   * Update booking display on dashboard
   */
  function updateBookingDisplay(booking, paymentSchedule) {
    // Update booking section if it exists
    const bookingSection = document.querySelector('[data-service="section-1"]');
    if (bookingSection) {
      const bookingContent = bookingSection.closest('.row');
      if (bookingContent) {
        const detailsHtml = `
                    <div class="booking-details" style="margin-top: 20px; padding: 20px; background: rgba(0,0,0,0.3); border-radius: 8px;">
                        <h4 style="color: #c5f330; margin-bottom: 15px;">${booking.package_name}</h4>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                            <div>
                                <p style="color: #888; margin: 0;">Status</p>
                                <p style="color: #fff; font-weight: bold; margin: 5px 0;">${booking.status.toUpperCase()}</p>
                            </div>
                            <div>
                                <p style="color: #888; margin: 0;">Total Amount</p>
                                <p style="color: #fff; font-weight: bold; margin: 5px 0;">$${parseFloat(booking.total_amount).toFixed(2)}</p>
                            </div>
                            <div>
                                <p style="color: #888; margin: 0;">Paid Amount</p>
                                <p style="color: #c5f330; font-weight: bold; margin: 5px 0;">$${parseFloat(booking.amount_paid).toFixed(2)}</p>
                            </div>
                            <div>
                                <p style="color: #888; margin: 0;">Remaining</p>
                                <p style="color: #ff5c5c; font-weight: bold; margin: 5px 0;">$${(parseFloat(booking.total_amount) - parseFloat(booking.amount_paid)).toFixed(2)}</p>
                            </div>
                        </div>
                        ${booking.notes ? `<p style="color: #ccc; margin: 10px 0; font-size: 14px;">${booking.notes}</p>` : ''}
                    </div>
                `;

        // Find and update content area
        const contentArea = bookingContent.querySelector('.s-about__intro-text');
        if (contentArea && !contentArea.querySelector('.booking-details')) {
          contentArea.insertAdjacentHTML('beforeend', detailsHtml);
        }
      }
    }

    // Update payment schedule if section exists
    if (paymentSchedule && paymentSchedule.length > 0) {
      updatePaymentSchedule(paymentSchedule);
    }
  }

  /**
   * Update payment schedule display
   */
  function updatePaymentSchedule(schedule) {
    const scheduleSection = document.querySelector('[data-service="section-4"]');
    if (scheduleSection) {
      const contentArea = scheduleSection.closest('.row').querySelector('.s-about__intro-text');
      if (contentArea && !contentArea.querySelector('.payment-schedule')) {
        const scheduleHtml = `
                    <div class="payment-schedule" style="margin-top: 20px; padding: 20px; background: rgba(0,0,0,0.3); border-radius: 8px;">
                        <h4 style="color: #c5f330; margin-bottom: 15px;">Upcoming Payments</h4>
                        ${schedule
                          .map(
                            payment => `
                            <div style="padding: 12px; background: rgba(255,255,255,0.05); border-radius: 6px; margin-bottom: 10px; border-left: 3px solid ${payment.status === 'paid' ? '#c5f330' : payment.status === 'overdue' ? '#ff5c5c' : '#888'};">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <div>
                                        <p style="color: #fff; font-weight: bold; margin: 0;">Payment ${payment.payment_number}</p>
                                        <p style="color: #888; font-size: 12px; margin: 5px 0;">Due: ${payment.due_date}</p>
                                    </div>
                                    <div style="text-align: right;">
                                        <p style="color: #fff; font-weight: bold; margin: 0;">$${parseFloat(payment.amount).toFixed(2)}</p>
                                        <p style="color: ${payment.status === 'paid' ? '#c5f330' : payment.status === 'overdue' ? '#ff5c5c' : '#888'}; font-size: 12px; margin: 5px 0; text-transform: uppercase;">${payment.status}</p>
                                    </div>
                                </div>
                            </div>
                        `
                          )
                          .join('')}
                    </div>
                `;
        contentArea.insertAdjacentHTML('beforeend', scheduleHtml);
      }
    }
  }

  /**
   * Setup dropdown click handlers
   */
  function setupDropdowns() {
    // User dropdown
    const userDropdownBtn = document.getElementById('userDropdownBtn');
    const userDropdownMenu = document.getElementById('userDropdownMenu');

    if (userDropdownBtn && userDropdownMenu) {
      userDropdownBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        toggleDropdown(userDropdownMenu);
      });
    }

    // Notifications dropdown
    const notificationsBtn = document.getElementById('notificationsDropdownBtn');
    const notificationsMenu = document.getElementById('notificationsDropdownMenu');

    if (notificationsBtn && notificationsMenu) {
      notificationsBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        toggleDropdown(notificationsMenu);
        if (notificationsMenu.classList.contains('show')) {
          loadNotifications();
        }
      });
    }

    // Messages dropdown
    const messagesBtn = document.getElementById('messagesDropdownBtn');
    const messagesMenu = document.getElementById('messagesDropdownMenu');

    if (messagesBtn && messagesMenu) {
      messagesBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        toggleDropdown(messagesMenu);
        if (messagesMenu.classList.contains('show')) {
          loadMessages();
        }
      });
    }

    // Mark all notifications as read
    const markAllBtn = document.getElementById('markAllNotificationsRead');
    if (markAllBtn) {
      markAllBtn.addEventListener('click', markAllNotificationsRead);
    }

    // Close dropdowns when clicking outside
    document.addEventListener('click', function (e) {
      const dropdowns = document.querySelectorAll('.header-dropdown-menu');
      dropdowns.forEach(dropdown => {
        if (!dropdown.closest('.header-dropdown').contains(e.target)) {
          closeDropdown(dropdown);
        }
      });
    });
  }

  /**
   * Toggle dropdown visibility
   */
  function toggleDropdown(dropdown) {
    if (activeDropdown && activeDropdown !== dropdown) {
      closeDropdown(activeDropdown);
    }

    if (dropdown.classList.contains('show')) {
      closeDropdown(dropdown);
    } else {
      openDropdown(dropdown);
    }
  }

  /**
   * Open dropdown
   */
  function openDropdown(dropdown) {
    dropdown.classList.add('show');
    activeDropdown = dropdown;
  }

  /**
   * Close dropdown
   */
  function closeDropdown(dropdown) {
    dropdown.classList.remove('show');
    if (activeDropdown === dropdown) {
      activeDropdown = null;
    }
  }

  /**
   * Load notifications from API
   */
  async function loadNotifications() {
    const notificationsList = document.getElementById('notificationsList');
    if (!notificationsList) return;

    try {
      const response = await fetch(CONFIG.notificationsEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error('Failed to load notifications');
      }

      const data = await response.json();

      if (data.success) {
        renderNotifications(data.notifications || []);
        updateNotificationBadge(data.unread_count || 0);
      } else {
        showError(notificationsList, data.message || 'Failed to load notifications');
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      showError(notificationsList, 'Unable to load notifications');
    }
  }

  /**
   * Render notifications list
   */
  function renderNotifications(notifications) {
    const notificationsList = document.getElementById('notificationsList');
    if (!notificationsList) return;

    if (notifications.length === 0) {
      notificationsList.innerHTML = '<div class="empty-state">No notifications</div>';
      return;
    }

    notificationsList.innerHTML = notifications
      .map(
        notification => `
            <div class="notification-item ${notification.is_read == 0 ? 'unread' : ''}" 
                 data-id="${notification.id}">
                <div class="notification-header">
                    <div class="notification-title">${escapeHtml(notification.title)}</div>
                    <div class="notification-time">${formatTime(notification.created_at)}</div>
                </div>
                <div class="notification-body">${escapeHtml(notification.message)}</div>
            </div>
        `
      )
      .join('');

    // Add click handlers to mark as read
    notificationsList.querySelectorAll('.notification-item').forEach(item => {
      item.addEventListener('click', function () {
        markNotificationRead(this.dataset.id);
      });
    });
  }

  /**
   * Load messages from API
   */
  async function loadMessages() {
    const messagesList = document.getElementById('messagesList');
    if (!messagesList) return;

    try {
      const response = await fetch(CONFIG.messagesEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error('Failed to load messages');
      }

      const data = await response.json();

      if (data.success) {
        renderMessages(data.messages || []);
        updateMessageBadge(data.unread_count || 0);
      } else {
        if (data.debug) {
          console.error('Messages API Error:', data.debug);
          console.error('Stack trace:', data.trace);
        }
        showError(messagesList, data.message || 'Failed to load messages');
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      showError(messagesList, 'Unable to load messages');
    }
  }

  /**
   * Render messages list
   */
  function renderMessages(messages) {
    const messagesList = document.getElementById('messagesList');
    if (!messagesList) return;

    if (messages.length === 0) {
      messagesList.innerHTML = '<div class="empty-state">No messages</div>';
      return;
    }

    messagesList.innerHTML = messages
      .map(
        message => `
            <div class="message-item ${message.is_read == 0 ? 'unread' : ''}" 
                 data-id="${message.id}">
                <div class="message-header">
                    <div class="message-sender">${escapeHtml(message.sender_name)}</div>
                    <div class="message-time">${formatTime(message.created_at)}</div>
                </div>
                <div class="message-preview">${escapeHtml(message.message)}</div>
            </div>
        `
      )
      .join('');

    // Add click handlers
    messagesList.querySelectorAll('.message-item').forEach(item => {
      item.addEventListener('click', function () {
        markMessageRead(this.dataset.id);
        // Navigate to messages tab
        const messagesTab = document.querySelector('[data-tab="messages"]');
        if (messagesTab) {
          messagesTab.click();
        }
      });
    });
  }

  /**
   * Mark notification as read
   */
  async function markNotificationRead(notificationId) {
    try {
      const response = await fetch(CONFIG.notificationsEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          action: 'mark_read',
          notification_id: notificationId,
        }),
      });

      if (response.ok) {
        loadNotifications(); // Reload to update UI
      }
    } catch {
      // Error already logged by loadNotifications
      loadNotifications(); // Try to reload anyway
    }
  }

  /**
   * Mark all notifications as read
   */
  async function markAllNotificationsRead() {
    try {
      const response = await fetch(CONFIG.notificationsEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          action: 'mark_all_read',
        }),
      });

      if (response.ok) {
        loadNotifications(); // Reload to update UI
      }
    } catch {
      // Error already logged by loadNotifications
      loadNotifications(); // Try to reload anyway
    }
  }

  /**
   * Mark message as read
   */
  async function markMessageRead(messageId) {
    try {
      const response = await fetch(CONFIG.messagesEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          action: 'mark_read',
          message_id: messageId,
        }),
      });

      if (response.ok) {
        loadMessages(); // Reload to update UI
      }
    } catch {
      // Error already logged by loadMessages
      loadMessages(); // Try to reload anyway
    }
  }

  /**
   * Update badge count for a dropdown button
   * @param {string} buttonId - ID of the dropdown button
   * @param {number} count - Badge count to display
   */
  function updateBadgeCount(buttonId, count) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;

    let badge = btn.querySelector('.badge-count');

    if (count > 0) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'badge-count';
        btn.appendChild(badge);
      }
      badge.textContent = count > 99 ? '99+' : count;
    } else if (badge) {
      badge.remove();
    }
  }

  /**
   * Update notification badge
   */
  function updateNotificationBadge(count) {
    updateBadgeCount('notificationsDropdownBtn', count);
  }

  /**
   * Update message badge
   */
  function updateMessageBadge(count) {
    updateBadgeCount('messagesDropdownBtn', count);
  }

  /**
   * Start periodic updates
   */
  function startPeriodicUpdates() {
    updateTimer = setInterval(() => {
      loadNotifications();
      loadMessages();
    }, CONFIG.updateInterval);
  }

  /**
   * Setup logout handler
   */
  function setupLogoutHandler() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (confirm('Are you sure you want to logout?')) {
          window.location.href = this.href;
        }
      });
    }
  }

  /**
   * Format time ago
   */
  function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

    return date.toLocaleDateString();
  }

  /**
   * Escape HTML
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Show error message
   */
  function showError(container, message) {
    container.innerHTML = `<div class="empty-state">${escapeHtml(message)}</div>`;
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (updateTimer) {
      clearInterval(updateTimer);
    }
  });
})();
