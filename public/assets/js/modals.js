/**
 * Messages and Notifications Modal System
 * Handles dedicated modal dialogs for messages and notifications
 */

(function () {
  'use strict';

  const BASE_URL = (window.APP_BASE_URL || '/TFE').replace(/\/$/, '') + '/';
  const MESSAGES_API = BASE_URL + 'api/messages.php';
  const NOTIFICATIONS_API = BASE_URL + 'api/notifications.php';
  const PROFILE_API = BASE_URL + 'api/profile.php';

  // Pagination settings
  const ITEMS_PER_PAGE = 10;
  let currentNotificationsPage = 1;
  // currentMessagesPage removed - page parameter is used directly in loadMessagesModal

  // Helper to make API calls - use shared utility if available
  async function fetchAPI(url) {
    if (window.fetchAPI && typeof window.fetchAPI === 'function') {
      return window.fetchAPI(url, BASE_URL);
    }
    // Fallback implementation
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (error) {
      console.error('API fetch error:', error);
      return { success: false, error: error.message };
    }
  }

  // Create modal container
  function createModalContainer(id, title) {
    const modal = document.createElement('div');
    modal.className = 'app-modal';
    modal.id = id;
    modal.innerHTML = `
            <div class="app-modal-overlay"></div>
            <div class="app-modal-container">
                <div class="app-modal-header">
                    <h2>${title}</h2>
                    <button class="app-modal-close" aria-label="Close">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="app-modal-body"></div>
            </div>
        `;
    document.body.appendChild(modal);
    return modal;
  }

  // Open modal
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  // Close modal
  window.closeModal = function (modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  };

  // Close all modals
  function closeAllModals() {
    document.querySelectorAll('.app-modal.active').forEach(modal => {
      modal.classList.remove('active');
    });
    document.body.style.overflow = '';
  }

  // ==================== MESSAGES MODAL ====================

  async function loadMessagesModal(page = 1) {

    const modal =
      document.getElementById('messagesModal') || createModalContainer('messagesModal', 'Messages');
    const body = modal.querySelector('.app-modal-body');

    body.innerHTML = '<div class="loading">Loading messages...</div>';
    openModal('messagesModal');

    const data = await fetchAPI(MESSAGES_API);

    if (data.success && data.messages) {
      const messages = data.messages;
      const totalPages = Math.ceil(messages.length / ITEMS_PER_PAGE);
      const start = (page - 1) * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE;
      const pageMessages = messages.slice(start, end);

      let html = '<div class="messages-container">';

      // Add conversation starter
      html += `
                <div class="message-conversation-starter">
                    <div class="conversation-starter-header">
                        <h4>Start a Conversation</h4>
                    </div>
                    <input type="text" id="userSearchInput" class="user-search-input" 
                           placeholder="Search for users to message..." 
                           oninput="searchUsersForConversation(this.value)">
                    <div id="userSuggestions" class="user-suggestions"></div>
                </div>
            `;

      if (pageMessages.length === 0) {
        html += '<div class="empty-state">No messages yet. Start a conversation above!</div>';
      } else {
        html += '<div class="messages-list">';
        pageMessages.forEach(msg => {
          const timeAgo = getTimeAgo(new Date(msg.created_at));
          html += `
                        <div class="message-item" data-message-id="${msg.id}">
                            <div class="message-avatar">
                                <div class="avatar-circle">${(msg.sender_name || 'U').charAt(0)}</div>
                            </div>
                            <div class="message-content">
                                <div class="message-header">
                                    <span class="message-sender">${msg.sender_name || 'Unknown'}</span>
                                    <span class="message-time">${timeAgo}</span>
                                </div>
                                <div class="message-text">${msg.content || 'No content'}</div>
                            </div>
                        </div>
                    `;
        });
        html += '</div>';

        // Add pagination
        if (totalPages > 1) {
          html += '<div class="modal-pagination">';
          if (page > 1) {
            html += `<button class="btn btn--stroke" onclick="window.loadMessagesPage(${page - 1})">Previous</button>`;
          }
          html += `<span class="page-info">Page ${page} of ${totalPages}</span>`;
          if (page < totalPages) {
            html += `<button class="btn btn--stroke" onclick="window.loadMessagesPage(${page + 1})">Next</button>`;
          }
          html += '</div>';
        }
      }

      html += '</div>';
      body.innerHTML = html;
    } else {
      body.innerHTML = '<div class="error-message">Failed to load messages</div>';
    }
  }

  // ==================== NOTIFICATIONS MODAL ====================

  async function loadNotificationsModal(page = 1) {
    currentNotificationsPage = page;

    const modal =
      document.getElementById('notificationsModal') ||
      createModalContainer('notificationsModal', 'Notifications');
    const body = modal.querySelector('.app-modal-body');

    body.innerHTML = '<div class="loading">Loading notifications...</div>';
    openModal('notificationsModal');

    const data = await fetchAPI(NOTIFICATIONS_API);

    if (data.success && data.notifications) {
      const notifications = data.notifications;
      const totalPages = Math.ceil(notifications.length / ITEMS_PER_PAGE);
      const start = (page - 1) * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE;
      const pageNotifications = notifications.slice(start, end);

      let html = '<div class="notifications-container">';

      // Mark all as read button
      html += '<div class="notifications-actions">';
      html +=
        '<button class="btn btn--stroke" onclick="window.markAllNotificationsRead()">Mark All as Read</button>';
      html += '</div>';

      if (pageNotifications.length === 0) {
        html += '<div class="empty-state">No notifications</div>';
      } else {
        html += '<div class="notifications-list">';
        pageNotifications.forEach(notif => {
          const timeAgo = getTimeAgo(new Date(notif.created_at));
          const unreadClass = notif.is_read == 0 ? 'unread' : '';
          html += `
                        <div class="notification-item ${unreadClass}" data-notification-id="${notif.id}">
                            <div class="notification-icon">
                                ${getNotificationIcon(notif.type)}
                            </div>
                            <div class="notification-content">
                                <div class="notification-title">${notif.title || 'Notification'}</div>
                                <div class="notification-message">${notif.message || ''}</div>
                                <div class="notification-time">${timeAgo}</div>
                            </div>
                            ${notif.is_read == 0 ? `<button class="mark-read-btn" onclick="window.markNotificationRead(${notif.id})">Mark as read</button>` : ''}
                        </div>
                    `;
        });
        html += '</div>';

        // Add pagination
        if (totalPages > 1) {
          html += '<div class="modal-pagination">';
          if (page > 1) {
            html += `<button class="btn btn--stroke" onclick="window.loadNotificationsPage(${page - 1})">Previous</button>`;
          }
          html += `<span class="page-info">Page ${page} of ${totalPages}</span>`;
          if (page < totalPages) {
            html += `<button class="btn btn--stroke" onclick="window.loadNotificationsPage(${page + 1})">Next</button>`;
          }
          html += '</div>';
        }
      }

      html += '</div>';
      body.innerHTML = html;
    } else {
      body.innerHTML = '<div class="error-message">Failed to load notifications</div>';
    }
  }

  // ==================== PROFILE MODAL ====================

  async function loadProfileModal() {
    const modal =
      document.getElementById('profileModal') ||
      createModalContainer('profileModal', 'Profile Settings');
    const body = modal.querySelector('.app-modal-body');

    body.innerHTML = '<div class="loading">Loading profile...</div>';
    openModal('profileModal');

    await fetchAPI(PROFILE_API); // Fetch profile but use initial data
    const userData = window.__INITIAL_PROFILE || {};

    let html = `
            <div class="profile-modal-content">
                <div class="modal-tabs">
                    <button class="modal-tab active" data-tab="personal">Personal Info</button>
                    <button class="modal-tab" data-tab="avatar">Avatar & Wallpaper</button>
                    <button class="modal-tab" data-tab="preferences">Preferences</button>
                </div>
                
                <div class="modal-tab-content">
                    <!-- Personal Info Tab -->
                    <div class="tab-panel active" data-panel="personal">
                        <form id="personalInfoForm" class="profile-form">
                            <div class="form-group">
                                <label>First Name</label>
                                <input type="text" name="first_name" value="${userData.first_name || ''}" required>
                            </div>
                            <div class="form-group">
                                <label>Last Name</label>
                                <input type="text" name="last_name" value="${userData.last_name || ''}" required>
                            </div>
                            <div class="form-group">
                                <label>Email</label>
                                <input type="email" name="email" value="${userData.email || ''}" required>
                            </div>
                            <div class="form-group">
                                <label>Country</label>
                                <input type="text" name="country" value="${userData.country || ''}">
                            </div>
                            <div class="form-group">
                                <label>Phone</label>
                                <input type="tel" name="phone" value="${userData.phone || ''}">
                            </div>
                            <div class="form-group">
                                <label>Team Support</label>
                                <input type="text" name="team_support" value="${userData.team_support || ''}">
                            </div>
                            <button type="submit" class="btn btn--stroke read-more-btn">Save Profile</button>
                        </form>
                    </div>
                    
                    <!-- Avatar & Wallpaper Tab -->
                    <div class="tab-panel" data-panel="avatar">
                        <div class="avatar-section">
                            <h3>Avatar</h3>
                            <div class="avatar-actions">
                                <button class="btn btn--stroke read-more-btn" onclick="window.openAvatarUpload()">Upload Avatar</button>
                                <button class="btn btn--stroke read-more-btn" onclick="window.openAvatarCreator()">Create Avatar</button>
                            </div>
                        </div>
                        
                        <div class="wallpaper-section">
                            <h3>Profile Wallpaper</h3>
                            <div class="wallpaper-options" id="wallpaperOptions">
                                <!-- Wallpaper options will be inserted here -->
                            </div>
                        </div>
                    </div>
                    
                    <!-- Preferences Tab -->
                    <div class="tab-panel" data-panel="preferences">
                        <form id="preferencesForm" class="profile-form">
                            <div class="form-group">
                                <label>
                                    <input type="checkbox" name="marketing_consent" ${userData.marketing_consent ? 'checked' : ''}>
                                    Receive marketing emails
                                </label>
                            </div>
                            <div class="form-group">
                                <label>
                                    <input type="checkbox" name="notifications_enabled" checked>
                                    Enable notifications
                                </label>
                            </div>
                            <button type="submit" class="btn btn--stroke read-more-btn">Save Preferences</button>
                        </form>
                    </div>
                </div>
            </div>
        `;

    body.innerHTML = html;

    // Initialize tab switching
    initModalTabs();
    loadWallpaperOptions();

    // Add form submit handler for personal info
    const personalInfoForm = document.getElementById('personalInfoForm');
    if (personalInfoForm) {
      personalInfoForm.addEventListener('submit', async e => {
        e.preventDefault();
        const formData = new FormData(personalInfoForm);
        const data = Object.fromEntries(formData.entries());

        try {
          const response = await fetch(PROFILE_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              action: 'update_personal_info',
              ...data,
            }),
          });

          const result = await response.json();
          if (result.success) {
            alert('Profile updated successfully!');
            // Reload profile data
            if (window.loadProfile && typeof window.loadProfile === 'function') {
              window.loadProfile();
            }
          } else {
            alert(result.message || 'Failed to update profile');
          }
        } catch (error) {
          console.error('Profile update error:', error);
          alert('An error occurred while updating your profile');
        }
      });
    }
  }

  // ==================== SETTINGS MODAL ====================

  function loadSettingsModal() {
    const modal =
      document.getElementById('settingsModal') || createModalContainer('settingsModal', 'Settings');
    const body = modal.querySelector('.app-modal-body');

    openModal('settingsModal');

    let html = `
            <div class="settings-modal-content">
                <div class="modal-tabs">
                    <button class="modal-tab active" data-tab="account">Account</button>
                    <button class="modal-tab" data-tab="privacy">Privacy</button>
                    <button class="modal-tab" data-tab="notifications">Notifications</button>
                </div>
                
                <div class="modal-tab-content">
                    <!-- Account Tab -->
                    <div class="tab-panel active" data-panel="account">
                        <h3>Account Settings</h3>
                        <div class="settings-section">
                            <button class="btn btn--stroke read-more-btn">Change Password</button>
                            <button class="btn btn--stroke read-more-btn">Download My Data</button>
                            <button class="btn btn--stroke read-more-btn" style="color: #f44336;">Delete Account</button>
                        </div>
                    </div>
                    
                    <!-- Privacy Tab -->
                    <div class="tab-panel" data-panel="privacy">
                        <h3>Privacy Settings</h3>
                        <form class="profile-form">
                            <div class="form-group">
                                <label>
                                    <input type="checkbox" checked>
                                    Show profile to other fans
                                </label>
                            </div>
                            <div class="form-group">
                                <label>
                                    <input type="checkbox" checked>
                                    Allow messages from other fans
                                </label>
                            </div>
                            <button type="submit" class="btn btn--stroke read-more-btn">Save Changes</button>
                        </form>
                    </div>
                    
                    <!-- Notifications Tab -->
                    <div class="tab-panel" data-panel="notifications">
                        <h3>Notification Preferences</h3>
                        <form class="profile-form">
                            <div class="form-group">
                                <label>
                                    <input type="checkbox" checked>
                                    Email notifications
                                </label>
                            </div>
                            <div class="form-group">
                                <label>
                                    <input type="checkbox" checked>
                                    Payment reminders
                                </label>
                            </div>
                            <div class="form-group">
                                <label>
                                    <input type="checkbox" checked>
                                    Event updates
                                </label>
                            </div>
                            <button type="submit" class="btn btn--stroke read-more-btn">Save Changes</button>
                        </form>
                    </div>
                </div>
            </div>
        `;

    body.innerHTML = html;
    initModalTabs();
  }

  // ==================== HELPERS ====================

  function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';

    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';

    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';

    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';

    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';

    return 'Just now';
  }

  function getNotificationIcon(type) {
    const icons = {
      financing:
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
      payment:
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>',
      event:
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
      default:
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>',
    };
    return icons[type] || icons.default;
  }

  function initModalTabs() {
    document.querySelectorAll('.modal-tab').forEach(tab => {
      tab.addEventListener('click', function () {
        const tabName = this.dataset.tab;

        // Remove active class from all tabs and panels
        this.parentElement
          .querySelectorAll('.modal-tab')
          .forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

        // Add active class to clicked tab and corresponding panel
        this.classList.add('active');
        document.querySelector(`[data-panel="${tabName}"]`).classList.add('active');
      });
    });
  }

  function loadWallpaperOptions() {
    const container = document.getElementById('wallpaperOptions');
    if (!container) return;

    const wallpapers = [
      { type: 'flag', value: 'NG', label: 'Nigeria' },
      { type: 'flag', value: 'KE', label: 'Kenya' },
      { type: 'flag', value: 'GH', label: 'Ghana' },
      { type: 'gradient', value: 'grad-1', label: 'Gradient 1' },
      { type: 'gradient', value: 'grad-2', label: 'Gradient 2' },
      { type: 'color', value: '#0a4a7a', label: 'Blue' },
      { type: 'color', value: '#1a1a1a', label: 'Dark' },
    ];

    let html = '<div class="wallpaper-grid">';
    wallpapers.forEach(wp => {
      if (wp.type === 'flag') {
        html += `<button class="wallpaper-option" data-type="${wp.type}" data-value="${wp.value}">
                    <img src="${BASE_URL}assets/Flags/${wp.value}.png" alt="${wp.label}">
                    <span>${wp.label}</span>
                </button>`;
      } else if (wp.type === 'color') {
        html += `<button class="wallpaper-option" data-type="${wp.type}" data-value="${wp.value}">
                    <div class="color-preview" style="background: ${wp.value}"></div>
                    <span>${wp.label}</span>
                </button>`;
      } else {
        html += `<button class="wallpaper-option" data-type="${wp.type}" data-value="${wp.value}">
                    <div class="gradient-preview ${wp.value}"></div>
                    <span>${wp.label}</span>
                </button>`;
      }
    });
    html += '</div>';
    container.innerHTML = html;
  }

  async function markNotificationRead(id) {
    try {
      await fetch(NOTIFICATIONS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_read', notification_id: id }),
      });
      loadNotificationsModal(currentNotificationsPage);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  async function markAllNotificationsRead() {
    try {
      await fetch(NOTIFICATIONS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read' }),
      });
      loadNotificationsModal(currentNotificationsPage);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }

  // ==================== GLOBAL FUNCTIONS ====================

  // Generic modal opener for custom content
  window.openAppModal = function (title, content) {
    const modalId = 'customAppModal';
    let modal = document.getElementById(modalId);

    if (!modal) {
      modal = createModalContainer(modalId, title);
    } else {
      // Update title
      const titleEl = modal.querySelector('.app-modal-header h2');
      if (titleEl) titleEl.textContent = title;
    }

    const body = modal.querySelector('.app-modal-body');
    body.innerHTML = content;

    openModal(modalId);
  };

  // Close app modal
  window.closeAppModal = function () {
    closeAllModals();
  };

  window.loadMessagesModal = loadMessagesModal;
  window.loadNotificationsModal = loadNotificationsModal;
  window.loadProfileModal = loadProfileModal;
  window.loadSettingsModal = loadSettingsModal;
  window.loadMessagesPage = loadMessagesModal;
  window.loadNotificationsPage = loadNotificationsModal;
  window.markNotificationRead = markNotificationRead;
  window.markAllNotificationsRead = markAllNotificationsRead;
  window.closeAllModals = closeAllModals;

  // Avatar upload and creator functions
  window.openAvatarUpload = function () {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async function (e) {
      const file = e.target.files[0];
      if (!file) return;

      // Validate file size (3MB)
      if (file.size > 3 * 1024 * 1024) {
        alert('File size must be less than 3MB');
        return;
      }

      // Upload
      const formData = new FormData();
      formData.append('avatar', file);
      formData.append('action', 'upload_avatar');

      try {
        const response = await fetch(PROFILE_API + '?action=upload_avatar', {
          method: 'POST',
          body: formData,
        });
        const result = await response.json();

        if (result.success && result.avatar_path) {
          // Update avatar display
          const avatarImg = document.getElementById('profileAvatar');
          if (avatarImg) {
            avatarImg.src = BASE_URL + result.avatar_path;
          }
          alert('Avatar uploaded successfully!');
          loadProfileModal(); // Refresh modal
        } else {
          alert('Upload failed: ' + (result.message || 'Unknown error'));
        }
      } catch (error) {
        console.error('Upload error:', error);
        alert('Upload failed. Please try again.');
      }
    };
    input.click();
  };

  window.openAvatarCreator = function () {
    // Simple avatar creator modal
    const modal =
      document.getElementById('avatarCreatorModal') ||
      createModalContainer('avatarCreatorModal', 'Create Avatar');
    const body = modal.querySelector('.app-modal-body');

    const colors = [
      '#667eea',
      '#764ba2',
      '#f093fb',
      '#f5576c',
      '#4facfe',
      '#00f2fe',
      '#43e97b',
      '#38f9d7',
    ];
    const styles = ['bottts', 'avataaars', 'identicon', 'initials', 'shapes'];

    let selectedColor = colors[0];
    // let selectedStyle = styles[0]; // Reserved for future use

    const html = `
            <div class="avatar-creator">
                <h3>Choose Avatar Style</h3>
                <div class="avatar-styles">
                    ${styles
                      .map(
                        style => `
                        <button class="avatar-style-btn" data-style="${style}">
                            ${style.charAt(0).toUpperCase() + style.slice(1)}
                        </button>
                    `
                      )
                      .join('')}
                </div>
                
                <h3>Choose Color</h3>
                <div class="avatar-colors">
                    ${colors
                      .map(
                        color => `
                        <button class="avatar-color-btn" style="background: ${color}" data-color="${color}"></button>
                    `
                      )
                      .join('')}
                </div>
                
                <div class="avatar-preview">
                    <img id="avatarPreviewImg" src="${BASE_URL}assets/img/avatars/default-avatar.png" alt="Preview" style="width: 200px; height: 200px; border-radius: 50%;">
                </div>
                
                <div class="avatar-actions" style="margin-top: 24px;">
                    <button class="btn btn--stroke read-more-btn" onclick="saveGeneratedAvatar()">Save Avatar</button>
                    <button class="btn btn--stroke read-more-btn" onclick="closeAllModals()">Cancel</button>
                </div>
            </div>
        `;

    body.innerHTML = html;
    openModal('avatarCreatorModal');

    // Add event listeners
    setTimeout(() => {
      document.querySelectorAll('.avatar-style-btn').forEach(btn => {
        btn.addEventListener('click', function () {
          document.querySelectorAll('.avatar-style-btn').forEach(b => b.classList.remove('active'));
          this.classList.add('active');
          // selectedStyle = this.dataset.style; // Reserved for future use
          updateAvatarPreview();
        });
      });

      document.querySelectorAll('.avatar-color-btn').forEach(btn => {
        btn.addEventListener('click', function () {
          document.querySelectorAll('.avatar-color-btn').forEach(b => b.classList.remove('active'));
          this.classList.add('active');
          selectedColor = this.dataset.color;
          updateAvatarPreview();
        });
      });

      function updateAvatarPreview() {
        // For now, just show a colored circle with initials
        const preview = document.getElementById('avatarPreviewImg');
        const name = window.__INITIAL_PROFILE?.name || 'User';
        const initials = name
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase();

        // Create canvas for preview
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');

        // Draw circle
        ctx.fillStyle = selectedColor;
        ctx.beginPath();
        ctx.arc(100, 100, 100, 0, Math.PI * 2);
        ctx.fill();

        // Draw initials
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 60px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(initials, 100, 100);

        preview.src = canvas.toDataURL();
      }

      window.saveGeneratedAvatar = async function () {
        const preview = document.getElementById('avatarPreviewImg');
        const blob = await (await fetch(preview.src)).blob();

        const formData = new FormData();
        formData.append('avatar', blob, 'avatar.png');
        formData.append('action', 'upload_avatar');

        try {
          const response = await fetch(PROFILE_API + '?action=upload_avatar', {
            method: 'POST',
            body: formData,
          });
          const result = await response.json();

          if (result.success && result.avatar_path) {
            const avatarImg = document.getElementById('profileAvatar');
            if (avatarImg) {
              avatarImg.src = BASE_URL + result.avatar_path;
            }
            alert('Avatar created successfully!');
            closeAllModals();
          } else {
            alert('Failed to save avatar: ' + (result.message || 'Unknown error'));
          }
        } catch (error) {
          console.error('Save error:', error);
          alert('Failed to save avatar. Please try again.');
        }
      };

      // Initial preview
      updateAvatarPreview();
    }, 100);
  };

  // ==================== INITIALIZE ====================

  function init() {
    // Close modal on overlay click or close button
    document.addEventListener('click', e => {
      if (
        e.target.classList.contains('app-modal-overlay') ||
        e.target.classList.contains('app-modal-close') ||
        e.target.closest('.app-modal-close')
      ) {
        closeAllModals();
      }
    });

    // Close modal on ESC key
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        closeAllModals();
      }
    });

    // Update Communication Hub modal to open Messages/Notifications
    window.openMessaging = function () {
      closeAllModals();
      loadMessagesModal();
    };

    window.openNotifications = function () {
      closeAllModals();
      loadNotificationsModal();
    };
  }

  // Search users for conversation
  let searchTimeout;
  window.searchUsersForConversation = function (query) {
    clearTimeout(searchTimeout);

    if (query.length < 2) {
      document.getElementById('userSuggestions').innerHTML = '';
      return;
    }

    searchTimeout = setTimeout(async () => {
      try {
        const response = await fetch(
          BASE_URL + `api/profile.php?action=search&q=${encodeURIComponent(query)}`
        );
        const data = await response.json();

        if (data.success && data.users) {
          let html = '';
          data.users.forEach(user => {
            const initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';
            html += `
                            <div class="user-suggestion-item" onclick="startConversationWith(${user.id}, '${user.name}')">
                                <div class="user-suggestion-avatar">${initial}</div>
                                <div class="user-suggestion-info">
                                    <h5>${user.name || 'User'}</h5>
                                    <p>${user.email || ''}</p>
                                </div>
                            </div>
                        `;
          });
          document.getElementById('userSuggestions').innerHTML = html;
        }
      } catch (error) {
        console.error('Error searching users:', error);
      }
    }, 300);
  };

  // Start conversation with user
  window.startConversationWith = async function (userId, userName) {
    try {
      const response = await fetch(BASE_URL + 'api/messages.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start_conversation',
          user_id: userId,
        }),
      });
      const data = await response.json();

      if (data.success) {
        // Clear search
        document.getElementById('userSearchInput').value = '';
        document.getElementById('userSuggestions').innerHTML = '';

        // Open conversation view
        alert(`Conversation started with ${userName}. You can now send messages!`);
        loadMessagesModal(); // Refresh messages
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
