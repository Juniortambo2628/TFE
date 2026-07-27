/**
 * Social Feed JavaScript
 * Handle feed, posts, likes, comments, hashtags, mentions
 */

(function () {
  'use strict';

  const BASE_URL = (window.APP_BASE_URL || '/TFE').replace(/\/$/, '') + '/';
  let currentFilter = 'chronological';
  let currentPage = 1;

  // Parse content for hashtags and mentions
  function parseContent(content) {
    // Parse hashtags
    content = content.replace(
      /#(\w+)/g,
      '<a href="javascript:void(0)" class="hashtag" onclick="showHashtagFeed(\'$1\')">#$1</a>'
    );

    // Parse mentions
    content = content.replace(
      /@(\w+)/g,
      '<a href="javascript:void(0)" class="mention" onclick="showUserProfile(\'$1\')">@$1</a>'
    );

    return content;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    const content = div.innerHTML;
    return content;
  }

  // Format time ago
  function timeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + 'y ago';

    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + 'mo ago';

    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + 'd ago';

    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + 'h ago';

    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + 'm ago';

    return 'Just now';
  }

  // Export timeAgo to window for use in other modules
  window.timeAgo = timeAgo;

  // Create avatar element (supports both images and 3D GLB models)
  function createAvatarElement(avatarUrl, altText = 'Avatar') {
    if (avatarUrl && avatarUrl.includes('.glb')) {
      const viewer = document.createElement('model-viewer');
      viewer.src = avatarUrl;
      viewer.alt = altText;
      viewer.setAttribute('auto-rotate', '');
      viewer.setAttribute('camera-controls', '');
      viewer.setAttribute('shadow-intensity', '1');
      viewer.style.width = '40px';
      viewer.style.height = '40px';
      viewer.style.borderRadius = '50%';
      viewer.style.display = 'inline-block';
      return viewer;
    }
    
    const img = document.createElement('img');
    img.src = avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(altText)}`;
    img.alt = altText;
    return img;
  }

  // Create post card HTML (Twitter-style)
  function createPostCard(post) {
    const authorInitial = post.author_name ? post.author_name.charAt(0).toUpperCase() : 'U';
    const parsedContent = parseContent(post.content);
    
    return `
            <div class="feed-post" data-post-id="${post.id}" onclick="showPostDetails(${post.id})">
                <div class="post-avatar">
                    <img src="${post.avatar_url || 'https://api.dicebear.com/9.x/avataaars/svg?seed=' + (post.username || post.author_name || 'user')}" alt="${post.author_name}">
                </div>
                <div class="post-content">
                    <div class="post-header">
                        <div class="post-author-info">
                            <span class="author-name">${post.author_name || 'Unknown User'}</span>
                            <span class="author-handle">@${post.username || 'user'}</span>
                            <span class="post-time">· ${timeAgo(post.created_at)}</span>
                        </div>
                        <button class="post-menu-btn" onclick="event.stopPropagation(); showContextMenu(event, ${post.id}, ${post.is_owner ? 'true' : 'false'})">
                            <i class="fas fa-ellipsis-h"></i>
                        </button>
                    </div>
                    
                    <div class="post-text">${parsedContent}</div>
                    
                    <div class="post-actions">
                        <button class="action-item action-reply" onclick="event.stopPropagation(); showPostComments(${post.id})">
                            <i class="far fa-comment"></i>
                            <span>${post.comments_count || 0}</span>
                        </button>
                        
                        <button class="action-item action-retweet ${post.user_reshared ? 'reshared' : ''}" onclick="event.stopPropagation(); resharePost(${post.id})">
                            <i class="fas fa-retweet"></i>
                            <span>${post.shares_count || 0}</span>
                        </button>
                        
                        <button class="action-item action-like ${post.user_liked ? 'liked' : ''}" onclick="event.stopPropagation(); togglePostLike(${post.id})">
                            <i class="${post.user_liked ? 'fas' : 'far'} fa-heart"></i>
                            <span>${post.likes_count || 0}</span>
                        </button>
                        
                        <button class="action-item action-share" onclick="event.stopPropagation(); sharePost(${post.id})">
                            <i class="far fa-share-square"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
  }

  // Show Context Menu
  window.showContextMenu = function(event, postId, isOwner) {
      event.preventDefault();
      
      // Remove existing menus
      const existing = document.querySelector('.context-menu');
      if (existing) existing.remove();
      
      const menu = document.createElement('div');
      menu.className = 'context-menu';
      
      let menuItems = `
          <div class="context-menu-item" onclick="followPost(${postId})">
              <i class="far fa-bell"></i> Turn on notifications
          </div>
          <div class="context-menu-item" onclick="copyLink(${postId})">
              <i class="far fa-copy"></i> Copy link to post
          </div>
      `;
      
      if (isOwner) {
          menuItems += `
              <div class="context-menu-item danger" onclick="deletePost(${postId})">
                  <i class="far fa-trash-alt"></i> Delete post
              </div>
          `;
      } else {
          menuItems += `
              <div class="context-menu-item" onclick="unfollowUser(${postId})">
                  <i class="fas fa-user-minus"></i> Unfollow @user
              </div>
              <div class="context-menu-item" onclick="muteUser(${postId})">
                  <i class="fas fa-volume-mute"></i> Mute @user
              </div>
              <div class="context-menu-item danger" onclick="reportPost(${postId})">
                  <i class="far fa-flag"></i> Report post
              </div>
          `;
      }
      
      menu.innerHTML = menuItems;
      document.body.appendChild(menu);
      
      // Position menu
      const rect = event.target.getBoundingClientRect();
      menu.style.top = (rect.bottom + window.scrollY) + 'px';
      menu.style.left = (rect.left + window.scrollX - 150) + 'px'; // Align leftish
      
      // Close on click outside
      document.addEventListener('click', function closeMenu(e) {
          if (!menu.contains(e.target)) {
              menu.remove();
              document.removeEventListener('click', closeMenu);
          }
      });
  };

  // Load feed
  async function loadFeed(filter = 'chronological', page = 1) {
    currentFilter = filter;
    currentPage = page;

    const feedContainer = document.getElementById('socialFeedPosts');
    if (!feedContainer) return;

    feedContainer.innerHTML =
      '<div class="feed-loading"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle></svg><p>Loading feed...</p></div>';

    try {
      const response = await fetch(
        `${BASE_URL}api/posts.php?filter=${filter}&page=${page}&limit=20`
      );
      const data = await response.json();

      if (data.success && data.posts) {
        if (data.posts.length === 0) {
          feedContainer.innerHTML =
            '<div class="feed-empty"><p>No posts yet. Be the first to share something!</p></div>';
        } else {
          feedContainer.innerHTML = data.posts.map(post => createPostCard(post)).join('');
        }
      } else {
        feedContainer.innerHTML =
          '<div class="feed-empty"><p>Failed to load feed. Please try again.</p></div>';
      }
    } catch (error) {
      console.error('Error loading feed:', error);
      feedContainer.innerHTML =
        '<div class="feed-empty"><p>Error loading feed. Please try again.</p></div>';
    }
  }

  // Create post
  async function createPost() {
    const textarea = document.getElementById('createPostTextarea');
    const visibilitySelect = document.getElementById('postVisibility');

    if (!textarea || !textarea.value.trim()) {
      alert('Please enter some content');
      return;
    }

    const content = textarea.value.trim();
    const visibility = visibilitySelect ? visibilitySelect.value : 'public';

    try {
      const response = await fetch(`${BASE_URL}api/posts.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_post',
          content: content,
          visibility: visibility,
        }),
      });

      const data = await response.json();

      if (data.success) {
        textarea.value = '';
        loadFeed(currentFilter, 1);
        alert('Post created successfully!');
      } else {
        alert('Failed to create post: ' + data.message);
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    }
  }

  // Toggle like
  window.toggleLike = async function (postId) {
    try {
      const response = await fetch(`${BASE_URL}api/social/like.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          post_id: postId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        loadFeed(currentFilter, currentPage);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  // Show comments (placeholder)
  window.showComments = function (postId) {
    alert('Comments feature coming soon! Post ID: ' + postId);
  };

  // Share post (placeholder)
  window.sharePost = function (postId) {
    alert('Share feature coming soon! Post ID: ' + postId);
  };

  // Show hashtag feed
  window.showHashtagFeed = function (tag) {
    alert('Hashtag feed coming soon: #' + tag);
  };

  // Show user profile
  window.showUserProfile = function (username) {
    alert('User profile coming soon: @' + username);
  };

  // Load trending hashtags
  async function loadTrendingHashtags() {
    try {
      const response = await fetch(`${BASE_URL}api/social/hashtags.php?trending=1&limit=10`);
      const data = await response.json();

      if (data.success && data.hashtags) {
        const container = document.getElementById('trendingHashtags');
        if (container) {
          container.innerHTML = data.hashtags
            .map(
              tag => `
                        <div class="hashtag-item" onclick="showHashtagFeed('${tag.tag}')">
                            <span class="hashtag-name">#${tag.tag}</span>
                            <span class="hashtag-count">${tag.usage_count} posts</span>
                        </div>
                    `
            )
            .join('');
        }
      }
    } catch (error) {
      console.error('Error loading trending hashtags:', error);
    }
  }

  // Set feed filter
  window.setFeedFilter = function (filter) {
    // Update button states
    document.querySelectorAll('.feed-filter-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    event.target.classList.add('active');

    loadFeed(filter, 1);
  };

  // User tooltip functionality
  let tooltipTimeout;
  let currentTooltip = null;

  window.showUserTooltip = async function (event, userId) {
    clearTimeout(tooltipTimeout);

    // Remove existing tooltip
    if (currentTooltip) {
      currentTooltip.remove();
    }

    tooltipTimeout = setTimeout(async () => {
      try {
        const response = await fetch(BASE_URL + `api/profile.php?user_id=${userId}`);
        const data = await response.json();

        if (data.success && data.data) {
          const user = data.data;
          const tooltip = document.createElement('div');
          tooltip.className = 'user-tooltip';
          tooltip.innerHTML = `
                        <div class="tooltip-header">
                            <div class="tooltip-avatar">${user.name ? user.name.charAt(0).toUpperCase() : 'U'}</div>
                            <div class="tooltip-info">
                                <h4>${user.name || 'User'}</h4>
                                <p>${user.email || ''}</p>
                            </div>
                        </div>
                        <div class="tooltip-stats">
                            <span>${user.followers_count || 0} Followers</span>
                            <span>${user.following_count || 0} Following</span>
                        </div>
                        <button class="tooltip-follow-btn ${user.is_following ? 'following' : ''}" 
                                onclick="toggleFollow(${userId})">
                            ${user.is_following ? 'Following' : 'Follow'}
                        </button>
                    `;

          const rect = event.target.getBoundingClientRect();
          tooltip.style.position = 'absolute';
          tooltip.style.top = rect.bottom + window.scrollY + 'px';
          tooltip.style.left = rect.left + window.scrollX + 'px';

          document.body.appendChild(tooltip);
          currentTooltip = tooltip;
        }
      } catch (error) {
        console.error('Error loading user tooltip:', error);
      }
    }, 500);
  };

  window.hideUserTooltip = function () {
    clearTimeout(tooltipTimeout);
    setTimeout(() => {
      if (currentTooltip) {
        currentTooltip.remove();
        currentTooltip = null;
      }
    }, 200);
  };

  // Toggle follow
  window.toggleFollow = async function (userId) {
    try {
      const response = await fetch(BASE_URL + 'api/social/follow.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await response.json();

      if (data.success) {
        if (currentTooltip) {
          const btn = currentTooltip.querySelector('.tooltip-follow-btn');
          if (data.action === 'followed') {
            btn.textContent = 'Following';
            btn.classList.add('following');
          } else {
            btn.textContent = 'Follow';
            btn.classList.remove('following');
          }
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  // Toggle post like
  window.togglePostLike = async function (postId) {
    try {
      const response = await fetch(BASE_URL + 'api/social/like.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId }),
      });
      const data = await response.json();

      if (data.success) {
        const postCard = document.querySelector(`.feed-post[data-post-id="${postId}"]`);
        if (!postCard) {
          console.error('Post card not found for ID:', postId);
          return;
        }
        const likeBtn = postCard.querySelector('.action-like');
        const likeCount = likeBtn.querySelector('span');
        const icon = likeBtn.querySelector('i');

        if (data.action === 'liked') {
          likeBtn.classList.add('liked');
          icon.classList.remove('far');
          icon.classList.add('fas');
          likeCount.textContent = parseInt(likeCount.textContent || 0) + 1;
        } else {
          likeBtn.classList.remove('liked');
          icon.classList.remove('fas');
          icon.classList.add('far');
          likeCount.textContent = Math.max(0, parseInt(likeCount.textContent || 0) - 1);
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  // Show post comments
  window.showPostComments = async function (postId) {
    const commentsContainer = document.getElementById(`comments-${postId}`);
    const modal = document.getElementById('commentsModal');
    if (!modal) {
      console.error('Comments modal not found');
      return;
    }
    modal.style.display = 'flex';

    if (commentsContainer.style.display === 'block') {
      commentsContainer.style.display = 'none';
      return;
    }

    try {
      const response = await fetch(
        BASE_URL + `api/posts.php?action=comments&post_id=${postId}`
      );
      const data = await response.json();

      if (data.success) {
        let html = '<div class="comments-section">';

        if (data.comments && data.comments.length > 0) {
          data.comments.forEach(comment => {
            html += `
                            <div class="comment-item">
                                <div class="comment-avatar">${comment.author_name ? comment.author_name.charAt(0).toUpperCase() : 'U'}</div>
                                <div class="comment-content">
                                    <div class="comment-author">${comment.author_name || 'User'}</div>
                                    <div class="comment-text">${comment.content}</div>
                                    <div class="comment-meta">${timeAgo(comment.created_at)}</div>
                                </div>
                            </div>
                        `;
          });
        }

        html += `
                    <div class="comment-input-container">
                        <textarea id="comment-input-${postId}" placeholder="Write a comment..." rows="2"></textarea>
                        <button onclick="postComment(${postId})">Comment</button>
                    </div>
                </div>`;

        commentsContainer.innerHTML = html;
        commentsContainer.style.display = 'block';
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  // Post comment
  window.postComment = async function (postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    const content = input.value.trim();

    if (!content) return;

    try {
      const response = await fetch(BASE_URL + 'api/posts.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'comment',
          post_id: postId,
          content: content,
        }),
      });
      const data = await response.json();

      if (data.success) {
        input.value = '';
        showPostComments(postId); // Reload comments

        // Update comment count
        const postCard = document.querySelector(`[data-post-id="${postId}"]`);
        const commentBtn = postCard.querySelectorAll('.post-action-btn')[1];
        const count = commentBtn.querySelector('span');
        count.textContent = parseInt(count.textContent) + 1;
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  // Reshare a post
  window.resharePost = function (postId) {
    const modal = document.getElementById('repostModal');
    if (!modal) {
      console.error('Repost modal not found');
      return;
    }

    // Store the post ID for later use
    window.currentRepostPostId = postId;

    // Clear the textarea
    const textarea = document.getElementById('repostComment');
    if (textarea) textarea.value = '';

    // Set up the confirm button
    const confirmBtn = document.getElementById('confirmRepostBtn');
    if (confirmBtn) {
      confirmBtn.onclick = async function() {
        const comment = textarea ? textarea.value.trim() : '';
        
        try {
          confirmBtn.disabled = true;
          confirmBtn.textContent = 'Reposting...';

          const response = await fetch('/TFE/api/posts.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'reshare',
              post_id: postId,
              comment: comment
            })
          });

          const data = await response.json();

          if (data.success) {
            const postCard = document.querySelector(`[data-post-id="${postId}"]`);
            if (postCard) {
              const reshareBtn = postCard.querySelectorAll('.post-action-btn')[2];
              if (reshareBtn) {
                const count = reshareBtn.querySelector('span');
                if (count) {
                  if (data.action === 'reshared') {
                    reshareBtn.classList.add('reshared');
                    count.textContent = parseInt(count.textContent || 0) + 1;
                  } else {
                    reshareBtn.classList.remove('reshared');
                    count.textContent = Math.max(0, parseInt(count.textContent || 0) - 1);
                  }
                }
              }
            }
            closeRepostModal();
            
            if (window.showToast) {
              window.showToast(data.action === 'reshared' ? 'Post reposted!' : 'Repost removed', 'success');
            }
          } else {
            alert('Error: ' + data.message);
          }
        } catch (error) {
          console.error('Error resharing post:', error);
          alert('Failed to repost. Please try again.');
        } finally {
          confirmBtn.disabled = false;
          confirmBtn.textContent = 'Repost';
        }
      };
    }

    // Show the modal
    modal.style.display = 'flex';
  };

  // Show post details (placeholder)
  window.showPostDetails = function(postId) {
      // Prevent triggering when clicking actions
      if (event.target.closest('.post-actions') || event.target.closest('.post-menu-btn')) return;
      console.log('Show post details:', postId);
      // Future: Open modal with full post details
  };

  // Initialize feed
  window.initSocialFeed = function () {
    loadFeed('chronological', 1);
    loadTrendingHashtags();

    // Setup create post button
    const createPostBtn = document.getElementById('createPostBtn');
    if (createPostBtn) {
      createPostBtn.onclick = createPost;
    }
    
    // Setup composer tools (placeholders)
    const tools = document.querySelectorAll('.composer-tool-btn');
    if (tools.length > 0) {
        tools[0].onclick = () => alert('Image upload coming soon!');
        tools[1].onclick = () => alert('Emoji picker coming soon!');
    }
  };

  // Auto-initialize if feed container exists
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      if (document.getElementById('socialFeedPosts')) {
        initSocialFeed();
      }
    });
  } else {
    if (document.getElementById('socialFeedPosts')) {
      initSocialFeed();
    }
  }
})();
