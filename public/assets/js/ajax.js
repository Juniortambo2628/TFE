import apiClient from './shared/http-utils.js';
import { showToast, showError } from './shared/ui-utils.js';
import { formatDate } from './shared/date-utils.js';

/**
 * AJAX Handler for Tena Waitlist System
 * Handles real-time updates and AJAX requests
 */

class TenaAjax {
  constructor() {
    // More reliable URL construction
    this.baseUrl = this.getBaseUrl();
    this.apiUrl = '/api/ajax_handler.php'; // apiClient handles baseURL if configured, but here we might need specific path
    this.lastCheck = Math.floor(Date.now() / 1000);
    this.updateInterval = null;
    this.init();
  }

  getBaseUrl() {
    // Get the base URL more reliably
    const currentPath = window.location.pathname;
    const isAdminPage = currentPath.includes('/admin/');

    if (isAdminPage) {
      // If we're in admin directory, go up one level
      return window.location.origin + currentPath.replace(/\/admin\/.*$/, '');
    } else {
      // If we're in root directory, use current path
      return window.location.origin + currentPath.replace(/\/[^\/]*$/, '');
    }
  }

  init() {
    this.bindEvents();

    // Only start real-time updates if we're on a dashboard page
    if (this.isDashboardPage()) {
      this.startRealtimeUpdates();
    }
  }

  isDashboardPage() {
    const currentPath = window.location.pathname;
    return (
      currentPath.includes('dashboard.php') ||
      currentPath.includes('admin/') ||
      currentPath.includes('users.php') ||
      currentPath.includes('analytics.php')
    );
  }

  startRealtimeUpdates() {
    // Check for updates every 30 seconds
    this.updateInterval = setInterval(() => {
      this.checkRealtimeUpdates();
    }, 30000);

    // Initial check
    this.checkRealtimeUpdates();
  }

  stopRealtimeUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  // Public method to stop updates
  stopUpdates() {
    this.stopRealtimeUpdates();
  }

  async checkRealtimeUpdates() {
    try {
      const response = await this.makeRequest('realtime_updates', {
        last_check: this.lastCheck,
      });

      if (response && response.success) {
        this.handleRealtimeUpdates(response.data);
        this.lastCheck = response.data.timestamp;
      }
    } catch (error) {
      console.error('Realtime update error:', error);

      // If it's an authentication error, stop the updates
      if (error.response && (error.response.status === 401 || error.message.includes('Authentication'))) {
        this.stopRealtimeUpdates();
      }
    }
  }

  handleRealtimeUpdates(data) {
    // Update notification count in header
    this.updateNotificationCount(data.unread_count);

    // Show new notifications
    if (data.notifications && data.notifications.length > 0) {
      data.notifications.forEach(notification => {
        this.showNotification(notification);
      });
    }
  }

