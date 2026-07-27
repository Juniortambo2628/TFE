// Modal control functions
let currentPostIdForComment = null;
let currentPostIdForShare = null;

// Close modals
window.closeRepostModal = function() {
  const modal = document.getElementById('repostModal');
  if (modal) modal.style.display = 'none';
};

window.closeCommentsModal = function() {
  const modal = document.getElementById('commentsModal');
  if (modal) modal.style.display = 'none';
  currentPostIdForComment = null;
};

window.closeViewPostModal = function() {
  const modal = document.getElementById('viewPostModal');
  if (modal) modal.style.display = 'none';
};

window.closeShareModal = function() {
  const modal = document.getElementById('shareModal');
  if (modal) modal.style.display = 'none';
  currentPostIdForShare = null;
};

// Show comments modal
window.showPostComments = async function(postId) {
  const modal = document.getElementById('commentsModal');
  if (!modal) {
    console.error('Comments modal not found');
    return;
  }
  
  currentPostIdForComment = postId;
  modal.style.display = 'flex';
  
  // Load comments
  try {
    const response = await fetch(`/TFE/api/posts.php?action=comments&post_id=${postId}`);
    const data = await response.json();
    
    if (data.success) {
      displayComments(data.comments);
    }
  } catch (error) {
    console.error('Error loading comments:', error);
  }
};

function displayComments(comments) {
  const container = document.getElementById('commentsListContainer');
  if (!container) return;
  
  if (comments.length === 0) {
    container.innerHTML = '<p style="color: rgba(255,255,255,0.5); text-align: center; padding: 20px;">No comments yet. Be the first to comment!</p>';
    return;
  }
  
  container.innerHTML = comments.map(comment => `
    <div class="comment-item">
      <img src="${comment.avatar || 'https://api.dicebear.com/9.x/avataaars/svg?seed=' + encodeURIComponent(comment.author_name)}" 
           alt="${comment.author_name}" class="comment-avatar">
      <div class="comment-content">
        <div class="comment-author">${comment.author_name}</div>
        <div class="comment-text">${comment.content}</div>
        <div class="comment-time">${timeAgo(comment.created_at)}</div>
      </div>
    </div>
  `).join('');
}

// Post comment
document.addEventListener('DOMContentLoaded', function() {
  const postCommentBtn = document.getElementById('postCommentBtn');
  if (postCommentBtn) {
    postCommentBtn.addEventListener('click', async function(e) {
      e.preventDefault(); // Prevent any form submission
      
      const textarea = document.getElementById('commentTextarea');
      const content = textarea.value.trim();
      
      if (!content || !currentPostIdForComment) {
        console.log('No content or post ID');
        return;
      }
      
      try {
        postCommentBtn.disabled = true;
        postCommentBtn.textContent = 'Posting...';
        
        const response = await fetch('/TFE/api/posts.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'comment',
            post_id: currentPostIdForComment,
            content: content
          })
        });
        
        const data = await response.json();
        
        if (data.success) {
          textarea.value = '';
          // Reload comments
          await showPostComments(currentPostIdForComment);
          
          // Update comment count on post
          const postCard = document.querySelector(`.feed-post[data-post-id="${currentPostIdForComment}"]`);
          if (postCard) {
            const commentBtn = postCard.querySelector('.action-reply span');
            if (commentBtn) {
              commentBtn.textContent = parseInt(commentBtn.textContent || 0) + 1;
            }
          }
          
          if (window.showToast) {
            window.showToast('Comment posted!', 'success');
          }
        } else {
          alert('Error: ' + (data.message || 'Failed to post comment'));
        }
      } catch (error) {
        console.error('Error posting comment:', error);
        alert('Failed to post comment. Please try again.');
      } finally {
        postCommentBtn.disabled = false;
        postCommentBtn.textContent = 'Comment';
      }
    });
  }
});

// Share functions
window.sharePost = function(postId) {
  currentPostIdForShare = postId;
  const modal = document.getElementById('shareModal');
  if (modal) modal.style.display = 'flex';
};

window.copyPostLink = function() {
  const postUrl = `${window.location.origin}/TFE/fan/feed.php?post=${currentPostIdForShare}`;
  navigator.clipboard.writeText(postUrl).then(() => {
    if (window.showToast) {
      window.showToast('Link copied to clipboard!', 'success');
    } else {
      alert('Link copied to clipboard!');
    }
    closeShareModal();
  });
};

window.shareToTwitter = function() {
  const postUrl = `${window.location.origin}/TFE/fan/feed.php?post=${currentPostIdForShare}`;
  const text = 'Check out this post on WCTFE Social!';
  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(postUrl)}`, '_blank');
};

window.shareToFacebook = function() {
  const postUrl = `${window.location.origin}/TFE/fan/feed.php?post=${currentPostIdForShare}`;
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`, '_blank');
};

// View post modal
window.showPostDetails = function(postId) {
  console.log('Show post details:', postId);
  const modal = document.getElementById('viewPostModal');
  const postCard = document.querySelector(`.feed-post[data-post-id="${postId}"]`);
  
  if (!modal || !postCard) {
    console.error('Modal or post not found');
    return;
  }
  
  const content = document.getElementById('viewPostContent');
  content.innerHTML = postCard.outerHTML;
  modal.style.display = 'flex';
};
