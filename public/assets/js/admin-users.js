// Admin users page JS (extracted from admin/users.php)
// Expects `perPage` global and `window.tenaAjax`, `window.ADMIN_TEMPLATES` to be available.

// User management functions
let currentUserId = null;

// Placeholder function - to be implemented
// eslint-disable-next-line no-unused-vars
function viewUser(id) {
  currentUserId = id;
  const modal = new bootstrap.Modal(document.getElementById('viewUserModal'));
  modal.show();
  loadUserDetails(id);
}

function loadUserDetails(id) {
  const content = document.getElementById('viewUserContent');
  content.innerHTML = ` < div class = "text-center py-4" > < div class = "spinner-border text-primary mb-3" role = "status" style = "width: 3rem; height: 3rem;" > < / div > < h6 class = "text-muted" > Loading user details... < / h6 > < p class = "small text-muted" > Please wait while we fetch the information < / p > < / div > `;

  setTimeout(() => {
    const row = document.querySelector('tr[data-id="' + id + '"]');
    if (row) {
      const cells = row.querySelectorAll('td');
      const name = cells[0].textContent.trim();
      // eslint-disable-next-line no-unused-vars
      const email = cells[1].textContent.trim();
      const country = cells[2].textContent.trim();
      const date = cells[3].textContent.trim();
      const status = cells[4].textContent.trim();

      content.innerHTML =
        '<div class="row">' +
        '<div class="col-md-6">' +
        '<h6 class="text-muted">Personal Information</h6>' +
        '<p><strong>Name:</strong> ' +
        name +
        '</p>' +
        '<p><strong>Email:</strong> <a href="mailto:' +
        email +
        '">' +
        email +
        '</a></p>' +
        '<p><strong>Country:</strong> ' +
        country +
        '</p>' +
        '</div>' +
        '<div class="col-md-6">' +
        '<h6 class="text-muted">Account Information</h6>' +
        '<p><strong>Status:</strong> ' +
        status +
        '</p>' +
        '<p><strong>Registration Date:</strong> ' +
        date +
        '</p>' +
        '<p><strong>User ID:</strong> #' +
        id +
        '</p>' +
        '</div>' +
        '</div>';
    } else {
      content.innerHTML =
        '<div class="alert alert-warning"><i class="fas fa-exclamation-triangle me-2"></i>User details not found.</div>';
    }
  }, 300);
}

function contactUser(id) {
  currentUserId = id;
  const userData = window.userRowData?.get?.(id) || 
    (() => {
      const row = document.querySelector('tr[data-id="' + id + '"]');
      if (!row) return null;
      const cells = row.querySelectorAll('td');
      return { name: cells[0]?.textContent.trim() || '' };
    })();

  if (userData) {
    document.getElementById('contactUserId').value = id;
    document.getElementById('contactSubject').value = 'Re: Your WCTFE Registration';
    document.getElementById('contactMessage').value =
      'Hello ' +
      userData.name +
      ",\n\nThank you for registering with WCTFE! We're excited to have you on board.\n\nBest regards,\nThe WCTFE Team";
  }
  const modal = new bootstrap.Modal(document.getElementById('contactUserModal'));
  modal.show();
}

// Placeholder function - to be implemented
// eslint-disable-next-line no-unused-vars
function contactUserFromModal() {
  if (currentUserId) {
    contactUser(currentUserId);
  }
}

// Placeholder function - to be implemented
// eslint-disable-next-line no-unused-vars
function editUser(id) {
  currentUserId = id;
  const userData = window.userRowData?.get?.(id) || 
    (() => {
      const row = document.querySelector('tr[data-id="' + id + '"]');
      if (!row) return null;
      const cells = row.querySelectorAll('td');
      return {
        name: cells[0]?.textContent.trim() || '',
        email: cells[1]?.textContent.trim() || '',
        country: cells[2]?.textContent.trim() || '',
        status: cells[4]?.textContent.trim() || '',
      };
    })();

  if (userData) {
    document.getElementById('editUserId').value = id;
    document.getElementById('editName').value = userData.name;
    document.getElementById('editEmail').value = userData.email;
    document.getElementById('editCountry').value = userData.country;
    document.getElementById('editStatus').value = userData.status.toLowerCase();
  }
  const modal = new bootstrap.Modal(document.getElementById('editUserModal'));
  modal.show();
}

// Placeholder function - to be implemented
// eslint-disable-next-line no-unused-vars
function deleteUser(id) {
  if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
    return;
  }
  const deleteBtn = document.querySelector('[onclick="deleteUser(' + id + ')"]');
  const originalText = deleteBtn ? deleteBtn.innerHTML : '';
  if (deleteBtn) {
    deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Deleting...';
    deleteBtn.disabled = true;
  }
  setTimeout(() => {
    if (window.tenaAjax) {
      window.tenaAjax.showNotification({
        type: 'success',
        title: 'User Deleted',
        message: 'User has been deleted successfully!',
      });
    }
    const row = document.querySelector('tr[data-id="' + id + '"]');
    if (row) {
      row.remove();
    }
    if (deleteBtn) {
      deleteBtn.innerHTML = originalText;
      deleteBtn.disabled = false;
    }
  }, 1000);
}

// Placeholder function - to be implemented
// eslint-disable-next-line no-unused-vars
function sendContactMessage() {
  const form = document.getElementById('contactUserForm');
  // eslint-disable-next-line no-unused-vars
  const formData = new FormData(form);
  const sendBtn = document.querySelector('[onclick="sendContactMessage()"]');
  const originalText = sendBtn ? sendBtn.innerHTML : '';
  if (sendBtn) {
    sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Sending...';
    sendBtn.disabled = true;
  }
  setTimeout(() => {
    if (window.tenaAjax) {
      window.tenaAjax.showNotification({
        type: 'success',
        title: 'Message Sent',
        message: 'Your message has been sent successfully!',
      });
    }
    const modal = bootstrap.Modal.getInstance(document.getElementById('contactUserModal'));
    if (modal) {
      modal.hide();
    }
    form.reset();
    if (sendBtn) {
      sendBtn.innerHTML = originalText;
      sendBtn.disabled = false;
    }
  }, 1000);
}

