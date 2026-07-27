/**
 * Dashboard User Management Module
 * Centralized user management functionality for admin dashboard
 *
 * Dependencies: dashboard-core.js, dashboard-utils.js
 */

class DashboardUserManagement {
  constructor() {
    this.currentUserId = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.initializeModals();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Global event delegation for user actions
    document.addEventListener('click', e => {
      if (e.target.matches('[data-action="view-user"]')) {
        const userId = e.target.dataset.userId;
        this.viewUser(userId);
      } else if (e.target.matches('[data-action="contact-user"]')) {
        const userId = e.target.dataset.userId;
        this.contactUser(userId);
      } else if (e.target.matches('[data-action="edit-user"]')) {
        const userId = e.target.dataset.userId;
        this.editUser(userId);
      } else if (e.target.matches('[data-action="delete-user"]')) {
        const userId = e.target.dataset.userId;
        this.deleteUser(userId);
      }
    });

    // Modal form submissions
    document.addEventListener('submit', e => {
      if (e.target.matches('#contactUserForm')) {
        e.preventDefault();
        this.sendContactMessage();
      } else if (e.target.matches('#editUserForm')) {
        e.preventDefault();
        this.saveUserChanges();
      }
    });
  }

  /**
   * Initialize modals
   */
  initializeModals() {
    // Create modals if they don't exist
    this.createViewUserModal();
    this.createContactUserModal();
    this.createEditUserModal();
  }

  /**
   * View user details
   */
  viewUser(id) {
    this.currentUserId = id;
    this.loadUserDetails(id);

    const modal = new bootstrap.Modal(document.getElementById('viewUserModal'));
    modal.show();
  }

  /**
   * Load user details
   */
  async loadUserDetails(id) {
    try {
      const response = await fetch(`/admin/api/user-details.php?id=${id}`);
      const data = await response.json();

      if (data.success) {
        this.populateUserDetails(data.user);
      } else {
        this.showError(data.message || 'Failed to load user details');
      }
    } catch (error) {
      console.error('Error loading user details:', error);
      this.showError('Error loading user details');
    }
  }

  /**
   * Populate user details in modal
   */
  populateUserDetails(user) {
    const modal = document.getElementById('viewUserModal');
    if (!modal) {
      return;
    }

    // Update modal content
    modal.querySelector('#userName').textContent = user.name || 'Unknown User';
    modal.querySelector('#userEmail').textContent = user.email || 'No email';
    modal.querySelector('#userCountry').textContent = user.country || 'Not specified';
    modal.querySelector('#userStatus').textContent = user.status || 'Unknown';
    modal.querySelector('#userDate').textContent = user.created_at
      ? new Date(user.created_at).toLocaleDateString()
      : 'Unknown';
    modal.querySelector('#userId').textContent = user.id || 'Unknown';
  }

  /**
   * Contact user
   */
  contactUser(id) {
    this.currentUserId = id;

    // Get user name for message
    const row = document.querySelector(`tr[data - id = "${id}"]`);
    const name = row
      ? row.querySelector('.name-text') && row.querySelector('.name-text').textContent
      : 'User';

    // Pre-fill message
    const messageField = document.getElementById('contactMessage');
    if (messageField) {
      messageField.value = `Hello ${name},\n\nThank you for registering with WCTFE! We're excited to have you on board.\n\nBest regards,\nThe WCTFE Team`;
    }

    const modal = new bootstrap.Modal(document.getElementById('contactUserModal'));
    modal.show();
  }