  updateNotificationCount(count) {
    const badge = document.querySelector('.notification-badge');
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline' : 'none';
    }
  }

  showNotification(notification) {
      // Use shared toast utility
      const type = notification.type === 'error' ? 'error' : 'success';
      showToast(notification.title + ': ' + notification.message, type);
  }

  async makeRequest(action, data = {}) {
    const formData = new FormData();
    formData.append('action', action);

    // Add data to form
    Object.keys(data).forEach(key => {
      if (typeof data[key] === 'object') {
        formData.append(key, JSON.stringify(data[key]));
      } else {
        formData.append(key, data[key]);
      }
    });

    try {
      // Use apiClient (axios) instead of fetch
      // Note: apiClient is configured with baseURL '/api', but existing code uses absolute path or relative to page
      // We'll use the full path logic from existing code but via axios
      
      // Since we are sending FormData, axios handles Content-Type automatically
      const response = await apiClient.post(this.apiUrl, formData);
      
      // Axios response.data is already parsed JSON
      return response;

    } catch (error) {
      console.error('AJAX request failed:', error);

      if (error.response) {
          if (error.response.status === 401) {
              console.warn('Authentication required. Redirecting to login...');
              window.location.href = this.getBaseUrl() + '/auth/login.php';
              return { success: false, message: 'Authentication required' };
          }
          if (error.response.status === 404) {
               // Handle 404 logic similar to before if needed, or just let it fail
               console.warn(`API endpoint not found: ${this.apiUrl} (action = ${action})`);
               if (action === 'get_stats') {
                   // Fallback logic could go here if really needed
               }
               return { success: false, message: 'Endpoint not available' };
          }
      }

      // Show user-friendly error message for network issues
      if (!error.response) {
        showError('Connection Error', 'Unable to connect to the server. Please check your internet connection and try again.');
      }

      throw error;
    }
  }

  // Public methods for different actions
  async getNotifications(limit = 20, unreadOnly = false) {
    return await this.makeRequest('get_notifications', {
      limit: limit,
      unread_only: unreadOnly,
    });
  }

  async markNotificationRead(notificationId) {
    return await this.makeRequest('mark_notification_read', {
      notification_id: notificationId,
    });
  }

  async markAllRead() {
    return await this.makeRequest('mark_all_read');
  }

  async getStats() {
    return await this.makeRequest('get_stats');
  }

  async getRegistrations(filters = {}) {
    return await this.makeRequest('get_registrations', filters);
  }

  async updateRegistration(registrationId, field, value) {
    return await this.makeRequest('update_registration', {
      registration_id: registrationId,
      field: field,
      value: value,
    });
  }

  async getAnalytics(dateFrom, dateTo) {
    return await this.makeRequest('get_analytics', {
      date_from: dateFrom,
      date_to: dateTo,
    });
  }

  async exportData(format, filters = {}) {
    return await this.makeRequest('export_data', {
      format: format,
      filters: filters,
    });
  }

  bindEvents() {
    // Bind notification events
    document.addEventListener('click', e => {
      if (e.target.classList.contains('mark-read')) {
        const notificationId = e.target.dataset.notificationId;
        this.markNotificationRead(notificationId).then(() => {
          e.target.closest('.notification-item').remove();
        });
      }

      if (e.target.classList.contains('mark-all-read')) {
        this.markAllRead().then(() => {
          document.querySelectorAll('.notification-item').forEach(item => {
            item.remove();
          });
        });
      }
    });

    // Bind form submissions for AJAX
    document.addEventListener('submit', e => {
      if (e.target.classList.contains('ajax-form')) {
        e.preventDefault();
        this.handleFormSubmission(e.target);
      }
    });
  }

  async handleFormSubmission(form) {
    const formData = new FormData(form);
    const action = form.dataset.action;

    try {
      const response = await this.makeRequest(action, Object.fromEntries(formData));

      if (response.success) {
        showToast(response.message || 'Operation completed successfully', 'success');

        // Trigger custom event
        form.dispatchEvent(new CustomEvent('ajax-success', { detail: response }));
      } else {
        showToast(response.message || 'Operation failed', 'error');
      }
    } catch {
      showToast('Network error occurred', 'error');
    }
  }

  // Utility method to update stats cards
  async updateStatsCards() {
    try {
      const response = await this.getStats();
      if (response.success) {
        this.updateStatsDisplay(response.data);
      }
    } catch (error) {
      console.error('Failed to update stats:', error);
    }
  }

  updateStatsDisplay(stats) {
    // Update total registrations
    const totalEl = document.querySelector('[data-stat="total_registrations"]');
    if (totalEl) {
      totalEl.textContent = stats.total_registrations || 0;
    }

    // Update today's registrations
    const todayEl = document.querySelector('[data-stat="today_registrations"]');
    if (todayEl) {
      todayEl.textContent = stats.today_registrations || 0;
    }

    // Update week registrations
    const weekEl = document.querySelector('[data-stat="week_registrations"]');
    if (weekEl) {
      weekEl.textContent = stats.week_registrations || 0;
    }

    // Update vacation rentals
    const vacationEl = document.querySelector('[data-stat="vacation_rentals"]');
    if (vacationEl) {
      vacationEl.textContent = stats.vacation_rentals || 0;
    }
  }

  // Method to refresh data tables
  async refreshDataTable(tableId, filters = {}) {
    try {
      const response = await this.getRegistrations(filters);
      if (response.success) {
        this.updateDataTable(tableId, response.data.registrations);
      }
    } catch (error) {
      console.error('Failed to refresh data table:', error);
    }
  }

  updateDataTable(tableId, data) {
    const table = document.getElementById(tableId);
    if (!table) {
      return;
    }

    const tbody = table.querySelector('tbody');
    if (!tbody) {
      return;
    }

    // Clear existing rows
    tbody.innerHTML = '';

    // Add new rows
    data.forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = this.buildTableRow(row);
      tbody.appendChild(tr);
    });
  }

  buildTableRow(data) {
    return `
            <td>${data.id}</td>
            <td><strong>${data.first_name} ${data.last_name}</strong></td>
            <td><a href="mailto:${data.email}" class="text-decoration-none">${data.email}</a></td>
            <td><span class="badge bg-secondary">${this.formatPropertyType(data.property_type)}</span></td>
            <td>${data.location || 'N/A'}</td>
            <td>${data.phone || 'N/A'}</td>
            <td><span class="badge ${this.getStatusClass(data.status)}">${this.formatStatus(data.status)}</span></td>
            <td>${formatDate(data.created_at)}</td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="viewUser(${data.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-outline-secondary" onclick="editUser(${data.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </td>
        `;
  }

  formatPropertyType(type) {
    const types = {
      vacation_rental: 'Vacation Rental',
      hotel: 'Hotel',
      'b&b': 'B&B',
      other: 'Other',
    };
    return types[type] || 'Unknown';
  }

  formatStatus(status) {
    const statuses = {
      active: 'Active',
      inactive: 'Inactive',
      converted: 'Converted',
    };
    return statuses[status] || 'Unknown';
  }

  getStatusClass(status) {
    const classes = {
      active: 'bg-success',
      inactive: 'bg-warning',
      converted: 'bg-primary',
    };
    return classes[status] || 'bg-secondary';
  }

  // getNotifications, markNotificationAsRead, markAllNotificationsAsRead, getStats, exportData methods are redundant if they just call makeRequest with same args, but keeping for compatibility if they were used differently.
  // Actually, I already defined them above. I'll remove the duplicates at the end of the file.
  
  async markNotificationAsRead(notificationId) {
      return this.markNotificationRead(notificationId);
  }
  
  async markAllNotificationsAsRead() {
      return this.markAllRead();
  }

}

// Initialize AJAX handler when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
  window.tenaAjax = new TenaAjax();
});

// Global functions for backward compatibility
// These may be called from HTML onclick handlers
// eslint-disable-next-line no-unused-vars
window.exportData = function(format) {
  if (window.tenaAjax) {
    window.tenaAjax.exportData(format);
  }
};

// eslint-disable-next-line no-unused-vars
window.refreshStats = function() {
  if (window.tenaAjax) {
    window.tenaAjax.updateStatsCards();
  }
};

// eslint-disable-next-line no-unused-vars
window.refreshTable = function(tableId, filters = {}) {
  if (window.tenaAjax) {
    window.tenaAjax.refreshDataTable(tableId, filters);
  }
};
