document.addEventListener('DOMContentLoaded', function() {
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationBadge = document.getElementById('notificationBadge');
    const notificationList = document.getElementById('notificationList');
    
    // Poll every 30 seconds
    setInterval(fetchNotifications, 30000);
    
    // Initial fetch
    fetchNotifications();

    function fetchNotifications() {
        // Don't fetch if elements don't exist on this page
        if (!notificationBadge || !notificationList) {
            return;
        }
        
        fetch('/TFE/api/notifications.php')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    updateNotificationUI(data.notifications);
                }
            })
            .catch(error => console.error('Error fetching notifications:', error));
    }

    function updateNotificationUI(notifications) {
        // Check if elements exist before updating
        if (!notificationBadge || !notificationList) {
            return;
        }
        
        const count = notifications.length;
        
        if (count > 0) {
            notificationBadge.textContent = count;
            notificationBadge.style.display = 'inline-block';
            
            let html = '';
            notifications.forEach(notif => {
                html += `
                    <a class="dropdown-item notification-item" href="#" onclick="markAsRead(${notif.id}, event)">
                        <div class="d-flex align-items-center">
                            <div class="icon-circle bg-primary mr-2">
                                <i class="fas fa-info"></i>
                            </div>
                            <div>
                                <p class="mb-0 text-wrap">${notif.message}</p>
                                <small class="text-muted">${new Date(notif.created_at).toLocaleTimeString()}</small>
                            </div>
                        </div>
                    </a>
                    <div class="dropdown-divider"></div>
                `;
            });
            html += '<a class="dropdown-item text-center small text-gray-500" href="#" onclick="markAllRead(event)">Mark all as read</a>';
            notificationList.innerHTML = html;
        } else {
            notificationBadge.style.display = 'none';
            notificationList.innerHTML = '<a class="dropdown-item text-center small text-gray-500" href="#">No new notifications</a>';
        }
    }

    window.markAsRead = function(id, event) {
        if (event) event.preventDefault();
        
        fetch('/TFE/api/notifications.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'mark_read', id: id })
        }).then(() => fetchNotifications());
    };

    window.markAllRead = function(event) {
        if (event) event.preventDefault();
        
        fetch('/TFE/api/notifications.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'mark_all_read' })
        }).then(() => fetchNotifications());
    };
});
