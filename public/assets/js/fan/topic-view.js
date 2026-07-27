/**
 * Topic View Page
 *
 * Handles topic and post loading, rendering, and interactions.
 * Expects window.TOPIC_VIEW_CONFIG to be defined by PHP.
 */

(function () {
  'use strict';

  const config = window.TOPIC_VIEW_CONFIG || {};
  const TOPIC_ID = config.topicId || 0;
  const TRIBE_ID = config.tribeId || 0;
  const IS_MEMBER = config.isMember || false;

  /**
   * Load topic and posts
   */
  async function loadTopic() {
    try {
      const data = await window.apiClient.get(`forum.php?tribe_id=${TRIBE_ID}&topic_id=${TOPIC_ID}`, {
        onError: (error) => {
          console.error('Error loading topic:', error);
        },
      });

      const topicContent = document.getElementById('topicContent');
      if (!topicContent) return;

      const topic = data.topic || data.data?.topic;
      const posts = data.posts || data.data?.posts || [];
      
      if (data.success && topic) {
        renderTopic(topic, posts);
      } else {
        topicContent.innerHTML = '<div class="empty-state">Topic not found</div>';
      }
    } catch (error) {
      console.error('Error loading topic:', error);
      const topicContent = document.getElementById('topicContent');
      if (topicContent) {
        topicContent.innerHTML = '<div class="empty-state">Failed to load topic</div>';
      }
    }
  }

  /**
   * Render topic and posts
   */
  function renderTopic(topic, posts) {
    const topicContent = document.getElementById('topicContent');
    if (!topicContent) return;

    // Render topic
    const topicHtml = `
            <div class="card-header">
                <h2 class="topic-title">
                    ${topic.is_pinned ? '📌 ' : ''}
                    ${topic.is_locked ? '🔒 ' : ''}
                    ${topic.title}
                </h2>
                <div class="topic-meta">
                    <span><i class="fas fa-user"></i> By ${topic.author_name || 'Unknown'}</span>
                    <span><i class="fas fa-clock"></i> ${timeAgo(topic.created_at)}</span>
                    <span><i class="fas fa-comments"></i> ${topic.replies_count || 0} replies</span>
                    <span><i class="fas fa-eye"></i> ${topic.views_count || 0} views</span>
                    <span><i class="fas fa-folder"></i> ${topic.category_name || 'General'}</span>
                </div>
            </div>
            <div class="card-content">
                <div class="topic-content">${topic.content}</div>
            </div>
        `;
    topicContent.innerHTML = topicHtml;

    // Render posts
    const postsContainer = document.getElementById('postsContainer');
    if (postsContainer) {
      if (posts.length > 0) {
        const postsHtml = posts
          .map(post => {
            const authorInitial = post.author_name ? post.author_name.charAt(0).toUpperCase() : 'U';
            return `
                        <div class="post-item" data-post-id="${post.id}">
                            <div class="post-header">
                                <div class="post-avatar">${authorInitial}</div>
                                <div class="post-author-info">
                                    <div class="post-author">${post.author_name || 'Unknown'}</div>
                                    <div class="post-time">${timeAgo(post.created_at)}</div>
                                </div>
                            </div>
                            <div class="post-content">${post.content}</div>
                            <div class="post-actions">
                                <button class="post-action-btn ${post.user_liked ? 'liked' : ''}" onclick="likePost(${post.id})">
                                    <i class="fas fa-heart"></i> ${post.likes_count || 0} Likes
                                </button>
                                ${post.is_solution ? '<span class="solution-badge"><i class="fas fa-check"></i> Solution</span>' : ''}
                            </div>
                        </div>
                    `;
          })
          .join('');
        postsContainer.innerHTML = postsHtml;
      } else {
        postsContainer.innerHTML =
          '<div class="empty-state"><i class="fas fa-comments"></i><h4>No replies yet</h4><p>Be the first to reply!</p></div>';
      }
    }
  }

  // timeAgo function is now provided by assets/js/utils/time-utils.js

  /**
   * Post reply
   */
  window.postReply = async function () {
    const replyContent = document.getElementById('replyContent');
    if (!replyContent) return;

    const content = replyContent.value.trim();

    if (!content) {
      alert('Please enter a reply');
      return;
    }

    if (!IS_MEMBER) {
      alert('You must be a tribe member to reply');
      return;
    }

    try {
      await window.apiClient.post('forum.php', {
        action: 'reply',
        topic_id: TOPIC_ID,
        tribe_id: TRIBE_ID,
        content: content,
      }, {
        onSuccess: () => {
          replyContent.value = '';
          alert('Reply posted successfully!');
          loadTopic(); // Reload to show new reply
        },
        onError: (error) => {
          alert('Failed to post reply: ' + error.message);
        },
      });
    } catch (error) {
      // Error already handled by apiClient
      console.error('Error posting reply:', error);
    }
  };

  /**
   * Like post
   */
  window.likePost = async function (postId) {
    try {
      await window.apiClient.post('forum.php', {
        action: 'like_post',
        post_id: postId,
      }, {
        onSuccess: () => {
          loadTopic(); // Reload to update like count
        },
        onError: (error) => {
          console.error('Error liking post:', error);
        },
      });
    } catch (error) {
      // Error already handled by apiClient
      console.error('Error liking post:', error);
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      loadTopic();
    });
  } else {
    loadTopic();
  }
})();
