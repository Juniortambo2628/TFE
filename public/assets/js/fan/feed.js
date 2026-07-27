/**
 * Feed Page
 *
 * Handles social feed functionality.
 */

(function () {
  'use strict';

  /**
   * Set feed filter
   */
  window.setFeedFilter = function (filter, event) {
    // Update active filter button
    document.querySelectorAll('.feed-filter-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    if (event && event.target) {
      event.target.classList.add('active');
    }

    // Implement filter functionality
    console.log('Filtering feed by:', filter);
  };

  /**
   * Create post
   */
  // eslint-disable-next-line no-unused-vars
  window.createPost = function (content) {
    // Implement post creation functionality
    alert('Post creation functionality will be implemented');
    const textarea = document.getElementById('createPostTextarea');
    if (textarea) {
      textarea.value = '';
    }
  };

  /**
   * Initialize feed page
   */
  function initFeed() {
    // Social feed functionality
    const createPostBtn = document.getElementById('createPostBtn');
    const createPostTextarea = document.getElementById('createPostTextarea');

    if (createPostBtn && createPostTextarea) {
      createPostBtn.addEventListener('click', function () {
        const content = createPostTextarea.value.trim();
        if (content) {
          window.createPost(content);
        }
      });
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFeed);
  } else {
    initFeed();
  }
})();