// Placeholder function - to be implemented
// eslint-disable-next-line no-unused-vars
function saveUserChanges() {
  const saveBtn = document.querySelector('[onclick="saveUserChanges()"]');
  const originalText = saveBtn ? saveBtn.innerHTML : '';
  if (saveBtn) {
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Saving...';
    saveBtn.disabled = true;
  }
  setTimeout(() => {
    if (window.tenaAjax) {
      window.tenaAjax.showNotification({
        type: 'success',
        title: 'User Updated',
        message: 'User information has been updated successfully!',
      });
    }
    const modal = bootstrap.Modal.getInstance(document.getElementById('editUserModal'));
    if (modal) {
      modal.hide();
    }
    if (saveBtn) {
      saveBtn.innerHTML = originalText;
      saveBtn.disabled = false;
    }
    setTimeout(() => {
      window.location.reload();
    }, 800);
  }, 1000);
}

// Live search
let searchTimeout;
const searchInputEl = document.getElementById('searchInput');
const searchLoadingEl = document.querySelector('.search-loading');

if (searchInputEl) {
  searchInputEl.addEventListener('input', function () {
    clearTimeout(searchTimeout);
    const query = this.value.trim();
    if (searchLoadingEl) {
      searchLoadingEl.classList.remove('d-none');
    }
    if (query.length === 0) {
      searchTimeout = setTimeout(() => performSearch(''), 200);
      return;
    }
    if (query.length < 2) {
      if (searchLoadingEl) {
        searchLoadingEl.classList.add('d-none');
      }
      return;
    }
    searchTimeout = setTimeout(() => performSearch(query), 300);
  });
}

function performSearch(query) {
  const formData = new FormData(document.getElementById('searchForm'));
  formData.set('search', query);
  formData.set('page', '1');
  const params = new URLSearchParams(formData);
  fetch('users.php?' + params.toString(), {
    method: 'GET',
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
  })
    .then(r => r.json())
    .then(data => {
      if (!data.success) {
        return;
      }
      const tableBody = document.getElementById('usersTableBody');
      if (!tableBody) {
        return;
      }
      tableBody.style.opacity = '0.5';
      tableBody.style.transition = 'opacity 0.2s ease';
      setTimeout(() => {
        tableBody.innerHTML = data.html;
        updatePaginationInfo(data);
        tableBody.style.opacity = '1';
      }, 200);
    })
    .catch(err => {
      console.error('Search error:', err);
      if (searchLoadingEl) {
        searchLoadingEl.classList.add('d-none');
      }
    });
}

function updatePaginationInfo(data) {
  const paginationInfo = document.querySelector('.text-muted');
  if (paginationInfo && paginationInfo.textContent.includes('Showing')) {
    const start = (data.current_page - 1) * perPage + 1;
    const end = Math.min(start + perPage - 1, data.total_records);
    paginationInfo.textContent =
      'Showing ' + start + ' to ' + end + ' of ' + data.total_records + ' entries';
  }
  const totalHeader = document.querySelector('.dashboard-card-header h5');
  if (totalHeader) {
    totalHeader.textContent = 'Users (' + data.total_records.toLocaleString() + ' total)';
  }
}

// Function is called from HTML onclick handlers
// eslint-disable-next-line no-unused-vars
function exportData(format) {
  const btn = document.getElementById(
    'export' + format.charAt(0).toUpperCase() + format.slice(1) + 'BtnModal'
  );
  let originalText = '';
  if (btn) {
    originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Exporting...';
    btn.disabled = true;
  }
  try {
    const currentPath = window.location.pathname;
    const isAdminPage = currentPath.includes('/admin/');
    if (isAdminPage) {
      let baseUrl = window.location.origin + currentPath.replace(/\/admin\/.*$/, '');
      const params = new URLSearchParams();
      if (format === 'pdf') {
        const pdfUrl = baseUrl + '/admin/export.php?export=pdf&' + params.toString();
        triggerExportDownload(pdfUrl);
        if (btn) {
          btn.innerHTML = originalText;
          btn.disabled = false;
        }
        return;
      }
      const exportUrl = baseUrl + '/admin/export.php?format=' + format;
      triggerExportDownload(exportUrl);
      if (btn) {
        btn.innerHTML = originalText;
        btn.disabled = false;
      }
      return;
    }
    directExport(format);
  } catch (err) {
    console.error('ExportData error:', err);
    directExport(format);
    if (btn) {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  }
}

function directExport(format) {
  const currentPath = window.location.pathname;
  const isAdminPage = currentPath.includes('/admin/');
  let baseUrl;
  if (isAdminPage) {
    baseUrl = window.location.origin + currentPath.replace(/\/admin\/.*$/, '');
  } else {
    baseUrl = window.location.origin + currentPath.replace(/\/[^\/]*$/, '');
  }
  const exportUrl = baseUrl + '/admin/export.php?format=' + format;
  triggerExportDownload(exportUrl);
  console.log('Exporting data as ' + format.toUpperCase() + '...');
}

// Wire per-page selector
const perPageSelect = document.getElementById('perPageSelect');
if (perPageSelect) {
  perPageSelect.addEventListener('change', function () {
    document.getElementById('searchForm').submit();
  });
}
