(function () {
  // profile.js - lightweight frontend for profile/dashboard features
  const baseUrl = (window.APP_BASE_URL || '/TFE').replace(/\/$/, '') + '/';
  const apiBase = baseUrl + 'api';
  const userProfileUrl = apiBase + '/profile.php';
  const messagesUrl = apiBase + '/messages.php';
  const notificationsUrl = apiBase + '/notifications.php';

  function $(sel, ctx = document) {
    return ctx.querySelector(sel);
  }
  function $all(sel, ctx = document) {
    return Array.from(ctx.querySelectorAll(sel));
  }

  async function jsonFetch(url, opts) {
    const r = await fetch(url, opts);
    const txt = await r.text();
    try {
      return JSON.parse(txt);
    } catch (e) {
      console.error('Invalid JSON', txt);
      throw e;
    }
  }

  async function loadProfile() {
    try {
      const res = await jsonFetch(userProfileUrl);
      if (res.success && res.data) {
        const p = res.data;
        const baseUrl = (window.APP_BASE_URL || '/TFE').replace(/\/$/, '') + '/';
        // Use 'avatar' field (new system) or fallback to 'avatar_path' (old system)
        const avatar =
          p.avatar || p.avatar_path || baseUrl + 'assets/img/avatars/default-avatar.png';

        // Update profile avatar if element exists
        const profileAvatar = $('#profileAvatar');
        if (profileAvatar) {
          profileAvatar.src = avatar;
        }

        // Update standing avatar if element exists
        const standing = document.getElementById('standingAvatar');
        if (standing) {
          standing.src = avatar;
        }

        // Update profile name if element exists
        const profileName = $('#profileName');
        if (profileName) {
          profileName.textContent =
            ((p.first_name || '') + ' ' + (p.last_name || '')).trim() || 'Fan';
        }

        // Update profile email if element exists
        const profileEmail = $('#profileEmail');
        if (profileEmail) {
          profileEmail.textContent = p.email || '';
        }
      }
    } catch (e) {
      console.warn('Profile load failed', e);
    }
  }

  async function uploadAvatar(form) {
    const fd = new FormData(form);
    fd.append('action', 'upload_avatar');
    try {
      const res = await jsonFetch(userProfileUrl + '?action=upload_avatar', {
        method: 'POST',
        body: fd,
      });
      if (res.success && res.avatar_path) {
        const baseUrl = (window.APP_BASE_URL || '/TFE').replace(/\/$/, '') + '/';
        const avatarUrl =
          res.avatar_path.startsWith('http') || res.avatar_path.startsWith('/')
            ? res.avatar_path
            : baseUrl + res.avatar_path;
        $('#profileAvatar').src = avatarUrl;
        const standing = document.getElementById('standingAvatar');
        if (standing) standing.src = avatarUrl;
      } else {
        alert(res.message || 'Upload failed');
      }
    } catch {
      alert('Upload failed');
    }
  }

  function initUploader() {
    const f = $('#avatarUploadForm');
    if (!f) {
      return;
    }
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      uploadAvatar(f);
    });
  }

  function initTabs() {
    $all('.tab').forEach(btn =>
      btn.addEventListener('click', () => {
        const target = btn.dataset.tab;
        $all('.tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        $all('.tab-content').forEach(c => c.classList.remove('active'));
        const el = document.getElementById(`tab-${target}`);
        if (el) {
          el.classList.add('active');
        }
      })
    );
  }

  function initWallpaperPicker() {
    $all('.wallpaper-option').forEach(btn =>
      btn.addEventListener('click', async () => {
        const wallpaperType = btn.dataset.type,
          value = btn.dataset.value;
        let wallpaperValue = null;
        if (wallpaperType === 'flag') {
          wallpaperValue = '/TFE/assets/Flags/' + value + '.png';
        }
        if (wallpaperType === 'gradient') {
          wallpaperValue = value; // named gradient
        }
        if (wallpaperType === 'color') {
          wallpaperValue = value;
        }
        // call API to save
        try {
          const fd = new FormData();
          fd.append('action', 'update_profile');
          fd.append('wallpaper', wallpaperValue);
          const res = await jsonFetch(userProfileUrl, { method: 'POST', body: fd });
          if (res.success) {
            // apply visually to hero/profile background
            const hero = document.querySelector('.s-hero__bg');
            if (hero) {
              if (wallpaperValue && wallpaperValue.startsWith('/TFE')) {
                hero.style.backgroundImage = `url(${wallpaperValue})`;
                hero.style.backgroundSize = 'cover';
              } else if (wallpaperValue && wallpaperValue.startsWith('#')) {
                hero.style.backgroundImage = 'none';
                hero.style.backgroundColor = wallpaperValue;
              } else {
                hero.style.backgroundImage = '';
              }
            }
          }
        } catch (e) {
          console.warn('Wallpaper save failed', e);
        }
      })
    );
  }

  async function loadConversations() {
    try {
      const res = await jsonFetch(messagesUrl);
      if (res.success && res.messages && res.messages.length > 0) {
        const list = $('#conversationsList');
        if (!list) {
          return;
        }
        list.innerHTML = '';

        // Create conversation items from messages
        res.messages.forEach((msg, idx) => {
          const btn = document.createElement('button');
          btn.className = 'conv-item';
          btn.textContent = msg.sender_name || 'Message ' + msg.id;
          btn.dataset.convId = msg.id;
          btn.addEventListener('click', () => selectConversation(msg.id, btn));
          list.appendChild(btn);

          // auto-select first conversation
          if (idx === 0 && !currentConv) {
            selectConversation(msg.id, btn);
          }
        });
      } else {
        // No conversations yet
        const list = $('#conversationsList');
        if (list) {
          list.innerHTML = '<div class="no-conversations">No messages yet</div>';
        }
      }
    } catch (e) {
      console.warn('Fetch conv failed', e);
      const list = $('#conversationsList');
      if (list) {
        list.innerHTML = '<div class="no-conversations">Failed to load messages</div>';
      }
    }
  }

  let currentConv = null;
  let messagePollHandle = null;
  async function selectConversation(convId, btnEl) {
    currentConv = convId;
    // highlight
    $all('.conv-item').forEach(b => b.classList.remove('active'));
    if (btnEl) {
      btnEl.classList.add('active');
    }
    await fetchMessages(convId);
    // start polling messages for this conversation
    if (messagePollHandle) {
      clearInterval(messagePollHandle);
    }
    messagePollHandle = setInterval(() => {
      if (currentConv) {
        fetchMessages(currentConv);
      }
    }, 6000);
  }

  async function fetchMessages(convId) {
    try {
      const res = await jsonFetch(messagesUrl + '?action=fetch_messages&conversation_id=' + convId);
      if (res.success) {
        const panel = $('#messageThread');
        if (!panel) {
          return;
        }
        panel.innerHTML = '';
        if (!res.messages || res.messages.length === 0) {
          document.getElementById('messagesEmptyState')?.setAttribute('aria-hidden', 'false');
        } else {
          document.getElementById('messagesEmptyState')?.setAttribute('aria-hidden', 'true');
        }
        res.messages.forEach(m => {
          const d = document.createElement('div');
          d.className = 'msg';
          const who = (m.first_name || 'User') + (m.last_name ? ' ' + m.last_name : '');
          const ts = new Date(m.created_at);
          const timeStr = ts.toLocaleString();
          d.innerHTML = ` < div class = "msg-row" > < div class = "msg-author" > ${escapeHtml(who)} < / div > < div class = "msg-content" > ${escapeHtml(m.content)} < / div > < div class = "msg-time" > ${escapeHtml(timeStr)} < / div > < / div > `;
          panel.appendChild(d);
        });
        panel.scrollTop = panel.scrollHeight;
      }
    } catch (e) {
      console.warn('Fetch messages failed', e);
    }
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  async function sendMessage(content) {
    if (!currentConv) {
      return alert('Select a conversation');
    }
    try {
      const fd = new FormData();
      fd.append('action', 'send_message');
      fd.append('conversation_id', currentConv);
      fd.append('content', content);
      const res = await jsonFetch(messagesUrl, { method: 'POST', body: fd });
      if (res.success) {
        await fetchMessages(currentConv);
      }
    } catch (e) {
      console.warn('Send message failed', e);
    }
  }

  function initSendForm() {
    const f = $('#sendMessageForm');
    if (!f) {
      return;
    }
    const input = $('#messageInput');
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      const v = input.value.trim();
      if (v) {
        sendMessage(v);
        input.value = '';
      }
    });
    // keyboard: Enter to send, Shift+Enter newline
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const v = input.value.trim();
        if (v) {
          sendMessage(v);
          input.value = '';
        }
      }
    });
    // accessibility
    input.setAttribute('aria-label', 'Type a message');
    f.setAttribute('aria-label', 'Send message form');
  }

  async function pollNotifications() {
    try {
      const res = await jsonFetch(notificationsUrl + '?action=fetch&limit=5');
      if (res.success) {
        const unread = res.notifications.filter(n => n.is_read == 0).length;
        // update floating nav badge
        const floating = document.querySelector('.floating-nav__container');
        if (floating) {
          let badge = floating.querySelector('.nav-badge');
          if (!badge) {
            badge = document.createElement('span');
            badge.className = 'nav-badge';
            floating.appendChild(badge);
          }
          badge.textContent = unread > 0 ? unread : '';
        }
        // store last fetched for modal
        window.__notifications_cache = res.notifications;
      }
    } catch {
      /* ignore */
    }
  }

  async function showNotificationsModal() {
    const modal = document.getElementById('notificationsModal');
    if (!modal) {
      return;
    }
    const list = modal.querySelector('.notifications-list');
    list.innerHTML = 'Loading...';
    try {
      const res = await jsonFetch(notificationsUrl + '?action=fetch&limit=50');
      if (res.success) {
        list.innerHTML = '';
        res.notifications.forEach(n => {
          const item = document.createElement('div');
          item.className = 'notification-item';
          item.innerHTML = ` < div class = "n-title" > ${escapeHtml(n.title || n.type)} < / div > < div class = "n-msg" > ${escapeHtml(n.message || '')} < / div > < div class = "n-time" > ${n.created_at} < / div > `;
          item.addEventListener('click', async () => {
            // mark read
            await fetch(notificationsUrl, {
              method: 'POST',
              body: new URLSearchParams({ action: 'mark_read', id: n.id }),
            });
            item.classList.add('read');
          });
          list.appendChild(item);
        });
      } else {
        list.innerHTML = 'Unable to load notifications';
      }
    } catch {
      list.innerHTML = 'Error loading';
    }
    modal.classList.add('open');
  }

  function initNotificationsTrigger() {
    const floating = document.querySelector('.floating-nav__container');
    if (!floating) {
      return;
    }
    floating.addEventListener('click', ev => {
      // if clicked on badge or container open modal
      if (ev.target.classList.contains('nav-badge') || ev.currentTarget) {
        showNotificationsModal();
      }
    });
    // modal close
    const modal = document.getElementById('notificationsModal');
    if (modal) {
      modal
        .querySelector('.modal-close')
        ?.addEventListener('click', () => modal.classList.remove('open'));
    }
  }

  function init() {
    loadProfile();
    initUploader();
    initTabs();
    initWallpaperPicker();
    loadConversations();
    initSendForm();
    initSendForm();
    initNotificationsTrigger();
    pollNotifications();
    setInterval(pollNotifications, 8000);
  }

  // Expose loadProfile globally so other scripts can refresh the profile
  window.loadProfile = loadProfile;

  document.addEventListener('DOMContentLoaded', init);
})();

// Avatar creator integration (DiceBear)
(function () {
  async function openAvatarCreator() {
    // simple integration: open dicebear avatar editor in new tab with a random seed, then allow user to copy SVG back
    // We will provide a modal in a future step; for now open the dicebear playground
    window.open(
      'https://avatars.dicebear.com/styles/avataaars/svg?seed=' +
        encodeURIComponent('user' + Date.now()),
      '_blank'
    );
  }
  document.addEventListener('DOMContentLoaded', function () {
    const btn = document.getElementById('openAvatarCreator');
    if (btn) {
      btn.addEventListener('click', openAvatarCreator);
    }
  });
})();