  /**
   * Send contact message
   */
  async sendContactMessage() {
    const message = document.getElementById('contactMessage').value;
    const subject = document.getElementById('contactSubject').value;

    if (!message.trim()) {
      this.showError('Please enter a message');
      return;
    }

    try {
      const response = await fetch('/admin/api/send-contact-message.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: this.currentUserId,
          subject: subject,
          message: message,
        }),
      });

      const data = await response.json();

      if (data.success) {
        this.showSuccess('Message sent successfully');
        bootstrap.Modal.getInstance(document.getElementById('contactUserModal')).hide();
      } else {
        this.showError(data.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      this.showError('Error sending message');
    }
  }

  /**
   * Edit user
   */
  editUser(id) {
    this.currentUserId = id;
    this.loadUserForEdit(id);

    const modal = new bootstrap.Modal(document.getElementById('editUserModal'));
    modal.show();
  }

  /**
   * Load user data for editing
   */
  async loadUserForEdit(id) {
    try {
      const response = await fetch(`/admin/api/user-details.php?id=${id}`);
      const data = await response.json();

      if (data.success) {
        this.populateEditForm(data.user);
      } else {
        this.showError(data.message || 'Failed to load user data');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      this.showError('Error loading user data');
    }
  }

  /**
   * Populate edit form
   */
  populateEditForm(user) {
    document.getElementById('editUserName').value = user.name || '';
    document.getElementById('editUserEmail').value = user.email || '';
    document.getElementById('editUserCountry').value = user.country || '';
    document.getElementById('editUserStatus').value = user.status || 'active';
  }

  /**
   * Save user changes
   */
  async saveUserChanges() {
    const formData = {
      id: this.currentUserId,
      name: document.getElementById('editUserName').value,
      email: document.getElementById('editUserEmail').value,
      country: document.getElementById('editUserCountry').value,
      status: document.getElementById('editUserStatus').value,
    };

    try {
      const response = await fetch('/admin/api/update-user.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        this.showSuccess('User updated successfully');
        bootstrap.Modal.getInstance(document.getElementById('editUserModal')).hide();
        // Refresh the table if it exists
        this.refreshUserTable();
      } else {
        this.showError(data.message || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      this.showError('Error updating user');
    }
  }

  /**
   * Delete user
   */
  deleteUser(id) {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      this.performDelete(id);
    }
  }

  /**
   * Perform user deletion
   */
  async performDelete(id) {
    try {
      const response = await fetch('/admin/api/delete-user.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: id }),
      });

      const data = await response.json();

      if (data.success) {
        this.showSuccess('User deleted successfully');
        // Remove row from table
        const row = document.querySelector(`tr[data - id = "${id}"]`);
        if (row) {
          row.remove();
        }
      } else {
        this.showError(data.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      this.showError('Error deleting user');
    }
  }

  /**
   * Refresh user table
   */
  refreshUserTable() {
    // Trigger table refresh if using AJAX
    const refreshBtn = document.querySelector('[data-action="refresh-table"]');
    if (refreshBtn) {
      refreshBtn.click();
    }
  }

  /**
   * Create view user modal
   */
  createViewUserModal() {
    if (document.getElementById('viewUserModal')) {
      return;
    }

    // Prefer server-rendered template if available via helper
    let tpl = '';
    if (typeof window.getAdminTemplate === 'function') {
      tpl = window.getAdminTemplate('profile') || '';
    }

    // If no server template, create a minimal accessible modal markup (safe fallback)
    if (!tpl) {
      tpl = `
                <div class="modal fade" id="viewUserModal" tabindex="-1">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">User Details</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div id="viewUserContent" class="p-2 text-muted">Loading...</div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                <button type="button" class="btn btn-primary" data-action="contact-user" data-user-id="">Contact User</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
    }

    document.body.insertAdjacentHTML('beforeend', tpl);
  }

  /**
   * Create contact user modal
   */
  createContactUserModal() {
    // ensure profile/template exists (it contains contact modal in server templates)
    if (document.getElementById('contactUserModal')) {
      return;
    }

    // Reuse profile template insertion (profile template usually includes contact modal)
    this.createViewUserModal();
  }

  /**
   * Create edit user modal
   */
  createEditUserModal() {
    if (document.getElementById('editUserModal')) {
      return;
    }

    // Ensure profile template contains edit modal; reuse insertion
    this.createViewUserModal();
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    if (window.dashboard && window.dashboard.showSuccess) {
      window.dashboard.showSuccess(message);
    } else {
      alert(message);
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    if (window.dashboard && window.dashboard.showError) {
      window.dashboard.showError(message);
    } else {
      alert(message);
    }
  }
}

// Initialize user management when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.dashboardUserManagement = new DashboardUserManagement();
});
