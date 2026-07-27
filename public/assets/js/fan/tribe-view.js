/**
 * Tribe View Page
 *
 * Handles forum loading, topic creation, and tribe membership.
 * Expects window.TRIBE_VIEW_CONFIG to be defined by PHP.
 */

(function () {
  'use strict';

  const config = window.TRIBE_VIEW_CONFIG || {};
  const BASE_URL = config.baseUrl || (window.APP_BASE_URL || '/TFE').replace(/\/$/, '') + '/';
  const TRIBE_ID = config.tribeId || 0;
  const IS_MEMBER = config.isMember || false;

  /**
   * Load forum categories and topics
   */
  async function loadForum() {
    try {
      // Use apiClient for consistent error handling
      const [catData, topicsData] = await Promise.all([
        window.apiClient.get(`forum.php?tribe_id=${TRIBE_ID}&action=categories`, {
          onError: (error) => {
            console.error('Error loading categories:', error);
          },
        }),
        window.apiClient.get(`forum.php?tribe_id=${TRIBE_ID}`, {
          onError: (error) => {
            console.error('Error loading topics:', error);
          },
        }),
      ]);

      if (catData && topicsData && catData.success && topicsData.success) {
        renderForum(catData.categories || catData.data?.categories, topicsData.topics || topicsData.data?.topics);
      } else {
        const container = document.getElementById('forumCategories');
        if (container) {
          container.innerHTML = '<div class="empty-state">Failed to load forum</div>';
        }
      }
    } catch (error) {
      console.error('Error loading forum:', error);
      const container = document.getElementById('forumCategories');
      if (container) {
        container.innerHTML = '<div class="empty-state">Failed to load forum</div>';
      }
    }
  }

  /**
   * Render forum
   */
  function renderForum(categories, topics) {
    const container = document.getElementById('forumCategories');
    if (!container) return;

    if (!categories || categories.length === 0) {
      container.innerHTML =
        '<div class="empty-state"><i class="fas fa-folder-open"></i><h4>No forum categories yet</h4><p>Categories will appear here when created</p></div>';
      return;
    }

    let html = '';

    categories.forEach(category => {
      const categoryTopics = topics.filter(t => t.category_id == category.id);

      html += `
                <div class="category-section">
                    <div class="category-header">
                        <div>
                            <h4 class="category-name">${category.name}</h4>
                            ${category.description ? `<p class="category-description">${category.description}</p>` : ''}
                        </div>
                        <span class="category-count">${category.topics_count || 0} Topics</span>
                    </div>
                    
                    <div class="topic-list">
            `;

      if (categoryTopics.length > 0) {
        categoryTopics.forEach(topic => {
          html += `
                        <div class="topic-item" onclick="viewTopic(${topic.id})">
                            <div class="topic-main">
                                <h5 class="topic-title">
                                    ${topic.is_pinned ? '<i class="fas fa-thumbtack"></i> ' : ''}
                                    ${topic.is_locked ? '<i class="fas fa-lock"></i> ' : ''}
                                    ${topic.title}
                                </h5>
                                <div class="topic-meta">
                                    <span><i class="fas fa-user"></i> By ${topic.author_name || 'Unknown'}</span>
                                    <span><i class="fas fa-clock"></i> ${timeAgo(topic.created_at)}</span>
                                    ${topic.last_reply_at ? `<span><i class="fas fa-reply"></i> Last reply ${timeAgo(topic.last_reply_at)}</span>` : ''}
                                </div>
                            </div>
                            <div class="topic-stats">
                                <span class="topic-stat"><i class="fas fa-comments"></i> ${topic.replies_count || 0}</span>
                                <span class="topic-stat"><i class="fas fa-eye"></i> ${topic.views_count || 0}</span>
                            </div>
                        </div>
                    `;
        });
      } else {
        html +=
          '<div class="empty-state"><i class="fas fa-comments"></i><h4>No topics yet</h4><p>Be the first to start a discussion!</p></div>';
      }

      html += `
                    </div>
                </div>
            `;
    });

    container.innerHTML = html;
  }

  // timeAgo function is now provided by assets/js/utils/time-utils.js

  /**
   * View topic
   */
  window.viewTopic = function (topicId) {
    window.location.href = BASE_URL + `fan/topic-view.php?id=${topicId}&tribe_id=${TRIBE_ID}`;
  };

  /**
   * Join tribe
   */
  window.joinTribe = async function (tribeId) {
    try {
      await window.apiClient.post('tribes.php', {
        action: 'join',
        tribe_id: tribeId,
      }, {
        onSuccess: () => {
          location.reload();
        },
        onError: (error) => {
          alert('Failed to join tribe: ' + error.message);
        },
      });
    } catch (error) {
      // Error already handled by apiClient
      console.error('Error:', error);
    }
  };

  /**
   * Leave tribe
   */
  window.leaveTribe = async function (tribeId) {
    if (!confirm('Are you sure you want to leave this tribe?')) return;

    try {
      await window.apiClient.post('tribes.php', {
        action: 'leave',
        tribe_id: tribeId,
      }, {
        onSuccess: () => {
          window.location.href = BASE_URL + 'fan/tribes.php';
        },
        onError: (error) => {
          alert('Failed to leave tribe: ' + error.message);
        },
      });
    } catch (error) {
      // Error already handled by apiClient
      console.error('Error:', error);
    }
  };

  /**
   * Open new topic modal
   */
  window.openNewTopicModal = function () {
    if (!IS_MEMBER) {
      alert('You must be a tribe member to create topics');
      return;
    }

    // Get categories for dropdown
    window.apiClient.get(`forum.php?tribe_id=${TRIBE_ID}&action=categories`, {
      onSuccess: (data) => {
        const categories = data.categories || data.data?.categories;
        if (categories) {
          const categoryOptions = categories
            .map(c => `<option value="${c.id}">${c.name}</option>`)
            .join('');

          const content = `
                        <div class="form-group">
                            <label>Category</label>
                            <select id="topicCategory" class="form-control">
                                ${categoryOptions}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Topic Title</label>
                            <input type="text" id="topicTitle" class="form-control" placeholder="Enter topic title" />
                        </div>
                        <div class="form-group">
                            <label>Content</label>
                            <textarea id="topicContent" class="form-control" rows="6" placeholder="Write your topic..."></textarea>
                        </div>
                        <div style="display: flex; gap: 12px; margin-top: 24px;">
                            <button class="btn btn--primary" onclick="createTopic()" style="flex: 1;">Create Topic</button>
                            <button class="btn btn--stroke" onclick="closeAppModal()" style="flex: 1;">Cancel</button>
                        </div>
                    `;

          if (window.openAppModal) {
            window.openAppModal('Create New Topic', content);
          }
        }
      },
      onError: (error) => {
        console.error('Error loading categories:', error);
        alert('Failed to load categories');
      },
    });
  };

  /**
   * Create topic
   */
  window.createTopic = async function () {
    const categoryEl = document.getElementById('topicCategory');
    const titleEl = document.getElementById('topicTitle');
    const contentEl = document.getElementById('topicContent');

    if (!categoryEl || !titleEl || !contentEl) return;

    const categoryId = categoryEl.value;
    const title = titleEl.value.trim();
    const content = contentEl.value.trim();

    if (!title || !content) {
      alert('Please fill in all fields');
      return;
    }

    try {
      await window.apiClient.post('forum.php', {
        action: 'create_topic',
        tribe_id: TRIBE_ID,
        category_id: categoryId,
        title: title,
        content: content,
      }, {
        onSuccess: () => {
          if (window.closeAppModal) {
            window.closeAppModal();
          }
          alert('Topic created successfully!');
          loadForum();
        },
        onError: (error) => {
          alert('Failed to create topic: ' + error.message);
        },
      });
    } catch (error) {
      // Error already handled by apiClient
      console.error('Error:', error);
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      loadForum();
    });
  } else {
    loadForum();
  }
})();
