/**
 * Ready Player Me Avatar Integration
 * Provides Meta-quality 3D avatar creation and display
 */

(function () {
  'use strict';

  let selectedAvatarUrl = null;

  // Open Ready Player Me avatar creator
  window.openAdvancedAvatarCreator = function () {
    const modal = document.getElementById('avatarCreatorModal');
    if (!modal) {
      console.error('Avatar modal not found!');
      return;
    }

    // Show modal
    modal.style.display = 'flex';

    // Get iframe container
    const iframeContainer = document.getElementById('rpmIframeContainer');
    if (!iframeContainer) {
      console.error('RPM iframe container not found!');
      return;
    }

    // Clear any existing iframe
    iframeContainer.innerHTML = '';

    // Create Ready Player Me iframe
    const iframe = document.createElement('iframe');
    iframe.id = 'rpmFrame';
    iframe.src = 'https://demo.readyplayer.me/avatar?frameApi&clearCache';
    iframe.allow = 'camera *; microphone *';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '8px';

    // Subscribe to events when iframe loads
    iframe.addEventListener('load', function() {
      console.log('RPM iframe loaded');
      
      // Subscribe to avatar exported event
      iframe.contentWindow.postMessage(
        JSON.stringify({
          target: 'readyplayerme',
          type: 'subscribe',
          eventName: 'v1.**'
        }),
        '*'
      );
      console.log('Subscribed to RPM events');
    });

    iframeContainer.appendChild(iframe);

    // Set up postMessage listener
    setupPostMessageListener();
  };

  // Close avatar creator modal
  window.closeAvatarCreatorModal = function () {
    const modal = document.getElementById('avatarCreatorModal');
    if (modal) {
      modal.style.display = 'none';
    }

    // Clear iframe
    const iframeContainer = document.getElementById('rpmIframeContainer');
    if (iframeContainer) {
      iframeContainer.innerHTML = '';
    }

    // Remove message listener
    window.removeEventListener('message', handlePostMessage);
  };

  // Setup postMessage communication with RPM iframe
  function setupPostMessageListener() {
    window.addEventListener('message', handlePostMessage);
  }

  // Handle messages from Ready Player Me iframe
  function handlePostMessage(event) {
    // Security check - only accept messages from ReadyPlayerMe
    if (!event.origin.includes('readyplayer.me')) {
      return;
    }

    const json = parse(event.data);
    if (!json) return;

    console.log('RPM Event:', json);

    // Handle different event types
    if (json.eventName === 'v1.frame.ready') {
      console.log('Ready Player Me frame is ready');
    }

    if (json.eventName === 'v1.avatar.exported') {
      console.log('Avatar exported! URL:', json.data.url);
      selectedAvatarUrl = json.data.url;

      // Enable save button
      const saveBtn = document.getElementById('saveAvatarBtn');
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Avatar';
        console.log('Save button enabled');
      }

      // Show success message
      if (window.showToast) {
        window.showToast('Avatar created! Click "Save Avatar" to apply.', 'success');
      } else {
        console.log('Avatar ready to save:', selectedAvatarUrl);
      }
    }

    if (json.eventName === 'v1.user.set') {
      console.log('User ID set:', json.data.id);
    }
  }

  // Parse JSON safely
  function parse(data) {
    try {
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  // Save avatar
  window.saveAvatar = async function () {
    if (!selectedAvatarUrl) {
      if (window.showToast) {
        window.showToast('Please create an avatar first', 'error');
      } else {
        alert('Please create an avatar first');
      }
      return;
    }

    const saveBtn = document.getElementById('saveAvatarBtn');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';
    }

    try {
      // Normalize baseUrl: strip trailing slash, add back, then append path
      const baseUrl = (window.APP_BASE_URL || '/TFE').replace(/\/$/, '') + '/';
      const response = await fetch(baseUrl + 'api/profile.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          avatar_url: selectedAvatarUrl,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update profile avatar display with 3D viewer
        const profileAvatar = document.getElementById('profileAvatar');
        if (profileAvatar && profileAvatar.tagName === 'MODEL-VIEWER') {
          profileAvatar.src = selectedAvatarUrl;
        } else if (profileAvatar) {
          // Replace img with model-viewer
          const modelViewer = document.createElement('model-viewer');
          modelViewer.id = 'profileAvatar';
          modelViewer.src = selectedAvatarUrl;
          modelViewer.alt = 'User Avatar';
          modelViewer.setAttribute('auto-rotate', '');
          modelViewer.setAttribute('camera-controls', '');
          modelViewer.setAttribute('shadow-intensity', '1');
          modelViewer.style.width = '100%';
          modelViewer.style.height = '100%';
          profileAvatar.parentNode.replaceChild(modelViewer, profileAvatar);
        }

        // Close modal
        closeAvatarCreatorModal();

        // Show success message
        if (window.showToast) {
          window.showToast('Avatar updated successfully!', 'success');
        } else {
          alert('Avatar updated successfully!');
        }

        // Reload page to reflect changes
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        throw new Error(data.message || 'Failed to save avatar');
      }
    } catch (error) {
      console.error('Error saving avatar:', error);
      if (window.showToast) {
        window.showToast('Error: ' + error.message, 'error');
      } else {
        alert('Error saving avatar: ' + error.message);
      }
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Avatar';
      }
    }
  };
})();
